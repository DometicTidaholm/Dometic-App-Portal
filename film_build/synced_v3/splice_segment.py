#!/usr/bin/env python3
"""Replace one IDR-bounded GOP, stream-copy everything else, and prove preservation.

The replacement is video-only for concatenation. Original AAC always comes from
the complete original film, at its original timestamps, without offset or encode.
"""
import argparse
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

NAMES = ("Dometic-App-Portal-4K-60fps.mp4", "app-portal-intro-sv-smooth-60fps.mp4")
VIDEO_FIELDS = ("codec_name", "profile", "level", "width", "height", "pix_fmt",
                "has_b_frames", "time_base", "r_frame_rate", "avg_frame_rate", "extradata_hash")


def run(command):
    subprocess.run(command, check=True)


def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-show_format", "-show_data_hash", "sha256",
        "-of", "json", str(path)]))


def video(path):
    return next(x for x in probe(path)["streams"] if x["codec_type"] == "video")


def packets(path, stream):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", stream, "-show_packets",
        "-show_data_hash", "sha256", "-show_entries", "packet=pts,dts,duration,data_hash,flags",
        "-of", "json", str(path)]))["packets"]


def audio_hash(path):
    return subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(path), "-map", "0:a:0", "-c:a", "copy",
        "-f", "hash", "-hash", "sha256", "-"], text=True).strip()


def check(condition, message):
    if not condition:
        raise RuntimeError(message)


def quote(path):
    return "'" + path.as_posix().replace("'", "'\\''") + "'"


def splice(source, replacement, target, work, start_frame, end_frame, identity):
    check(source.resolve() != target.resolve(), "Output must initially be separate from source")
    work.mkdir(parents=True, exist_ok=True)
    sv = video(source)
    check(sv["codec_name"] == "h264", "Expected H.264")
    check(Fraction(sv["avg_frame_rate"]) == 60, "Expected exact 60fps source")
    total = int(sv["nb_frames"])
    check(total == 4200, f"Expected 4200 source frames; got {total}")
    ticks = Fraction(1, 60) / Fraction(sv["time_base"])
    check(ticks.denominator == 1, "Video time base must represent 60fps exactly")
    ticks = int(ticks)
    original_v = packets(source, "v:0")
    original_a = packets(source, "a:0")
    check(len(original_v) == total, "Unexpected source packet count")
    for frame in (start_frame, end_frame):
        check(any(p["pts"] == frame * ticks and p["flags"].startswith("K") for p in original_v),
              f"Frame {frame} is not an original keyframe")

    # Segment muxer ends at keyframe PTS, avoiding naive -to/outpoint DTS issues.
    run(["ffmpeg", "-y", "-v", "error", "-i", str(source), "-map", "0:v:0", "-c", "copy",
         "-f", "segment", "-segment_times", f"{start_frame / 60:.12f},{end_frame / 60:.12f}",
         "-segment_time_delta", "0.000001", "-reset_timestamps", "1", "-avoid_negative_ts", "disabled",
         "-segment_format", "mp4", str(work / "original-%02d.mp4")])
    parts = [work / f"original-{i:02d}.mp4" for i in range(3)]
    counts = (start_frame, end_frame - start_frame, total - end_frame)
    for part, count in zip(parts, counts):
        check(int(video(part)["nb_frames"]) == count, f"Wrong original segment length: {part}")

    if not identity:
        check(replacement.is_file(), f"Missing replacement: {replacement}")
        pv = video(replacement)
        for field in VIDEO_FIELDS:
            check(pv.get(field) == sv.get(field),
                  f"Incompatible replacement {field}: {pv.get(field)} != {sv.get(field)}")
        check(int(pv["nb_frames"]) == counts[1], "Wrong replacement frame count")
        check(abs(float(pv["start_time"])) < 1e-6, "Replacement must begin at PTS 0")
        check(abs(float(pv["duration"]) - counts[1] / 60) < 1e-5, "Wrong replacement duration")
        patch = work / "replacement-video.mp4"
        run(["ffmpeg", "-y", "-v", "error", "-i", str(replacement), "-map", "0:v:0", "-c", "copy",
             "-avoid_negative_ts", "disabled", str(patch)])
        pp = packets(patch, "v:0")
        check(len(pp) == counts[1] and pp[0]["flags"].startswith("K"), "Patch must begin with keyframe")
        check(pp[0]["dts"] == original_v[0]["dts"], "Replacement reorder delay differs")
        parts[1] = patch

    concat = work / "parts.ffconcat"
    concat.write_text("ffconcat version 1.0\n" + "".join(
        f"file {quote(part.resolve())}\nduration {count / 60:.15f}\n"
        for part, count in zip(parts, counts)))
    # avcC/SPS/PPS was checked byte-for-byte. Disabling auto_convert preserves
    # original IDR payloads instead of injecting extra SPS/PPS at each keyframe.
    run(["ffmpeg", "-y", "-v", "warning", "-f", "concat", "-safe", "0", "-auto_convert", "0",
         "-i", str(concat), "-i", str(source), "-map", "0:v:0", "-map", "1:a:0",
         "-c", "copy", "-t", str(total / 60), "-movflags", "+faststart", str(target)])

    result = probe(target)
    ov = next(x for x in result["streams"] if x["codec_type"] == "video")
    for field in VIDEO_FIELDS:
        check(ov.get(field) == sv.get(field), f"Output changed {field}")
    check(int(ov["nb_frames"]) == total, "Output frame count changed")
    check(abs(float(result["format"]["duration"]) - total / 60) < 1e-6, "Output duration changed")
    output_v, output_a = packets(target, "v:0"), packets(target, "a:0")
    check(len(output_v) == total, "Output video packet count changed")
    check(sorted(p["pts"] for p in output_v) == list(range(0, total * ticks, ticks)),
          "Output PTS contains a gap, duplicate, or wrong cadence")
    check([p["dts"] for p in output_v] == [p["dts"] for p in original_v],
          "Output DTS sequence differs from original")
    check(all(p["duration"] == ticks for p in output_v), "Output frame durations changed")
    unchanged = 0
    changed = 0
    for before, after in zip(original_v, output_v):
        outside = before["pts"] < start_frame * ticks or before["pts"] >= end_frame * ticks
        if outside or identity:
            check(before == after, f"Original video packet changed at PTS {before['pts']}")
            unchanged += 1
        elif before != after:
            changed += 1
    check(original_a == output_a, "AAC packet payload or timestamps changed")
    original_audio_hash, output_audio_hash = audio_hash(source), audio_hash(target)
    check(original_audio_hash == output_audio_hash, "AAC stream hash changed")
    print(f"VERIFIED {source.name}: {total} frames, {unchanged} original packets preserved, "
          f"{len(output_a)} identical AAC packets", flush=True)
    return {
        "file": source.name, "output": str(target), "identity_test": identity,
        "start_frame": start_frame, "end_frame_exclusive": end_frame,
        "start_seconds": start_frame / 60, "end_seconds": end_frame / 60,
        "replacement_frames": end_frame - start_frame, "total_frames": total,
        "fps": 60, "duration": total / 60, "time_base": sv["time_base"], "ticks_per_frame": ticks,
        "extradata_hash": sv["extradata_hash"], "original_video_packets_preserved": unchanged,
        "modified_packets_in_replacement_gop": changed,
        "identical_aac_packets": len(output_a), "audio_sha256": output_audio_hash,
        "pts_exact_60fps": True, "dts_identical_to_original": True,
        "size_bytes": target.stat().st_size,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--media-dir", type=Path, required=True)
    parser.add_argument("--patch-dir", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--start-frame", type=int, default=2250)
    parser.add_argument("--end-frame", type=int, default=2500)
    parser.add_argument("--files", nargs="+", choices=NAMES, default=list(NAMES))
    parser.add_argument("--identity-test", action="store_true")
    parser.add_argument("--in-place", action="store_true",
                        help="Only after all selected outputs pass, replace originals with verified copies")
    args = parser.parse_args()
    check(args.identity_test or args.patch_dir, "--patch-dir is required unless --identity-test")
    check(0 < args.start_frame < args.end_frame < 4200, "Invalid replacement frame range")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    report = {"method": "IDR-aligned stream-copy concat; unchanged original AAC", "files": []}
    for i, name in enumerate(args.files):
        source = args.media_dir / name
        patch = (args.patch_dir / name) if args.patch_dir else None
        target = args.output_dir / name
        report["files"].append(splice(source, patch, target, args.output_dir / f"segments-{i}",
                                      args.start_frame, args.end_frame, args.identity_test))
    report_path = args.report or args.output_dir / "splice-report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2))
    if args.in_place:
        # Keep source/target separate until every selected output has passed.
        for name in args.files:
            staging = args.media_dir / (name + ".verified-tmp")
            shutil.copyfile(args.output_dir / name, staging)
            staging.replace(args.media_dir / name)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()

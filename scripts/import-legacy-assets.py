#!/usr/bin/env python3
"""Copy the pinned, public portal assets and verify their original Git hashes."""

from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = Path(__file__).with_name("legacy-assets.json")
VERIFY_ONLY = "--verify-only" in sys.argv


def digest(path, size):
    sha = hashlib.sha1(f"blob {size}\0".encode())
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            sha.update(block)
    return sha.hexdigest()


def copy_asset(entry):
    relative = Path(entry["path"])
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError("Invalid asset destination")
    target = ROOT / relative
    if not target.resolve().is_relative_to(ROOT) or target.is_symlink():
        raise ValueError("Asset must remain inside the repository")
    size = entry["size"]
    expected = entry["git_blob_sha"]
    if not isinstance(size, int) or size <= 0 or not re.fullmatch(r"[0-9a-f]{40}", expected):
        raise ValueError("Invalid asset checksum or size")
    url = urlsplit(entry["source_url"])
    if url.scheme != "https" or url.netloc != "raw.githubusercontent.com" or not re.match(
        r"^/MrMartinPet/(Dometic|DometicPersonalHandbok)/[0-9a-f]{40}/", url.path
    ):
        raise ValueError("Source must be a pinned public original")
    if target.exists():
        if target.stat().st_size != size or digest(target, size) != expected:
            raise ValueError(f"Refusing to overwrite a different existing file: {relative}")
        return {"path": entry["path"], "status": "verified", "size": size}
    if VERIFY_ONLY:
        raise FileNotFoundError(relative)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(target.name + ".copy-part")
    try:
        request = Request(entry["source_url"], headers={"User-Agent": "DometicTidaholm-Portal-Migration/1.0"})
        with urlopen(request, timeout=90) as response, temporary.open("wb") as output:
            total = 0
            while block := response.read(1024 * 1024):
                total += len(block)
                if total > size:
                    raise ValueError(f"Unexpected asset size: {relative}")
                output.write(block)
        if temporary.stat().st_size != size or digest(temporary, size) != expected:
            raise ValueError(f"Original checksum does not match: {relative}")
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    return {"path": entry["path"], "status": "copied", "size": size}


def main():
    entries = json.loads(MANIFEST.read_text())
    if len({item["path"] for item in entries}) != len(entries):
        raise ValueError("Duplicate asset paths")
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(copy_asset, entries))
    print(json.dumps({"files": len(results), "bytes": sum(item["size"] for item in results),
                      "copied": sum(item["status"] == "copied" for item in results)}, indent=2))


if __name__ == "__main__":
    main()

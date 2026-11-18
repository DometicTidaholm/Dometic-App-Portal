#!/usr/bin/env python3
"""Create a 70s 4K film from screenshots of the LIVE Dometic GitHub Pages applications.
Only actual page screenshots are used as the visual basis. All labels are editorial overlays.
"""
import asyncio, os, subprocess, shutil, math, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from playwright.async_api import async_playwright

ROOT=Path("film_build")
ROOT.mkdir(exist_ok=True)
BASE="https://dometictidaholm.github.io/Dometic-App-Portal/"
W,H=3840,2160
FPS=24
font_path="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
bold_path="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def font(size,bold=False):
    return ImageFont.truetype(bold_path if bold else font_path,size)
def run(args):
    print("RUN", " ".join(map(str,args))[:400],flush=True)
    subprocess.run(list(map(str,args)),check=True)
def snap_name(n):return ROOT/(n+".png")
def screenshot_fallback(name,source):
    if snap_name(name).exists():return
    shutil.copy(snap_name(source),snap_name(name))
async def capture():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
        context=await browser.new_context(viewport={"width":1920,"height":1080},device_scale_factor=2,locale="sv-SE",color_scheme="dark",reduced_motion="reduce")
        page=await context.new_page()
        async def go(url,name,scroll=0,click=None):
            try:
                response=await page.goto(url,wait_until="domcontentloaded",timeout=45000)
                await page.wait_for_timeout(1700)
                if click:
                    try:
                        await page.get_by_role("button",name=click,exact=True).first.click(timeout=3500)
                        await page.wait_for_timeout(450)
                    except Exception as ex: print("CLICK MISS",name,str(ex)[:160],flush=True)
                if scroll:
                    await page.evaluate("(v)=>window.scrollTo(0,v)",scroll)
                    await page.wait_for_timeout(500)
                await page.screenshot(path=str(snap_name(name)),animations="disabled",timeout=30000)
                print("CAPTURE",name,"HTTP",response.status if response else "none",flush=True)
            except Exception as ex:
                print("CAPTURE FAILED",name,str(ex)[:250],flush=True)
        await go(BASE,"portal")
        await go(BASE,"categories",scroll=690,click="Processanalys")
        await go(BASE+"apps/20CycleCheck/","cycle")
        await go(BASE+"apps/steptimer/","step")
        await go(BASE+"apps/Frekvensanalys/","frequency")
        await go(BASE+"apps/Dometic-AnalyzeMovements/","movement")
        await go(BASE+"apps/ErgonomicAnalysis/","kim1")
        await go(BASE+"apps/KIM2/","kim2")
        await go(BASE+"apps/KIM3/","kim3")
        await go(BASE+"apps/Funktionsplaneraren/","resource")
        await go(BASE+"apps/DometicPersonalHandbok/","handbook")
        await go(BASE,"cards",scroll=760)
        await go(BASE,"install",click="Installera app")
        await browser.close()
    for name in ["portal","categories","cycle","step","frequency","movement","kim1","kim2","kim3","resource","handbook","cards","install"]:
        screenshot_fallback(name,"portal")

def white_logo():
    path=Path("assets/dometic-logo-white.png")
    img=Image.open(path).convert("RGBA")
    # Preserve original transparent silhouette, force all nontransparent logo pixels to white.
    alpha=img.getchannel("A")
    if alpha.getextrema()==(255,255):
        gray=img.convert("L")
        # The source is a black/white logo on transparency or dark; derive alpha from dark shapes.
        import PIL.ImageOps
        alpha=PIL.ImageOps.invert(gray)
    img=Image.new("RGBA",img.size,(255,255,255,0))
    img.putalpha(alpha)
    return img

def branded_frame(name,source,title,subtitle,kind="app"):
    shot=Image.open(snap_name(source)).convert("RGB")
    if shot.size!=(W,H):shot=shot.resize((W,H),Image.Resampling.LANCZOS)
    if kind in ("intro","outro"):
        shot=shot.filter(ImageFilter.GaussianBlur(20))
        dark=Image.new("RGBA",(W,H),(8,17,25,190))
        base=Image.alpha_composite(shot.convert("RGBA"),dark)
        dr=ImageDraw.Draw(base)
        # Subtle concentric brand arcs, original Dometic wordmark on top
        for i in range(5):
            pad=350+i*95
            dr.arc((W//2-pad,H//2-pad,W//2+pad,H//2+pad),start=207,end=320,fill=(135,210,222,25+i*6),width=5)
        logo=white_logo()
        max_w=1700
        ratio=max_w/logo.width
        logo=logo.resize((int(logo.width*ratio),int(logo.height*ratio)),Image.Resampling.LANCZOS)
        if logo.height>400:
            ratio=400/logo.height
            logo=logo.resize((int(logo.width*ratio),int(logo.height*ratio)),Image.Resampling.LANCZOS)
        x=(W-logo.width)//2
        y=H//2-logo.height//2-160
        base.alpha_composite(logo,(x,y))
        dr=ImageDraw.Draw(base)
        text="TIDAHOLM  ·  APP PORTAL"
        box=dr.textbbox((0,0),text,font=font(70,True))
        dr.text(((W-(box[2]-box[0]))/2,y+logo.height+80),text,font=font(70,True),fill=(214,241,246,255))
        if kind=="outro":
            tagline="Från analys till förbättring. Allt på ett ställe."
            box=dr.textbbox((0,0),tagline,font=font(51))
            dr.text(((W-(box[2]-box[0]))/2,y+logo.height+210),tagline,font=font(51),fill=(165,215,225,255))
    else:
        base=shot.convert("RGBA")
        gradient=Image.new("RGBA",(W,510),(0,0,0,0))
        g=ImageDraw.Draw(gradient)
        for y in range(510):
            alpha=int(215*min(1,(y/370)**1.3))
            g.line((0,y,W,y),fill=(6,15,23,alpha))
        base.alpha_composite(gradient,(0,H-510))
        dr=ImageDraw.Draw(base)
        dr.rounded_rectangle((118,H-402,132,H-280),radius=7,fill=(113,210,226,255))
        dr.text((170,H-404),title,font=font(91,True),fill=(255,255,255,255),stroke_width=1)
        dr.text((175,H-268),subtitle,font=font(43),fill=(197,222,232,255))
        dr.text((W-545,H-110),"DOMETIC  /  TIDAHOLM",font=font(29,True),fill=(166,204,216,225))
    base.convert("RGB").save(ROOT/(name+"_styled.png"),quality=96)
    return ROOT/(name+"_styled.png")

SCENES=[
 ("intro","portal","Dometic App Portal","Från analys till förbättring",4.0,"intro"),
 ("home","portal","En portal – alla verktyg","Den publicerade Dometic App Portal",7.0,"app"),
 ("categories","categories","Hitta rätt verktyg","Välj arbetsområde eller sök",5.0,"app"),
 ("cycle","cycle","Twenty Cycle Check","Mät cykeltider och upptäck variation",6.0,"app"),
 ("step","step","Moment och tider","Studera arbetets olika moment",5.0,"app"),
 ("frequency","frequency","Frekvensanalys","Se hur arbetstiden fördelas",5.0,"app"),
 ("movement","movement","Rörelser och gångvägar","Kartlägg förflyttningar",6.0,"app"),
 ("kim1","kim1","KIM 1 · Lyft och bärande","Bedöm ergonomiska belastningsrisker",4.0,"app"),
 ("kim2","kim2","KIM 2 · Skjuta och dra","Analysera fysisk belastning",3.0,"app"),
 ("kim3","kim3","KIM 3 · Repetitivt arbete","Identifiera risker i hand- och armarbete",3.0,"app"),
 ("resource","resource","Produktionsstöd","Planering och kalibrering",4.0,"app"),
 ("handbook","handbook","Personalhandbok","Rutiner, blanketter och information",4.0,"app"),
 ("cards","cards","Öppna apparna direkt","Klicka på ett helt appkort",6.0,"app"),
 ("install","install","Installera App Portal","På datorn eller mobilens hemskärm",6.0,"app"),
 ("outro","portal","Dometic App Portal","Allt på ett ställe",2.0,"outro"),
]
assert sum(x[4] for x in SCENES)==70
def render():
    for i,(name,source,title,subtitle,seconds,kind) in enumerate(SCENES):
        branded_frame(name,source,title,subtitle,kind)
    segments=[]
    # 0.45 seconds of each scene reserved for a true morph/zoom transition
    transition=0.45
    for i,(name,source,title,subtitle,seconds,kind) in enumerate(SCENES):
        still=ROOT/(name+"_styled.png")
        duration=seconds-(transition if i<len(SCENES)-1 else 0)
        target=ROOT/f"clip_{i:02d}.mp4"
        # Ken Burns motion on real screenshots: 4K raster throughout
        run(["ffmpeg","-hide_banner","-loglevel","error","-y","-loop","1","-framerate",str(FPS),"-i",still,
            "-vf",f"scale=4000:2250:flags=lanczos,crop=3840:2160:x='80+40*sin(n/160)':y='45+24*cos(n/190)',fps={FPS},format=yuv420p",
            "-t",f"{duration:.3f}","-an","-c:v","libx264","-preset","veryfast","-crf","28","-r",str(FPS),
            "-video_track_timescale","12288","-movflags","+faststart",target])
        segments.append(target)
        if i<len(SCENES)-1:
            next_name=SCENES[i+1][0]
            nxt=ROOT/(next_name+"_styled.png")
            trans=ROOT/f"transition_{i:02d}.mp4"
            effect=["zoomin","smoothleft","fade","smoothup","zoomin","smoothleft","fade"][i%7]
            run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                "-loop","1","-framerate",str(FPS),"-t","0.8","-i",still,
                "-loop","1","-framerate",str(FPS),"-t","0.8","-i",nxt,
                "-filter_complex",f"[0:v]fps={FPS},format=yuv420p,settb=AVTB[a];[1:v]fps={FPS},format=yuv420p,settb=AVTB[b];[a][b]xfade=transition={effect}:duration={transition}:offset=0,trim=duration={transition},setpts=PTS-STARTPTS,format=yuv420p[v]",
                "-map","[v]","-an","-c:v","libx264","-preset","veryfast","-crf","28","-r",str(FPS),
                "-video_track_timescale","12288",trans])
            segments.append(trans)
    manifest=ROOT/"segments.txt"
    manifest.write_text("\n".join("file '"+str(x.resolve())+"'" for x in segments)+"\n")
    visual=ROOT/"silent_4k.mp4"
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",manifest,"-c","copy",visual])
    return visual

def mix(visual):
    output=Path("media/app-portal-intro-sv.mp4")
    output.parent.mkdir(parents=True,exist_ok=True)
    voice=Path("/tmp/voice.mp3")
    music=Path("/tmp/music.mp3")
    logo=Path("/tmp/logo.mp3")
    swoosh=Path("/tmp/swoosh.mp3")
    click=Path("/tmp/click.mp3")
    # Music remains beneath narration. Intro and outro use bespoke ElevenLabs effects.
    fc=(
      "[1:a]aresample=48000,volume=1.18,adelay=100|100,apad=pad_dur=70,atrim=duration=70[voice];"
      "[2:a]aresample=48000,volume=0.13,afade=t=in:st=0:d=1.6,afade=t=out:st=66:d=4,atrim=duration=70[music];"
      "[3:a]aresample=48000,volume=0.26,adelay=100|100,apad=pad_dur=70,atrim=duration=70[logo];"
      "[4:a]aresample=48000,volume=0.13,adelay=16000|16000,apad=pad_dur=70,atrim=duration=70[swish];"
      "[5:a]aresample=48000,volume=0.10,adelay=61000|61000,apad=pad_dur=70,atrim=duration=70[click];"
      "[voice][music][logo][swish][click]amix=inputs=5:duration=longest:normalize=0,alimiter=limit=0.94[a]"
    )
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",visual,"-i",voice,"-i",music,"-i",logo,"-i",swoosh,"-i",click,
         "-filter_complex",fc,"-map","0:v:0","-map","[a]","-c:v","copy","-c:a","aac","-b:a","192k","-t","70",
         "-movflags","+faststart",output])
    probe=subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration,size","-of","json",str(output)],text=True)
    print("FINAL",probe,flush=True)
    return output

if __name__=="__main__":
    asyncio.run(capture())
    mix(render())

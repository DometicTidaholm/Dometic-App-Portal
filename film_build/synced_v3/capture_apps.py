#!/usr/bin/env python3
"""Capture genuine app UI for the portal film using temporary illustrative data.

No source files or remote application data are changed. Every value is held only
in this throwaway browser profile. The film must label these views Exempeldata.
"""
import argparse
import asyncio
import json
import os
from pathlib import Path
import time

from PIL import Image, ImageDraw, ImageFont
from playwright.async_api import async_playwright

DATE = "2026-11-18"


def cycle_data(count=20):
    seconds = [59.3, 58.7, 60.4, 61.1, 59.6, 63.2, 60.5, 58.9, 73.1, 60.2,
               59.8, 61.3, 60.6, 59.5, 66.8, 60.1, 58.6, 60.8, 59.9, 60.3]
    return {
        "lang": "sv", "theme": "dark", "process": "Limning – exempel",
        "subprocess": "Montering", "date": DATE, "standard": 60, "takt": 65,
        "product": "Fönster", "boundary": "Laddning till färdig cykel",
        "pendingCycle": {"note": "", "pieces": 1, "reason": ""},
        "laps": [{"ms": round(s * 1000), "pieces": 1,
                  "note": "Materialpåfyllning" if i == 8 else "",
                  "reason": "material" if i == 8 else ""}
                 for i, s in enumerate(seconds[:count])],
        "processData": {"shiftType": "1", "startTime": "06:18", "endTime": "14:42",
                        "plannedStopMinutes": 42, "setupsPerShift": 2,
                        "setupMinutes": 8, "productsPerCycle": 1,
                        "annualDemand": 194400, "weeklyHours": 78},
    }


def frequency_data():
    now = int(time.time() * 1000)
    acts = {
        "Processarbete": ["Ladda och lossa", "Limning", "Kvalitetskontroll"],
        "Materialförsörjning": ["Hämta material", "Fylla på vid station"],
        "Problem": ["Åtgärda mindre stopp"],
        "Administration": ["Rapportering"],
        "Övrigt": ["Ordning och reda"],
    }
    minutes = [14, 8, 5, 6, 4, 3, 3, 2]
    totals, counts, history = {}, {}, []
    cursor = now - 45 * 60000
    for (category, name), mins in zip([(c, a) for c, arr in acts.items() for a in arr], minutes):
        key = f"{category}|||{name}"
        total = mins * 60000
        totals[key] = total
        counts[key] = max(1, mins // 2)
        history.append({"id": key, "category": category, "activity": name,
                        "start": cursor, "end": cursor + total, "duration": total})
        cursor += total
    return {"version": 3, "savedAt": now, "activities": acts,
            "header": {"leader": "Exempeldata", "flow": "Limning · processobservation",
                       "date": DATE, "source": "Exempel för presentationsfilm"},
            "selectedCategory": "Processarbete", "totals": totals, "counts": counts,
            "history": history, "active": None, "activeStartTs": 0,
            "sessionStartTs": now - 45 * 60000}


async def main(args):
    out = Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    report = {"base_url": args.base_url, "illustrative_data": True,
              "viewport": [1440, 900], "device_scale_factor": 2, "captures": [], "errors": []}
    async with async_playwright() as p:
        launch = {"headless": True, "args": ["--no-sandbox", "--disable-dev-shm-usage"]}
        executable = os.environ.get("BROWSER_EXECUTABLE")
        if executable:
            launch["executable_path"] = executable
        elif Path("/usr/bin/chromium").exists():
            launch["executable_path"] = "/usr/bin/chromium"
        browser = await p.chromium.launch(**launch)
        context = await browser.new_context(viewport={"width": 1440, "height": 900},
                                            device_scale_factor=2, locale="sv-SE",
                                            color_scheme="dark", reduced_motion="reduce")
        context.set_default_timeout(10000)

        async def page_for(app, storage=None):
            page = await context.new_page()
            page.on("dialog", lambda dialog: dialog.accept())
            page.on("pageerror", lambda error: report["errors"].append({"app": app, "javascript": str(error)}))
            if storage:
                # Applied once per new document, only in this temporary context.
                await page.add_init_script("for (const [k,v] of Object.entries(" + json.dumps(storage, ensure_ascii=False) + ")) localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));")
            response = await page.goto(args.base_url.rstrip("/") + "/apps/" + app + "/?lang=sv",
                                       wait_until="domcontentloaded", timeout=60000)
            if not response or response.status >= 400:
                raise RuntimeError(f"HTTP {response.status if response else None}: {app}")
            await page.wait_for_timeout(700)
            await page.evaluate("document.fonts.ready")
            return page

        async def shot(page, name, full=False):
            await page.mouse.move(1430, 890)
            await page.evaluate("document.activeElement && document.activeElement.blur()")
            await page.wait_for_timeout(120)
            target = out / f"{name}.png"
            await page.screenshot(path=str(target), full_page=full, animations="disabled")
            report["captures"].append({"file": target.name, "url": page.url, "full_page": full,
                                       "scroll_y": await page.evaluate("window.scrollY")})
            print("CAPTURE", name, flush=True)

        async def run(name, fn):
            try:
                await fn()
            except Exception as error:
                report["errors"].append({"task": name, "error": str(error)})
                print("CAPTURE_ERROR", name, str(error), flush=True)

        async def cycle():
            page = await page_for("20CycleCheck", {"cycle-check-state-v8": cycle_data(8), "dometic-language": "sv"})
            await page.evaluate("selectLanguage('sv')")
            await page.wait_for_timeout(200)
            await shot(page, "cycle_desktop")
            # Change the browser's in-memory observed cycle list through the app's
            # own state and redraw functions; source code remains untouched.
            await page.evaluate("(data)=>{laps=data.laps;refreshUI();drawChart();}", cycle_data(20))
            await page.wait_for_timeout(300)
            await shot(page, "cycle_results")
            await shot(page, "cycle_results_full", True)
            await page.close()

        async def step():
            steps = [{"name": name, "type": kind} for name, kind in [
                ("Hämta material", "NNVA"), ("Placera och rikta", "NNVA"),
                ("Limma", "VA"), ("Kontrollera", "NNVA"),
                ("Ladda maskin", "VA"), ("Lossa färdig ruta", "NNVA")]]
            page = await page_for("steptimer", {"dometic-language": "sv", "steptimer_theme": "dark",
                "steptimer_v4_setup": {"process": "Limning – exempel", "date": DATE, "steps": steps,
                                      "checks": [True, True, True]}})
            # Step Timer intentionally keeps state inside an IIFE. Exercise its
            # real public controls instead of assuming global helper functions.
            await page.locator('#languageModal [data-language="sv"]').click()
            await shot(page, "step_setup")
            cycles = [[8.2, 6.0, 18.2, 7.3, 10.0, 6.8], [7.9, 5.8, 17.9, 7.6, 10.4, 6.5],
                      [8.1, 6.2, 18.5, 7.4, 10.1, 6.7], [8.5, 6.1, 18.0, 7.8, 10.2, 6.4],
                      [8.0, 5.9, 18.1, 7.5, 9.8, 6.6]]
            await page.clock.install()
            await page.locator("#btnStart").click()
            await page.locator("#btnNext").click()
            for cycle_index, durations in enumerate(cycles):
                for seconds in durations:
                    await page.clock.fast_forward(int(seconds * 1000))
                    await page.locator("#btnNext").click()
                if cycle_index == 2:
                    await shot(page, "step_live")
            await page.locator("#btnPause").click()
            await page.locator("#btnFinish").click()
            await page.wait_for_timeout(400)
            await shot(page, "step_desktop")
            await shot(page, "step_results_full", True)
            await page.close()

        async def frequency():
            page = await page_for("Frekvensanalys", {"fa_theme": "dark", "fa_draft_v3": frequency_data()})
            await page.wait_for_timeout(2300)  # let restore toast disappear
            await shot(page, "frequency_desktop")
            await page.locator("#finishBtn").click()
            await page.wait_for_timeout(1200)
            await shot(page, "frequency_results")
            await shot(page, "frequency_results_full", True)
            # Record whether the app's original chart library actually rendered.
            report["frequency_chart_available"] = await page.evaluate("typeof Chart !== 'undefined'")
            await page.close()

        async def movement():
            page = await page_for("Dometic-AnalyzeMovements", {"movements-language": "sv"})
            await page.evaluate("chooseLanguage('sv')")
            await page.locator('details:has(#demo) > summary').click()
            await page.locator("#demo").click()
            await page.evaluate("""()=>{
                project.workstation='Exempel monteringscell';
                project.observer='Exempeldata';
                project.date='2026-11-18';
                project.layout=[
                    {id:'material',type:'rect',name:'Material',points:[{x:.08,y:.10},{x:.29,y:.29}]},
                    {id:'montering',type:'rect',name:'Monteringsbord',points:[{x:.38,y:.18},{x:.58,y:.40}]},
                    {id:'verktyg',type:'rect',name:'Verktyg',points:[{x:.71,y:.08},{x:.90,y:.26}]},
                    {id:'kontroll',type:'rect',name:'Kontroll',points:[{x:.66,y:.56},{x:.89,y:.77}]},
                    {id:'pack',type:'rect',name:'Packning',points:[{x:.10,y:.65},{x:.34,y:.87}]}
                ];save();render();window.scrollTo(0,0);
            }""")
            await shot(page, "movement_desktop")
            # Position markers and every path are drawn by the real app. Sample
            # observations progressively reveal the diagram for video compositing.
            route = [0, 1, 2, 1, 3, 4, 0, 1, 3, 4, 0, 1, 2, 1, 3, 4]
            for idx, count in enumerate([0, 3, 6, 10, 13, 16]):
                await page.evaluate("""({route,count})=>{
                    project.visits=route.slice(0,count).map((index,i)=>{
                        const pos=project.positions[index];
                        return {id:'sample-'+i,position:pos.id,x:pos.x,y:pos.y,bend:false,
                                cycle:1,time:i*60000,actual:null,steps:null,walkMs:null};
                    });
                    project.session={status:'paused',elapsed:1200000,start:null};
                    project.observedCycles=3;save();render();window.scrollTo(0,0);
                }""", {"route": route, "count": count})
                await shot(page, f"movement_route_{idx:02d}")
                if idx == 5:
                    await shot(page, "movement_route")
                    await shot(page, "movement_route_full", True)
            await page.close()

        async def kim1():
            page = await page_for("ErgonomicAnalysis")
            for sel, value in [("#factory", "43"), ("#process", "Montering – exempel"),
                               ("#underProcess", "Lyft till packpall")]:
                await page.locator(sel).fill(value)
            for selector in ['[data-key="time"][data-pts="4"]', '[data-key="weight"][data-pts="2"]',
                             '[data-key="condition"][data-pts="0"]', '[data-key="posture"][data-pts="2"]']:
                await page.locator(selector).click()
            await page.evaluate("window.scrollTo(0,0)")
            await shot(page, "kim1_desktop")
            await shot(page, "kim1_full", True)
            await page.locator('[data-key="posture"]').first.scroll_into_view_if_needed()
            await shot(page, "kim1_posture")
            await page.close()

        async def kim2():
            example = {"task": "Flytta materialvagn – exempel", "department": "Produktion",
                "assessor": "Exempeldata", "date": DATE, "timeMode": "short", "timeIdx": 2,
                "timeScore": 4, "massMode": "rolling", "massType": "fixed", "massIdx": 2,
                "massScore": 1.5, "massCritical": False, "positionId": "low-slow", "posScore": 1,
                "posture": 1, "conditions": 0, "notes": "Illustrativ bedömning för presentationsfilm."}
            page = await page_for("KIM2", {"kim2": example})
            await shot(page, "kim2_desktop")
            await shot(page, "kim2_full", True)
            await page.locator("#massTypeWrap").scroll_into_view_if_needed()
            await shot(page, "kim2_equipment")
            await page.close()

        async def kim3():
            keys = ["veryLow", "low", "medium", "large", "veryLarge", "peak", "impact"]
            empty = {key: {"on": False, "h": 3, "m": 0} for key in keys}
            right = json.loads(json.dumps(empty));right["low"] = {"on": True, "h": 2, "m": 3}
            example = {"task": "Montera beslag – exempel", "department": "Produktion", "assessor": "Exempeldata",
                       "date": DATE, "duration": 4, "left": empty, "right": right,
                       "factors": {"grip": 0, "arm": 1, "organisation": 1, "conditions": 0, "posture": 1},
                       "notes": "Illustrativ bedömning för presentationsfilm."}
            page = await page_for("KIM3", {"kim3": example})
            await shot(page, "kim3_desktop")
            await shot(page, "kim3_full", True)
            await page.locator('[data-factor="arm"]').first.scroll_into_view_if_needed()
            await shot(page, "kim3_posture")
            await page.close()

        tasks = {"cycle": cycle, "step": step, "frequency": frequency, "movement": movement,
                 "kim1": kim1, "kim2": kim2, "kim3": kim3}
        for name, fn in tasks.items():
            if not args.only or name in args.only.split(","):
                await run(name, fn)
        await browser.close()

    (out / "app-capture-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))
    names = ["cycle_desktop", "cycle_results", "step_desktop", "frequency_desktop", "frequency_results",
             "movement_desktop", "movement_route", "kim1_desktop", "kim2_desktop", "kim3_desktop"]
    captures = [(name, out / (name + ".png")) for name in names if (out / (name + ".png")).exists()]
    if captures:
        cell_w, cell_h = 480, 330
        sheet = Image.new("RGB", (cell_w * 2, cell_h * ((len(captures) + 1) // 2)), "#141e2b")
        draw = ImageDraw.Draw(sheet)
        for i, (name, path) in enumerate(captures):
            im = Image.open(path).convert("RGB");im.thumbnail((cell_w - 16, 290))
            x = (i % 2) * cell_w; y = (i // 2) * cell_h
            sheet.paste(im, (x + (cell_w - im.width) // 2, y + 28))
            draw.text((x + 10, y + 7), name, fill="white")
        sheet.save(out / "apps-contact-sheet.jpg", quality=92)
    print(json.dumps({"captures": len(report["captures"]), "errors": report["errors"]}, ensure_ascii=False))
    # A partial capture set is kept for diagnosis instead of silently substituting
    # another application's screenshot.
    required = {name + ".png" for name in names}
    missing = sorted(required - {r["file"] for r in report["captures"]}) if not args.only else []
    if missing:
        raise SystemExit("Missing required screenshots: " + ", ".join(missing))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8765/portal/")
    parser.add_argument("--output", default="work/captures")
    parser.add_argument("--only", default="", help="Optional comma-separated app names")
    asyncio.run(main(parser.parse_args()))

#!/usr/bin/env python3
"""Capture actual Dometic portal UI without changing application source or data.

Run against an HTTP server serving the existing portal checkout.  Each viewport
uses a fresh browser context; all navigation/filter/dialog actions are UI actions.
"""
from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=os.environ.get("CAPTURE_BASE_URL", "http://127.0.0.1:8765/portal/"))
    parser.add_argument("--output", default=os.environ.get("CAPTURE_OUT", "work/captures"))
    parser.add_argument("--browser-path", default=None)
    args = parser.parse_args()
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    base = args.base_url.rstrip("/") + "/"
    records: dict[str, dict] = {}
    errors: list[str] = []

    def ready(page, route=""):
        page.goto(base + route, wait_until="domcontentloaded", timeout=30000)
        page.evaluate("() => document.fonts.ready")
        page.wait_for_timeout(450)

    def controls(page, selectors):
        result = {}
        for label, selector in selectors.items():
            loc = page.locator(selector).first
            if loc.count() and loc.is_visible():
                box = loc.bounding_box()
                if box:
                    result[label] = {**box, "center_x": box["x"] + box["width"] / 2,
                                     "center_y": box["y"] + box["height"] / 2}
        return result

    def capture(page, name, *, full=False, selectors=None, note=None):
        page.mouse.move(0, 0)
        path = out / name
        page.screenshot(path=str(path), full_page=full, animations="disabled")
        with Image.open(path) as im:
            dims = list(im.size)
        records[name] = {
            "image_size_px": dims,
            "viewport_css_px": page.viewport_size,
            "device_scale_factor": page.evaluate("window.devicePixelRatio"),
            "scroll_y_css_px": page.evaluate("window.scrollY"),
            "url": page.url,
            "full_page": full,
            "controls_css_px": controls(page, selectors or {}),
            "note": note,
        }
        print(name, dims, flush=True)

    portal_controls = {
        "install": "#installButton",
        "language_sv": "[data-lang='sv']",
        "language_en": "[data-lang='en']",
        "language_de": "[data-lang='de']",
        "intro_film": "#portalIntroButton",
        "search": "#search",
        "process_filter": "#filters button:has-text('Processanalys')",
        "ergonomics_filter": "#filters button:has-text('Ergonomi')",
        "production_filter": "#filters button:has-text('Produktionsstöd')",
        "information_filter": "#filters button:has-text('Information')",
        "first_app": ".app-card a",
    }

    with sync_playwright() as p:
        candidate = args.browser_path
        if candidate is None and not Path(p.chromium.executable_path).exists():
            candidate = "/usr/bin/chromium" if Path("/usr/bin/chromium").exists() else None
        launch = {"headless": True, "args": ["--no-sandbox"]}
        if candidate:
            launch["executable_path"] = candidate
        browser = p.chromium.launch(**launch)
        desktop = browser.new_context(viewport={"width": 1440, "height": 900},
                                      device_scale_factor=2, locale="sv-SE",
                                      timezone_id="Europe/Stockholm", service_workers="block")
        page = desktop.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        ready(page)
        page.locator("#cards > *").first.wait_for()
        capture(page, "portal_desktop.png", selectors=portal_controls)
        capture(page, "portal_full.png", full=True, selectors=portal_controls)
        for lang in ["en", "de"]:
            page.locator(f"[data-lang='{lang}']").click()
            capture(page, f"portal_{lang}.png", selectors=portal_controls)
        page.locator("[data-lang='sv']").click()

        # Crop real rendered cards individually; preserve all displayed words.
        for app in page.evaluate("window.PORTAL_APPS.map(a => ({id:a.id, name:a.sv.name}))"):
            card = page.locator(".app-card").filter(has=page.get_by_role("heading", name=app["name"], exact=True))
            name = "portal_card_" + re.sub(r"[^a-z0-9_-]+", "_", app["id"].lower()) + ".png"
            card.scroll_into_view_if_needed()
            page.mouse.move(0, 0)
            card.screenshot(path=str(out / name), animations="disabled")
            with Image.open(out / name) as im:
                dims = list(im.size)
            records[name] = {"image_size_px": dims, "app_id": app["id"], "app_name": app["name"],
                             "device_scale_factor": 2, "element_bbox_css_px": card.bounding_box(),
                             "url": page.url, "note": "Actual rendered portal app card, no text replacement"}
            if app["id"] == "RTM":
                card.screenshot(path=str(out / "portal_rtm_card.png"), animations="disabled")
                records["portal_rtm_card.png"] = dict(records[name])

        for label, filename in [("Processanalys", "portal_process.png"),
                                ("Ergonomi", "portal_ergonomi.png"),
                                ("Produktionsstöd", "portal_production.png"),
                                ("Information", "portal_information.png")]:
            page.get_by_role("button", name=label, exact=True).click()
            page.locator("#applications").evaluate(
                "el => window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - 24))")
            page.wait_for_timeout(250)
            capture(page, filename, selectors=portal_controls)

        page.get_by_role("button", name="Alla appar", exact=True).click()
        page.evaluate("window.scrollTo(0,0)")
        page.locator("#installButton").click()
        page.locator("#installDialog[open]").wait_for(timeout=5000)
        capture(page, "install_desktop.png", selectors={"close": "#dialogClose", "done": "#dialogDone"})
        page.locator("#dialogClose").click()

        ready(page, "apps/DometicPersonalHandbok/")
        page.wait_for_function("document.querySelector('#home-doc-count').textContent.trim() !== '–'")
        if "kunde inte" in page.locator("#home-status").inner_text().lower():
            raise RuntimeError("Handbook catalog did not load; refusing to capture a failed page")
        handbook_controls = {"forms": ".header-nav [data-view='forms']",
                             "documents": ".header-nav [data-view='documents']",
                             "search": "#home-search", "install": "#install-app"}
        capture(page, "handbook_desktop.png", selectors=handbook_controls)
        capture(page, "handbook_full.png", full=True, selectors=handbook_controls)
        page.locator(".header-nav [data-view='forms']").click()
        page.locator("#section-title").filter(has_text="Blanketter").wait_for()
        forms_count = page.locator("#forms-count").inner_text()
        capture(page, "handbook_forms.png", selectors={"search": "#search"},
                note=f"Actual catalog has {forms_count} forms. Empty-state UI is genuine; no fabricated forms.")
        page.locator(".header-nav [data-view='documents']").click()
        capture(page, "handbook_documents.png", selectors={"search": "#search"})

        ready(page, "apps/Funktionsplaneraren/")
        page.locator(".block").first.wait_for()
        capture(page, "resources_desktop.png", selectors={"export_pdf": "#exportPdf",
                                                          "add_block": "#addBlock",
                                                          "add_service": "#addService"})
        ready(page, "apps/Tolkkalibrering/")
        capture(page, "calibration_desktop.png", selectors={"save_pdf": "#savePdf"})
        capture(page, "calibration_full.png", full=True, selectors={"save_pdf": "#savePdf"})

        ready(page, "apps/market-intelligence/")
        page.wait_for_function("!document.querySelector('#brief-status').textContent.includes('Loading')", timeout=25000)
        capture(page, "market_desktop.png", note="Actual dashboard data and dates as rendered by the app.")
        capture(page, "market_full.png", full=True)
        ready(page, "apps/lunchkollen/")
        page.locator("#grid .card").first.wait_for(timeout=35000)
        capture(page, "lunch_desktop.png", selectors={"coupons": "#couponFilter", "search": "#search"},
                note="Actual restaurant list and menu availability for the browser's current date.")
        capture(page, "lunch_full.png", full=True)
        desktop.close()

        mobile = browser.new_context(
            viewport={"width": 390, "height": 844}, device_scale_factor=3,
            is_mobile=True, has_touch=True, locale="sv-SE", timezone_id="Europe/Stockholm",
            service_workers="block",
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")
        phone = mobile.new_page()
        phone.on("pageerror", lambda error: errors.append(str(error)))
        ready(phone)
        phone.locator("#cards > *").first.wait_for()
        capture(phone, "portal_mobile.png", selectors=portal_controls)
        capture(phone, "portal_mobile_full.png", full=True, selectors=portal_controls)
        phone.locator("#installButton").click()
        phone.locator("#installDialog[open]").wait_for(timeout=5000)
        capture(phone, "install_mobile.png", selectors={"close": "#dialogClose", "done": "#dialogDone"})
        mobile.close()
        browser.close()

    records["_capture_errors"] = errors
    (out / "portal_capture_metadata.json").write_text(json.dumps(records, ensure_ascii=False, indent=2))
    contact_names = ["portal_desktop.png", "portal_process.png", "portal_ergonomi.png",
                     "install_desktop.png", "portal_mobile.png", "install_mobile.png",
                     "handbook_desktop.png", "handbook_forms.png", "handbook_documents.png",
                     "resources_desktop.png", "calibration_desktop.png", "market_desktop.png",
                     "lunch_desktop.png", "portal_en.png", "portal_de.png"]
    width, height = 480, 330
    sheet = Image.new("RGB", (width * 3, height * ((len(contact_names) + 2) // 3)), "#dce2e7")
    draw = ImageDraw.Draw(sheet)
    for i, name in enumerate(contact_names):
        x, y = i % 3 * width, i // 3 * height
        with Image.open(out / name) as shot:
            shot.thumbnail((width - 16, height - 36))
            sheet.paste(shot, (x + (width - shot.width) // 2, y + 26))
        draw.text((x + 8, y + 6), name, fill="#14232b")
    sheet.save(out / "portal_contact_sheet.png")


if __name__ == "__main__":
    main()

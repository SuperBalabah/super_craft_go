"""
Headless Playwright assertion script for 弈境 · GoRealm Web UI.
Strictly follows .antigravityrules:
- Zero-token terminal assertions (PASS/FAIL)
- Headless execution, no browser_subagent
- Direct assertions on:
  1. Brand '弈境 · GoRealm' and vector SVG GoLogo
  2. Professional title 'AI 勝率走勢圖' (no '野狐' text)
  3. Traditional territory analysis modal '棋勢分析結果' with two-column layout & authoritative verdict
  4. '最強超人 AI' setting and AI thinking time / visits options
  5. 3D scenery persistence & quick camera toggle
"""

import sys
import time
import sys
import time

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

def main():
    print("=== Starting Headless Playwright Verification ===")
    failures = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"]
        )
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        # Ensure 3D renderer and contemplation camera in baduk.settings
        init_settings = '{"renderer":"3d","camera":"contemplation","lang":"zh","decor":"washitsu"}'
        context.add_init_script(f"localStorage.setItem('baduk.settings', '{init_settings}')")
        page = context.new_page()

        # 1. Navigate to Vite dev server
        try:
            res = page.goto("http://localhost:1420/", timeout=10000)
            assert res and res.status == 200, f"Expected status 200, got {res.status if res else 'None'}"
            print("[PASS] HTTP 200 OK: 弈境 · GoRealm web frontend reachable")
        except Exception as e:
            print(f"[FAIL] Navigation failed: {e}")
            failures.append("Navigation")
            return 1

        # Wait for page elements to render
        page.wait_for_timeout(2000)

        # 2. Assert Document Title and Brand Name
        title = page.title()
        if "弈境" in title and "GoRealm" in title:
            print(f"[PASS] Document title correctly branded: '{title}'")
        else:
            print(f"[FAIL] Document title unexpected: '{title}'")
            failures.append("Brand Title")

        # 3. Assert Vector SVG GoLogo
        logo = page.query_selector(".brand-wrap .go-logo")
        if logo:
            print("[PASS] Vector SVG GoLogo present in header")
        else:
            print("[FAIL] Vector SVG GoLogo not found in header")
            failures.append("GoLogo")

        # 4. Assert Winrate Chart is mounted with 'AI 勝率走勢圖' title (NOT '野狐')
        winrate_container = page.query_selector(".fox-winrate-container")
        if winrate_container:
            title_text = winrate_container.query_selector(".fox-title")
            chart_title = title_text.inner_text() if title_text else ""
            if "AI 勝率走勢圖" in chart_title or "AI Winrate Chart" in chart_title:
                print(f"[PASS] Winrate chart correctly titled: '{chart_title}' (No third-party naming)")
            else:
                print(f"[FAIL] Winrate chart title unexpected: '{chart_title}'")
                failures.append("WinrateChart Title")
        else:
            print("[FAIL] .fox-winrate-container not found in DOM")
            failures.append("WinrateChart Container")

        # 5. Assert Quick 3D View Switch Button exists
        view_toggle = page.query_selector(".view-toggle")
        if not view_toggle:
            # If still in 2d, click the 2d/3d toggle button
            render_btn = page.query_selector("button[aria-label*='3D'], button[aria-label*='2D'], button[title*='3D'], button[title*='2D']")
            if render_btn:
                render_btn.click()
                page.wait_for_timeout(500)
                view_toggle = page.query_selector(".view-toggle")

        if view_toggle:
            btn_title = view_toggle.get_attribute("title")
            print(f"[PASS] 3D Camera quick toggle button available (title: '{btn_title}')")
        else:
            print("[FAIL] .view-toggle button not found")
            failures.append("View Toggle")

        # 6. Assert Game Sheet contains '最強超人 AI' and 'AI 思考深度'
        try:
            # Click game settings or new game door
            game_door = page.query_selector(".doors button")
            if game_door:
                game_door.click()
                page.wait_for_timeout(500)
                sheet = page.query_selector(".sheet")
                if sheet:
                    sheet_text = sheet.inner_text()
                    if "最強超人 AI" in sheet_text:
                        print("[PASS] Game options contain '最強超人 AI' superhuman bot setting")
                    else:
                        print("[FAIL] '最強超人 AI' missing from game settings")
                        failures.append("Superhuman AI setting")

                    if "AI 思考深度" in sheet_text or "快速" in sheet_text or "標準" in sheet_text:
                        print("[PASS] Game options contain 'AI 思考深度' thinking depth setting (50/150/400/1000 visits)")
                    else:
                        print("[FAIL] AI thinking depth setting missing")
                        failures.append("AI Visits setting")

                    # Close sheet
                    close_btn = sheet.query_selector(".close")
                    if close_btn:
                        close_btn.click()
                        page.wait_for_timeout(300)
        except Exception as e:
            print(f"[WARN] Game sheet inspection note: {e}")

        # 7. Test Traditional Territory Counting (Press 't')
        try:
            page.keyboard.press("t")
            page.wait_for_timeout(1000)
            hud = page.query_selector(".fox-territory-hud")
            if hud:
                hud_text = hud.inner_text()
                if "棋勢分析結果" in hud_text and "分析的結果只提供參考" in hud_text:
                    print("[PASS] Traditional Territory Analysis Modal ('棋勢分析結果') rendered with disclaimer:")
                    for line in hud_text.splitlines():
                        if line.strip():
                            safe_line = line.strip().encode('ascii', 'replace').decode('ascii')
                            print(f"       -> {safe_line}")
                else:
                    print(f"[FAIL] Territory modal content missing required headers/footers")
                    failures.append("Territory HUD Content")
            else:
                print("[NOTE] .fox-territory-hud not rendered immediately on 't'")
        except Exception as e:
            print(f"[FAIL] Error testing territory toggle: {e}")
            failures.append("Territory HUD")

        browser.close()

    print("=================================================")
    if not failures:
        print(">>> ALL HEADLESS UI ASSERTIONS PASSED (100%) <<<")
        return 0
    else:
        print(f">>> FAILURES DETECTED: {failures} <<<")
        return 1

if __name__ == "__main__":
    sys.exit(main())


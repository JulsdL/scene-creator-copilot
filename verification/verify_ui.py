from playwright.sync_api import sync_playwright

def verify_luxury_ui():
    """
    Perform an automated UI verification against http://localhost:3000 and capture screenshots.
    
    Launches a headless Chromium browser, navigates to http://localhost:3000 (60s timeout), waits for a `main` element to appear (60s timeout), and saves a success screenshot to verification/luxury_ui_verification.png. On any exception, logs the error and saves a fallback screenshot to verification/error_screenshot.png. Ensures the browser is closed in all cases.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the page
        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000", timeout=60000)

            print("Waiting for main element...")
            # Wait for content to load
            page.wait_for_selector('main', timeout=60000)

            print("Taking screenshot...")
            # Take a screenshot
            page.screenshot(path="verification/luxury_ui_verification.png")
            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"Error: {e}")
            # Take a screenshot even if there is an error to see what's happening
            page.screenshot(path="verification/error_screenshot.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_luxury_ui()
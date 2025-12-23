from playwright.sync_api import sync_playwright
import time
import os
import threading
import http.server
import socketserver

PORT = 8000

def start_server():
    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass # Suppress logs
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def verify_game():
    # Start server in a thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Allow server to start
    time.sleep(2)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            print("Navigating to game...")
            page.goto(f"http://localhost:{PORT}/index.html")
            
            # Wait for canvas to be present (Three.js appends canvas to body)
            print("Waiting for canvas...")
            page.wait_for_selector("canvas", timeout=10000)
            
            # Check UI elements
            print("Checking UI...")
            expect_ui = page.locator("#ui-container")
            if expect_ui.is_visible():
                print("UI Container is visible.")
            else:
                print("UI Container NOT visible.")

            # Take screenshot
            print("Taking screenshot...")
            screenshot_path = "verification/game_screenshot.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")
            
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_game()

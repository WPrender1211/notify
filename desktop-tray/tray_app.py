import pystray
from PIL import Image, ImageDraw
import threading
import time
import webbrowser
import requests
import sys
import os

SERVER_URL = "http://localhost:5000"
is_muted = False
last_processed_call_id = ""

def create_tray_image(muted=False):
    # Create 64x64 icon
    width, height = 64, 64
    image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    dc = ImageDraw.Draw(image)

    # Circle background (Cyan if active, Rose/Red if muted)
    bg_color = (244, 63, 94, 255) if muted else (56, 189, 248, 255)
    dc.ellipse([4, 4, 60, 60], fill=bg_color)

    # Draw phone handset silhouette
    phone_color = (255, 255, 255, 255)
    dc.rounded_rectangle([20, 16, 44, 48], radius=6, fill=phone_color)
    dc.ellipse([24, 20, 40, 36], fill=bg_color)
    dc.rectangle([20, 26, 44, 38], fill=phone_color)

    if muted:
        # Draw red strike-through line
        dc.line([12, 12, 52, 52], fill=(255, 255, 255, 255), width=4)

    return image

def toggle_mute(icon, item):
    global is_muted
    is_muted = not is_muted
    try:
        requests.post(f"{SERVER_URL}/api/tray/toggle-mute", timeout=2)
    except Exception:
        pass
    
    icon.icon = create_tray_image(is_muted)
    status_text = "MUTED (Notifications Off)" if is_muted else "Active (Listening for Calls)"
    icon.title = f"CallNotify: {status_text}"
    
    if is_muted:
        icon.notify("Call alerts are now MUTED. Incoming calls will log quietly.", "🔕 Notifications Muted")
    else:
        icon.notify("Call alerts are now ON. You will receive popup alerts for calls.", "🔔 Notifications Active")

def open_dashboard(icon, item):
    webbrowser.open(SERVER_URL)

def test_notification(icon, item):
    if is_muted:
        icon.notify("Unmute in tray menu to see incoming alerts.", "Notifications Muted")
    else:
        icon.notify("+1 (555) 349-8812\nNovacorp Global (VIP Client)", "Incoming: Sarah Jenkins")

def exit_app(icon, item):
    icon.stop()
    os._exit(0)

def background_listener(icon):
    global is_muted, last_processed_call_id
    while True:
        try:
            # Check mute state from server
            res = requests.get(f"{SERVER_URL}/api/tray/status", timeout=2)
            if res.status_code == 200:
                data = res.json()
                server_muted = data.get('isMuted', False)
                if server_muted != is_muted:
                    is_muted = server_muted
                    icon.icon = create_tray_image(is_muted)
                    status_text = "MUTED (Notifications Off)" if is_muted else "Active (Listening for Calls)"
                    icon.title = f"CallNotify: {status_text}"

            # Check active incoming calls
            call_res = requests.get(f"{SERVER_URL}/api/calls", timeout=2)
            if call_res.status_code == 200:
                calls_data = call_res.json()
                act = calls_data.get('activeCall')
                if act and act.get('id') != last_processed_call_id:
                    last_processed_call_id = act.get('id')
                    if not is_muted and act.get('state') == 'RINGING':
                        caller = act.get('name') or "Unknown Caller"
                        number = act.get('number') or "Private Number"
                        company = act.get('company')
                        body = f"{number}" + (f" ({company})" if company else "")
                        icon.notify(body, f"Incoming: {caller}")
        except Exception:
            pass
        time.sleep(2)

def main():
    image = create_tray_image(False)
    
    menu = pystray.Menu(
        pystray.MenuItem("📞 CallNotify Hub", None, enabled=False),
        pystray.MenuItem("🔕 Mute Notifications", toggle_mute, checked=lambda item: is_muted),
        pystray.MenuItem("🌐 Open Web Dashboard", open_dashboard),
        pystray.MenuItem("🧪 Test Call Notification", test_notification),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("🚪 Exit", exit_app)
    )

    icon = pystray.Icon("CallNotify", image, "CallNotify: Active (Listening for Calls)", menu)

    # Start listener thread
    t = threading.Thread(target=background_listener, args=(icon,), daemon=True)
    t.start()

    # Show initial startup balloon
    threading.Thread(target=lambda: (time.sleep(1), icon.notify("Right-click this tray icon anytime to Mute Notifications or Open Web Dashboard.", "CallNotify Active in Tray")), daemon=True).start()

    icon.run()

if __name__ == "__main__":
    main()

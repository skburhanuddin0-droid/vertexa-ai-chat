"""
Helper script for start-public.bat.
Uses a SINGLE ngrok tunnel on port 3000 (frontend).
API calls are proxied by Vite to the local backend on port 8000.
No need for a separate backend tunnel!
"""
import subprocess, sys, os, time, json
try:
    import requests
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

PROJECT_DIR  = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(PROJECT_DIR, "frontend")
ENV_FILE     = os.path.join(FRONTEND_DIR, ".env.local")


def update_env(api_url):
    """Update VITE_API_URL in .env.local."""
    lines = []
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r") as f:
            lines = f.readlines()
    found = False
    new_lines = []
    for line in lines:
        if line.strip().startswith("VITE_API_URL"):
            new_lines.append(f"VITE_API_URL={api_url}\n")
            found = True
        else:
            new_lines.append(line)
    if not found:
        new_lines.append(f"VITE_API_URL={api_url}\n")
    with open(ENV_FILE, "w") as f:
        f.writelines(new_lines)


def restore_env():
    """Reset VITE_API_URL to localhost."""
    update_env("http://localhost:8000")


def start_frontend():
    """Start the Vite frontend dev server in a new terminal window."""
    subprocess.Popen(
        ["cmd", "/k", f"cd /d {FRONTEND_DIR} && npm run dev"],
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )


def kill_existing_ngrok():
    """Kill any existing ngrok processes."""
    try:
        subprocess.run(
            ["taskkill", "/f", "/im", "ngrok.exe"],
            capture_output=True, timeout=5
        )
        time.sleep(1)
    except:
        pass


def get_tunnel_url():
    """Get the tunnel URL from ngrok's local API."""
    try:
        resp = requests.get("http://localhost:4040/api/tunnels", timeout=5)
        data = resp.json()
        for t in data.get("tunnels", []):
            url = t.get("public_url", "")
            if url.startswith("https://"):
                return url
    except:
        pass
    return None


def main():
    print()
    print("=" * 55)
    print("  VERTEXA - Public Tunnel Setup (ngrok)")
    print("=" * 55)
    print()

    # Step 0: Kill old ngrok
    print("[0/3] Cleaning up old ngrok processes...")
    kill_existing_ngrok()
    print()

    # Step 1: Set env to proxy mode and start frontend
    print("[1/3] Configuring frontend for PUBLIC mode...")
    update_env("proxy")
    print("  Set VITE_API_URL = proxy (Vite will proxy API calls)")
    print()

    print("  Starting Frontend Dev Server...")
    start_frontend()
    time.sleep(4)
    print("  Frontend started on port 3000!")
    print()

    # Step 2: Start single ngrok tunnel on port 3000
    print("[2/3] Starting ngrok tunnel (port 3000)...")
    ngrok_proc = subprocess.Popen(
        'npx ngrok http 3000',
        shell=True,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )

    # Wait for tunnel URL
    tunnel_url = None
    for attempt in range(20):
        time.sleep(1)
        tunnel_url = get_tunnel_url()
        if tunnel_url:
            break
        if attempt % 5 == 4:
            print(f"  Still waiting... ({attempt+1}s)")

    if not tunnel_url:
        print("[ERROR] Could not get tunnel URL from ngrok.")
        print("  Check http://localhost:4040 for the ngrok dashboard.")
        sys.exit(1)

    print(f"  Tunnel URL: {tunnel_url}")
    print()

    # Print summary
    print("=" * 55)
    print()
    print(f"  Your app is live at:")
    print()
    print("  +-------------------------------------------------+")
    print(f"  |  {tunnel_url:<47} |")
    print("  +-------------------------------------------------+")
    print()
    print("  How it works:")
    print("  - Frontend loads through the ngrok tunnel")
    print("  - API calls are proxied by Vite to localhost:8000")
    print("  - Everything goes through ONE secure tunnel!")
    print()
    print("  Add this URL to your:")
    print("  Supabase Dashboard -> Authentication -> Redirect URLs")
    print()
    print("  Ngrok Dashboard: http://localhost:4040")
    print()
    print("=" * 55)
    print()
    print("  Tunnel is running. Press Ctrl+C to stop.")
    print()

    try:
        while True:
            time.sleep(5)
            if ngrok_proc.poll() is not None:
                print("  [!] Ngrok process ended unexpectedly.")
                break
    except KeyboardInterrupt:
        pass

    print("\nShutting down...")
    ngrok_proc.terminate()
    kill_existing_ngrok()
    print("Restoring .env.local to http://localhost:8000 ...")
    restore_env()
    print("Done. Use start-all.bat for local mode.")


if __name__ == "__main__":
    main()

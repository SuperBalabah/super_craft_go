#!/usr/bin/env python3
"""
Super Craft Go (GoRealm) - Integrated Desktop Engine & Web Server
100% 自包含的本地圍棋中繼與靜態 Web 伺服器：
- 自動掛載 KataGo OpenCL 引擎與雙神經網路（擬人化 Human SL + 超人類模型）
- 內建靜態資源伺服器，直接託管 3D 榧木工坊 (dist/)，無需安裝 Node.js 或 Vite
- 支援一鍵自啟動瀏覽器、即時 AI 走勢勝率分析、全級段位與黑白算地
"""

import os
import sys
import json
import uuid
import time
import subprocess
import threading
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler

# Windows GUI / no-console mode compatibility: redirect None stdout/stderr
if sys.stdout is None:
    sys.stdout = open(os.devnull, 'w', encoding='utf-8')
if sys.stderr is None:
    sys.stderr = open(os.devnull, 'w', encoding='utf-8')

if hasattr(sys.stdout, 'encoding') and sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8765

if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(os.path.abspath(sys.executable))
    MEI_DIR = getattr(sys, '_MEIPASS', BASE_DIR)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    MEI_DIR = BASE_DIR

BUNDLE_DIR = os.path.join(BASE_DIR, "katago_bundle")
KATAGO_EXE = os.path.join(BUNDLE_DIR, "katago.exe")
CONFIG_FILE = os.path.join(BUNDLE_DIR, "analysis.cfg")
MODELS_DIR = os.path.join(BUNDLE_DIR, "models")

# Static assets directory (dist)
DIST_DIR = os.path.join(BASE_DIR, "dist")
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.join(MEI_DIR, "dist")
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.join(BASE_DIR, "..", "masame", "dist")

print(f"[*] DIST_DIR is: {DIST_DIR} (exists: {os.path.exists(DIST_DIR)})")

MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".json": "application/json; charset=utf-8",
}

katago_proc = None
proc_lock = threading.Lock()
engine_status = {"state": "starting", "model": None, "human": None}

pending_requests = {}
pending_lock = threading.Lock()

def reader_thread(proc):
    """KataGo stdout 監聽執行緒，按 query id 分發回應"""
    global engine_status
    while True:
        try:
            line = proc.stdout.readline()
            if not line:
                break
            line = line.strip()
            if not line:
                continue
            data = json.loads(line)
            qid = data.get("id")
            if qid:
                with pending_lock:
                    event, container = pending_requests.pop(qid, (None, None))
                if event and container is not None:
                    container.append(data)
                    event.set()
        except Exception as e:
            print(f"[KataGo Parser Error]: {e}", flush=True)

def stderr_thread(proc):
    """KataGo stderr 監聽執行緒，捕獲就緒與調校進度"""
    global engine_status
    while True:
        try:
            line = proc.stderr.readline()
            if not line:
                break
            line = line.strip()
            if not line:
                continue
            if "Started, ready to begin handling requests" in line:
                engine_status["state"] = "ready"
                print("🚀 KataGo 引擎就緒，開始接收推算請求！", flush=True)
            elif "Tuning" in line:
                engine_status["state"] = "tuning"
                print(f"[KataGo Tuning]: {line}", flush=True)
        except Exception as e:
            print(f"[KataGo Stderr Error]: {e}", flush=True)

def start_engine():
    global katago_proc, engine_status
    if not os.path.exists(KATAGO_EXE):
        print(f"❌ 錯誤: 找不到 KataGo 執行檔: {KATAGO_EXE}", flush=True)
        engine_status["state"] = "error"
        return

    # 尋找模型
    models = [f for f in os.listdir(MODELS_DIR) if f.endswith('.bin.gz') or f.endswith('.txt.gz')]
    active_model = None
    human_model = None

    for m in models:
        if 'human' in m.lower():
            human_model = m
        else:
            active_model = m

    if not active_model and models:
        active_model = models[0]

    engine_status["model"] = active_model
    engine_status["human"] = human_model
    engine_status["state"] = "starting"

    cmd = [
        KATAGO_EXE,
        "analysis",
        "-config", CONFIG_FILE,
        "-model", os.path.join(MODELS_DIR, active_model)
    ]

    if human_model:
        cmd.extend(["-human-model", os.path.join(MODELS_DIR, human_model)])

    creation_flags = 0
    if sys.platform == 'win32':
        creation_flags = getattr(subprocess, 'CREATE_NO_WINDOW', 0x08000000)

    env = os.environ.copy()
    env["PATH"] = BUNDLE_DIR + ";" + env.get("PATH", "")

    print(f"[*] 啟動 KataGo: {' '.join(cmd)}", flush=True)
    katago_proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        cwd=BUNDLE_DIR,
        env=env,
        creationflags=creation_flags
    )

    t_out = threading.Thread(target=reader_thread, args=(katago_proc,), daemon=True)
    t_err = threading.Thread(target=stderr_thread, args=(katago_proc,), daemon=True)
    t_out.start()
    t_err.start()

class BridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # 靜默正常 HTTP 請求日誌以保持終端乾淨
        return

    def _set_cors_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_cors_headers(204)

    def do_GET(self):
        clean_path = self.path.split("?")[0]
        if clean_path == '/status':
            self._set_cors_headers(200)
            res = {
                "state": engine_status["state"],
                "active_model": engine_status["model"],
                "human_model": engine_status["human"],
                "pid": katago_proc.pid if katago_proc else None
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        # 靜態資源託管 (Serving 3D Web App from dist)
        if clean_path == '/' or not clean_path:
            file_path = os.path.join(DIST_DIR, "index.html")
        else:
            rel = clean_path.lstrip('/')
            file_path = os.path.join(DIST_DIR, rel)
            if not os.path.exists(file_path):
                file_path = os.path.join(DIST_DIR, "index.html")

        print(f"[*] GET {clean_path} -> file_path: {file_path} (exists: {os.path.exists(file_path)})", flush=True)

        if os.path.exists(file_path) and os.path.isfile(file_path):
            ext = os.path.splitext(file_path)[1].lower()
            mime = MIME_TYPES.get(ext, "application/octet-stream")
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            with open(file_path, "rb") as f:
                self.wfile.write(f.read())
        else:
            self._set_cors_headers(404)
            self.wfile.write(b'{"error": "not found"}')

    def do_POST(self):
        if self.path == '/analyze':
            content_length = int(self.headers.get('Content-Length', 0))
            raw_data = self.rfile.read(content_length).decode('utf-8')
            try:
                query = json.loads(raw_data)
            except Exception as e:
                self._set_cors_headers(400)
                self.wfile.write(json.dumps({"error": f"Invalid JSON: {e}"}).encode('utf-8'))
                return

            if "id" not in query:
                query["id"] = f"masame_{uuid.uuid4().hex[:10]}"
            qid = query["id"]

            # Auto-heal / auto-start engine if not running
            global katago_proc
            if not katago_proc or katago_proc.poll() is not None:
                print("[*] KataGo process not running, restarting engine...", flush=True)
                start_engine()

            # Wait for engine to become ready (up to 25s for initial OpenCL/weights loading)
            for _ in range(50):
                if engine_status.get("state") == "ready":
                    break
                if katago_proc and katago_proc.poll() is not None:
                    break
                time.sleep(0.5)

            if not katago_proc or katago_proc.poll() is not None:
                self._set_cors_headers(503)
                self.wfile.write(json.dumps({"error": "KataGo engine failed to start"}).encode('utf-8'))
                return

            event = threading.Event()
            container = []
            with pending_lock:
                pending_requests[qid] = (event, container)

            # 發送查詢給 KataGo stdin
            query_str = json.dumps(query) + "\n"
            with proc_lock:
                try:
                    katago_proc.stdin.write(query_str)
                    katago_proc.stdin.flush()
                except Exception as e:
                    with pending_lock:
                        pending_requests.pop(qid, None)
                    self._set_cors_headers(500)
                    self.wfile.write(json.dumps({"error": f"Failed to send query: {e}"}).encode('utf-8'))
                    return

            # 等候 KataGo 回應（最多 30 秒）
            success = event.wait(timeout=30.0)
            if success and container:
                self._set_cors_headers(200)
                self.wfile.write(json.dumps(container[0]).encode('utf-8'))
            else:
                with pending_lock:
                    pending_requests.pop(qid, None)
                self._set_cors_headers(504)
                self.wfile.write(json.dumps({"error": "Query timeout"}).encode('utf-8'))
        else:
            self._set_cors_headers(404)
            self.wfile.write(b'{"error": "not found"}')

class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True

def run_server(open_browser=True):
    try:
        server = ReusableHTTPServer(('127.0.0.1', PORT), BridgeHandler)
    except OSError as e:
        print(f"⚠️ Port {PORT} already bound: {e}. Opening browser...", flush=True)
        if open_browser:
            webbrowser.open(f"http://127.0.0.1:{PORT}")
        return
    url = f"http://127.0.0.1:{PORT}"
    print(f"🌐 Super Craft Go (GoRealm) 已就緒: {url}", flush=True)
    if open_browser:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n正在停止服務與 KataGo...", flush=True)
        if katago_proc:
            katago_proc.terminate()
        server.server_close()

if __name__ == '__main__':
    open_b = "--no-browser" not in sys.argv
    start_engine()
    run_server(open_browser=open_b)

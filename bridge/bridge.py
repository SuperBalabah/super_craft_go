#!/usr/bin/env python3
"""
Craft Go / Masame - KataGo Analysis Bridge Server
高效安全的本地 KataGo 守護中繼程序：
- 自動掛載 KataGo OpenCL 引擎與雙神經網路（擬人化 Human SL + 最強開源超人類模型）
- 提供高效 HTTP API 供 Masame 前端直連
- 支援職業九段至業餘 20k 全級位、秀策/吳清源等歷史大師、死活題與覆盤得失目數分析
"""

import os
import sys
import json
import uuid
import subprocess
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

# Windows console encoding fix
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8765
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BUNDLE_DIR = os.path.join(BASE_DIR, "katago_bundle")

KATAGO_EXE = os.path.join(BUNDLE_DIR, "katago.exe")
CONFIG_FILE = os.path.join(BUNDLE_DIR, "analysis.cfg")
MODELS_DIR = os.path.join(BUNDLE_DIR, "models")

katago_proc = None
proc_lock = threading.Lock()
engine_status = {"state": "starting", "model": None, "human": None}

pending_requests = {}
pending_lock = threading.Lock()

def reader_thread(proc):
    """KataGo stdout 監聽執行緒，按 query id 分發回應"""
    global engine_status
    for line in iter(proc.stdout.readline, ''):
        if not line:
            break
        line = line.strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            qid = data.get("id")
            if qid:
                with pending_lock:
                    event, container = pending_requests.pop(qid, (None, None))
                if event and container is not None:
                    container.append(data)
                    event.set()
        except Exception as e:
            print(f"[KataGo Parser Error]: {e} on line: {line[:100]}")

def stderr_thread(proc):
    """KataGo stderr 監聽執行緒，捕獲就緒與調校進度"""
    global engine_status
    for line in iter(proc.stderr.readline, ''):
        if not line:
            break
        line = line.strip()
        if not line:
            continue
        if "Started, ready to begin handling requests" in line:
            engine_status["state"] = "ready"
            print(f"\n✨ KataGo 雙神經網路引擎已就緒，等待前端分析請求！\n")
        elif "Tuning" in line or "Testing" in line:
            engine_status["state"] = "tuning"
            print(f"[KataGo GPU Tuning]: {line}")
        elif "Model name" in line:
            print(f"[KataGo Engine]: {line}")

def start_engine():
    global katago_proc, engine_status

    if not os.path.exists(KATAGO_EXE):
        print(f"⚠️ 未找到 KataGo 執行檔: {KATAGO_EXE}")
        engine_status["state"] = "error"
        return

    strong_model = None
    human_model = None

    if os.path.exists(MODELS_DIR):
        for f in os.listdir(MODELS_DIR):
            fp = os.path.join(MODELS_DIR, f)
            if "human" in f:
                human_model = fp
            elif "kata1" in f:
                strong_model = fp

    if not strong_model or not human_model:
        print(f"⚠️ 缺少神經網路模型！請確認 {MODELS_DIR} 目錄完整。")
        engine_status["state"] = "error"
        return

    engine_status["model"] = os.path.basename(strong_model)
    engine_status["human"] = os.path.basename(human_model)

    cmd = [
        KATAGO_EXE,
        "analysis",
        "-config", CONFIG_FILE,
        "-model", strong_model,
        "-human-model", human_model
    ]

    print(f"🚀 啟動 KataGo 分析進程: {' '.join(cmd)}")
    katago_proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        cwd=BUNDLE_DIR
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
        if self.path == '/status':
            self._set_cors_headers(200)
            res = {
                "state": engine_status["state"],
                "active_model": engine_status["model"],
                "human_model": engine_status["human"],
                "pid": katago_proc.pid if katago_proc else None
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
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

            if not katago_proc or katago_proc.poll() is not None:
                self._set_cors_headers(503)
                self.wfile.write(json.dumps({"error": "KataGo engine not running"}).encode('utf-8'))
                return

            event = threading.Event()
            container = []
            with pending_lock:
                pending_requests[qid] = (event, container)

            with proc_lock:
                try:
                    katago_proc.stdin.write(json.dumps(query) + "\n")
                    katago_proc.stdin.flush()
                except Exception as e:
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

def run_server():
    server = HTTPServer(('127.0.0.1', PORT), BridgeHandler)
    print(f"🌐 Masame 本地引擎中繼微服務已啟動: http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n正在停止服務與 KataGo...")
        if katago_proc:
            katago_proc.terminate()
        server.server_close()

if __name__ == '__main__':
    start_engine()
    run_server()

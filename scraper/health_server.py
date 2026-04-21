"""
Wrapper que inicia o Scraper Scheduler e expõe um endpoint HTTP mínimo
de health check na porta 9095 para compatibilidade com o preview tool.
"""
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status":"ok","service":"scraper-scheduler"}')

    def log_message(self, *args):
        pass  # silencioso


def start_scheduler():
    subprocess.run([sys.executable, "scheduler.py"])


if __name__ == "__main__":
    t = threading.Thread(target=start_scheduler, daemon=True)
    t.start()
    print("[health_server] Scraper Scheduler iniciado. Health check em http://localhost:9095")
    HTTPServer(("", 9095), HealthHandler).serve_forever()

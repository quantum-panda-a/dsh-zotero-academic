"""
Lightweight REST daemon for the Zotero Academic & Semantic Engine.
Serves requests from the DeepSeek Harness TypeScript plugin over local HTTP.
"""

import argparse
import json
import logging
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict

# Ensure local module aliasing
if "zotero_mcp" not in sys.modules:
    import engine
    sys.modules["zotero_mcp"] = engine

from engine.core import ZoteroCore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [zotero-engine] %(message)s"
)
logger = logging.getLogger("zotero_server")

core: ZoteroCore = None

class ZoteroRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, data: Dict[str, Any]):
        try:
            body = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._send_json(200, {"status": "ok", "service": "zotero-engine", "version": "1.0.0"})
        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            self._send_json(400, {"error": "Invalid JSON"})
            return

        endpoint = self.path.rstrip("/")
        try:
            if endpoint == "/api/hybrid_search":
                query = payload.get("query", "")
                limit = int(payload.get("limit", 5))
                mode = payload.get("mode", "hybrid")
                group_id = payload.get("group_id")
                results = core.hybrid_search(query=query, limit=limit, mode=mode, group_id=group_id)
                self._send_json(200, {"ok": True, "results": results})

            elif endpoint == "/api/semantic_search":
                query = payload.get("query", "")
                limit = int(payload.get("limit", 5))
                group_id = payload.get("group_id")
                results = core.semantic_search(query=query, limit=limit, group_id=group_id)
                self._send_json(200, {"ok": True, "results": results})

            elif endpoint == "/api/search":
                query = payload.get("query", "")
                limit = int(payload.get("limit", 10))
                results = core.search_items(query=query, limit=limit)
                self._send_json(200, {"ok": True, "items": results})

            elif endpoint == "/api/read_paper":
                item_key = payload.get("item_key", "")
                start_page = payload.get("start_page")
                end_page = payload.get("end_page")
                result = core.read_paper(item_key=item_key, start_page=start_page, end_page=end_page)
                self._send_json(200, {"ok": True, "data": result})

            elif endpoint == "/api/annotations":
                item_key = payload.get("item_key", "")
                results = core.get_annotations(item_key=item_key)
                self._send_json(200, {"ok": True, "annotations": results})

            elif endpoint == "/api/add_paper":
                identifier = payload.get("identifier", "")
                result = core.add_paper(identifier=identifier)
                self._send_json(200, {"ok": True, "data": result})

            elif endpoint == "/api/sync_database":
                action = payload.get("action", "status")
                result = core.sync_database(action=action)
                self._send_json(200, {"ok": True, "data": result})

            else:
                self._send_json(404, {"error": f"Unknown endpoint: {endpoint}"})

        except Exception as e:
            logger.exception("Error processing request at %s", endpoint)
            self._send_json(500, {"ok": False, "error": str(e)})

    def log_message(self, format, *args):
        # Clean logging
        logger.info("%s - %s", self.address_string(), format % args)

def main():
    global core
    parser = argparse.ArgumentParser(description="Zotero Academic & Semantic Engine Daemon")
    parser.add_argument("--host", default="127.0.0.1", help="Host address to bind")
    parser.add_argument("--port", type=int, default=23125, help="Port to listen on")
    parser.add_argument("--db-path", default=None, help="Custom path to zotero.sqlite")
    args = parser.parse_args()

    core = ZoteroCore(db_path=args.db_path)
    server_address = (args.host, args.port)
    httpd = ThreadingHTTPServer(server_address, ZoteroRequestHandler)
    logger.info("Zotero Engine Daemon listening on http://%s:%d", args.host, args.port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down Zotero Engine Daemon...")
        httpd.server_close()

if __name__ == "__main__":
    main()

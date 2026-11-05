#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import sys
import os

PORT = 51247
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/index.html"
        print(f"============================================================")
        print(f"🚀 CHRONO-7 Cinematic 3D Experience running at:")
        print(f"👉 {url}")
        print(f"👉 Standalone file: file://{os.path.join(DIRECTORY, 'standalone.html')}")
        print(f"============================================================")
        print("Press Ctrl+C to stop the server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    start_server()

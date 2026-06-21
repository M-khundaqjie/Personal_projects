#!/usr/bin/env python3
"""
Animix backend.
Reads the token.json you already created and serves your live
MyAnimeList plan-to-watch / plan-to-read lists to the Animix app.

RUN
  1. Keep this file in the SAME folder as token.json.
  2. Paste your Client ID + Secret below (same two as before).
  3. Terminal:  python3 animix_server.py
  4. Test it: open http://localhost:8000/lists in your browser.
     You should see your titles as JSON. That's step 1 done.

Leave this running while you use the app.
"""

import json
import urllib.request
import urllib.parse
import urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from config import CLIENT_ID, CLIENT_SECRET

PORT = 8000
API = "https://api.myanimelist.net/v2"
TOKEN_URL = "https://myanimelist.net/v1/oauth2/token"


def load_token():
    with open("token.json") as f:
        return json.load(f)


def save_token(tok):
    with open("token.json", "w") as f:
        json.dump(tok, f, indent=2)


def refresh(tok):
    """Get a fresh access token if the old one expired."""
    data = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "refresh_token",
        "refresh_token": tok["refresh_token"],
    }).encode()
    with urllib.request.urlopen(urllib.request.Request(TOKEN_URL, data=data)) as r:
        new = json.load(r)
    save_token(new)
    return new


def fetch_list(media, status, access):
    url = f"{API}/users/@me/{media}list?status={status}&limit=1000&fields=list_status"
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + access})
    with urllib.request.urlopen(req) as r:
        data = json.load(r)
    return [i["node"]["title"] for i in data.get("data", [])]


def get_lists():
    tok = load_token()
    try:
        anime = fetch_list("anime", "plan_to_watch", tok["access_token"])
        manga = fetch_list("manga", "plan_to_read", tok["access_token"])
    except urllib.error.HTTPError as e:
        if e.code == 401:  # token expired -> refresh once and retry
            tok = refresh(tok)
            anime = fetch_list("anime", "plan_to_watch", tok["access_token"])
            manga = fetch_list("manga", "plan_to_read", tok["access_token"])
        else:
            raise
    return {"anime": anime, "manga": manga}


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/lists"):
            try:
                body = json.dumps(get_lists()).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._cors()
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self._cors()
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self._cors()
            self.end_headers()

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    if "PASTE_YOUR" in CLIENT_ID:
        print("\n  Add your Client ID and Secret at the top first.\n")
    else:
        print(f"\n  Animix backend running.")
        print(f"  Test in browser:  http://localhost:{PORT}/lists")
        print(f"  Stop it with Ctrl+C\n")
        ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()

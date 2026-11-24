#!/usr/bin/env python3
"""Fetch the public Google Photos share page for the listing album and write
data/photos.json with the photos currently in it. Re-running this picks up
additions/removals/reordering in the album, so the site's gallery stays in
sync with it.

The album's public SHARE link (photos.google.com/share/...?key=...) embeds
each photo as a signed lh3.googleusercontent.com/pw/<token> base URL; no
Google login is required to fetch the page or the images. Append a size
suffix (e.g. "=w1600") to a base URL to get that image at a given width.
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

ALBUM_SHARE_URL = "https://photos.google.com/share/AF1QipN-h7kEOhiUqwgCISj_oSGhDDMp5jMCTfV3EQNR_ZlDSCKy22luZRcW0UZu-yG_GA?key=UDY4MnJ4Qm41ZFVjV1V0S18tX3NSRjhhV0FIYnFn"
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "photos.json"
BASE_URL_RE = re.compile(r"https://lh3\.googleusercontent\.com/pw/[A-Za-z0-9_-]+")


def fetch_album_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_photo_bases(html: str) -> list[str]:
    seen = []
    for match in BASE_URL_RE.findall(html):
        if match not in seen:
            seen.append(match)
    return seen


def main() -> int:
    html = fetch_album_html(ALBUM_SHARE_URL)
    bases = extract_photo_bases(html)
    if not bases:
        print("No photos found in album page — not overwriting existing data/photos.json", file=sys.stderr)
        return 1

    photos = [{"id": base.rsplit("/", 1)[-1][:16], "base": base} for base in bases]

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps({"photos": photos}, indent=2) + "\n")
    print(f"Wrote {len(photos)} photos to {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

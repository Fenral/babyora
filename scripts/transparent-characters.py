"""Batch background-remove the 7 Klemeg weather characters via rembg.

Reads from public/illustrations/characters/*.png, writes RGBA PNG-32 to
_tmp_transparent/. Skips _rgb-backup/ subfolder.
"""
import sys
from pathlib import Path
from rembg import remove, new_session

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "illustrations" / "characters"
DST = ROOT / "_tmp_transparent"
DST.mkdir(exist_ok=True)

session = new_session("u2netp")  # smaller, faster than u2net; fine for watercolor

count = 0
for png in sorted(SRC.glob("klemeg-*.png")):
    out = DST / png.name
    input_bytes = png.read_bytes()
    output_bytes = remove(input_bytes, session=session)
    out.write_bytes(output_bytes)
    print(f"  {png.name}: {len(input_bytes):,} -> {len(output_bytes):,} bytes", flush=True)
    count += 1

print(f"\nDone. {count} files written to {DST}", flush=True)

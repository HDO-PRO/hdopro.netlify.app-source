import re
from pathlib import Path

html = Path('game.html').read_text(encoding='utf-8')
js = Path('game.js').read_text(encoding='utf-8')

ids_html = set(re.findall(r'\bid="([^"]+)"', html))
ids_js = set(re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", js))

missing = ids_js - ids_html
if missing:
    print("FAIL: getElementById references missing in game.html:")
    for m in sorted(missing):
        print(f"  - {m}")
    exit(1)
else:
    print(f"PASS: all {len(ids_js)} getElementById references have matching IDs in game.html.")

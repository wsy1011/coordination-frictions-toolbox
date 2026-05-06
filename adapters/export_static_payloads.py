from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.repository import repository


OUTPUT_DIR = ROOT / "frontend" / "public" / "data"


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(sanitize(payload), ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")


def sanitize(value: object) -> object:
    if isinstance(value, dict):
        return {key: sanitize(item) for key, item in value.items()}
    if isinstance(value, list):
        return [sanitize(item) for item in value]
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value
    return value


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    write_json(OUTPUT_DIR / "locks.json", {"items": repository.get_locks()})
    write_json(OUTPUT_DIR / "corridors.json", {"items": repository.get_corridors()})
    write_json(OUTPUT_DIR / "network.json", repository.get_network())
    write_json(OUTPUT_DIR / "paper-evidence.json", repository.get_paper_evidence())
    write_json(OUTPUT_DIR / "manifest.json", {"evidence": "data/paper-evidence.json"})
    print(f"Static paper-evidence payloads exported to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

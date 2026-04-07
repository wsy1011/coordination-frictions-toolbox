from __future__ import annotations

import json
import math
from pathlib import Path

from backend.app.repository import repository


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "frontend" / "public" / "data"
SIMULATION_DIR = OUTPUT_DIR / "simulations"

POLICY_FAMILIES = ("queue", "structural")
ALLOCATION_FAMILIES = ("uniform", "hard_topk", "soft_topk", "rank_weighted")
BUDGET_LEVELS = (5, 10, 15)


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
    SIMULATION_DIR.mkdir(parents=True, exist_ok=True)

    write_json(OUTPUT_DIR / "locks.json", {"items": repository.get_locks()})
    write_json(OUTPUT_DIR / "corridors.json", {"items": repository.get_corridors()})
    write_json(OUTPUT_DIR / "network.json", repository.get_network())
    write_json(OUTPUT_DIR / "baseline-overview.json", repository.get_baseline_overview())
    write_json(OUTPUT_DIR / "rankings.json", repository.get_rankings())

    manifest: list[dict[str, object]] = []
    for policy_family in POLICY_FAMILIES:
        for allocation_family in ALLOCATION_FAMILIES:
            for budget_k in BUDGET_LEVELS:
                payload = repository.simulate(policy_family, allocation_family, budget_k)
                file_name = f"{policy_family}_{allocation_family}_{budget_k}.json"
                write_json(SIMULATION_DIR / file_name, payload)
                manifest.append(
                    {
                        "policy_family": policy_family,
                        "allocation_family": allocation_family,
                        "budget_k": budget_k,
                        "path": f"data/simulations/{file_name}",
                    }
                )

    write_json(OUTPUT_DIR / "manifest.json", {"simulations": manifest})
    print(f"Static payloads exported to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

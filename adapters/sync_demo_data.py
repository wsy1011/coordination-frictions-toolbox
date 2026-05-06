from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "inland-shipping-eeoi-corridor-pressure"
TARGET = ROOT / "data" / "demo"


FILES = [
    ("data/raw/hazard_minimal/raw/lock_nodes_52.csv", "lock_nodes_52.csv"),
    ("data/raw/hazard_minimal/raw/lock_nodes_final_paper.csv", "lock_nodes_final_paper.csv"),
    ("data/processed/network_edges.csv", "network_edges.csv"),
]


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    for source_rel, target_name in FILES:
        src = SOURCE / source_rel
        dst = TARGET / target_name
        shutil.copy2(src, dst)
        print(f"Synced {src} -> {dst}")


if __name__ == "__main__":
    main()

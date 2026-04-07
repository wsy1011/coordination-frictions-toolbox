from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "coordination frictions"
TARGET = ROOT / "data" / "demo"


FILES = [
    ("data/raw/lock_nodes_52.csv", "lock_nodes_52.csv"),
    ("data/raw/lock_nodes_final_paper.csv", "lock_nodes_final_paper.csv"),
    ("data/processed/network_edges.csv", "network_edges.csv"),
    ("results/lock_friction_upgrade_results.json", "lock_friction_upgrade_results.json"),
    ("results/lock_friction_model_results.json", "lock_friction_model_results.json"),
    ("results/appendix_tables/policy_v2_lock_scores.csv", "policy_v2_lock_scores.csv"),
    ("results/appendix_tables/policy_top10_lock_outcomes.csv", "policy_top10_lock_outcomes.csv"),
    ("results/appendix_tables/policy_v2_queue_summary.csv", "policy_v2_queue_summary.csv"),
    ("results/appendix_tables/policy_v2_structural_summary.csv", "policy_v2_structural_summary.csv"),
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


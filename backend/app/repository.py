from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd

from .config import ROOT_DIR, settings


ENCODINGS = ("utf-8-sig", "utf-8", "gb18030", "gbk")

CORRIDOR_GROUP_MAP = {
    "沿江口门群": "沿江口门",
    "京杭主通道": "京杭运河",
    "苏南入江支网": "苏南",
    "通扬—里下河网络": "苏中",
    "淮河—徐宿西北网络": "苏北",
    "盐河—连申—出海网络": "苏北",
}

ALLOCATION_LABELS = {
    "uniform": "Uniform",
    "hard_topk": "Hard-Topk",
    "soft_topk": "Soft-Topk",
    "rank_weighted": "Rank-Weighted",
}

POLICY_LABELS = {
    "queue": "queue governance",
    "structural": "empty/barge-tug governance",
}


def normalize_corridor_group(value: object) -> str:
    text = str(value or "").strip()
    if not text:
        return "其他"
    return CORRIDOR_GROUP_MAP.get(text, text)


class DataRepository:
    def __init__(self, mode: str, source_project_dir: Path, private_data_dir: Path | None):
        self.mode = mode
        self.source_project_dir = Path(source_project_dir)
        self.private_data_dir = Path(private_data_dir) if private_data_dir else None
        self.demo_dir = ROOT_DIR / "data" / "demo"

    def _base_dir(self) -> Path:
        if self.mode == "demo":
            return self.demo_dir
        if self.private_data_dir:
            return self.private_data_dir
        return self.source_project_dir

    def _read_csv(self, path: Path) -> pd.DataFrame:
        last_error: Exception | None = None
        for encoding in ENCODINGS:
            try:
                return pd.read_csv(path, encoding=encoding)
            except Exception as exc:  # noqa: BLE001
                last_error = exc
        raise RuntimeError(f"Unable to read CSV {path}") from last_error

    def _read_json(self, path: Path) -> dict[str, Any]:
        last_error: Exception | None = None
        for encoding in ENCODINGS:
            try:
                return json.loads(path.read_text(encoding=encoding))
            except Exception as exc:  # noqa: BLE001
                last_error = exc
        raise RuntimeError(f"Unable to read JSON {path}") from last_error

    def _resolve(self, *parts: str) -> Path:
        candidate = self._base_dir().joinpath(*parts)
        if candidate.exists():
            return candidate
        if self.mode == "demo":
            raise FileNotFoundError(f"Missing demo asset: {candidate}")
        fallback = ROOT_DIR.joinpath("data", "demo", parts[-1])
        if fallback.exists():
            return fallback
        raise FileNotFoundError(f"Missing required asset: {candidate}")

    def _resolve_asset(self, demo_name: str, source_parts: tuple[str, ...]) -> Path:
        if self.mode == "demo":
            return self._resolve(demo_name)
        try:
            return self._resolve(*source_parts)
        except FileNotFoundError:
            return self._resolve(demo_name)

    @lru_cache(maxsize=1)
    def load_upgrade_results(self) -> dict[str, Any]:
        path = self._resolve_asset(
            "lock_friction_upgrade_results.json",
            ("results", "lock_friction_upgrade_results.json"),
        )
        return self._read_json(path)

    @lru_cache(maxsize=1)
    def load_model_results(self) -> dict[str, Any]:
        path = self._resolve_asset(
            "lock_friction_model_results.json",
            ("results", "lock_friction_model_results.json"),
        )
        return self._read_json(path)

    @lru_cache(maxsize=1)
    def load_nodes(self) -> pd.DataFrame:
        coords_path = self._resolve_asset(
            "lock_nodes_52.csv",
            ("data", "raw", "lock_nodes_52.csv"),
        )
        meta_path = self._resolve_asset(
            "lock_nodes_final_paper.csv",
            ("data", "raw", "lock_nodes_final_paper.csv"),
        )
        coords = self._read_csv(coords_path).rename(columns={"node_id": "lock_id"})
        meta = self._read_csv(meta_path).rename(columns={"node_id": "lock_id"})
        merged = meta.merge(coords, on=["lock_id"], how="left", suffixes=("", "_coord"))
        merged["has_geometry"] = merged["latitude"].notna() & merged["longitude"].notna()
        merged["is_public_visible"] = merged["node_type"].ne("virtual_boundary")
        merged["display_order"] = merged["observed_events"].rank(method="first", ascending=False).astype(int)
        merged["macro_corridor"] = merged["macro_corridor"].map(normalize_corridor_group)
        return merged

    @lru_cache(maxsize=1)
    def load_edges(self) -> pd.DataFrame:
        path = self._resolve_asset(
            "network_edges.csv",
            ("data", "processed", "network_edges.csv"),
        )
        return self._read_csv(path)

    @lru_cache(maxsize=1)
    def load_lock_scores(self) -> pd.DataFrame:
        path = self._resolve_asset(
            "policy_v2_lock_scores.csv",
            ("results", "appendix_tables", "policy_v2_lock_scores.csv"),
        )
        frame = self._read_csv(path)
        frame["corridor"] = frame["corridor"].map(normalize_corridor_group)
        return frame

    @lru_cache(maxsize=1)
    def load_top_lock_outcomes(self) -> pd.DataFrame:
        path = self._resolve_asset(
            "policy_top10_lock_outcomes.csv",
            ("results", "appendix_tables", "policy_top10_lock_outcomes.csv"),
        )
        return self._read_csv(path)

    @lru_cache(maxsize=1)
    def load_queue_summary(self) -> pd.DataFrame:
        path = self._resolve_asset(
            "policy_v2_queue_summary.csv",
            ("results", "appendix_tables", "policy_v2_queue_summary.csv"),
        )
        return self._read_csv(path)

    @lru_cache(maxsize=1)
    def load_structural_summary(self) -> pd.DataFrame:
        path = self._resolve_asset(
            "policy_v2_structural_summary.csv",
            ("results", "appendix_tables", "policy_v2_structural_summary.csv"),
        )
        return self._read_csv(path)

    @lru_cache(maxsize=1)
    def load_budget_robustness(self) -> pd.DataFrame:
        path = self._resolve_asset(
            "policy_v2_budget_robustness.csv",
            ("results", "appendix_tables", "policy_v2_budget_robustness.csv"),
        )
        return self._read_csv(path)

    @lru_cache(maxsize=1)
    def _baseline_metrics(self) -> dict[str, float]:
        queue_summary = self.load_queue_summary()
        structural_summary = self.load_structural_summary()
        return {
            "expected_wait1": float(queue_summary.iloc[0]["expected_wait1"] - queue_summary.iloc[0]["delta_wait1"]),
            "p90_wait1": float(queue_summary.iloc[0]["p90_wait1"] - queue_summary.iloc[0]["delta_p90_wait1"]),
            "p95_wait1": float(queue_summary.iloc[0]["p95_wait1"] - queue_summary.iloc[0]["delta_p95_wait1"]),
            "high_wait_prob": float(
                queue_summary.iloc[0]["high_wait_prob"] - queue_summary.iloc[0]["delta_high_wait_prob"]
            ),
            "low_eff_share": float(
                structural_summary.iloc[0]["low_eff_share"] - structural_summary.iloc[0]["delta_low_eff_share"]
            ),
            "state4_share": float(
                structural_summary.iloc[0]["state4_share"] - structural_summary.iloc[0]["delta_state4_share"]
            ),
        }

    def _scenario_title(self, policy_family: str, allocation_family: str, budget_k: int) -> str:
        allocation_label = ALLOCATION_LABELS.get(allocation_family, allocation_family)
        policy_label = POLICY_LABELS.get(policy_family, policy_family)
        return f"{allocation_label} {policy_label} (K={budget_k})"

    def _summary_table(self, policy_family: str) -> pd.DataFrame:
        return self.load_queue_summary() if policy_family == "queue" else self.load_structural_summary()

    def _get_exact_summary(
        self, policy_family: str, allocation_family: str, budget_k: int
    ) -> dict[str, Any] | None:
        table = self._summary_table(policy_family)
        exact = table[
            (table["policy_family"] == policy_family)
            & (table["allocation_family"] == allocation_family)
            & (table["budget_k"] == budget_k)
        ]
        if exact.empty:
            return None
        return exact.iloc[0].to_dict()

    def _scenario_summary(self, policy_family: str, allocation_family: str, budget_k: int) -> dict[str, Any]:
        exact = self._get_exact_summary(policy_family, allocation_family, budget_k)
        if exact is not None:
            return exact

        robustness = self.load_budget_robustness()
        robust_row = robustness[
            (robustness["policy_family"] == policy_family)
            & (robustness["allocation_family"] == allocation_family)
            & (robustness["budget_k"] == budget_k)
        ]
        if robust_row.empty:
            raise ValueError("No simulation scenario found for the requested policy settings.")

        row = robust_row.iloc[0].to_dict()
        baseline = self._baseline_metrics()
        summary: dict[str, Any] = {
            "scenario": self._scenario_title(policy_family, allocation_family, budget_k),
            "policy_family": policy_family,
            "allocation_family": allocation_family,
            "budget_k": int(budget_k),
            "delta_wait1": float(row["delta_wait1"]),
            "delta_p90_wait1": float(row["delta_p90_wait1"]),
            "delta_p95_wait1": float(row["delta_p95_wait1"]),
            "delta_high_wait_prob": float(row["delta_high_wait_prob"]),
            "delta_low_eff_share": float(row["delta_low_eff_share"]),
            "delta_state4_share": float(row["delta_state4_share"]),
        }
        summary["expected_wait1"] = baseline["expected_wait1"] + summary["delta_wait1"]
        summary["p90_wait1"] = baseline["p90_wait1"] + summary["delta_p90_wait1"]
        summary["p95_wait1"] = baseline["p95_wait1"] + summary["delta_p95_wait1"]
        summary["high_wait_prob"] = baseline["high_wait_prob"] + summary["delta_high_wait_prob"]
        summary["low_eff_share"] = baseline["low_eff_share"] + summary["delta_low_eff_share"]
        summary["state4_share"] = baseline["state4_share"] + summary["delta_state4_share"]
        return summary

    def _impact_reference(self, policy_family: str, allocation_family: str) -> tuple[str, dict[str, Any], dict[str, Any]]:
        if policy_family == "queue":
            if allocation_family == "uniform":
                exact = self._get_exact_summary("queue", "uniform", 10)
                if exact is None:
                    raise ValueError("Missing queue reference scenario for impact chart.")
                return "uniform_queue", exact, exact

            base_reference = self._get_exact_summary("queue", "hard_topk", 10)
            allocation_reference = self._get_exact_summary("queue", allocation_family, 10)
            if base_reference is None:
                raise ValueError("Missing queue reference scenario for impact chart.")
            if allocation_reference is None:
                allocation_reference = base_reference
            return "targeted_queue", base_reference, allocation_reference

        exact = self._get_exact_summary("structural", allocation_family, 10)
        if exact is None:
            exact = self._get_exact_summary("structural", "uniform", 10)
        if exact is None:
            raise ValueError("Missing structural reference scenario for impact chart.")
        return "targeted_queue", exact, exact

    def _impact_locks(
        self, policy_family: str, allocation_family: str, selected_summary: dict[str, Any]
    ) -> list[dict[str, Any]]:
        top_outcomes = self.load_top_lock_outcomes().copy()
        column_prefix, reference_summary, allocation_reference = self._impact_reference(policy_family, allocation_family)
        delta_column = f"{column_prefix}_delta_wait1_min"

        reference_delta = float(reference_summary.get("delta_wait1", 0) or 0)
        allocation_delta = float(allocation_reference.get("delta_wait1", 0) or 0)
        selected_delta = float(selected_summary.get("delta_wait1", 0) or 0)

        allocation_scale = 1.0
        reference_focus = float(reference_summary.get("mean_toplock_reduction_min", 0) or 0)
        allocation_focus = float(allocation_reference.get("mean_toplock_reduction_min", 0) or 0)
        if abs(reference_focus) > 1e-9 and abs(allocation_focus) > 1e-9:
            allocation_scale = allocation_focus / reference_focus

        budget_scale = 1.0
        if abs(allocation_delta) > 1e-9:
            budget_scale = selected_delta / allocation_delta

        if allocation_family == "uniform":
            scale = budget_scale
        else:
            scale = allocation_scale * budget_scale

        top_outcomes["delta_wait1_min"] = top_outcomes[delta_column] * scale
        top_outcomes["policy_wait1_min"] = top_outcomes["baseline_wait1_min"] + top_outcomes["delta_wait1_min"]
        impact_records = (
            top_outcomes.head(10)[
                ["cur_lock_id", "lock_name", "baseline_wait1_min", "policy_wait1_min", "delta_wait1_min", "priority_rank"]
            ]
            .rename(columns={"cur_lock_id": "lock_id"})
            .to_dict(orient="records")
        )
        return impact_records

    def get_corridors(self) -> list[dict[str, Any]]:
        nodes = self.load_nodes()
        visible = nodes[nodes["is_public_visible"]]
        grouped = (
            visible.groupby("macro_corridor", dropna=False)
            .agg(
                lock_count=("lock_id", "count"),
                visible_points=("has_geometry", "sum"),
                total_events=("observed_events", "sum"),
            )
            .reset_index()
            .sort_values("total_events", ascending=False)
        )
        return grouped.to_dict(orient="records")

    def get_locks(self) -> list[dict[str, Any]]:
        nodes = self.load_nodes()
        visible = nodes[nodes["is_public_visible"]].copy()
        columns = [
            "lock_id",
            "lock_name",
            "node_type",
            "official_route",
            "macro_corridor",
            "gateway_type",
            "observed_events",
            "route_verified",
            "notes",
            "longitude",
            "latitude",
            "has_geometry",
            "display_order",
            "is_public_visible",
        ]
        return visible[columns].sort_values("display_order").to_dict(orient="records")

    def get_network(self) -> dict[str, Any]:
        nodes = self.load_nodes()
        node_lookup = nodes.set_index("lock_id")[["lock_name", "longitude", "latitude", "macro_corridor", "gateway_type"]]
        edges = self.load_edges().copy()
        edges = edges[edges["source_id"].isin(node_lookup.index) & edges["target_id"].isin(node_lookup.index)]
        records: list[dict[str, Any]] = []
        for row in edges.itertuples(index=False):
            src = node_lookup.loc[int(row.source_id)]
            dst = node_lookup.loc[int(row.target_id)]
            records.append(
                {
                    "source_id": int(row.source_id),
                    "target_id": int(row.target_id),
                    "source_name": str(row.source_name),
                    "target_name": str(row.target_name),
                    "section": str(getattr(row, "section", "")),
                    "edge_type": str(getattr(row, "edge_type", "")),
                    "macro_corridor": normalize_corridor_group(getattr(row, "macro_corridor", "")),
                    "weight": float(getattr(row, "transition_count_bothways", 0) or 0),
                    "source_lon": None if pd.isna(src["longitude"]) else float(src["longitude"]),
                    "source_lat": None if pd.isna(src["latitude"]) else float(src["latitude"]),
                    "target_lon": None if pd.isna(dst["longitude"]) else float(dst["longitude"]),
                    "target_lat": None if pd.isna(dst["latitude"]) else float(dst["latitude"]),
                }
            )
        return {"nodes": self.get_locks(), "edges": records}

    def get_baseline_overview(self) -> dict[str, Any]:
        upgrade = self.load_upgrade_results()
        model = self.load_model_results()
        baseline = next(item for item in upgrade["policy_simulation"] if item["scenario"] == "Baseline")
        lock_scores = self.load_lock_scores()
        top_risks = (
            lock_scores.sort_values("queue_rank")
            .head(5)[["cur_lock_id", "lock_name", "corridor", "queue_risk_score", "queue_rank"]]
            .rename(columns={"cur_lock_id": "lock_id"})
            .to_dict(orient="records")
        )
        proxy_stats = upgrade.get("proxy_stats", {})
        return {
            "headline": {
                "events": int(model["events"]),
                "transitions": int(model["transitions"]),
                "threshold": float(model["threshold"]),
                "expected_wait1": float(baseline["expected_wait1"]),
                "expected_wait_total": float(baseline["expected_wait_total"]),
                "low_eff_share": float(baseline["low_eff_share"]),
                "state4_share": float(baseline["state4_share"]),
            },
            "state_shares": baseline.get("state_shares", {}),
            "top_risks": top_risks,
            "proxy_stats": proxy_stats,
            "scenarios": upgrade["policy_simulation"],
        }

    def simulate(self, policy_family: str, allocation_family: str, budget_k: int) -> dict[str, Any]:
        selected = self._scenario_summary(policy_family, allocation_family, budget_k)
        impact_records = self._impact_locks(policy_family, allocation_family, selected)

        lock_scores = self.load_lock_scores().sort_values(
            "queue_rank" if policy_family == "queue" else "structural_rank"
        )
        ranked_locks = (
            lock_scores.head(12)[
                [
                    "cur_lock_id",
                    "lock_name",
                    "corridor",
                    "queue_rank",
                    "structural_rank",
                    "queue_risk_score",
                    "structural_risk_score",
                ]
            ]
            .rename(columns={"cur_lock_id": "lock_id"})
            .to_dict(orient="records")
        )
        return {
            "selection": {
                "policy_family": policy_family,
                "allocation_family": allocation_family,
                "budget_k": int(selected["budget_k"]),
                "scenario": str(selected["scenario"]),
            },
            "summary": {
                key: (float(value) if isinstance(value, (int, float)) and not isinstance(value, bool) else value)
                for key, value in selected.items()
            },
            "impact_locks": impact_records,
            "ranked_locks": ranked_locks,
        }

    def get_rankings(self, limit: int = 20) -> dict[str, Any]:
        scores = self.load_lock_scores().copy()
        queue = scores.sort_values("queue_rank").head(limit).to_dict(orient="records")
        structural = scores.sort_values("structural_rank").head(limit).to_dict(orient="records")
        return {"queue": queue, "structural": structural}

    def export_report(self, policy_family: str, allocation_family: str, budget_k: int) -> dict[str, Any]:
        baseline = self.get_baseline_overview()["headline"]
        simulation = self.simulate(policy_family, allocation_family, budget_k)
        summary = simulation["summary"]
        report = "\n".join(
            [
                "# 政策沙盘摘要",
                "",
                f"- 方案: {simulation['selection']['scenario']}",
                f"- 政策类型: {policy_family}",
                f"- 分配方式: {allocation_family}",
                f"- 预算 K: {summary['budget_k']}",
                "",
                "## 基线",
                f"- 期望等待一程: {baseline['expected_wait1']:.3f}",
                f"- 总等待: {baseline['expected_wait_total']:.3f}",
                f"- 低效率占比: {baseline['low_eff_share']:.3%}",
                f"- State4 占比: {baseline['state4_share']:.3%}",
                "",
                "## 情景结果",
                f"- 期望等待一程: {summary['expected_wait1']:.3f}",
                f"- 对基线变化: {summary['delta_wait1']:.3f}",
                f"- P90 等待: {summary['p90_wait1']:.3f}",
                f"- 高等待概率: {summary['high_wait_prob']:.3%}",
                "",
                "## 重点对象",
            ]
        )
        for item in simulation["impact_locks"][:5]:
            report += f"\n- {item['lock_name']}: 变化 {item['delta_wait1_min']:.3f} 分钟"
        return {
            "title": f"{simulation['selection']['scenario']} 政策摘要",
            "content_type": "text/markdown",
            "content": report,
        }


repository = DataRepository(
    mode=settings.app_mode.lower(),
    source_project_dir=settings.source_project_dir,
    private_data_dir=settings.private_data_dir,
)

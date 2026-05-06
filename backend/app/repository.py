from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd

from .config import ROOT_DIR, settings


ENCODINGS = ("utf-8-sig", "utf-8", "gb18030", "gbk")

CORRIDOR_GROUP_MAP = {
    "沿江口门群": "沿江口门群",
    "京杭主通道": "京杭运河",
    "苏南入江支网": "苏南",
    "通扬—里下河网络": "苏中",
    "通扬-里下河网络": "苏中",
    "淮河—徐宿西北网络": "苏北",
    "淮河-徐宿西北网络": "苏北",
    "盐河—连申—出海网络": "苏北",
    "盐河-连申-出海网络": "苏北",
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
    def load_nodes(self) -> pd.DataFrame:
        coords_path = self._resolve_asset(
            "lock_nodes_52.csv",
            ("data", "raw", "hazard_minimal", "raw", "lock_nodes_52.csv"),
        )
        meta_path = self._resolve_asset(
            "lock_nodes_final_paper.csv",
            ("data", "raw", "hazard_minimal", "raw", "lock_nodes_final_paper.csv"),
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
    def load_paper_evidence(self) -> dict[str, Any]:
        return self._read_json(self._resolve("paper_evidence.json"))

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

    def get_paper_evidence(self) -> dict[str, Any]:
        return self.load_paper_evidence()


repository = DataRepository(
    mode=settings.app_mode.lower(),
    source_project_dir=settings.source_project_dir,
    private_data_dir=settings.private_data_dir,
)

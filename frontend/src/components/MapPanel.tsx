"use client";

import { useMemo } from "react";

import type { LockPoint, NetworkEdge } from "@/types/api";

type MapPanelProps = {
  locks: LockPoint[];
  edges: NetworkEdge[];
  selectedCorridor: string;
  selectedLockId?: number;
  title: string;
  subtitle: string;
};

function buildSrcDoc(
  locks: LockPoint[],
  edges: NetworkEdge[],
  selectedLockId?: number,
) {
  const payload = JSON.stringify({
    locks,
    edges,
    selectedLockId: selectedLockId ?? null,
  }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <style>
    html, body, #map { height: 100%; margin: 0; }
    body { font-family: Arial, sans-serif; }
    .leaflet-container { background: #e9efe7; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script>
    const payload = ${payload};
    const map = L.map('map', { zoomControl: true }).setView([32.8, 119.5], 6.5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const visibleLocks = payload.locks.filter(Boolean);
    const visibleEdges = payload.edges.filter(Boolean);
    const bounds = [];

    visibleEdges.forEach((edge) => {
      if (edge.source_lat == null || edge.source_lon == null || edge.target_lat == null || edge.target_lon == null) return;
      L.polyline(
        [[edge.source_lat, edge.source_lon], [edge.target_lat, edge.target_lon]],
        {
          color: '#d77223',
          weight: Math.min(Math.max((edge.weight || 0) / 2500, 1.2), 4.5),
          opacity: 0.3
        }
      ).addTo(map);
    });

    visibleLocks.forEach((lock) => {
      if (lock.latitude == null || lock.longitude == null) return;
      const isSelected = payload.selectedLockId != null && Number(payload.selectedLockId) === Number(lock.lock_id);
      const marker = L.circleMarker([lock.latitude, lock.longitude], {
        radius: isSelected ? 10 : Math.min(Math.max((lock.observed_events || 0) / 1400, 4), 9),
        color: '#f7f0e3',
        weight: 2,
        fillColor: isSelected ? '#0d5291' : '#16324f',
        fillOpacity: 0.85
      }).addTo(map);
      marker.bindPopup(
        '<strong>' + lock.lock_name + '</strong><br/>' +
        (lock.macro_corridor || '') + '<br/>' +
        'Events: ' + Number(lock.observed_events || 0).toLocaleString()
      );
      bounds.push([lock.latitude, lock.longitude]);
      if (isSelected) marker.openPopup();
    });

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: payload.selectedLockId ? 9 : 8 });
    }
  </script>
</body>
</html>`;
}

export function MapPanel({
  locks,
  edges,
  selectedCorridor,
  selectedLockId,
  title,
  subtitle,
}: MapPanelProps) {
  const visibleLocks = useMemo(
    () =>
      locks.filter(
        (lock) =>
          lock.has_geometry &&
          (selectedCorridor === "all" || lock.macro_corridor === selectedCorridor),
      ),
    [locks, selectedCorridor],
  );

  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (edge) =>
          edge.source_lon != null &&
          edge.source_lat != null &&
          edge.target_lon != null &&
          edge.target_lat != null &&
          (selectedCorridor === "all" || edge.macro_corridor === selectedCorridor),
      ),
    [edges, selectedCorridor],
  );

  const selectedName = useMemo(() => {
    const selectedLock = visibleLocks.find((lock) => lock.lock_id === selectedLockId);
    return selectedLock?.lock_name ?? "全部船闸";
  }, [selectedLockId, visibleLocks]);

  const srcDoc = useMemo(
    () => buildSrcDoc(visibleLocks, visibleEdges, selectedLockId),
    [selectedLockId, visibleEdges, visibleLocks],
  );

  return (
    <section className="overflow-hidden rounded-[30px] border border-[var(--line)] bg-white/92 shadow-[0_18px_45px_rgba(32,42,56,0.10)]">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-xl">{title}</h3>
          <p className="text-sm text-[var(--ink-600)]">{subtitle}</p>
        </div>
        <div className="rounded-full border border-[var(--line)] bg-[var(--sand-100)] px-4 py-2 text-sm text-[var(--ink-700)]">
          当前聚焦: {selectedName}
        </div>
      </div>
      <iframe
        title="Lock network map"
        srcDoc={srcDoc}
        className="h-[560px] w-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </section>
  );
}

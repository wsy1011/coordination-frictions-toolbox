import type { CorridorMeta, LockPoint, NetworkResponse, PaperEvidence } from "@/types/api";
import { API_BASE_URL, BASE_PATH, IS_STATIC_MODE } from "@/lib/site";

async function request<T>(pathName: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${pathName}`, {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function readStatic<T>(relativePath: string): Promise<T> {
  const response = await fetch(`${BASE_PATH}/${relativePath}`.replace(/\/{2,}/g, "/"), {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Static request failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchLocks(): Promise<LockPoint[]> {
  if (IS_STATIC_MODE) {
    const data = await readStatic<{ items: LockPoint[] }>("data/locks.json");
    return data.items;
  }
  const data = await request<{ items: LockPoint[] }>("/api/meta/locks");
  return data.items;
}

export async function fetchCorridors(): Promise<CorridorMeta[]> {
  if (IS_STATIC_MODE) {
    const data = await readStatic<{ items: CorridorMeta[] }>("data/corridors.json");
    return data.items;
  }
  const data = await request<{ items: CorridorMeta[] }>("/api/meta/corridors");
  return data.items;
}

export async function fetchNetwork(): Promise<NetworkResponse> {
  return IS_STATIC_MODE ? readStatic<NetworkResponse>("data/network.json") : request<NetworkResponse>("/api/network");
}

export async function fetchPaperEvidence(): Promise<PaperEvidence> {
  return IS_STATIC_MODE
    ? readStatic<PaperEvidence>("data/paper-evidence.json")
    : request<PaperEvidence>("/api/paper/evidence");
}

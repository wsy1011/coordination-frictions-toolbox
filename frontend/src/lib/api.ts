import type {
  BaselineOverview,
  CorridorMeta,
  ExportResponse,
  LockPoint,
  NetworkResponse,
  RankingsResponse,
  SimulationResponse,
} from "@/types/api";
import { API_BASE_URL, BASE_PATH, IS_STATIC_MODE } from "@/lib/site";

async function request<T>(pathName: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${pathName}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
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

function simulationFileName(policyFamily: string, allocationFamily: string, budgetK: number): string {
  return `data/simulations/${policyFamily}_${allocationFamily}_${budgetK}.json`;
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

export async function fetchBaselineOverview(): Promise<BaselineOverview> {
  return IS_STATIC_MODE
    ? readStatic<BaselineOverview>("data/baseline-overview.json")
    : request<BaselineOverview>("/api/baseline/overview");
}

export async function fetchRankings(): Promise<RankingsResponse> {
  return IS_STATIC_MODE ? readStatic<RankingsResponse>("data/rankings.json") : request<RankingsResponse>("/api/rankings");
}

export async function runSimulation(payload: {
  policy_family: string;
  allocation_family: string;
  budget_k: number;
}): Promise<SimulationResponse> {
  if (IS_STATIC_MODE) {
    return readStatic<SimulationResponse>(
      simulationFileName(payload.policy_family, payload.allocation_family, payload.budget_k),
    );
  }
  return request<SimulationResponse>("/api/simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function exportReport(payload: {
  policy_family: string;
  allocation_family: string;
  budget_k: number;
}): Promise<ExportResponse> {
  if (IS_STATIC_MODE) {
    throw new Error("Static demo mode does not support report export.");
  }
  return request<ExportResponse>("/api/export/report", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

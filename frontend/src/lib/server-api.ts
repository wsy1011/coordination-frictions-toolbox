import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  BaselineOverview,
  CorridorMeta,
  NetworkResponse,
  RankingsResponse,
  SimulationResponse,
} from "@/types/api";
import { API_BASE_URL, IS_STATIC_MODE } from "@/lib/site";

async function readStaticJson<T>(relativePath: string): Promise<T> {
  const fullPath = path.join(process.cwd(), "public", relativePath);
  const content = await readFile(fullPath, "utf-8");
  return JSON.parse(content) as T;
}

async function serverRequest<T>(pathName: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${pathName}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: IS_STATIC_MODE ? "force-cache" : "no-store",
  });

  if (!response.ok) {
    throw new Error(`Server request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function simulationFileName(policyFamily: string, allocationFamily: string, budgetK: number): string {
  return `data/simulations/${policyFamily}_${allocationFamily}_${budgetK}.json`;
}

export async function getInitialDashboardData(): Promise<{
  corridors: CorridorMeta[];
  network: NetworkResponse;
  baseline: BaselineOverview;
  rankings: RankingsResponse;
  simulation: SimulationResponse;
}> {
  if (IS_STATIC_MODE) {
    const [corridorsRaw, network, baseline, rankings, simulation] = await Promise.all([
      readStaticJson<{ items: CorridorMeta[] }>("data/corridors.json"),
      readStaticJson<NetworkResponse>("data/network.json"),
      readStaticJson<BaselineOverview>("data/baseline-overview.json"),
      readStaticJson<RankingsResponse>("data/rankings.json"),
      readStaticJson<SimulationResponse>(simulationFileName("queue", "uniform", 10)),
    ]);

    return {
      corridors: corridorsRaw.items,
      network,
      baseline,
      rankings,
      simulation,
    };
  }

  const [corridorsRaw, network, baseline, rankings, simulation] = await Promise.all([
    serverRequest<{ items: CorridorMeta[] }>("/api/meta/corridors"),
    serverRequest<NetworkResponse>("/api/network"),
    serverRequest<BaselineOverview>("/api/baseline/overview"),
    serverRequest<RankingsResponse>("/api/rankings"),
    serverRequest<SimulationResponse>("/api/simulate", {
      method: "POST",
      body: JSON.stringify({
        policy_family: "queue",
        allocation_family: "uniform",
        budget_k: 10,
      }),
    }),
  ]);

  return {
    corridors: corridorsRaw.items,
    network,
    baseline,
    rankings,
    simulation,
  };
}

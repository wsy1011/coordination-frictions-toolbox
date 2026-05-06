import { readFile } from "node:fs/promises";
import path from "node:path";

import type { InitialDashboardData, PaperEvidence, NetworkResponse, CorridorMeta } from "@/types/api";
import { API_BASE_URL, IS_STATIC_MODE } from "@/lib/site";

async function readStaticJson<T>(relativePath: string): Promise<T> {
  const fullPath = path.join(process.cwd(), "public", relativePath);
  const content = await readFile(fullPath, "utf-8");
  return JSON.parse(content) as T;
}

async function serverRequest<T>(pathName: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${pathName}`, {
    headers: {
      "Content-Type": "application/json",
    },
    cache: IS_STATIC_MODE ? "force-cache" : "no-store",
  });

  if (!response.ok) {
    throw new Error(`Server request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getInitialDashboardData(): Promise<InitialDashboardData> {
  if (IS_STATIC_MODE) {
    const [corridorsRaw, network, evidence] = await Promise.all([
      readStaticJson<{ items: CorridorMeta[] }>("data/corridors.json"),
      readStaticJson<NetworkResponse>("data/network.json"),
      readStaticJson<PaperEvidence>("data/paper-evidence.json"),
    ]);

    return {
      corridors: corridorsRaw.items,
      network,
      evidence,
    };
  }

  const [corridorsRaw, network, evidence] = await Promise.all([
    serverRequest<{ items: CorridorMeta[] }>("/api/meta/corridors"),
    serverRequest<NetworkResponse>("/api/network"),
    serverRequest<PaperEvidence>("/api/paper/evidence"),
  ]);

  return {
    corridors: corridorsRaw.items,
    network,
    evidence,
  };
}

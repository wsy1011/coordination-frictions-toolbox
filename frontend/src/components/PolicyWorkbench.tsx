"use client";

import { useEffect, useMemo, useState } from "react";

import {
  fetchBaselineOverview,
  fetchCorridors,
  fetchNetwork,
  fetchRankings,
  runSimulation,
} from "@/lib/api";
import type {
  BaselineOverview,
  CorridorMeta,
  NetworkResponse,
  RankingsResponse,
  SimulationResponse,
} from "@/types/api";
import { BarChartPanel, DoughnutChartPanel } from "./ChartPanel";
import { MapPanel } from "./MapPanel";
import { MetricCard } from "./MetricCard";

type PolicyFamily = "queue" | "structural";
type AllocationFamily = "uniform" | "hard_topk" | "soft_topk" | "rank_weighted";

const allocationLabels: Record<AllocationFamily, string> = {
  uniform: "普遍治理",
  hard_topk: "硬 Top-K",
  soft_topk: "软 Top-K",
  rank_weighted: "按风险加权",
};

export function PolicyWorkbench({
  mode,
  initialData,
}: {
  mode: "dashboard" | "network" | "rankings";
  initialData?: {
    corridors: CorridorMeta[];
    network: NetworkResponse;
    baseline: BaselineOverview;
    rankings: RankingsResponse;
    simulation: SimulationResponse;
  };
}) {
  const [corridors, setCorridors] = useState<CorridorMeta[]>(initialData?.corridors ?? []);
  const [network, setNetwork] = useState<NetworkResponse | null>(initialData?.network ?? null);
  const [baseline, setBaseline] = useState<BaselineOverview | null>(initialData?.baseline ?? null);
  const [rankings, setRankings] = useState<RankingsResponse | null>(initialData?.rankings ?? null);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(initialData?.simulation ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [policyFamily, setPolicyFamily] = useState<PolicyFamily>("queue");
  const [allocationFamily, setAllocationFamily] = useState<AllocationFamily>("uniform");
  const [budgetK, setBudgetK] = useState(10);
  const [selectedCorridor, setSelectedCorridor] = useState<string>("all");
  const [selectedLockId, setSelectedLockId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (initialData) {
      return;
    }
    async function load() {
      try {
        setLoading(true);
        const [corridorData, networkData, baselineData, rankingData, initialSimulation] =
          await Promise.all([
            fetchCorridors(),
            fetchNetwork(),
            fetchBaselineOverview(),
            fetchRankings(),
            runSimulation({
              policy_family: "queue",
              allocation_family: "uniform",
              budget_k: 10,
            }),
          ]);
        setCorridors(corridorData);
        setNetwork(networkData);
        setBaseline(baselineData);
        setRankings(rankingData);
        setSimulation(initialSimulation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [initialData]);

  async function refreshSimulation(next?: {
    policyFamily?: PolicyFamily;
    allocationFamily?: AllocationFamily;
    budgetK?: number;
  }) {
    const payload = {
      policy_family: next?.policyFamily ?? policyFamily,
      allocation_family: next?.allocationFamily ?? allocationFamily,
      budget_k: next?.budgetK ?? budgetK,
    };
    try {
      const result = await runSimulation(payload);
      setSimulation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    }
  }

  const filteredLocks = useMemo(() => {
    const locks = network?.nodes ?? [];
    return locks.filter((lock) =>
      selectedCorridor === "all" ? true : lock.macro_corridor === selectedCorridor,
    );
  }, [network?.nodes, selectedCorridor]);

  const displayedRankings = useMemo(() => {
    if (!rankings) {
      return [];
    }
    return policyFamily === "queue" ? rankings.queue : rankings.structural;
  }, [policyFamily, rankings]);

  if (loading) {
    return (
      <section className="rounded-[30px] border border-[var(--line)] bg-white/90 px-6 py-16 text-center shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="text-sm uppercase tracking-[0.35em] text-[var(--ink-500)]">
          Loading
        </p>
        <p className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--ink-900)]">
          正在拼接政策沙盘、网络数据和重点对象榜单
        </p>
      </section>
    );
  }

  if (error || !network || !baseline || !simulation) {
    return (
      <section className="rounded-[30px] border border-[var(--line)] bg-[#fff5f1] px-6 py-12 text-center shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[#842c1a]">
          接口暂时不可用
        </p>
        <p className="mt-2 text-sm text-[#842c1a]">
          {error ?? "请先启动 FastAPI 后端，再刷新前端页面。"}
        </p>
      </section>
    );
  }

  const headline = baseline.headline;
  const stateShareData = Object.entries(baseline.state_shares).map(([name, value]) => ({
    name,
    value,
  }));
  const priorityPanelTitle = "当前方案受影响最大的对象";
  const priorityPanelSubtitle = "按当前政策情景下的一程等待变化幅度排序，切换政策类型、分配方式和预算 K 都会联动更新。";
  const priorityImpactLocks = [...simulation.impact_locks]
    .sort((left, right) => Math.abs(right.delta_wait1_min) - Math.abs(left.delta_wait1_min))
    .slice(0, 5);
  const priorityLabels = priorityImpactLocks.map((item) => item.lock_name);
  const priorityValues = priorityImpactLocks.map((item) => item.delta_wait1_min);
  const impactLabels = simulation.impact_locks.map((item) => item.lock_name);
  const impactValues = simulation.impact_locks.map((item) => item.delta_wait1_min);

  if (mode === "rankings" && rankings) {
    return (
      <section className="grid gap-6 xl:grid-cols-2">
        <RankingsList
          title="队列治理优先对象"
          items={rankings.queue}
          metricLabel="队列风险"
          metricKey="queue_risk_score"
        />
        <RankingsList
          title="结构治理优先对象"
          items={rankings.structural}
          metricLabel="结构风险"
          metricKey="structural_risk_score"
        />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="平均等待"
          value={`${headline.expected_wait1.toFixed(2)} h`}
          helper="基于基线情景的期望等待一程"
        />
        <MetricCard
          label="总等待"
          value={`${headline.expected_wait_total.toFixed(2)} h`}
          helper="用于衡量综合协同摩擦"
        />
        <MetricCard
          label="低效率占比"
          value={`${(headline.low_eff_share * 100).toFixed(1)}%`}
          helper="反映持续性低效状态的覆盖面"
        />
        <MetricCard
          label="State4 占比"
          value={`${(headline.state4_share * 100).toFixed(1)}%`}
          helper="监测最脆弱状态的系统暴露程度"
        />
      </section>

      <div className={mode === "dashboard" ? "grid gap-6 xl:grid-cols-[360px_1fr]" : "grid gap-6"}>
        {mode === "dashboard" && (
          <aside className="rounded-[30px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--ink-500)]">
                Policy Controls
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl">
                设定政策组合
              </h2>
            </div>
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-700)]">
                  政策类型
                </span>
                <select
                  className="w-full rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3"
                  value={policyFamily}
                  onChange={async (event) => {
                    const next = event.target.value as PolicyFamily;
                    setPolicyFamily(next);
                    await refreshSimulation({ policyFamily: next });
                  }}
                >
                  <option value="queue">队列治理</option>
                  <option value="structural">结构治理</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-700)]">
                  分配方式
                </span>
                <select
                  className="w-full rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3"
                  value={allocationFamily}
                  onChange={async (event) => {
                    const next = event.target.value as AllocationFamily;
                    setAllocationFamily(next);
                    await refreshSimulation({ allocationFamily: next });
                  }}
                >
                  {Object.entries(allocationLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-700)]">
                  预算 K
                </span>
                <input
                  className="w-full accent-[var(--accent-blue)]"
                  type="range"
                  min={5}
                  max={15}
                  step={5}
                  value={budgetK}
                  onChange={async (event) => {
                    const next = Number(event.target.value);
                    setBudgetK(next);
                    await refreshSimulation({ budgetK: next });
                  }}
                />
                <div className="mt-2 flex items-center justify-between text-sm text-[var(--ink-600)]">
                  <span>5</span>
                  <span className="rounded-full bg-[var(--sand-200)] px-3 py-1 font-medium text-[var(--ink-800)]">
                    当前: {budgetK}
                  </span>
                  <span>15</span>
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-700)]">
                  走廊筛选
                </span>
                <select
                  className="w-full rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3"
                  value={selectedCorridor}
                  onChange={(event) => {
                    setSelectedCorridor(event.target.value);
                    setSelectedLockId(undefined);
                  }}
                >
                  <option value="all">全部走廊</option>
                  {corridors.map((item) => (
                    <option key={item.macro_corridor} value={item.macro_corridor}>
                      {item.macro_corridor}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 rounded-[24px] bg-[var(--ink-900)] p-5 text-[var(--sand-100)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--sand-300)]">
                Selected Scenario
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl">
                {simulation.selection.scenario}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[var(--sand-300)]">等待变化</p>
                  <p className="mt-1 text-lg">{Number(simulation.summary.delta_wait1 ?? 0).toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-[var(--sand-300)]">P90 变化</p>
                  <p className="mt-1 text-lg">{Number(simulation.summary.delta_p90_wait1 ?? 0).toFixed(3)}</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        <div className="flex flex-col gap-6">
          <MapPanel
            locks={network.nodes}
            edges={network.edges}
            selectedCorridor={selectedCorridor}
            selectedLockId={selectedLockId}
            title="真实船闸网络地图"
            subtitle="真实坐标点位来自公开副本，线条表示网络连接和协调关系。"
          />

          {mode === "dashboard" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <BarChartPanel
                title={priorityPanelTitle}
                subtitle={priorityPanelSubtitle}
                labels={priorityLabels}
                values={priorityValues}
                color="#0d5291"
              />
              <DoughnutChartPanel
                title="系统状态分布"
                subtitle="基线状态份额帮助快速识别高脆弱性结构"
                items={stateShareData}
              />
              <BarChartPanel
                title="重点节点等待变化"
                subtitle="当前政策情景对优先对象的一程等待变化"
                labels={impactLabels}
                values={impactValues}
                color="#d77223"
              />
              <section className="rounded-[28px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl">重点对象榜单</h3>
                  <p className="text-sm text-[var(--ink-600)]">点击节点名称可把地图聚焦到指定船闸。</p>
                </div>
                <div className="mt-4 space-y-3">
                  {displayedRankings.slice(0, 8).map((item) => (
                    <button
                      key={`${item.cur_lock_id}-${item.lock_name}`}
                      type="button"
                      onClick={() => setSelectedLockId(item.cur_lock_id)}
                      className="flex w-full items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3 text-left transition hover:border-[var(--accent-blue)] hover:bg-white"
                    >
                      <div>
                        <p className="font-medium text-[var(--ink-900)]">{item.lock_name}</p>
                        <p className="text-sm text-[var(--ink-600)]">{item.corridor}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                          排名
                        </p>
                        <p className="font-[family-name:var(--font-display)] text-2xl">
                          {policyFamily === "queue" ? item.queue_rank : item.structural_rank}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {mode === "network" && (
            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <section className="rounded-[28px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
                <h3 className="font-[family-name:var(--font-display)] text-xl">走廊覆盖</h3>
                <div className="mt-4 space-y-3">
                  {corridors.map((corridor) => (
                    <div
                      key={corridor.macro_corridor}
                      className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-[var(--ink-900)]">{corridor.macro_corridor}</p>
                        <p className="text-sm text-[var(--ink-600)]">
                          {corridor.visible_points}/{corridor.lock_count} 个点位可视
                        </p>
                      </div>
                      <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--accent-blue)]">
                        {corridor.total_events.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-[28px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
                <h3 className="font-[family-name:var(--font-display)] text-xl">可视化节点明细</h3>
                <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-1">
                  {filteredLocks.slice(0, 18).map((lock) => (
                    <div
                      key={lock.lock_id}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{lock.lock_name}</p>
                        <button
                          type="button"
                          onClick={() => setSelectedLockId(lock.lock_id)}
                          className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink-700)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
                        >
                          聚焦地图
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-[var(--ink-600)]">
                        {lock.macro_corridor} · {lock.official_route}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          )}
        </div>
      </div>

    </div>
  );
}

function RankingsList({
  title,
  items,
  metricLabel,
  metricKey,
}: {
  title: string;
  items: RankingsResponse["queue"];
  metricLabel: string;
  metricKey: "queue_risk_score" | "structural_risk_score";
}) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
      <h3 className="font-[family-name:var(--font-display)] text-xl">{title}</h3>
      <p className="text-sm text-[var(--ink-600)]">
        聚合结果仅用于政策优先级排序，不提供原始事件级记录。
      </p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.cur_lock_id}-${item.lock_name}`}
            className="grid grid-cols-[60px_1fr_110px] items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3"
          >
            <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--accent-blue)]">
              {metricKey === "queue_risk_score" ? item.queue_rank : item.structural_rank}
            </p>
            <div>
              <p className="font-medium text-[var(--ink-900)]">{item.lock_name}</p>
              <p className="text-sm text-[var(--ink-600)]">{item.corridor}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-500)]">
                {metricLabel}
              </p>
              <p className="text-lg font-semibold">
                {Number(item[metricKey]).toFixed(3)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

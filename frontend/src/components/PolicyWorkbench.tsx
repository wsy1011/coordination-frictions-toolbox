"use client";

import { useEffect, useMemo, useState } from "react";

import {
  fetchBaselineOverview,
  fetchCorridors,
  fetchNetwork,
  fetchRankings,
  runSimulation,
} from "@/lib/api";
import { type LocalizedText, useLocale } from "@/lib/locale";
import { displayCorridor, displayLockName, displayRoute } from "@/lib/translations";
import type {
  BaselineOverview,
  CorridorMeta,
  NetworkResponse,
  RankingsResponse,
  SimulationResponse,
} from "@/types/api";
import { BarChartPanel } from "./ChartPanel";
import { MapPanel } from "./MapPanel";
import { MetricCard } from "./MetricCard";

type PolicyFamily = "queue" | "structural";
type AllocationFamily = "uniform" | "hard_topk" | "soft_topk" | "rank_weighted";

const paperMetrics = {
  rows: 215133,
  pressureRows: 185224,
  meanPreDispatchMin: 547.89,
  medianPreDispatchMin: 264.72,
  cpHazardChangePct: 36.1,
  lqHazardChangePct: -49.6,
  co2Cells: 36,
  co2R2: 0.795,
  uniformMeanReductionMin: 10.54,
  localTargetMeanReductionMin: 30.23,
};

const allocationLabels: Record<AllocationFamily, LocalizedText> = {
  uniform: { zh: "统一分配", en: "Uniform" },
  hard_topk: { zh: "硬 Top-K", en: "Hard Top-K" },
  soft_topk: { zh: "软 Top-K", en: "Soft Top-K" },
  rank_weighted: { zh: "按风险加权", en: "Risk Weighted" },
};

const policyLabels: Record<PolicyFamily, LocalizedText> = {
  queue: { zh: "直接负担缓解", en: "Direct burden relief" },
  structural: { zh: "连通瓶颈监管", en: "Connected-bottleneck supervision" },
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
  const { locale, t } = useLocale();
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
      <section className="rounded-[24px] border border-[var(--line)] bg-white/90 px-6 py-16 text-center shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--ink-500)]">Loading</p>
        <p className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--ink-900)]">
          {t({
            zh: "正在加载政策沙盘、网络数据和治理优先级",
            en: "Loading the policy sandbox, network data, and governance priorities",
          })}
        </p>
      </section>
    );
  }

  if (error || !network || !baseline || !simulation) {
    return (
      <section className="rounded-[24px] border border-[var(--line)] bg-[#fff5f1] px-6 py-12 text-center shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[#842c1a]">
          {t({ zh: "界面暂时不可用", en: "The interface is temporarily unavailable" })}
        </p>
        <p className="mt-2 text-sm text-[#842c1a]">
          {error ??
            t({
              zh: "请先启动 FastAPI 后端，或确认静态 JSON 已导出。",
              en: "Please start the FastAPI backend or confirm that static JSON payloads have been exported.",
            })}
        </p>
      </section>
    );
  }

  const priorityImpactLocks = [...simulation.impact_locks]
    .sort((left, right) => Math.abs(right.delta_wait1_min) - Math.abs(left.delta_wait1_min))
    .slice(0, 5);
  const priorityLabels = priorityImpactLocks.map((item) => displayLockName(item.lock_name, locale));
  const priorityValues = priorityImpactLocks.map((item) => Math.abs(item.delta_wait1_min));
  const impactLabels = simulation.impact_locks.map((item) => displayLockName(item.lock_name, locale));
  const impactValues = simulation.impact_locks.map((item) => item.delta_wait1_min);

  if (mode === "rankings" && rankings) {
    return (
      <section className="grid gap-6 xl:grid-cols-2">
        <RankingsList
          title={{ zh: "直接负担缓解优先级", en: "Direct-Burden Relief Priorities" }}
          items={rankings.queue}
          metricLabel={{ zh: "直接负担指数", en: "Burden Index" }}
          metricKey="queue_risk_score"
        />
        <RankingsList
          title={{ zh: "连通瓶颈监管优先级", en: "Connected-Bottleneck Priorities" }}
          items={rankings.structural}
          metricLabel={{ zh: "连通瓶颈指数", en: "Connected Index" }}
          metricKey="structural_risk_score"
        />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t({ zh: "平均 pre-dispatch 负担", en: "Mean Pre-dispatch Burden" })}
          value={`${paperMetrics.meanPreDispatchMin.toFixed(1)} min`}
          helper={t({
            zh: `${paperMetrics.rows.toLocaleString()} 条行政分析记录；中位数 ${paperMetrics.medianPreDispatchMin.toFixed(1)} 分钟。`,
            en: `${paperMetrics.rows.toLocaleString()} administrative rows; median ${paperMetrics.medianPreDispatchMin.toFixed(1)} minutes.`,
          })}
        />
        <MetricCard
          label={t({ zh: "走廊压力 IQR hazard 变化", en: "Corridor-Pressure IQR Hazard Shift" })}
          value={`+${paperMetrics.cpHazardChangePct.toFixed(1)}%`}
          helper={t({
            zh: "CP 从第 25 分位到第 75 分位，放行强度提高；本地队列压力为 -49.6%。",
            en: "CP moving from the 25th to 75th percentile raises release intensity; local queue pressure is -49.6%.",
          })}
        />
        <MetricCard
          label={t({ zh: "分组 CO2 模型", en: "Grouped CO2 Model" })}
          value={`R² ${paperMetrics.co2R2.toFixed(3)}`}
          helper={t({
            zh: `${paperMetrics.co2Cells} 个分组单元，作为环境相关性的配套证据。`,
            en: `${paperMetrics.co2Cells} grouped cells, used as supporting environmental consequence evidence.`,
          })}
        />
        <MetricCard
          label={t({ zh: "固定容量 benchmark", en: "Fixed-Capacity Benchmark" })}
          value={`${paperMetrics.localTargetMeanReductionMin.toFixed(1)} min`}
          helper={t({
            zh: `本地负担 targeted 规则；统一分配为 ${paperMetrics.uniformMeanReductionMin.toFixed(1)} 分钟。`,
            en: `Local-burden targeted rule; uniform allocation is ${paperMetrics.uniformMeanReductionMin.toFixed(1)} minutes.`,
          })}
        />
      </section>

      <div className={mode === "dashboard" ? "grid gap-6 xl:grid-cols-[360px_1fr]" : "grid gap-6"}>
        {mode === "dashboard" && (
          <aside className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                {t({ zh: "政策评估控制", en: "Policy Evaluation Controls" })}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl">
                {t({ zh: "设定固定容量情景", en: "Configure Fixed-Capacity Design" })}
              </h2>
            </div>
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-700)]">
                  {t({ zh: "治理对象", en: "Governance Object" })}
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
                  <option value="queue">{t(policyLabels.queue)}</option>
                  <option value="structural">{t(policyLabels.structural)}</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-700)]">
                  {t({ zh: "分配规则", en: "Allocation Rule" })}
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
                      {t(label)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-700)]">
                  {t({ zh: "预算 K", en: "Budget K" })}
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
                    {t({ zh: `当前: ${budgetK}`, en: `Current: ${budgetK}` })}
                  </span>
                  <span>15</span>
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-700)]">
                  {t({ zh: "区域筛选", en: "Corridor Filter" })}
                </span>
                <select
                  className="w-full rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3"
                  value={selectedCorridor}
                  onChange={(event) => {
                    setSelectedCorridor(event.target.value);
                    setSelectedLockId(undefined);
                  }}
                >
                  <option value="all">{t({ zh: "全部区域", en: "All Groups" })}</option>
                  {corridors.map((item) => (
                    <option key={item.macro_corridor} value={item.macro_corridor}>
                      {displayCorridor(item.macro_corridor, locale)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 rounded-[20px] bg-[var(--ink-900)] p-5 text-[var(--sand-100)]">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--sand-300)]">
                {t({ zh: "当前情景", en: "Selected Scenario" })}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl">
                {simulation.selection.scenario}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[var(--sand-300)]">{t({ zh: "平均变化", en: "Mean Delta" })}</p>
                  <p className="mt-1 text-lg">{Number(simulation.summary.delta_wait1 ?? 0).toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-[var(--sand-300)]">{t({ zh: "P90 变化", en: "P90 Delta" })}</p>
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
            title={{ zh: "真实船闸网络地图", en: "Connected Lock Network Map" }}
            subtitle={{
              zh: "坐标来自公开演示快照；连线表示拓扑约束下的船闸连通关系。",
              en: "Coordinates come from the public demo snapshot; lines represent topology-constrained connected lock links.",
            }}
          />

          {mode === "dashboard" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <BarChartPanel
                title={t({ zh: "当前情景下变化最大的船闸", en: "Largest Lock-Level Changes in the Current Scenario" })}
                subtitle={t({
                  zh: "按 pre-dispatch waiting 变化幅度排序；治理对象、分配规则和预算 K 会联动更新。",
                  en: "Sorted by the magnitude of pre-dispatch waiting change; governance object, allocation rule, and budget K update this panel.",
                })}
                labels={priorityLabels}
                values={priorityValues}
                color="#0d5291"
              />
              <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
                <div className="mb-4">
                  <h3 className="font-[family-name:var(--font-display)] text-xl">
                    {t({ zh: "论文证据链", en: "Paper Evidence Chain" })}
                  </h3>
                  <p className="text-sm leading-6 text-[var(--ink-600)]">
                    {t({
                      zh: "这里只保留新论文中实际报告的证据层，不再展示旧工具箱状态变量。",
                      en: "This panel keeps only evidence layers reported in the revised paper and no longer shows legacy toolbox state variables.",
                    })}
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      zh: "AIS operating states: cruising, approach, low-speed manoeuvring, waiting or loitering.",
                      en: "AIS operating states: cruising, approach, low-speed manoeuvring, waiting or loitering.",
                    },
                    {
                      zh: `行政记录: ${paperMetrics.rows.toLocaleString()} 条过闸记录，${paperMetrics.pressureRows.toLocaleString()} 条保留压力协变量。`,
                      en: `Administrative records: ${paperMetrics.rows.toLocaleString()} lock-passage rows, ${paperMetrics.pressureRows.toLocaleString()} with pressure covariates.`,
                    },
                    {
                      zh: "Dispatch hazard: 本地队列压力降低放行强度，走廊压力提高放行强度。",
                      en: "Dispatch hazard: local queue pressure lowers release intensity, while corridor pressure raises it.",
                    },
                    {
                      zh: "Grouped CO2: 作为等待相关运行环境的环境后果证据，而不是主因果结论。",
                      en: "Grouped CO2: supporting consequence evidence for waiting-related operating environments, not the main causal claim.",
                    },
                  ].map((item) => (
                    <p
                      key={item.en}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3 text-sm leading-7 text-[var(--ink-700)]"
                    >
                      {t(item)}
                    </p>
                  ))}
                </div>
              </section>
              <BarChartPanel
                title={t({ zh: "优先船闸的等待变化", en: "Waiting Changes for Priority Locks" })}
                subtitle={t({
                  zh: "当前固定容量情景下重点船闸的 pre-dispatch waiting 变化。",
                  en: "Pre-dispatch waiting changes for priority locks under the selected fixed-capacity scenario.",
                })}
                labels={impactLabels}
                values={impactValues}
                color="#d77223"
              />
              <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl">
                    {t({ zh: "治理优先级列表", en: "Targeting Index List" })}
                  </h3>
                  <p className="text-sm text-[var(--ink-600)]">
                    {t({ zh: "点击船闸名称可在地图上聚焦。", en: "Click a lock name to focus the map." })}
                  </p>
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
                        <p className="font-medium text-[var(--ink-900)]">{displayLockName(item.lock_name, locale)}</p>
                        <p className="text-sm text-[var(--ink-600)]">{displayCorridor(item.corridor, locale)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-500)]">
                          {t({ zh: "排名", en: "Rank" })}
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
              <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
                <h3 className="font-[family-name:var(--font-display)] text-xl">
                  {t({ zh: "区域-功能分组覆盖", en: "Regional-Functional Group Coverage" })}
                </h3>
                <div className="mt-4 space-y-3">
                  {corridors.map((corridor) => (
                    <div
                      key={corridor.macro_corridor}
                      className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-[var(--ink-900)]">
                          {displayCorridor(corridor.macro_corridor, locale)}
                        </p>
                        <p className="text-sm text-[var(--ink-600)]">
                          {t({
                            zh: `${corridor.visible_points}/${corridor.lock_count} 个点位可见`,
                            en: `${corridor.visible_points}/${corridor.lock_count} visible lock points`,
                          })}
                        </p>
                      </div>
                      <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--accent-blue)]">
                        {corridor.total_events.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
                <h3 className="font-[family-name:var(--font-display)] text-xl">
                  {t({ zh: "观测船闸节点", en: "Observed Lock Nodes" })}
                </h3>
                <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-1">
                  {filteredLocks.slice(0, 18).map((lock) => (
                    <div key={lock.lock_id} className="rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{displayLockName(lock.lock_name, locale)}</p>
                        <button
                          type="button"
                          onClick={() => setSelectedLockId(lock.lock_id)}
                          className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink-700)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
                        >
                          {t({ zh: "聚焦地图", en: "Focus Map" })}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-[var(--ink-600)]">
                        {displayCorridor(lock.macro_corridor, locale)} / {displayRoute(lock.official_route, locale)}
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
  title: LocalizedText;
  items: RankingsResponse["queue"];
  metricLabel: LocalizedText;
  metricKey: "queue_risk_score" | "structural_risk_score";
}) {
  const { locale, t } = useLocale();

  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
      <h3 className="font-[family-name:var(--font-display)] text-xl">{t(title)}</h3>
      <p className="text-sm text-[var(--ink-600)]">
        {t({
          zh: "聚合结果只用于政策优先级排序，不暴露事件级原始记录。",
          en: "Aggregate results are only used for policy prioritization and do not expose event-level records.",
        })}
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
              <p className="font-medium text-[var(--ink-900)]">{displayLockName(item.lock_name, locale)}</p>
              <p className="text-sm text-[var(--ink-600)]">{displayCorridor(item.corridor, locale)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-500)]">{t(metricLabel)}</p>
              <p className="text-lg font-semibold">{Number(item[metricKey]).toFixed(3)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

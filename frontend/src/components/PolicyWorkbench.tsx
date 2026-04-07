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
import { BarChartPanel, DoughnutChartPanel } from "./ChartPanel";
import { MapPanel } from "./MapPanel";
import { MetricCard } from "./MetricCard";

type PolicyFamily = "queue" | "structural";
type AllocationFamily = "uniform" | "hard_topk" | "soft_topk" | "rank_weighted";

const allocationLabels: Record<AllocationFamily, LocalizedText> = {
  uniform: { zh: "普遍治理", en: "Uniform" },
  hard_topk: { zh: "硬 Top-K", en: "Hard Top-K" },
  soft_topk: { zh: "软 Top-K", en: "Soft Top-K" },
  rank_weighted: { zh: "按风险加权", en: "Risk Weighted" },
};

const policyLabels: Record<PolicyFamily, LocalizedText> = {
  queue: { zh: "队列政策", en: "Queue policy" },
  structural: { zh: "结构再分配政策", en: "Structural reallocation policy" },
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
      <section className="rounded-[30px] border border-[var(--line)] bg-white/90 px-6 py-16 text-center shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="text-sm uppercase tracking-[0.35em] text-[var(--ink-500)]">Loading</p>
        <p className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--ink-900)]">
          {locale === "zh"
            ? "正在加载政策沙盘、网络数据和重点对象榜单"
            : "Loading the policy sandbox, network data, and targeting indices"}
        </p>
      </section>
    );
  }

  if (error || !network || !baseline || !simulation) {
    return (
      <section className="rounded-[30px] border border-[var(--line)] bg-[#fff5f1] px-6 py-12 text-center shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[#842c1a]">
          {locale === "zh" ? "接口暂时不可用" : "The interface is temporarily unavailable"}
        </p>
        <p className="mt-2 text-sm text-[#842c1a]">
          {error ??
            (locale === "zh"
              ? "请先启动 FastAPI 后端，再刷新前端页面。"
              : "Please start the FastAPI backend and refresh the frontend page.")}
        </p>
      </section>
    );
  }

  const headline = baseline.headline;
  const stateShareData = Object.entries(baseline.state_shares).map(([name, value]) => ({
    name,
    value,
  }));
  const priorityImpactLocks = [...simulation.impact_locks]
    .sort((left, right) => Math.abs(right.delta_wait1_min) - Math.abs(left.delta_wait1_min))
    .slice(0, 5);
  const priorityLabels = priorityImpactLocks.map((item) => displayLockName(item.lock_name, locale));
  const priorityValues = priorityImpactLocks.map((item) => item.delta_wait1_min);
  const impactLabels = simulation.impact_locks.map((item) => displayLockName(item.lock_name, locale));
  const impactValues = simulation.impact_locks.map((item) => item.delta_wait1_min);

  if (mode === "rankings" && rankings) {
    return (
      <section className="grid gap-6 xl:grid-cols-2">
        <RankingsList
          title={{ zh: "队列风险优先级", en: "Queue-risk governance priorities" }}
          items={rankings.queue}
          metricLabel={{ zh: "队列风险", en: "Queue Risk" }}
          metricKey="queue_risk_score"
        />
        <RankingsList
          title={{ zh: "结构风险优先级", en: "Structural-risk governance priorities" }}
          items={rankings.structural}
          metricLabel={{ zh: "结构风险", en: "Structural Risk" }}
          metricKey="structural_risk_score"
        />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={locale === "zh" ? "平均预调度等待" : "Mean pre-dispatch waiting"}
          value={`${headline.expected_wait1.toFixed(2)} h`}
          helper={
            locale === "zh"
              ? "基于基线情景的期望一程等待时间"
              : "Expected first-leg waiting time under the baseline scenario"
          }
        />
        <MetricCard
          label={locale === "zh" ? "平均总等待" : "Mean total waiting"}
          value={`${headline.expected_wait_total.toFixed(2)} h`}
          helper={
            locale === "zh"
              ? "用于衡量系统层面的综合协调摩擦"
              : "Used to capture aggregate coordination frictions"
          }
        />
        <MetricCard
          label={locale === "zh" ? "低效率状态占比" : "Low-efficiency-state share"}
          value={`${(headline.low_eff_share * 100).toFixed(1)}%`}
          helper={
            locale === "zh"
              ? "显示持续低效率状态在样本中的占比"
              : "Shows the share of observations in persistent low-efficiency states"
          }
        />
        <MetricCard
          label={locale === "zh" ? "State 4 占比" : "State 4 Share"}
          value={`${(headline.state4_share * 100).toFixed(1)}%`}
          helper={
            locale === "zh"
              ? "衡量系统暴露在最脆弱状态下的程度"
              : "Tracks the system exposure to the most fragile state"
          }
        />
      </section>

      <div className={mode === "dashboard" ? "grid gap-6 xl:grid-cols-[360px_1fr]" : "grid gap-6"}>
        {mode === "dashboard" && (
          <aside className="rounded-[30px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--ink-500)]">
                {locale === "zh" ? "政策评价控制" : "Policy evaluation controls"}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl">
                {locale === "zh" ? "设定固定预算情景" : "Configure fixed-budget design"}
              </h2>
            </div>
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-700)]">
                  {locale === "zh" ? "治理对象" : "Governance object"}
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
                  {locale === "zh" ? "分配规则" : "Allocation rule"}
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
                  {locale === "zh" ? "预算 K" : "Budget K"}
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
                    {locale === "zh" ? `当前: ${budgetK}` : `Current: ${budgetK}`}
                  </span>
                  <span>15</span>
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--ink-700)]">
                  {locale === "zh" ? "走廊筛选" : "Corridor Filter"}
                </span>
                <select
                  className="w-full rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3"
                  value={selectedCorridor}
                  onChange={(event) => {
                    setSelectedCorridor(event.target.value);
                    setSelectedLockId(undefined);
                  }}
                >
                  <option value="all">{locale === "zh" ? "全部走廊" : "All Corridors"}</option>
                  {corridors.map((item) => (
                    <option key={item.macro_corridor} value={item.macro_corridor}>
                      {displayCorridor(item.macro_corridor, locale)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 rounded-[24px] bg-[var(--ink-900)] p-5 text-[var(--sand-100)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--sand-300)]">
                {locale === "zh" ? "当前情景" : "Selected Scenario"}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl">
                {simulation.selection.scenario}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[var(--sand-300)]">{locale === "zh" ? "等待变化" : "Wait Delta"}</p>
                  <p className="mt-1 text-lg">{Number(simulation.summary.delta_wait1 ?? 0).toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-[var(--sand-300)]">{locale === "zh" ? "P90 变化" : "P90 Delta"}</p>
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
            title={{
              zh: "真实船闸网络地图",
              en: "Connected lock network map",
            }}
            subtitle={{
              zh: "真实坐标点位来自公开副本，线条表示网络连接和协调关系。",
              en: "Real coordinates come from the public demo snapshot, and the lines represent network connectivity and coordination links.",
            }}
          />

          {mode === "dashboard" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <BarChartPanel
                title={
                  locale === "zh" ? "当前情景下变化最大的船闸" : "Largest lock-level changes in the current scenario"
                }
                subtitle={
                  locale === "zh"
                    ? "按当前情景下一程等待变化幅度排序，政策类型、分配方式和预算 K 都会联动更新。"
                    : "Sorted by the magnitude of pre-dispatch waiting change under the current counterfactual. Governance object, allocation rule, and budget K all update this panel."
                }
                labels={priorityLabels}
                values={priorityValues}
                color="#0d5291"
              />
              <DoughnutChartPanel
                title={locale === "zh" ? "系统状态分布" : "System State Distribution"}
                subtitle={
                  locale === "zh"
                    ? "基线状态份额帮助快速识别高脆弱性结构。"
                    : "Baseline state shares help identify highly fragile structures at a glance"
                }
                items={stateShareData}
              />
              <BarChartPanel
                title={locale === "zh" ? "优先船闸的预调度等待变化" : "Pre-dispatch waiting changes for priority locks"}
                subtitle={
                  locale === "zh"
                    ? "当前政策情景下，重点船闸的一程等待变化。"
                    : "Lock-level changes in expected pre-dispatch waiting under the current governance counterfactual"
                }
                labels={impactLabels}
                values={impactValues}
                color="#d77223"
              />
              <section className="rounded-[28px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl">
                    {locale === "zh" ? "治理优先级列表" : "Targeting index list"}
                  </h3>
                  <p className="text-sm text-[var(--ink-600)]">
                    {locale === "zh"
                      ? "点击船闸名称可将地图聚焦到对应船闸。"
                      : "Click a lock name to focus the map on that lock."}
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
                        <p className="font-medium text-[var(--ink-900)]">
                          {displayLockName(item.lock_name, locale)}
                        </p>
                        <p className="text-sm text-[var(--ink-600)]">
                          {displayCorridor(item.corridor, locale)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                          {locale === "zh" ? "排名" : "Rank"}
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
                <h3 className="font-[family-name:var(--font-display)] text-xl">
                  {locale === "zh" ? "区域-功能分组覆盖" : "Regional-functional group coverage"}
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
                          {locale === "zh"
                            ? `${corridor.visible_points}/${corridor.lock_count} 个点位可视`
                            : `${corridor.visible_points}/${corridor.lock_count} visible lock points`}
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
                <h3 className="font-[family-name:var(--font-display)] text-xl">
                  {locale === "zh" ? "观测船闸节点" : "Observed lock nodes"}
                </h3>
                <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-1">
                  {filteredLocks.slice(0, 18).map((lock) => (
                    <div
                      key={lock.lock_id}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{displayLockName(lock.lock_name, locale)}</p>
                        <button
                          type="button"
                          onClick={() => setSelectedLockId(lock.lock_id)}
                          className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink-700)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
                        >
                          {locale === "zh" ? "聚焦地图" : "Focus Map"}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-[var(--ink-600)]">
                        {displayCorridor(lock.macro_corridor, locale)} ·{" "}
                        {displayRoute(lock.official_route, locale)}
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
    <section className="rounded-[28px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
      <h3 className="font-[family-name:var(--font-display)] text-xl">{t(title)}</h3>
      <p className="text-sm text-[var(--ink-600)]">
        {t({
          zh: "聚合结果仅用于政策优先级排序，不暴露事件级原始记录。",
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
              <p className="font-medium text-[var(--ink-900)]">
                {displayLockName(item.lock_name, locale)}
              </p>
              <p className="text-sm text-[var(--ink-600)]">
                {displayCorridor(item.corridor, locale)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-500)]">
                {t(metricLabel)}
              </p>
              <p className="text-lg font-semibold">{Number(item[metricKey]).toFixed(3)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

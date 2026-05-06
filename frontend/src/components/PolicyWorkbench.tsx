"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { fetchCorridors, fetchNetwork, fetchPaperEvidence } from "@/lib/api";
import { BASE_PATH } from "@/lib/site";
import { type LocalizedText, useLocale } from "@/lib/locale";
import { displayCorridor, displayLockName, displayRoute } from "@/lib/translations";
import type {
  CounterfactualGain,
  CorridorMeta,
  InitialDashboardData,
  NetworkResponse,
  PaperEvidence,
  PolicyRule,
  PriorityTarget,
} from "@/types/api";
import { BarChartPanel } from "./ChartPanel";
import { MapPanel } from "./MapPanel";
import { MetricCard } from "./MetricCard";

const ruleLabels: Record<string, LocalizedText> = {
  local_burden: { zh: "本地负担", en: "Local burden" },
  gateway_priority: { zh: "口门优先", en: "Gateway priority" },
  connected_pressure: { zh: "连通压力暴露", en: "Connected-pressure exposure" },
  exposure_sensitivity: { zh: "暴露-敏感性", en: "Exposure-sensitivity" },
};

const categoryLabels: Record<string, LocalizedText> = {
  "Southern Jiangsu": { zh: "苏南", en: "Southern Jiangsu" },
  "Central Jiangsu": { zh: "苏中", en: "Central Jiangsu" },
  "Northern Jiangsu": { zh: "苏北", en: "Northern Jiangsu" },
  "Grand Canal": { zh: "京杭运河", en: "Grand Canal" },
  "Non-Grand Canal": { zh: "非京杭运河", en: "Non-Grand Canal" },
  "Gateway locks": { zh: "口门船闸", en: "Gateway locks" },
  "Non-gateway locks": { zh: "非口门船闸", en: "Non-gateway locks" },
};

const aisStateLabels: Record<string, LocalizedText> = {
  Cruising: { zh: "巡航", en: "Cruising" },
  Approach: { zh: "接近船闸", en: "Approach" },
  "Low-speed manoeuvring": { zh: "低速操纵", en: "Low-speed manoeuvring" },
  "Waiting or loitering": { zh: "等待或徘徊", en: "Waiting or loitering" },
};

function labelRule(id: string, fallback: string, t: (value: LocalizedText) => string) {
  return ruleLabels[id] ? t(ruleLabels[id]) : fallback;
}

function figureSrc(path: string) {
  return `${BASE_PATH}/${path}`.replace(/\/{2,}/g, "/");
}

export function PolicyWorkbench({
  mode,
  initialData,
}: {
  mode: "dashboard" | "network" | "priorities";
  initialData?: InitialDashboardData;
}) {
  const { locale, t } = useLocale();
  const [corridors, setCorridors] = useState<CorridorMeta[]>(initialData?.corridors ?? []);
  const [network, setNetwork] = useState<NetworkResponse | null>(initialData?.network ?? null);
  const [evidence, setEvidence] = useState<PaperEvidence | null>(initialData?.evidence ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const selectedCorridor = "all";
  const [selectedLockId, setSelectedLockId] = useState<number | undefined>(undefined);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("local_burden");
  const [selectedFigureId, setSelectedFigureId] = useState<string>("burden_decomposition");

  useEffect(() => {
    if (initialData) {
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const [corridorData, networkData, evidenceData] = await Promise.all([
          fetchCorridors(),
          fetchNetwork(),
          fetchPaperEvidence(),
        ]);
        setCorridors(corridorData);
        setNetwork(networkData);
        setEvidence(evidenceData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [initialData]);

  const lockLookup = useMemo(() => {
    const lookup = new Map<number, string>();
    for (const lock of network?.nodes ?? []) {
      lookup.set(lock.lock_id, lock.lock_name);
    }
    return lookup;
  }, [network?.nodes]);

  const filteredLocks = useMemo(() => {
    const locks = network?.nodes ?? [];
    return locks.filter((lock) =>
      selectedCorridor === "all" ? true : lock.macro_corridor === selectedCorridor,
    );
  }, [network?.nodes, selectedCorridor]);

  const selectedRule = useMemo(
    () => evidence?.policy_rules.find((rule) => rule.rule_id === selectedRuleId) ?? evidence?.policy_rules[0],
    [evidence?.policy_rules, selectedRuleId],
  );

  const selectedGains = useMemo(
    () => evidence?.counterfactual_gains.filter((item) => item.rule_id === selectedRuleId) ?? [],
    [evidence?.counterfactual_gains, selectedRuleId],
  );

  const selectedFigure = useMemo(
    () => evidence?.figures.find((figure) => figure.id === selectedFigureId) ?? evidence?.figures[0],
    [evidence?.figures, selectedFigureId],
  );

  if (loading) {
    return (
      <section className="rounded-[24px] border border-[var(--line)] bg-white/90 px-6 py-16 text-center shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--ink-500)]">Loading</p>
        <p className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--ink-900)]">
          {t({
            zh: "正在加载论文证据、船闸网络和交互面板",
            en: "Loading paper evidence, lock network, and interactive panels",
          })}
        </p>
      </section>
    );
  }

  if (error || !network || !evidence) {
    return (
      <section className="rounded-[24px] border border-[var(--line)] bg-[#fff5f1] px-6 py-12 text-center shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[#842c1a]">
          {t({ zh: "界面暂时不可用", en: "The interface is temporarily unavailable" })}
        </p>
        <p className="mt-2 text-sm text-[#842c1a]">
          {error ??
            t({
              zh: "请先启动 FastAPI 后端，或确认新论文静态证据 JSON 已导出。",
              en: "Please start the FastAPI backend or confirm that the revised paper-evidence JSON has been exported.",
            })}
        </p>
      </section>
    );
  }

  if (mode === "priorities") {
    return (
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <PriorityTargets
          targets={evidence.priority_targets}
          lockLookup={lockLookup}
          selectedLockId={selectedLockId}
          onSelectLock={setSelectedLockId}
        />
        <PolicyRulePanel
          rules={evidence.policy_rules}
          gains={evidence.counterfactual_gains}
          selectedRuleId={selectedRuleId}
          onSelectRule={setSelectedRuleId}
        />
        <div className="xl:col-span-2">
          <MapPanel
            locks={network.nodes}
            edges={network.edges}
            selectedCorridor="all"
            selectedLockId={selectedLockId}
            title={{ zh: "优先治理对象在网络中的位置", en: "Priority Targets in the Network" }}
            subtitle={{
              zh: "点击表格中的船闸后，地图会定位到论文 exposure-sensitivity 规则下的重点对象。",
              en: "Click a lock in the table to locate paper priority targets under the exposure-sensitivity rule.",
            }}
          />
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t({ zh: "平均 pre-dispatch 负担", en: "Mean Pre-dispatch Burden" })}
          value={`${evidence.headline.mean_pre_dispatch_burden_min.toFixed(1)} min`}
          helper={t({
            zh: `${evidence.headline.administrative_rows.toLocaleString()} 条行政过闸记录；中位数 ${evidence.headline.median_pre_dispatch_burden_min.toFixed(1)} 分钟。`,
            en: `${evidence.headline.administrative_rows.toLocaleString()} administrative lock-passage rows; median ${evidence.headline.median_pre_dispatch_burden_min.toFixed(1)} minutes.`,
          })}
        />
        <MetricCard
          label={t({ zh: "走廊压力 IQR hazard 变化", en: "Corridor-Pressure IQR Hazard Shift" })}
          value="+36.1%"
          helper={t({
            zh: "CP 从第 25 分位到第 75 分位提高放行强度；本地队列压力为 -49.6%。",
            en: "CP moving from the 25th to 75th percentile raises release intensity; local queue pressure is -49.6%.",
          })}
        />
        <MetricCard
          label={t({ zh: "分组 CO2 证据", en: "Grouped CO2 Evidence" })}
          value={`R² ${evidence.headline.co2_fe_r2.toFixed(3)}`}
          helper={t({
            zh: `${evidence.headline.grouped_co2_cells} 个 harmonized grouped cells；作为环境后果证据。`,
            en: `${evidence.headline.grouped_co2_cells} harmonized grouped cells; supporting environmental consequence evidence.`,
          })}
        />
        <MetricCard
          label={t({ zh: "固定容量 benchmark", en: "Fixed-Capacity Benchmark" })}
          value="30.2 min"
          helper={t({
            zh: "本地负担 targeted 规则的平均负担降低；统一分配为 10.5 分钟。",
            en: "Mean burden reduction under the local-burden targeted rule; uniform allocation is 10.5 minutes.",
          })}
        />
      </section>

      <div className={mode === "dashboard" ? "grid gap-6 xl:grid-cols-[380px_1fr]" : "grid gap-6"}>
        {mode === "dashboard" && selectedRule && (
          <aside className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
              {t({ zh: "固定容量治理规则", en: "Fixed-Capacity Governance Rule" })}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl">
              {labelRule(selectedRule.rule_id, selectedRule.rule, t)}
            </h2>
            <div className="mt-5 grid gap-2">
              {evidence.policy_rules.map((rule) => (
                <button
                  key={rule.rule_id}
                  type="button"
                  onClick={() => setSelectedRuleId(rule.rule_id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                    selectedRuleId === rule.rule_id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
                      : "border-[var(--line)] bg-[var(--sand-100)] text-[var(--ink-700)] hover:border-[var(--accent-blue)]"
                  }`}
                >
                  {labelRule(rule.rule_id, rule.rule, t)}
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-[20px] bg-[var(--ink-900)] p-4 text-[var(--sand-100)]">
              <p className="text-xs uppercase tracking-[0.20em] text-[var(--sand-300)]">
                {t({ zh: "政策对象", en: "Policy Objective" })}
              </p>
              <p className="mt-2 text-sm leading-7">{selectedRule.policy_objective}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.20em] text-[var(--sand-300)]">
                {t({ zh: "评价指标", en: "Evaluation Metric" })}
              </p>
              <p className="mt-2 text-sm leading-7">{selectedRule.metric}</p>
            </div>
            <FixedCapacityMiniBars gains={selectedGains} />
          </aside>
        )}

        <div className="flex flex-col gap-6">
          <MapPanel
            locks={network.nodes}
            edges={network.edges}
            selectedCorridor={selectedCorridor}
            selectedLockId={selectedLockId}
            title={{ zh: "连通船闸网络地图", en: "Connected Lock Network Map" }}
            subtitle={{
              zh: "公开快照只展示船闸坐标、区域分组和拓扑连通关系，不展示事件级过闸记录。",
              en: "The public snapshot shows lock coordinates, regional groups, and topology links, without event-level lock-passage records.",
            }}
          />

          {mode === "dashboard" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <BarChartPanel
                title={t({ zh: "Dispatch hazard 对比", en: "Dispatch-Hazard Contrasts" })}
                subtitle={t({
                  zh: "论文表格中的 hazard effect sizes；正值表示更快放行，负值表示更慢放行。",
                  en: "Hazard effect sizes from the paper; positive values indicate faster release and negative values indicate slower release.",
                })}
                labels={evidence.hazard_contrasts.map((item) => item.contrast)}
                values={evidence.hazard_contrasts.map((item) => item.change_pct)}
                color="#0d5291"
              />
              <EvidenceChain evidence={evidence} />
              <BarChartPanel
                title={t({ zh: "地域与口门异质性", en: "Geographic and Gateway Heterogeneity" })}
                subtitle={t({
                  zh: "按论文异质性表展示平均 pre-dispatch burden。",
                  en: "Mean pre-dispatch burden from the paper's heterogeneity table.",
                })}
                labels={evidence.geographic_heterogeneity.map((item) =>
                  categoryLabels[item.category] ? t(categoryLabels[item.category]) : item.category,
                )}
                values={evidence.geographic_heterogeneity.map((item) => item.mean_pre_dispatch_burden_min)}
                color="#d77223"
              />
              <FigureExplorer
                evidence={evidence}
                selectedFigureId={selectedFigureId}
                selectedFigure={selectedFigure}
                onSelectFigure={setSelectedFigureId}
              />
            </div>
          )}

          {mode === "network" && (
            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
                  {t({ zh: "AIS operating-state 规则", en: "AIS Operating-State Rules" })}
                </h3>
                <div className="mt-4 space-y-3">
                  {evidence.ais_state_rules.map((item) => (
                    <div key={item.state} className="rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3">
                      <p className="font-medium text-[var(--ink-900)]">
                        {aisStateLabels[item.state] ? t(aisStateLabels[item.state]) : item.state}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--ink-600)]">{item.rule}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)] xl:col-span-2">
                <h3 className="font-[family-name:var(--font-display)] text-xl">
                  {t({ zh: "观测船闸节点", en: "Observed Lock Nodes" })}
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

function FixedCapacityMiniBars({ gains }: { gains: CounterfactualGain[] }) {
  const { t } = useLocale();
  const max = Math.max(...gains.map((item) => item.p90_burden_reduction_min), 1);
  return (
    <div className="mt-5 space-y-3">
      <p className="text-xs uppercase tracking-[0.20em] text-[var(--ink-500)]">
        {t({ zh: "Benchmark 结果", en: "Benchmark Results" })}
      </p>
      {gains.map((item) => (
        <div key={`${item.rule_id}-${item.allocation}`}>
          <div className="flex justify-between text-sm">
            <span className="capitalize text-[var(--ink-700)]">{item.allocation}</span>
            <span className="font-medium">{item.mean_burden_reduction_min.toFixed(2)} min</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--sand-200)]">
            <div
              className="h-full rounded-full bg-[var(--accent-blue)]"
              style={{ width: `${(item.p90_burden_reduction_min / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EvidenceChain({ evidence }: { evidence: PaperEvidence }) {
  const { t } = useLocale();
  const layers = [
    {
      title: { zh: "AIS 行为层", en: "AIS Behavior Layer" },
      text: {
        zh: `${evidence.sample_layers[3].count.toLocaleString()} 个 MMSI，用于识别接近、低速和等待状态。`,
        en: `${evidence.sample_layers[3].count.toLocaleString()} MMSI used to identify approach, low-speed, and waiting states.`,
      },
    },
    {
      title: { zh: "行政时序层", en: "Administrative Timing Layer" },
      text: {
        zh: `${evidence.headline.administrative_rows.toLocaleString()} 条过闸记录，定位登记到调度之间的治理负担。`,
        en: `${evidence.headline.administrative_rows.toLocaleString()} lock-passage rows locate the registration-to-dispatch governance burden.`,
      },
    },
    {
      title: { zh: "调度 hazard 层", en: "Dispatch-Hazard Layer" },
      text: {
        zh: "本地队列压力与走廊压力呈相反放行关系，支撑连通压力诊断。",
        en: "Local queue pressure and corridor pressure have opposite release-timing relationships.",
      },
    },
    {
      title: { zh: "Grouped CO2 后果层", en: "Grouped CO2 Consequence Layer" },
      text: {
        zh: `${evidence.headline.grouped_co2_cells} 个分组单元提供环境相关性的配套证据。`,
        en: `${evidence.headline.grouped_co2_cells} grouped cells provide supporting environmental consequence evidence.`,
      },
    },
  ];
  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
      <h3 className="font-[family-name:var(--font-display)] text-xl">
        {t({ zh: "论文证据链", en: "Paper Evidence Chain" })}
      </h3>
      <div className="mt-4 space-y-3">
        {layers.map((layer) => (
          <div key={layer.title.en} className="rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3">
            <p className="font-medium text-[var(--ink-900)]">{t(layer.title)}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--ink-600)]">{t(layer.text)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FigureExplorer({
  evidence,
  selectedFigureId,
  selectedFigure,
  onSelectFigure,
}: {
  evidence: PaperEvidence;
  selectedFigureId: string;
  selectedFigure: PaperEvidence["figures"][number] | undefined;
  onSelectFigure: (id: string) => void;
}) {
  const { t } = useLocale();
  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
      <h3 className="font-[family-name:var(--font-display)] text-xl">
        {t({ zh: "论文图表交互浏览", en: "Interactive Paper-Figure Browser" })}
      </h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {evidence.figures.map((figure) => (
          <button
            key={figure.id}
            type="button"
            onClick={() => onSelectFigure(figure.id)}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              selectedFigureId === figure.id
                ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
                : "border-[var(--line)] bg-[var(--sand-100)] text-[var(--ink-700)]"
            }`}
          >
            {figure.title}
          </button>
        ))}
      </div>
      {selectedFigure && (
        <div className="mt-4 overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--sand-100)]">
          <Image
            src={figureSrc(selectedFigure.path)}
            alt={selectedFigure.title}
            width={900}
            height={520}
            className="max-h-[360px] w-full object-contain"
          />
          <div className="border-t border-[var(--line)] px-4 py-3">
            <p className="font-medium text-[var(--ink-900)]">{selectedFigure.title}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--ink-600)]">{selectedFigure.role}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function PriorityTargets({
  targets,
  lockLookup,
  selectedLockId,
  onSelectLock,
}: {
  targets: PriorityTarget[];
  lockLookup: Map<number, string>;
  selectedLockId?: number;
  onSelectLock: (lockId: number) => void;
}) {
  const { locale, t } = useLocale();
  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
      <h3 className="font-[family-name:var(--font-display)] text-xl">
        {t({ zh: "Exposure-sensitivity 优先对象", en: "Exposure-Sensitivity Priority Targets" })}
      </h3>
      <p className="text-sm leading-6 text-[var(--ink-600)]">
        {t({
          zh: "来自新论文表格的 top-10 优先船闸，包含平均负担、P90 负担、CP 暴露和 sensitivity。",
          en: "Top-10 priority locks from the revised paper table, with mean burden, P90 burden, CP exposure, and sensitivity.",
        })}
      </p>
      <div className="mt-4 space-y-3">
        {targets.map((item) => {
          const lockName = lockLookup.get(item.lock_id) ?? `Lock ${item.lock_id}`;
          const selected = selectedLockId === item.lock_id;
          return (
            <button
              key={item.rank}
              type="button"
              onClick={() => onSelectLock(item.lock_id)}
              className={`grid w-full grid-cols-[44px_1fr_120px] items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
                selected ? "border-[var(--accent-blue)] bg-white" : "border-[var(--line)] bg-[var(--sand-100)]"
              }`}
            >
              <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--accent-blue)]">{item.rank}</p>
              <div>
                <p className="font-medium text-[var(--ink-900)]">{displayLockName(lockName, locale)}</p>
                <p className="text-sm text-[var(--ink-600)]">
                  {categoryLabels[item.region] ? t(categoryLabels[item.region]) : item.region} /{" "}
                  {item.gateway ? t({ zh: "口门", en: "gateway" }) : t({ zh: "非口门", en: "non-gateway" })}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">{item.mean_burden_min.toFixed(1)} min</p>
                <p className="text-[var(--ink-600)]">CP {item.exposure_cp.toFixed(1)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PolicyRulePanel({
  rules,
  gains,
  selectedRuleId,
  onSelectRule,
}: {
  rules: PolicyRule[];
  gains: CounterfactualGain[];
  selectedRuleId: string;
  onSelectRule: (ruleId: string) => void;
}) {
  const { t } = useLocale();
  const selectedRule = rules.find((rule) => rule.rule_id === selectedRuleId) ?? rules[0];
  const selectedGains = gains.filter((item) => item.rule_id === selectedRule.rule_id);
  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
      <h3 className="font-[family-name:var(--font-display)] text-xl">
        {t({ zh: "固定容量规则解释", en: "Fixed-Capacity Rule Interpretation" })}
      </h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {rules.map((rule) => (
          <button
            key={rule.rule_id}
            type="button"
            onClick={() => onSelectRule(rule.rule_id)}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              selectedRuleId === rule.rule_id
                ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
                : "border-[var(--line)] bg-[var(--sand-100)] text-[var(--ink-700)]"
            }`}
          >
            {labelRule(rule.rule_id, rule.rule, t)}
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-[20px] bg-[var(--sand-100)] p-4">
        <p className="text-xs uppercase tracking-[0.20em] text-[var(--ink-500)]">
          {t({ zh: "治理目标", en: "Governance Objective" })}
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--ink-700)]">{selectedRule.policy_objective}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.20em] text-[var(--ink-500)]">
          {t({ zh: "操作含义", en: "Operational Instrument" })}
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--ink-700)]">{selectedRule.instrument}</p>
      </div>
      <FixedCapacityMiniBars gains={selectedGains} />
    </section>
  );
}

"use client";

import { useLocale } from "@/lib/locale";
import { AUTHOR_EMAIL, AUTHOR_NAME } from "@/lib/site";

const authorLinks = [
  { label: { zh: "机构", en: "Affiliation" }, value: "Hohai University" },
  { label: { zh: "地点", en: "Location" }, value: "Nanjing, China" },
  { label: { zh: "邮箱", en: "Email" }, value: AUTHOR_EMAIL, href: `mailto:${AUTHOR_EMAIL}` },
  { label: { zh: "GitHub", en: "GitHub" }, value: "github.com/wsy1011", href: "https://github.com/wsy1011" },
  {
    label: { zh: "ResearchGate", en: "ResearchGate" },
    value: "researchgate.net/profile/Suyang-Wang-6",
    href: "https://www.researchgate.net/profile/Suyang-Wang-6",
  },
  { label: { zh: "ORCID", en: "ORCID" }, value: "0009-0002-8499-1181", href: "https://orcid.org/0009-0002-8499-1181" },
];

const evidenceChain = [
  {
    zh: "AIS 层识别船闸邻近等待和低速运行在连通界面附近聚集。",
    en: "The AIS layer identifies waiting and low-speed operation clustered around connected lock interfaces.",
  },
  {
    zh: "行政过闸记录将主要治理负担定位在登记到调度之间的 pre-dispatch 阶段。",
    en: "Administrative lock records locate the dominant governance burden in the registration-to-dispatch stage.",
  },
  {
    zh: "调度 hazard 模型区分本地排队压力和走廊连通压力：本地压力降低放行强度，走廊压力提高放行强度。",
    en: "Dispatch-hazard models separate local queue pressure from corridor pressure: local pressure lowers release intensity, while corridor pressure raises it.",
  },
  {
    zh: "分组 CO2 结果只作为环境相关性的配套证据，不替代论文的连通压力和调度负担主线。",
    en: "Grouped CO2 outcomes are supporting environmental consequence evidence, not a replacement for the connected-pressure and pre-dispatch-burden claim.",
  },
];

const boundaries = [
  {
    zh: "公开网站只发布聚合演示快照，不发布事件级过闸原始记录。",
    en: "The public website only publishes aggregate demo snapshots and does not expose event-level lock-passage records.",
  },
  {
    zh: "浏览器端不重新估计论文模型；它读取已经导出的只读结果和演示 JSON。",
    en: "The browser does not re-estimate the paper models; it reads exported read-only results and demo JSON payloads.",
  },
  {
    zh: "固定容量情景是透明 benchmark，用于比较治理规则，不应解释为真实调度系统。",
    en: "The fixed-capacity scenario is a transparent benchmark for comparing governance rules, not a live dispatching system.",
  },
  {
    zh: "private 模式也只应以只读方式接入受限数据目录。",
    en: "Private mode should still connect to restricted data directories in read-only form.",
  },
];

const pages = [
  {
    name: { zh: "政策沙盘", en: "Policy Sandbox" },
    detail: {
      zh: "比较统一分配、Top-K 和按风险加权等固定容量规则下的负担变化。",
      en: "Compare burden changes under uniform, Top-K, and risk-weighted fixed-capacity rules.",
    },
  },
  {
    name: { zh: "连通网络", en: "Connected Network" },
    detail: {
      zh: "查看船闸坐标、区域分组和拓扑约束下的连通关系。",
      en: "Inspect lock coordinates, regional groupings, and topology-constrained connected links.",
    },
  },
  {
    name: { zh: "治理优先级", en: "Governance Priorities" },
    detail: {
      zh: "对比直接负担缓解和连通瓶颈监管对应的优先对象。",
      en: "Compare priority objects for direct burden relief and connected-bottleneck supervision.",
    },
  },
];

export function AboutContent() {
  const { t } = useLocale();

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[24px] border border-[var(--line)] bg-[var(--ink-900)] p-6 text-[var(--sand-100)] shadow-[0_18px_45px_rgba(32,42,56,0.14)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--sand-300)]">
            {t({ zh: "作者信息", en: "Author Information" })}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">{AUTHOR_NAME}</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--sand-200)]">
            {authorLinks.map((item) => (
              <div key={item.value} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--sand-300)]">{t(item.label)}</p>
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                    className="mt-1 block break-words text-base text-white underline decoration-white/20 underline-offset-4 hover:text-[var(--sand-300)]"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-1 text-base text-white">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-6 shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">Evidence Chain</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
            {t({ zh: "从可见等待到治理优先级", en: "From Visible Waiting to Governance Priorities" })}
          </h2>
          <div className="mt-5 space-y-4 text-[15px] leading-8 text-[var(--ink-700)]">
            {evidenceChain.map((item) => (
              <p key={item.en} className="rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3">
                {t(item)}
              </p>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-6 shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">Scope Boundary</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {boundaries.map((item) => (
            <p key={item.en} className="rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3 text-sm leading-7 text-[var(--ink-700)]">
              {t(item)}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-[var(--line)] bg-white/92 p-6 shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">Product Pages</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {pages.map((page) => (
            <div key={page.name.en} className="rounded-[20px] border border-[var(--line)] bg-[var(--sand-100)] p-5">
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink-900)]">{t(page.name)}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-700)]">{t(page.detail)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

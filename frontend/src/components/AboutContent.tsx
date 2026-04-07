"use client";

import { useLocale } from "@/lib/locale";
import { AUTHOR_EMAIL, AUTHOR_NAME } from "@/lib/site";

const authorLinks = [
  {
    label: { zh: "机构", en: "Affiliation" },
    value: "Hohai University",
  },
  {
    label: { zh: "地点", en: "Location" },
    value: "Nanjing, China",
  },
  {
    label: { zh: "邮箱", en: "Email" },
    value: AUTHOR_EMAIL,
    href: `mailto:${AUTHOR_EMAIL}`,
  },
  {
    label: { zh: "GitHub", en: "GitHub" },
    value: "github.com/wsy1011",
    href: "https://github.com/wsy1011",
  },
  {
    label: { zh: "ResearchGate", en: "ResearchGate" },
    value: "researchgate.net/profile/Suyang-Wang-6",
    href: "https://www.researchgate.net/profile/Suyang-Wang-6",
  },
  {
    label: { zh: "ORCID", en: "ORCID" },
    value: "0009-0002-8499-1181",
    href: "https://orcid.org/0009-0002-8499-1181",
  },
];

const principles = [
  {
    zh: "这个交互网站是论文的独立演示版本，不修改上游研究仓库中的脚本、数据和结果文件。",
    en: "This interactive website is an independent companion demo for the paper and does not modify scripts, data, or result files in the upstream research repository.",
  },
  {
    zh: "前端只访问独立工具箱自己的数据接口或静态快照，不直接散读原研究项目文件。",
    en: "The frontend only reads this toolbox's own APIs or static snapshots and does not directly traverse files in the research repository.",
  },
  {
    zh: "公开 Demo 只展示聚合输出和演示快照，不返回事件级船闸过闸原始记录。",
    en: "The public demo only shows aggregate outputs and demo snapshots, and does not expose event-level lock-passage records.",
  },
  {
    zh: "如果切换到 private 模式，仍然通过只读方式接入受限数据目录。",
    en: "When switched to private mode, the app still connects to restricted data directories in read-only mode.",
  },
];

const pages = [
  {
    name: { zh: "政策沙盘", en: "Policy Sandbox" },
    detail: {
      zh: "设定治理对象、预算 K 和区域-功能分组范围，并查看反事实情景结果变化。",
      en: "Adjust governance object, budget K, and group scope, then inspect policy-sandbox outcome changes.",
    },
  },
  {
    name: { zh: "连通网络", en: "Connected Lock Network" },
    detail: {
      zh: "查看观测船闸点位、空间分布和拓扑约束下的直接连通关系。",
      en: "Inspect observed lock coordinates, spatial distribution, and topology-constrained connected links.",
    },
  },
  {
    name: { zh: "治理优先级", en: "Governance Prioritization" },
    detail: {
      zh: "查看队列风险控制和结构状态再分配对应的治理优先级。",
      en: "See targeting indices for queue-risk control and structural state reallocation.",
    },
  },
];

export function AboutContent() {
  const { locale, t } = useLocale();

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[30px] border border-[var(--line)] bg-[var(--ink-900)] p-6 text-[var(--sand-100)] shadow-[0_18px_45px_rgba(32,42,56,0.14)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--sand-300)]">
            {locale === "zh" ? "作者信息" : "Author Information"}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">{AUTHOR_NAME}</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--sand-200)]">
            {authorLinks.map((item) => (
              <div key={item.value} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--sand-300)]">
                  {t(item.label)}
                </p>
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

        <section className="rounded-[30px] border border-[var(--line)] bg-white/92 p-6 shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-500)]">Design Notes</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
            {locale === "zh"
              ? "独立仓库、只读接入、聚合输出"
              : "Independent Repository, Read-only Access, Aggregate Outputs"}
          </h2>
          <div className="mt-5 space-y-4 text-[15px] leading-8 text-[var(--ink-700)]">
            {principles.map((item) => (
              <p key={item.en} className="rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3">
                {t(item)}
              </p>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[30px] border border-[var(--line)] bg-white/92 p-6 shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-500)]">Product Pages</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {pages.map((page) => (
            <div key={page.name.en} className="rounded-[24px] border border-[var(--line)] bg-[var(--sand-100)] p-5">
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink-900)]">
                {t(page.name)}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-700)]">{t(page.detail)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

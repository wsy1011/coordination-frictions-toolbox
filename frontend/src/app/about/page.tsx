import { AppShell } from "@/components/AppShell";

const principles = [
  "这个交互网站是论文的独立演示 Demo，不修改上游研究仓库中的脚本、数据和结果文件。",
  "前端只访问独立工具箱自己的数据接口或静态快照，不直接散读原研究项目文件。",
  "公开 Demo 只展示聚合分析结果和演示副本，不返回事件级原始数据。",
  "如果切换到 private 模式，依然通过只读方式接入受限数据目录。",
];

const pages = [
  { name: "政策沙盘", detail: "设置政策类型、预算 K 和走廊范围，并查看结果变化。" },
  { name: "网络地图", detail: "查看真实船闸点位、空间分布和公开网络连线。" },
  { name: "重点对象", detail: "查看队列治理和结构治理下的优先干预对象排序。" },
];

export default function AboutPage() {
  return (
    <AppShell
      title="方法与说明"
      subtitle="解释这个论文 Demo 如何与原研究项目隔离、如何读取数据，以及第一版的使用边界。"
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[30px] border border-[var(--line)] bg-white/92 p-6 shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-500)]">Design Notes</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">独立仓库、只读接入、聚合输出</h2>
          <div className="mt-5 space-y-4 text-[15px] leading-8 text-[var(--ink-700)]">
            {principles.map((item) => (
              <p key={item} className="rounded-2xl border border-[var(--line)] bg-[var(--sand-100)] px-4 py-3">
                {item}
              </p>
            ))}
          </div>
        </section>
        <section className="rounded-[30px] border border-[var(--line)] bg-[var(--ink-900)] p-6 text-[var(--sand-100)] shadow-[0_18px_45px_rgba(32,42,56,0.14)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--sand-300)]">V1 Boundaries</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">当前版本做什么，不做什么</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--sand-200)]">
            <p>做: 展示网络地图、政策参数调节、重点对象识别和聚合结果对比。</p>
            <p>不做: 实时调度、用户鉴权、多用户协作和事件级明细下载。</p>
            <p>做: 支持 demo 与 private 两种运行模式。</p>
            <p>不做: 改写上游学术模型或重新估计论文口径。</p>
          </div>
        </section>
      </div>
      <section className="rounded-[30px] border border-[var(--line)] bg-white/92 p-6 shadow-[0_18px_45px_rgba(32,42,56,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-500)]">Product Pages</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {pages.map((page) => (
            <div key={page.name} className="rounded-[24px] border border-[var(--line)] bg-[var(--sand-100)] p-5">
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink-900)]">
                {page.name}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-700)]">{page.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

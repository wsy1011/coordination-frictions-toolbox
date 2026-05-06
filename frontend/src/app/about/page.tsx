import { AppShell } from "@/components/AppShell";
import { AboutContent } from "@/components/AboutContent";

export default function AboutPage() {
  return (
    <AppShell
      title={{ zh: "方法与边界", en: "Method and Scope" }}
      subtitle={{
        zh: "说明这个独立网站如何配套论文新结果，以及公开演示和原始研究数据之间的边界。",
        en: "Explain how this standalone website supports the revised paper results and where the public-demo boundary sits relative to the research data.",
      }}
    >
      <AboutContent />
    </AppShell>
  );
}

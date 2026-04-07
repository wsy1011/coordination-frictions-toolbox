import { AppShell } from "@/components/AppShell";
import { AboutContent } from "@/components/AboutContent";

export default function AboutPage() {
  return (
    <AppShell
      title={{ zh: "方法与说明", en: "Methodology" }}
      subtitle={{
        zh: "解释这个论文 Demo 如何与原研究项目隔离、如何读取数据，以及第一版的使用边界。",
        en: "Explain how this paper demo stays isolated from the research repository, how it reads data, and what the first release is designed to cover.",
      }}
    >
      <AboutContent />
    </AppShell>
  );
}

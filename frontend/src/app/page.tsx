import { AppShell } from "@/components/AppShell";
import { PolicyWorkbench } from "@/components/PolicyWorkbench";
import { getInitialDashboardData } from "@/lib/server-api";

export default async function Home() {
  const initialData = await getInitialDashboardData();

  return (
    <AppShell
      title={{
        zh: "连通船闸压力论文演示",
        en: "Paper Demo: Connected Lock Pressure",
      }}
      subtitle={{
        zh: "用聚合快照展示 AIS 可见等待、pre-dispatch 治理负担、连通压力和固定容量治理规则。",
        en: "An aggregate companion demo for AIS-visible waiting, pre-dispatch governance burden, connected pressure, and fixed-capacity governance rules.",
      }}
    >
      <PolicyWorkbench mode="dashboard" initialData={initialData} />
    </AppShell>
  );
}

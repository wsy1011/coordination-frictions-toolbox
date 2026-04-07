import { AppShell } from "@/components/AppShell";
import { PolicyWorkbench } from "@/components/PolicyWorkbench";
import { getInitialDashboardData } from "@/lib/server-api";

export default async function Home() {
  const initialData = await getInitialDashboardData();

  return (
    <AppShell
      title={{
        zh: "船闸侧协调摩擦论文演示",
        en: "Paper Demo: Lock-Side Coordination Frictions",
      }}
      subtitle={{
        zh: "用于比较连通船闸网络中的固定预算治理反事实情景。",
        en: "An interactive policy sandbox for comparing fixed-budget governance designs in a connected lock network.",
      }}
    >
      <PolicyWorkbench mode="dashboard" initialData={initialData} />
    </AppShell>
  );
}

import { AppShell } from "@/components/AppShell";
import { PolicyWorkbench } from "@/components/PolicyWorkbench";
import { getInitialDashboardData } from "@/lib/server-api";

export default async function NetworkPage() {
  const initialData = await getInitialDashboardData();

  return (
    <AppShell
      title={{ zh: "连通船闸网络", en: "Connected Lock Network" }}
      subtitle={{
        zh: "查看区域-功能分组、观测船闸点位和拓扑约束下的直接连通关系。",
        en: "Inspect regional-functional groups, observed lock locations, and topology-constrained connected links.",
      }}
    >
      <PolicyWorkbench mode="network" initialData={initialData} />
    </AppShell>
  );
}

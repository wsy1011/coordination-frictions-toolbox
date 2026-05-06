import { AppShell } from "@/components/AppShell";
import { PolicyWorkbench } from "@/components/PolicyWorkbench";
import { getInitialDashboardData } from "@/lib/server-api";

export default async function PrioritiesPage() {
  const initialData = await getInitialDashboardData();

  return (
    <AppShell
      title={{ zh: "治理优先级", en: "Governance Priorities" }}
      subtitle={{
        zh: "对比直接负担缓解和连通瓶颈监管下的聚合治理优先对象，并在地图上定位对应船闸。",
        en: "Compare aggregate priority objects for direct burden relief and connected-bottleneck supervision, then locate each lock on the map.",
      }}
    >
      <PolicyWorkbench mode="priorities" initialData={initialData} />
    </AppShell>
  );
}

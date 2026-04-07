import { AppShell } from "@/components/AppShell";
import { PolicyWorkbench } from "@/components/PolicyWorkbench";
import { getInitialDashboardData } from "@/lib/server-api";

export default async function RankingsPage() {
  const initialData = await getInitialDashboardData();

  return (
    <AppShell
      title={{ zh: "治理优先级", en: "Governance Prioritization" }}
      subtitle={{
        zh: "查看由聚合风险指标生成的治理优先级，并在地图上定位对应船闸。",
        en: "Review targeting indices generated from aggregate risk indicators and locate the corresponding locks on the map.",
      }}
    >
      <PolicyWorkbench mode="rankings" initialData={initialData} />
    </AppShell>
  );
}

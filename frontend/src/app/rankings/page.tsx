import { AppShell } from "@/components/AppShell";
import { PolicyWorkbench } from "@/components/PolicyWorkbench";
import { getInitialDashboardData } from "@/lib/server-api";

export default async function RankingsPage() {
  const initialData = await getInitialDashboardData();

  return (
    <AppShell
      title="重点对象"
      subtitle="查看基于聚合风险指标生成的重点治理对象排序，并与地图联动定位。"
    >
      <PolicyWorkbench mode="rankings" initialData={initialData} />
    </AppShell>
  );
}

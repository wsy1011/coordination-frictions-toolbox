import { AppShell } from "@/components/AppShell";
import { PolicyWorkbench } from "@/components/PolicyWorkbench";
import { getInitialDashboardData } from "@/lib/server-api";

export default async function NetworkPage() {
  const initialData = await getInitialDashboardData();

  return (
    <AppShell
      title="网络地图"
      subtitle="使用真实船闸点位与公开网络连线，查看走廊分组、空间分布和重点节点位置。"
    >
      <PolicyWorkbench mode="network" initialData={initialData} />
    </AppShell>
  );
}

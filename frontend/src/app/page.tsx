import { AppShell } from "@/components/AppShell";
import { PolicyWorkbench } from "@/components/PolicyWorkbench";
import { getInitialDashboardData } from "@/lib/server-api";

export default async function Home() {
  const initialData = await getInitialDashboardData();

  return (
    <AppShell
      title="船闸协调摩擦论文演示 Demo"
      subtitle="这是论文研究的交互式演示网站，用于在真实地图上比较不同政策工具对等待、脆弱性和重点节点的影响。"
    >
      <PolicyWorkbench mode="dashboard" initialData={initialData} />
    </AppShell>
  );
}

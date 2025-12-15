import { DashboardClient } from "./dashboard-client";
import { loadDashboardKpisFromAttachments } from "@/lib/data/kpis-dashboard";

export default function DashboardPage() {
  const { monthlySiteKpis, globalPpm } = loadDashboardKpisFromAttachments();
  return <DashboardClient monthlySiteKpis={monthlySiteKpis} globalPpm={globalPpm} />;
}

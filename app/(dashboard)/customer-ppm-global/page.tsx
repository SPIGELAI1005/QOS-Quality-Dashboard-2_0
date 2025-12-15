import { DashboardClient } from "../dashboard/dashboard-client";
import { loadDashboardKpisFromAttachments } from "@/lib/data/kpis-dashboard";

export default function CustomerPPMGlobalPage() {
  const { monthlySiteKpis, globalPpm } = loadDashboardKpisFromAttachments();
  return <DashboardClient monthlySiteKpis={monthlySiteKpis} globalPpm={globalPpm} viewMode="customer" />;
}


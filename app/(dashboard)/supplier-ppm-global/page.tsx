import { DashboardClient } from "../dashboard/dashboard-client";
import { loadDashboardKpisFromAttachments } from "@/lib/data/kpis-dashboard";

export default function SupplierPPMGlobalPage() {
  const { monthlySiteKpis, globalPpm } = loadDashboardKpisFromAttachments();
  return <DashboardClient monthlySiteKpis={monthlySiteKpis} globalPpm={globalPpm} viewMode="supplier" />;
}


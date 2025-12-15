import { AISummaryClient } from "./ai-summary-client";
import { loadDashboardKpisFromAttachments } from "@/lib/data/kpis-dashboard";

export default function AISummaryPage() {
  const { monthlySiteKpis, globalPpm } = loadDashboardKpisFromAttachments();
  return <AISummaryClient monthlySiteKpis={monthlySiteKpis} globalPpm={globalPpm} />;
}


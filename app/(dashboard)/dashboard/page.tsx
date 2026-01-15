import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  // Source of truth in production is the browser dataset (localStorage) populated via /upload.
  // We intentionally do NOT server-seed from the repo's /attachments folder to avoid showing data before upload.
  return <DashboardClient />;
}

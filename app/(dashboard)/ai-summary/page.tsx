import { AISummaryClient } from "./ai-summary-client";

export default function AISummaryPage() {
  // Source of truth is the browser dataset (localStorage) populated via /upload.
  // Do not server-seed from /attachments to avoid showing data before upload.
  return <AISummaryClient />;
}


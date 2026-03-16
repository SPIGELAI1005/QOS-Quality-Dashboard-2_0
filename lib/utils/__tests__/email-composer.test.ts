import { describe, expect, it } from "vitest";
import { buildMailtoLink } from "../email-composer";

describe("email-composer mailto encoding", () => {
  it("does not reintroduce plus signs between words in subject/body", () => {
    const link = buildMailtoLink(
      {
        type: "anomaly",
        title: "410 FEN, US",
        date: "Mar 2025",
        percentage: "85,7%",
        description: "Supplier PPM spiked and requires immediate investigation.",
        trend: "up",
      },
      [],
      "https://example.com/ai-summary"
    );

    expect(link.startsWith("mailto:?")).toBe(true);

    // Guardrail: URL encoding must not use '+' for spaces.
    expect(link).not.toContain("+");

    const query = link.split("?")[1] ?? "";
    const params = new URLSearchParams(query);
    const subject = params.get("subject") ?? "";
    const body = params.get("body") ?? "";

    expect(subject).toContain("QOS ET Report - Action Required");
    expect(body).toContain("Dear Team,");
    expect(body).toContain("quality anomaly that requires investigation");

    // The decoded body should never contain '+' as a space replacement.
    expect(body).not.toMatch(/[A-Za-z]\+[A-Za-z]/);
  });
});

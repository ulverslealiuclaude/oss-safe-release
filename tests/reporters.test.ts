import { describe, expect, it } from "vitest";
import { renderJsonReport } from "../src/reporters/json";
import { renderMarkdownReport } from "../src/reporters/markdown";
import type { Finding } from "../src/types";

const findings: Finding[] = [
  {
    ruleId: "workflow.mutable-action-ref",
    severity: "high",
    title: "Action is not pinned",
    message: "actions/checkout uses a mutable ref.",
    filePath: ".github/workflows/ci.yml",
    line: 4,
    recommendation: "Pin to a full commit SHA.",
  },
];

describe("reporters", () => {
  it("renders Markdown reports with finding details", () => {
    const markdown = renderMarkdownReport(findings);

    expect(markdown).toContain("# oss-safe-release report");
    expect(markdown).toContain("workflow.mutable-action-ref");
    expect(markdown).toContain(".github/workflows/ci.yml:4");
  });

  it("renders JSON reports with findings", () => {
    const json = JSON.parse(renderJsonReport(findings));

    expect(json.findings[0].ruleId).toBe("workflow.mutable-action-ref");
  });
});

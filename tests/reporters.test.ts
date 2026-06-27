import { describe, expect, it } from "vitest";
import { renderConsoleSummary } from "../src/reporters/console";
import { renderJsonReport } from "../src/reporters/json";
import { renderMarkdownReport } from "../src/reporters/markdown";
import { renderSarifReport } from "../src/reporters/sarif";
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
  it("renders console summaries with scan metadata", () => {
    const summary = renderConsoleSummary(findings, {
      fileCount: 8,
      workflowCount: 2,
      ruleCount: 20,
    });

    expect(summary).toContain("1 finding");
    expect(summary).toContain("scanned 8 files, 2 workflows, 20 rules");
  });

  it("renders singular scan metadata labels", () => {
    const summary = renderConsoleSummary([], {
      fileCount: 1,
      workflowCount: 1,
      ruleCount: 1,
    });

    expect(summary).toContain("scanned 1 file, 1 workflow, 1 rule");
  });


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

  it("renders SARIF reports for GitHub code scanning", () => {
    const sarif = JSON.parse(renderSarifReport(findings));

    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].tool.driver.name).toBe("oss-safe-release");
    expect(sarif.runs[0].tool.driver.rules[0].id).toBe("workflow.mutable-action-ref");
    expect(sarif.runs[0].tool.driver.rules[0].helpUri).toBe(
      "https://github.com/ulverslealiuclaude/oss-safe-release/blob/main/docs/rules.md",
    );
    expect(sarif.runs[0].tool.driver.rules[0].defaultConfiguration.level).toBe("error");
    expect(sarif.runs[0].results[0].ruleId).toBe("workflow.mutable-action-ref");
    expect(sarif.runs[0].results[0].ruleIndex).toBe(0);
    expect(sarif.runs[0].results[0].level).toBe("error");
    expect(sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri).toBe(".github/workflows/ci.yml");
    expect(sarif.runs[0].results[0].locations[0].physicalLocation.region.startLine).toBe(4);
  });
});

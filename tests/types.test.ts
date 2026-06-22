import { describe, expect, it } from "vitest";
import type { Finding } from "../src/types";

describe("Finding type", () => {
  it("supports stable rule metadata for reports", () => {
    const finding: Finding = {
      ruleId: "workflow.mutable-action-ref",
      severity: "high",
      title: "Action is not pinned",
      message: "actions/checkout uses a mutable ref.",
      filePath: ".github/workflows/ci.yml",
      line: 12,
      recommendation: "Pin the action to a full commit SHA.",
    };

    expect(finding.ruleId).toBe("workflow.mutable-action-ref");
    expect(finding.severity).toBe("high");
  });
});

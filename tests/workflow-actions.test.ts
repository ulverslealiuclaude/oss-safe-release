import { describe, expect, it } from "vitest";
import type { RepoContext } from "../src/types";
import { workflowActionsRule } from "../src/rules/workflow-actions";

describe("workflowActionsRule", () => {
  it("flags actions pinned to mutable refs", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/ci.yml",
          content: "jobs:\n  test:\n    steps:\n      - uses: actions/checkout@main\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.mutable-action-ref",
        severity: "high",
        filePath: ".github/workflows/ci.yml",
      }),
    );
  });

  it("flags write-all token permissions", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/release.yml",
          content: "permissions: write-all\njobs:\n  release:\n    steps: []\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.write-all-permissions",
        severity: "critical",
      }),
    );
  });
});

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

  it("flags pull_request_target workflows that execute repository code", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/pr-target.yml",
          content:
            "on: pull_request_target\njobs:\n  test:\n    steps:\n      - uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608\n      - run: pnpm test\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.pull-request-target-executes-code",
        severity: "high",
        filePath: ".github/workflows/pr-target.yml",
      }),
    );
  });

  it("flags pull_request_target workflows that download artifacts", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/pr-target-artifacts.yml",
          content:
            "on: pull_request_target\njobs:\n  publish:\n    steps:\n      - uses: actions/download-artifact@8ade135a41bc03ea155e62e844d188df1ea18608\n        with:\n          name: pr-build\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.pull-request-target-downloads-artifact",
        severity: "high",
        filePath: ".github/workflows/pr-target-artifacts.yml",
      }),
    );
  });

  it("flags untrusted GitHub context interpolation in run steps", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/comment.yml",
          content:
            "on: pull_request\njobs:\n  test:\n    steps:\n      - run: echo \"${{ github.event.pull_request.title }}\"\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.untrusted-context-in-run",
        severity: "high",
        filePath: ".github/workflows/comment.yml",
      }),
    );
  });

  it("flags remote scripts piped into shells", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/install.yml",
          content:
            "on: push\njobs:\n  install:\n    steps:\n      - run: |\n          curl -fsSL https://example.com/install.sh | bash\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.remote-script-pipe",
        severity: "high",
        filePath: ".github/workflows/install.yml",
      }),
    );
  });

  it("flags unpinned global tool installs in workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/release.yml",
          content: "on: push\njobs:\n  release:\n    steps:\n      - run: npm install -g semantic-release\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.unpinned-global-install",
        severity: "medium",
        filePath: ".github/workflows/release.yml",
      }),
    );
  });

  it("does not flag pinned global tool installs", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/release.yml",
          content: "on: push\njobs:\n  release:\n    steps:\n      - run: npm install -g semantic-release@21.1.2\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.unpinned-global-install",
      }),
    );
  });

  it("flags reusable workflow calls that inherit all secrets", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/reuse.yml",
          content:
            "on: push\njobs:\n  release:\n    uses: org/reusable/.github/workflows/release.yml@8ade135a41bc03ea155e62e844d188df1ea18608\n    secrets: inherit\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.reusable-workflow-secrets-inherit",
        severity: "high",
        filePath: ".github/workflows/reuse.yml",
      }),
    );
  });

  it("flags reusable workflows that accept secrets without explicit permissions", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/reusable-release.yml",
          content:
            "on:\n  workflow_call:\n    secrets:\n      npm_token:\n        required: true\njobs:\n  publish:\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = workflowActionsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "workflow.workflow-call-secrets-without-permissions",
        severity: "medium",
        filePath: ".github/workflows/reusable-release.yml",
      }),
    );
  });
});

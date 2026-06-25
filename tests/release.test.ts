import { describe, expect, it } from "vitest";
import { releaseRule } from "../src/rules/release";
import type { RepoContext } from "../src/types";

describe("releaseRule", () => {
  it("flags package publishing in pull request workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/publish.yml",
          content: "on: pull_request\njobs:\n  publish:\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request",
        severity: "critical",
      }),
    );
  });

  it("flags package publishing on unconstrained push workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/publish.yml",
          content: "on: push\njobs:\n  publish:\n    steps:\n      - run: pnpm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-trusted-gate",
        severity: "high",
        filePath: ".github/workflows/publish.yml",
      }),
    );
  });

  it("flags container image publishing in pull request workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/container-publish.yml",
          content: "on: pull_request\njobs:\n  publish:\n    steps:\n      - run: docker push ghcr.io/example/app:latest\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request",
        severity: "critical",
        filePath: ".github/workflows/container-publish.yml",
      }),
    );
  });

  it("flags container image publishing on unconstrained push workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/container-publish.yml",
          content: "on: push\njobs:\n  publish:\n    steps:\n      - run: docker push ghcr.io/example/app:latest\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-trusted-gate",
        severity: "high",
        filePath: ".github/workflows/container-publish.yml",
      }),
    );
  });

  it("flags GitHub release creation in pull request workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/github-release.yml",
          content: "on: pull_request\njobs:\n  release:\n    steps:\n      - run: gh release create v1.2.3 dist/app.zip\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request",
        severity: "critical",
        filePath: ".github/workflows/github-release.yml",
      }),
    );
  });

  it("flags GitHub release creation on unconstrained push workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/github-release.yml",
          content: "on: push\njobs:\n  release:\n    steps:\n      - run: gh release create v1.2.3 dist/app.zip\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-trusted-gate",
        severity: "high",
        filePath: ".github/workflows/github-release.yml",
      }),
    );
  });

  it("flags artifact publishing without explicit permissions", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/release.yml",
          content: "on: release\njobs:\n  publish:\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-explicit-permissions",
        severity: "medium",
        filePath: ".github/workflows/release.yml",
      }),
    );
  });

  it("does not flag artifact publishing with explicit permissions", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/release.yml",
          content: "on: release\npermissions:\n  contents: read\n  id-token: write\njobs:\n  publish:\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-explicit-permissions",
      }),
    );
  });

  it("flags manual package publishing without an environment or confirmation input", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/manual-publish.yml",
          content: "on: workflow_dispatch\njobs:\n  publish:\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.manual-publish-without-approval",
        severity: "medium",
        filePath: ".github/workflows/manual-publish.yml",
      }),
    );
  });

  it("does not flag manual package publishing with a protected environment", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/manual-publish.yml",
          content: "on: workflow_dispatch\njobs:\n  publish:\n    environment: npm-release\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.manual-publish-without-approval",
      }),
    );
  });
});

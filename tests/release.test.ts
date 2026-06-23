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
});

import { describe, expect, it } from "vitest";
import type { RepoContext } from "../src/types";
import { secretsRule } from "../src/rules/secrets";

describe("secretsRule", () => {
  it("flags committed environment files", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [{ path: ".env", content: "TOKEN=abc" }],
      workflows: [],
    };

    const findings = secretsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "secrets.sensitive-file-committed",
        severity: "critical",
        filePath: ".env",
      }),
    );
  });

  it("flags missing gitignore coverage for common secret files", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [{ path: ".gitignore", content: "node_modules\n" }],
      workflows: [],
    };

    const findings = secretsRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "secrets.gitignore-missing-env",
        severity: "medium",
      }),
    );
  });
});

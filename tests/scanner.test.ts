import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepository } from "../src/scanner";

describe("scanRepository", () => {
  it("returns findings from all built-in rules", async () => {
    const root = await mkdtemp(join(tmpdir(), "oss-safe-release-scanner-"));
    await mkdir(join(root, ".github/workflows"), { recursive: true });
    await writeFile(
      join(root, ".github/workflows/ci.yml"),
      "permissions: write-all\njobs:\n  test:\n    steps:\n      - uses: actions/checkout@main\n",
    );
    await writeFile(join(root, ".env"), "TOKEN=abc");

    const result = await scanRepository(root);

    expect(result.findings.map((finding) => finding.ruleId)).toEqual(
      expect.arrayContaining([
        "workflow.mutable-action-ref",
        "workflow.write-all-permissions",
        "secrets.sensitive-file-committed",
      ]),
    );

    await rm(root, { recursive: true, force: true });
  });

  it("applies config ignores by rule id and path", async () => {
    const root = await mkdtemp(join(tmpdir(), "oss-safe-release-config-"));
    await writeFile(join(root, ".env"), "TOKEN=abc");
    await writeFile(
      join(root, "oss-safe-release.config.json"),
      JSON.stringify({
        ignore: [{ ruleId: "secrets.sensitive-file-committed", path: ".env" }],
      }),
    );

    const result = await scanRepository(root);

    expect(result.findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "secrets.sensitive-file-committed",
        filePath: ".env",
      }),
    );
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        ruleId: "secrets.gitignore-missing-env",
      }),
    );

    await rm(root, { recursive: true, force: true });
  });
});

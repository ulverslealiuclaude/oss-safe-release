import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepository } from "../src/scanner";

describe("scanRepository", () => {
  it("returns findings from all built-in rules", async () => {
    const root = join(process.cwd(), "tests/fixtures/scanner");
    await rm(root, { recursive: true, force: true });
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
  });
});

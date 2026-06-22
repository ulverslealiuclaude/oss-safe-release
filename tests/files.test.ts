import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverRepoFiles } from "../src/files";

describe("discoverRepoFiles", () => {
  it("loads relevant repository files and excludes generated directories", async () => {
    const root = join(process.cwd(), "tests/fixtures/file-discovery");
    await rm(root, { recursive: true, force: true });
    await mkdir(join(root, ".github/workflows"), { recursive: true });
    await mkdir(join(root, "node_modules/pkg"), { recursive: true });
    await writeFile(join(root, ".github/workflows/ci.yml"), "name: ci\n");
    await writeFile(join(root, ".gitignore"), ".env\n");
    await writeFile(join(root, "node_modules/pkg/index.js"), "ignored");

    const files = await discoverRepoFiles(root);
    const paths = files.map((file) => file.path).sort();

    expect(paths).toContain(".github/workflows/ci.yml");
    expect(paths).toContain(".gitignore");
    expect(paths).not.toContain("node_modules/pkg/index.js");
  });
});

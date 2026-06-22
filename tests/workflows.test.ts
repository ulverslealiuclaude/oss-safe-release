import { describe, expect, it } from "vitest";
import type { RepoFile } from "../src/types";
import { findLine, parseWorkflowFiles } from "../src/workflows";

describe("parseWorkflowFiles", () => {
  it("parses GitHub workflow YAML files", () => {
    const files: RepoFile[] = [
      {
        path: ".github/workflows/ci.yml",
        content: "name: ci\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n",
      },
    ];

    const result = parseWorkflowFiles(files);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe(".github/workflows/ci.yml");
    expect(result[0].data).toMatchObject({ name: "ci" });
  });

  it("finds one-based line numbers", () => {
    expect(findLine("a\nb\nc\n", "b")).toBe(2);
  });
});

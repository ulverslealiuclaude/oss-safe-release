import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createProgram, shouldFailForFindings } from "../src/cli";
import type { Finding } from "../src/types";

const mediumFinding: Finding = {
  ruleId: "workflow.write-all-permissions",
  severity: "medium",
  title: "Workflow grants broad permissions",
  message: "permissions: write-all grants broad token access.",
  filePath: ".github/workflows/ci.yml",
  line: 3,
  recommendation: "Use least-privilege permissions.",
};

describe("createProgram", () => {
  it("defines the scan command", () => {
    const program = createProgram();

    expect(program.commands.map((command) => command.name())).toContain("scan");
  });

  it("defines the SARIF report option", () => {
    const program = createProgram();
    const scanCommand = program.commands.find((command) => command.name() === "scan");

    expect(scanCommand?.options.map((option) => option.long)).toContain("--sarif");
  });

  it("defines the fail-on severity option", () => {
    const program = createProgram();
    const scanCommand = program.commands.find((command) => command.name() === "scan");

    expect(scanCommand?.options.map((option) => option.long)).toContain("--fail-on");
  });

  it("defines the config option", () => {
    const program = createProgram();
    const scanCommand = program.commands.find((command) => command.name() === "scan");

    expect(scanCommand?.options.map((option) => option.long)).toContain("--config");
  });

  it("fails only on high or critical findings by default", () => {
    expect(shouldFailForFindings([mediumFinding], "high")).toBe(false);
    expect(shouldFailForFindings([{ ...mediumFinding, severity: "high" }], "high")).toBe(true);
  });

  it("supports stricter and disabled fail thresholds", () => {
    expect(shouldFailForFindings([mediumFinding], "medium")).toBe(true);
    expect(shouldFailForFindings([{ ...mediumFinding, severity: "critical" }], "none")).toBe(false);
  });

  it("rejects invalid fail-on severity values", async () => {
    const program = createProgram();
    let errorOutput = "";
    program.exitOverride();
    program.configureOutput({
      writeErr: (value) => {
        errorOutput += value;
      },
    });

    await expect(program.parseAsync(["node", "oss-safe-release", "scan", ".", "--fail-on", "urgent"])).rejects.toThrow(
      "process.exit unexpectedly called",
    );
    expect(errorOutput).toContain("Allowed choices are low, medium, high, critical, none");
  });

  it("creates report output directories when they do not exist", async () => {
    const root = await mkdtemp(join(tmpdir(), "oss-safe-release-cli-"));
    await mkdir(join(root, ".github/workflows"), { recursive: true });
    await writeFile(join(root, ".github/workflows/ci.yml"), "name: ci\n");
    await writeFile(join(root, ".gitignore"), ".env\n");
    const program = createProgram();
    program.exitOverride();
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      await program.parseAsync([
        "node",
        "oss-safe-release",
        "scan",
        root,
        "--markdown",
        "reports/nested/safe-release.md",
        "--json",
        "reports/nested/safe-release.json",
        "--sarif",
        "reports/nested/safe-release.sarif",
        "--fail-on",
        "none",
      ]);
    } finally {
      stdout.mockRestore();
    }

    await expect(readFile(join(root, "reports/nested/safe-release.md"), "utf8")).resolves.toContain("# oss-safe-release report");
    await expect(readFile(join(root, "reports/nested/safe-release.json"), "utf8")).resolves.toContain('"findings"');
    await expect(readFile(join(root, "reports/nested/safe-release.sarif"), "utf8")).resolves.toContain('"version": "2.1.0"');

    await rm(root, { recursive: true, force: true });
  });

  it("uses an explicit config file for ignores", async () => {
    const root = await mkdtemp(join(tmpdir(), "oss-safe-release-cli-"));
    await mkdir(join(root, ".github/workflows"), { recursive: true });
    await mkdir(join(root, "config"), { recursive: true });
    await writeFile(join(root, ".github/workflows/ci.yml"), "permissions: write-all\n");
    await writeFile(join(root, ".gitignore"), ".env\n");
    await writeFile(
      join(root, "config/safe-release.json"),
      JSON.stringify({
        ignore: [
          {
            ruleId: "workflow.write-all-permissions",
            path: ".github/workflows/ci.yml",
          },
        ],
      }),
    );
    const program = createProgram();
    program.exitOverride();
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      await program.parseAsync([
        "node",
        "oss-safe-release",
        "scan",
        root,
        "--config",
        "config/safe-release.json",
        "--json",
        "reports/safe-release.json",
        "--fail-on",
        "low",
      ]);
    } finally {
      stdout.mockRestore();
    }

    await expect(readFile(join(root, "reports/safe-release.json"), "utf8")).resolves.toContain('"findings": []');
    expect(process.exitCode).toBe(0);

    await rm(root, { recursive: true, force: true });
  });

  it("rejects a missing explicit config file", async () => {
    const root = await mkdtemp(join(tmpdir(), "oss-safe-release-cli-"));
    await mkdir(join(root, ".github/workflows"), { recursive: true });
    await writeFile(join(root, ".github/workflows/ci.yml"), "name: ci\n");
    await writeFile(join(root, ".gitignore"), ".env\n");
    const program = createProgram();
    program.exitOverride();
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      await expect(
        program.parseAsync(["node", "oss-safe-release", "scan", root, "--config", "config/missing.json", "--fail-on", "none"]),
      ).rejects.toThrow("Config file not found");
    } finally {
      stdout.mockRestore();
      await rm(root, { recursive: true, force: true });
    }
  });
});

import { describe, expect, it } from "vitest";
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
});

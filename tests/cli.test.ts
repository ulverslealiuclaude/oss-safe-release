import { describe, expect, it } from "vitest";
import { createProgram } from "../src/cli";

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
});

#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Command } from "commander";
import { renderConsoleSummary } from "./reporters/console";
import { renderJsonReport } from "./reporters/json";
import { renderMarkdownReport } from "./reporters/markdown";
import { scanRepository } from "./scanner";

export function createProgram(): Command {
  const program = new Command();
  program.name("oss-safe-release").description("OSS maintainer safety checks for releases, GitHub Actions, and secrets.");

  program
    .command("scan")
    .description("Scan a repository")
    .argument("[path]", "repository path", ".")
    .option("--markdown <path>", "write Markdown report", "safe-release-report.md")
    .option("--json <path>", "write JSON report", "safe-release-report.json")
    .action(async (targetPath: string, options: { markdown: string; json: string }) => {
      const rootDir = resolve(targetPath);
      const result = await scanRepository(rootDir);
      await writeFile(resolve(rootDir, options.markdown), renderMarkdownReport(result.findings));
      await writeFile(resolve(rootDir, options.json), renderJsonReport(result.findings));
      process.stdout.write(renderConsoleSummary(result.findings));
      process.exitCode = result.findings.some((finding) => finding.severity === "critical" || finding.severity === "high") ? 1 : 0;
    });

  return program;
}

if (require.main === module) {
  createProgram().parseAsync(process.argv).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 2;
  });
}

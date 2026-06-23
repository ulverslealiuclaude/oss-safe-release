#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Command } from "commander";
import { renderConsoleSummary } from "./reporters/console";
import { renderJsonReport } from "./reporters/json";
import { renderMarkdownReport } from "./reporters/markdown";
import { renderSarifReport } from "./reporters/sarif";
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
    .option("--sarif <path>", "write SARIF report for code scanning")
    .action(async (targetPath: string, options: { markdown: string; json: string; sarif?: string }) => {
      const rootDir = resolve(targetPath);
      const result = await scanRepository(rootDir);
      await writeFile(resolve(rootDir, options.markdown), renderMarkdownReport(result.findings));
      await writeFile(resolve(rootDir, options.json), renderJsonReport(result.findings));
      if (options.sarif !== undefined) {
        await writeFile(resolve(rootDir, options.sarif), renderSarifReport(result.findings));
      }
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

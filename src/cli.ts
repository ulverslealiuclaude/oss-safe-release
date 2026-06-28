#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Command, Option } from "commander";
import { renderConsoleSummary } from "./reporters/console";
import { renderJsonReport } from "./reporters/json";
import { renderMarkdownReport } from "./reporters/markdown";
import { renderSarifReport } from "./reporters/sarif";
import { scanRepository } from "./scanner";
import type { Finding, Severity } from "./types";

export type FailOnSeverity = Severity | "none";

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function shouldFailForFindings(findings: Finding[], failOn: FailOnSeverity): boolean {
  if (failOn === "none") {
    return false;
  }

  return findings.some((finding) => SEVERITY_RANK[finding.severity] >= SEVERITY_RANK[failOn]);
}

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
    .option("--config <path>", "read scanner config from an explicit JSON file")
    .option("--quiet", "suppress console summary output")
    .addOption(
      new Option("--fail-on <severity>", "exit with code 1 on findings at or above severity").choices([
        "low",
        "medium",
        "high",
        "critical",
        "none",
      ]).default("high"),
    )
    .action(
      async (
        targetPath: string,
        options: { markdown: string; json: string; sarif?: string; config?: string; quiet?: boolean; failOn: FailOnSeverity },
      ) => {
        const rootDir = resolve(targetPath);
        const result = await scanRepository(rootDir, { configPath: options.config });
        await writeReportFile(rootDir, options.markdown, renderMarkdownReport(result.findings));
        await writeReportFile(rootDir, options.json, renderJsonReport(result.findings));
        if (options.sarif !== undefined) {
          await writeReportFile(rootDir, options.sarif, renderSarifReport(result.findings));
        }
        if (options.quiet !== true) {
          process.stdout.write(renderConsoleSummary(result.findings, result.summary));
        }
        process.exitCode = shouldFailForFindings(result.findings, options.failOn) ? 1 : 0;
      },
    );

  return program;
}

async function writeReportFile(rootDir: string, outputPath: string, content: string): Promise<void> {
  const resolvedPath = resolve(rootDir, outputPath);
  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, content);
}

if (require.main === module) {
  createProgram().parseAsync(process.argv).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 2;
  });
}

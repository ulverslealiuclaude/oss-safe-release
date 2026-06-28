import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { discoverRepoFiles } from "./files";
import { releaseRule } from "./rules/release";
import { secretsRule } from "./rules/secrets";
import { workflowActionsRule } from "./rules/workflow-actions";
import type { Finding, IgnoreEntry, RepoContext, Rule, ScannerConfig, ScanSummary, Severity } from "./types";
import { parseWorkflowFiles } from "./workflows";

const BUILT_IN_RULES: Rule[] = [workflowActionsRule, secretsRule, releaseRule];
const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export interface ScanResult {
  findings: Finding[];
  summary: ScanSummary;
}

export interface ScanOptions {
  configPath?: string;
}

export async function scanRepository(rootDir: string, options: ScanOptions = {}): Promise<ScanResult> {
  const files = await discoverRepoFiles(rootDir);
  const workflows = parseWorkflowFiles(files);
  const context: RepoContext = {
    rootDir,
    files,
    workflows,
  };
  const config = await loadConfig(rootDir, files, options.configPath);
  const findings = applyIgnores(BUILT_IN_RULES.flatMap((rule) => rule.run(context)), config.ignore ?? []);

  return {
    summary: {
      fileCount: files.length,
      workflowCount: workflows.length,
      ruleCount: BUILT_IN_RULES.length,
    },
    findings: findings.sort((a, b) => {
      const severityDelta = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (severityDelta !== 0) return severityDelta;
      return `${a.filePath ?? ""}${a.ruleId}`.localeCompare(`${b.filePath ?? ""}${b.ruleId}`);
    }),
  };
}

async function loadConfig(rootDir: string, files: { path: string; content: string }[], configPath?: string): Promise<ScannerConfig> {
  const content = configPath === undefined ? files.find((file) => file.path === "oss-safe-release.config.json")?.content : await readConfigFile(rootDir, configPath);
  if (content === undefined) return {};

  try {
    const parsed = JSON.parse(content) as ScannerConfig;
    return {
      ignore: Array.isArray(parsed.ignore) ? parsed.ignore.filter(isIgnoreEntry) : [],
    };
  } catch {
    return {};
  }
}

async function readConfigFile(rootDir: string, configPath: string): Promise<string | undefined> {
  const resolvedPath = resolve(rootDir, configPath);
  try {
    return await readFile(resolvedPath, "utf8");
  } catch {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }
}

function isIgnoreEntry(value: unknown): value is IgnoreEntry {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<IgnoreEntry>;
  return typeof candidate.ruleId === "string" && (candidate.path === undefined || typeof candidate.path === "string");
}

function applyIgnores(findings: Finding[], ignores: IgnoreEntry[]): Finding[] {
  return findings.filter(
    (finding) =>
      !ignores.some((ignore) => ignore.ruleId === finding.ruleId && (ignore.path === undefined || ignore.path === finding.filePath)),
  );
}

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

export async function scanRepository(rootDir: string): Promise<ScanResult> {
  const files = await discoverRepoFiles(rootDir);
  const workflows = parseWorkflowFiles(files);
  const context: RepoContext = {
    rootDir,
    files,
    workflows,
  };
  const config = loadConfig(files);
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

function loadConfig(files: { path: string; content: string }[]): ScannerConfig {
  const configFile = files.find((file) => file.path === "oss-safe-release.config.json");
  if (!configFile) return {};

  try {
    const parsed = JSON.parse(configFile.content) as ScannerConfig;
    return {
      ignore: Array.isArray(parsed.ignore) ? parsed.ignore.filter(isIgnoreEntry) : [],
    };
  } catch {
    return {};
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

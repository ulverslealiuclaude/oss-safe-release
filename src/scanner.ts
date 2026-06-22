import { discoverRepoFiles } from "./files";
import { releaseRule } from "./rules/release";
import { secretsRule } from "./rules/secrets";
import { workflowActionsRule } from "./rules/workflow-actions";
import type { Finding, RepoContext, Rule, Severity } from "./types";
import { parseWorkflowFiles } from "./workflows";

const BUILT_IN_RULES: Rule[] = [workflowActionsRule, secretsRule, releaseRule];
const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export interface ScanResult {
  findings: Finding[];
}

export async function scanRepository(rootDir: string): Promise<ScanResult> {
  const files = await discoverRepoFiles(rootDir);
  const context: RepoContext = {
    rootDir,
    files,
    workflows: parseWorkflowFiles(files),
  };
  const findings = BUILT_IN_RULES.flatMap((rule) => rule.run(context));

  return {
    findings: findings.sort((a, b) => {
      const severityDelta = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (severityDelta !== 0) return severityDelta;
      return `${a.filePath ?? ""}${a.ruleId}`.localeCompare(`${b.filePath ?? ""}${b.ruleId}`);
    }),
  };
}

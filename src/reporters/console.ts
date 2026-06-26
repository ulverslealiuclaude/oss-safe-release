import type { Finding, ScanSummary, Severity } from "../types";

export function renderConsoleSummary(findings: Finding[], summary?: ScanSummary): string {
  const scanDetail = summary
    ? `; scanned ${formatCount(summary.fileCount, "file")}, ${formatCount(summary.workflowCount, "workflow")}, ${formatCount(summary.ruleCount, "rule")}`
    : "";

  if (findings.length === 0) return `oss-safe-release: no findings${scanDetail}\n`;

  const counts = findings.reduce<Partial<Record<Severity, number>>>((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
    return acc;
  }, {});

  const findingLabel = findings.length === 1 ? "finding" : "findings";
  return `oss-safe-release: ${findings.length} ${findingLabel} ` +
    `(critical=${counts.critical ?? 0}, high=${counts.high ?? 0}, medium=${counts.medium ?? 0}, low=${counts.low ?? 0})${scanDetail}\n`;
}

function formatCount(count: number, label: string): string {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

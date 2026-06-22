import type { Finding, Severity } from "../types";

export function renderConsoleSummary(findings: Finding[]): string {
  if (findings.length === 0) return "oss-safe-release: no findings\n";

  const counts = findings.reduce<Partial<Record<Severity, number>>>((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
    return acc;
  }, {});

  return `oss-safe-release: ${findings.length} findings ` +
    `(critical=${counts.critical ?? 0}, high=${counts.high ?? 0}, medium=${counts.medium ?? 0}, low=${counts.low ?? 0})\n`;
}

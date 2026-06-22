import type { Finding } from "../types";

export function renderMarkdownReport(findings: Finding[]): string {
  const lines = ["# oss-safe-release report", "", `Findings: ${findings.length}`, ""];

  for (const finding of findings) {
    const location = finding.filePath ? `${finding.filePath}${finding.line ? `:${finding.line}` : ""}` : "repository";
    lines.push(`## ${finding.severity.toUpperCase()}: ${finding.title}`);
    lines.push("");
    lines.push(`- Rule: \`${finding.ruleId}\``);
    lines.push(`- Location: \`${location}\``);
    lines.push(`- Message: ${finding.message}`);
    lines.push(`- Recommendation: ${finding.recommendation}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

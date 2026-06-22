import type { Finding } from "../types";

export function renderJsonReport(findings: Finding[]): string {
  return `${JSON.stringify({ findings }, null, 2)}\n`;
}

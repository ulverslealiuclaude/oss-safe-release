import type { Finding, Severity } from "../types";

const LEVEL_BY_SEVERITY: Record<Severity, "note" | "warning" | "error"> = {
  low: "note",
  medium: "warning",
  high: "error",
  critical: "error",
};

export function renderSarifReport(findings: Finding[]): string {
  const rulesById = new Map<string, unknown>();

  for (const finding of findings) {
    if (rulesById.has(finding.ruleId)) {
      continue;
    }

    rulesById.set(finding.ruleId, {
      id: finding.ruleId,
      name: finding.ruleId,
      shortDescription: {
        text: finding.title,
      },
      fullDescription: {
        text: finding.message,
      },
      help: {
        text: finding.recommendation,
      },
      properties: {
        severity: finding.severity,
      },
    });
  }

  return `${JSON.stringify(
    {
      version: "2.1.0",
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      runs: [
        {
          tool: {
            driver: {
              name: "oss-safe-release",
              informationUri: "https://github.com/ulverslealiuclaude/oss-safe-release",
              rules: [...rulesById.values()],
            },
          },
          results: findings.map((finding) => ({
            ruleId: finding.ruleId,
            level: LEVEL_BY_SEVERITY[finding.severity],
            message: {
              text: finding.message,
            },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: finding.filePath ?? ".",
                  },
                  region: finding.line === undefined ? undefined : { startLine: finding.line },
                },
              },
            ],
            properties: {
              severity: finding.severity,
            },
          })),
        },
      ],
    },
    null,
    2,
  )}\n`;
}

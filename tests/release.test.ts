import { describe, expect, it } from "vitest";
import { releaseRule } from "../src/rules/release";
import type { RepoContext } from "../src/types";

describe("releaseRule", () => {
  it("flags package publishing in pull request workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/publish.yml",
          content: "on: pull_request\njobs:\n  publish:\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request",
        severity: "critical",
      }),
    );
  });

  it("flags package publishing in pull request target workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/publish.yml",
          content: "on: pull_request_target\njobs:\n  publish:\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request-target",
        severity: "critical",
        filePath: ".github/workflows/publish.yml",
      }),
    );
  });

  it("flags pull request target release workflow calls that inherit secrets", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/pr-release.yml",
          content:
            "on: pull_request_target\njobs:\n  publish:\n    uses: example/project/.github/workflows/release.yml@8ade135a41bc03ea155e62e844d188df1ea18608\n    secrets: inherit\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.pull-request-target-inherits-release-secrets",
        severity: "critical",
        filePath: ".github/workflows/pr-release.yml",
      }),
    );
  });

  it("flags package publishing on unconstrained push workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/publish.yml",
          content: "on: push\njobs:\n  publish:\n    steps:\n      - run: pnpm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-trusted-gate",
        severity: "high",
        filePath: ".github/workflows/publish.yml",
      }),
    );
  });

  it("flags container image publishing in pull request workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/container-publish.yml",
          content: "on: pull_request\njobs:\n  publish:\n    steps:\n      - run: docker push ghcr.io/example/app:latest\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request",
        severity: "critical",
        filePath: ".github/workflows/container-publish.yml",
      }),
    );
  });

  it("flags container image publishing on unconstrained push workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/container-publish.yml",
          content: "on: push\njobs:\n  publish:\n    steps:\n      - run: docker push ghcr.io/example/app:latest\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-trusted-gate",
        severity: "high",
        filePath: ".github/workflows/container-publish.yml",
      }),
    );
  });

  it("flags GHCR publishing without packages write permission", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/container-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\njobs:\n  publish:\n    steps:\n      - run: docker push ghcr.io/example/app:latest\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.ghcr-publish-without-packages-write",
        severity: "medium",
        filePath: ".github/workflows/container-publish.yml",
      }),
    );
  });

  it("does not flag GHCR publishing with packages write permission", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/container-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\n  packages: write\njobs:\n  publish:\n    steps:\n      - run: docker push ghcr.io/example/app:latest\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.ghcr-publish-without-packages-write",
      }),
    );
  });

  it("flags GitHub release creation in pull request workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/github-release.yml",
          content: "on: pull_request\njobs:\n  release:\n    steps:\n      - run: gh release create v1.2.3 dist/app.zip\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request",
        severity: "critical",
        filePath: ".github/workflows/github-release.yml",
      }),
    );
  });

  it("flags GitHub release creation on unconstrained push workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/github-release.yml",
          content: "on: push\njobs:\n  release:\n    steps:\n      - run: gh release create v1.2.3 dist/app.zip\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-trusted-gate",
        severity: "high",
        filePath: ".github/workflows/github-release.yml",
      }),
    );
  });

  it("flags GitHub release creation without contents write permission", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/github-release.yml",
          content:
            "on: release\npermissions:\n  contents: read\njobs:\n  release:\n    steps:\n      - run: gh release create v1.2.3 dist/app.zip\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.github-release-without-contents-write",
        severity: "medium",
        filePath: ".github/workflows/github-release.yml",
      }),
    );
  });

  it("does not flag GitHub release creation with contents write permission", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/github-release.yml",
          content:
            "on: release\npermissions:\n  contents: write\njobs:\n  release:\n    steps:\n      - run: gh release create v1.2.3 dist/app.zip\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.github-release-without-contents-write",
      }),
    );
  });

  it("flags semantic-release in pull request workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/semantic-release.yml",
          content: "on: pull_request\njobs:\n  release:\n    steps:\n      - run: npx semantic-release\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request",
        severity: "critical",
        filePath: ".github/workflows/semantic-release.yml",
      }),
    );
  });

  it("flags semantic-release on unconstrained push workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/semantic-release.yml",
          content: "on: push\njobs:\n  release:\n    steps:\n      - run: npx semantic-release\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-trusted-gate",
        severity: "high",
        filePath: ".github/workflows/semantic-release.yml",
      }),
    );
  });

  it("does not flag semantic-release dry runs as publishing", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/semantic-release.yml",
          content: "on: pull_request\njobs:\n  release:\n    steps:\n      - run: npx semantic-release --dry-run\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request",
      }),
    );
  });

  it("flags release-it in pull request workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/release-it.yml",
          content: "on: pull_request\njobs:\n  release:\n    steps:\n      - run: npx release-it\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request",
        severity: "critical",
        filePath: ".github/workflows/release-it.yml",
      }),
    );
  });

  it("flags Changesets publish on unconstrained push workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/changesets.yml",
          content: "on: push\njobs:\n  release:\n    steps:\n      - run: pnpm changeset publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-trusted-gate",
        severity: "high",
        filePath: ".github/workflows/changesets.yml",
      }),
    );
  });

  it("flags Changesets action publish inputs on unconstrained push workflows", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/changesets-action.yml",
          content:
            "on: push\njobs:\n  release:\n    steps:\n      - uses: changesets/action@8ade135a41bc03ea155e62e844d188df1ea18608\n        with:\n          publish: yarn release\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-trusted-gate",
        severity: "high",
        filePath: ".github/workflows/changesets-action.yml",
      }),
    );
  });

  it("does not flag Changesets action without a publish input", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/changesets-action.yml",
          content:
            "on: push\njobs:\n  release:\n    steps:\n      - uses: changesets/action@8ade135a41bc03ea155e62e844d188df1ea18608\n        with:\n          version: pnpm changeset version\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-trusted-gate",
      }),
    );
  });

  it("does not flag release-it dry runs as publishing", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/release-it.yml",
          content: "on: pull_request\njobs:\n  release:\n    steps:\n      - run: npx release-it --dry-run\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-on-pull-request",
      }),
    );
  });

  it("flags artifact publishing without explicit permissions", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/release.yml",
          content: "on: release\njobs:\n  publish:\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-explicit-permissions",
        severity: "medium",
        filePath: ".github/workflows/release.yml",
      }),
    );
  });

  it("does not flag artifact publishing with explicit permissions", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/release.yml",
          content: "on: release\npermissions:\n  contents: read\n  id-token: write\njobs:\n  publish:\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.publish-without-explicit-permissions",
      }),
    );
  });

  it("flags npm provenance publishing without id-token write permission", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/npm-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\njobs:\n  publish:\n    steps:\n      - run: npm publish --provenance\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.npm-provenance-without-id-token-write",
        severity: "medium",
        filePath: ".github/workflows/npm-publish.yml",
      }),
    );
  });

  it("does not flag npm provenance publishing with id-token write permission", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/npm-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\n  id-token: write\njobs:\n  publish:\n    steps:\n      - run: npm publish --provenance\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.npm-provenance-without-id-token-write",
      }),
    );
  });

  it("flags npm token publishing without a protected environment", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/npm-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\njobs:\n  publish:\n    steps:\n      - run: npm publish\n        env:\n          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.npm-token-without-environment",
        severity: "medium",
        filePath: ".github/workflows/npm-publish.yml",
      }),
    );
  });

  it("does not flag npm token publishing with a protected environment", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/npm-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\njobs:\n  publish:\n    environment: npm-release\n    steps:\n      - run: npm publish\n        env:\n          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.npm-token-without-environment",
      }),
    );
  });

  it("flags npm token references directly inside run commands", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/npm-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\njobs:\n  publish:\n    environment: npm-release\n    steps:\n      - run: npm config set //registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }} && npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.npm-token-in-run-command",
        severity: "medium",
        filePath: ".github/workflows/npm-publish.yml",
      }),
    );
  });

  it("does not flag npm tokens passed through step env", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/npm-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\njobs:\n  publish:\n    environment: npm-release\n    steps:\n      - run: npm publish\n        env:\n          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.npm-token-in-run-command",
      }),
    );
  });

  it("flags PyPI token references directly inside run commands", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/pypi-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\njobs:\n  publish:\n    environment: pypi-release\n    steps:\n      - run: twine upload dist/* -u __token__ -p ${{ secrets.PYPI_API_TOKEN }}\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.pypi-token-in-run-command",
        severity: "medium",
        filePath: ".github/workflows/pypi-publish.yml",
      }),
    );
  });

  it("does not flag PyPI tokens passed through step env", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/pypi-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\njobs:\n  publish:\n    environment: pypi-release\n    steps:\n      - run: twine upload dist/*\n        env:\n          TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.pypi-token-in-run-command",
      }),
    );
  });

  it("flags PyPI trusted publishing without id-token write permission", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/pypi-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\njobs:\n  publish:\n    environment: pypi-release\n    steps:\n      - uses: pypa/gh-action-pypi-publish@8ade135a41bc03ea155e62e844d188df1ea18608\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.pypi-trusted-publishing-without-id-token-write",
        severity: "medium",
        filePath: ".github/workflows/pypi-publish.yml",
      }),
    );
  });

  it("does not flag PyPI trusted publishing with id-token write permission", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/pypi-publish.yml",
          content:
            "on: release\npermissions:\n  contents: read\n  id-token: write\njobs:\n  publish:\n    environment: pypi-release\n    steps:\n      - uses: pypa/gh-action-pypi-publish@8ade135a41bc03ea155e62e844d188df1ea18608\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.pypi-trusted-publishing-without-id-token-write",
      }),
    );
  });

  it("flags manual package publishing without an environment or confirmation input", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/manual-publish.yml",
          content: "on: workflow_dispatch\njobs:\n  publish:\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).toContainEqual(
      expect.objectContaining({
        ruleId: "release.manual-publish-without-approval",
        severity: "medium",
        filePath: ".github/workflows/manual-publish.yml",
      }),
    );
  });

  it("does not flag manual package publishing with a protected environment", () => {
    const context: RepoContext = {
      rootDir: "/repo",
      files: [],
      workflows: [
        {
          path: ".github/workflows/manual-publish.yml",
          content: "on: workflow_dispatch\njobs:\n  publish:\n    environment: npm-release\n    steps:\n      - run: npm publish\n",
          data: {},
        },
      ],
    };

    const findings = releaseRule.run(context);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "release.manual-publish-without-approval",
      }),
    );
  });
});

# CI and Security Automation

## Automated checks

The repository now applies the following automated checks to pull requests and pushes to `main`. The quality workflow uses a locked Node 22 and pnpm installation, has read-only repository permissions, and pins each third-party GitHub Action to a verified commit.

| Workflow            | Trigger                                                               | Controls                                                                                                                               |
| ------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Quality`           | Pull requests, `main` pushes, manual dispatch                         | Changed-file formatting, TypeScript, tests with coverage, production build, complete dependency audit, and a 14-day coverage artifact. |
| `Dependency Review` | Pull requests                                                         | Rejects runtime dependency changes that introduce moderate-or-higher known vulnerabilities.                                            |
| `CodeQL`            | Pull requests, `main` pushes, manual dispatch, weekly Monday schedule | Runs the `security-extended` JavaScript and TypeScript query suite and sends results to GitHub code scanning.                          |
| Dependabot          | Weekly                                                                | Opens limited, reviewable update pull requests for npm packages and GitHub Actions.                                                    |

## Coverage reports

Run `pnpm coverage` locally to produce a terminal summary, `coverage/coverage-summary.json`, and `coverage/lcov.info`. The Quality workflow uploads the entire `coverage/` directory as the `coverage-report` artifact and appends the JSON summary to the workflow run summary. The current suite is intentionally reported without a hard coverage threshold; the report establishes a measurable baseline for future test expansion without blocking existing security work on legacy untested paths.

## Local release gate

Use the following commands before opening a pull request. The formatting command checks only files changed from the configured Git comparison base and safely falls back to local changes when no base is available.

```bash
pnpm format:check
pnpm coverage
pnpm check
pnpm build
pnpm audit --audit-level=moderate
```

## Security audit record

The latest audit found no known vulnerabilities in the complete dependency graph after compatible development-tool updates and transitive patch overrides. A Semgrep scan using OWASP Top Ten and secret-detection rules reported zero blocking findings across all tracked source and workflow files. GitHub Dependabot security updates, secret scanning, and push protection are enabled for the public repository; GitHub did not enable non-provider secret patterns for this repository.

> Automated scanning reduces risk but does not replace secret rotation, code review, least-privilege production configuration, rate limiting, backups, or incident response procedures.

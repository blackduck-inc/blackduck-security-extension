# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Black Duck Security Scan Extension for Azure DevOps - an Azure Pipeline task extension that integrates SAST/SCA into CI/CD pipelines via Bridge CLI. Supports four products:
- **Polaris** - SAST/SCA analysis
- **Black Duck SCA** - Software Composition Analysis
- **Coverity** - Static analysis
- **SRM** - Security Risk Management

## Build Commands

All commands run from `blackduck-security-task/`:

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript → lib/
npm run package      # Bundle with ncc → dist/
npm run lint         # ESLint on src/**/*.ts
npm run format       # Prettier on src/**/*.ts
npm test             # Mocha unit tests with nyc coverage (html + text)
npm run all          # format + lint + build + package + test
npm run integrationTest  # Integration tests (requires separate tsconfig-int-test.json)

# Single test file
npx mocha --require ts-node/register test/unit/blackduck-security-task/<file>.spec.ts
```

## Architecture

### Core Flow (`src/main.ts`)
1. Reads inputs — validates, logs deprecation warnings
2. Downloads or locates Bridge CLI (standard vs airgap mode)
3. Resolves Bridge CLI version from `versions.txt`
4. Builds product-specific JSON input files via `tools-parameter.ts`
5. Executes Bridge CLI, captures exit code
6. Uploads SARIF reports and diagnostics
7. Sets Azure DevOps build status

### Key Source Files (`src/blackduck-security-task/`)
- **`bridge-cli.ts`** — Downloads/validates Bridge CLI; platform-specific paths; retry logic; uses `createSSLConfiguredHttpClient()` from `utility.ts`
- **`tools-parameter.ts`** — Builds Bridge CLI commands; generates `polaris_input.json`, `bd_input.json`, `coverity_input.json`, `srm_input.json`; handles PR comments and Fix PR
- **`input.ts`** — Reads YAML pipeline and Classic Editor inputs; maps deprecated param names with migration warnings
- **`validator.ts`** — Required-field checks per product; validates severities, URLs, paths
- **`azure-service-client.ts`** — ADO API calls for PR comments and Fix PRs
- **`utility.ts`** — Singleton HTTP client (`createSSLConfiguredHttpClient()`); version comparison helpers
- **`proxy-utils.ts`** / **`ssl-utils.ts`** — Proxy from env vars (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`); custom CA cert support
- **`application-constant.ts`** — All string constants and param name keys (no magic strings elsewhere)
- **`enum/ErrorCodes.ts`** / **`enum/BuildStatus.ts`** — Exit code and build result enums
- **`model/`** — TypeScript interfaces per product: `polaris.ts`, `blackduckSCA.ts`, `coverity.ts`, `srm.ts`, `azure.ts`, `reports.ts`

### Key Patterns
- **Dual Input Mode** — YAML pipeline keys (snake_case) and Classic Editor keys (camelCase) both supported; deprecated names trigger `showLogForDeprecatedInputs()` warnings
- **Version-based Behavior** — Bridge CLI 2.0+ uses `integrations/` prefix for SARIF paths; 3.9.0+ changed Coverity PR comment format; handled in `utility.ts` via semver comparisons
- **Airgap Mode** — `ENABLE_NETWORK_AIRGAP=true` skips CLI download; `BRIDGECLI_INSTALL_DIRECTORY` must point to pre-installed CLI
- **Build Status Control** — `MARK_BUILD_STATUS` maps to ADO task result (Succeeded/SucceededWithIssues/Failed) independently of scan findings
- **Singleton HTTP Client** — `createSSLConfiguredHttpClient()` caches client per SSL config hash; invalidated on config change
- **SARIF Upload** — Only for non-PR events; path varies by Bridge CLI version

### Extension Metadata
- **`vss-extension.json`** — ADO extension manifest (version, publisher, contributions)
- **`task.json`** — Task inputs/outputs, execution handler for Azure Pipeline UI
- **`tsconfig.json`** — ES6 target, CommonJS modules, output to `lib/`

## Adding a New Input Parameter
1. Add constant in `application-constant.ts`
2. Read in `input.ts`
3. Update model interface in `model/`
4. Build into command in `tools-parameter.ts`
5. Validate in `validator.ts`
6. Add unit tests in `test/unit/blackduck-security-task/`

## Supporting a New Security Product
1. Create model interface in `src/blackduck-security-task/model/{product}.ts`
2. Add product key constant in `application-constant.ts`
3. Add validator function in `validator.ts`
4. Implement command builder in `tools-parameter.ts`
5. Update `bridge-cli.ts` to include product in command building
6. Add inputs to `task.json` and `vss-extension.json`
7. Add unit tests in `test/unit/blackduck-security-task/`

## Configuration Files

- `tsconfig.json` — TypeScript compiler: ES6 target, CommonJS, output to `lib/`
- `tsconfig-int-test.json` — Separate config for integration test compilation
- `eslint.config.mjs` — ESLint flat config for `src/**/*.ts`
- `package.json` — Scripts, dependencies (azure-pipelines-task-lib, node-fetch, etc.)
- `task.json` — ADO task manifest: inputs, outputs, execution handler for Pipeline UI
- `vss-extension.json` — ADO extension manifest: version, publisher, task contributions

## Azure DevOps Environment Variables

Consumed via `tl.getVariable()` (azure-pipelines-task-lib), defined in `AZURE_ENVIRONMENT_VARIABLES` in `model/azure.ts`:

| Variable | ADO System Variable |
|---|---|
| Collection URI | `System.CollectionUri` |
| Project | `System.TeamProject` |
| Repository | `Build.Repository.Name` |
| Build reason | `Build.Reason` |
| PR number | `System.PullRequest.PullRequestId` |
| PR source branch | `System.PullRequest.SourceBranch` |
| PR target branch | `System.PullRequest.TargetBranch` |
| Temp directory | `Agent.TempDirectory` |

Proxy env vars (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, and lowercase variants) read directly from `process.env` in `proxy-utils.ts`.

## Testing
- Framework: Mocha + Chai + Sinon, transpiled via ts-node
- Coverage: nyc (html + text reporters)
- Integration tests use `tsconfig-int-test.json` and require `npm run integraionTestBuild` first
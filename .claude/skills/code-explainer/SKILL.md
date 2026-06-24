---
name: code-explainer
description: Use when asked to explain how any part of the Black Duck Security Scan ADO extension works — entry flow, product scan setup, Bridge CLI integration, input handling, PR comments, Fix PRs, SARIF upload, airgap mode, proxy/SSL, or version compatibility. Produces a precise, file-linked explanation grounded in the actual source.
---

# Extension Code Explainer

This skill explains how the Black Duck Security Scan Azure DevOps extension works, grounded in the actual source code. It covers end-to-end flow, per-component behavior, and cross-cutting concerns.

## High-Level Architecture

```
Azure Pipeline (task.json / vss-extension.json)
        │
        ▼
  src/main.ts                          ← orchestrator
  ├── input.ts                         ← reads YAML / Classic Editor inputs, maps deprecated keys
  ├── bridge-cli.ts (BridgeCli)
  │   ├── validator.ts                 ← validates required fields per product
  │   ├── tools-parameter.ts           ← builds Bridge CLI command + generates input JSON files
  │   │   ├── model/{product}.ts       ← typed config shape per product
  │   │   ├── model/azure.ts           ← ADO context (repo, branch, PR info via tl.getVariable)
  │   │   └── model/reports.ts         ← SARIF / JSON report settings
  │   ├── [download] bridge-cli-bundle.zip from artifactory  (skipped in airgap mode)
  │   └── executeBridgeCliCommand()    ← spawns Bridge CLI process
  ├── utility.ts                       ← version checks, SARIF path resolution, HTTP client
  ├── proxy-utils.ts / ssl-utils.ts    ← proxy + CA cert config injected into HTTP client
  ├── diagnostics.ts                   ← uploads diagnostics ZIP artifact
  └── azure-service-client.ts          ← ADO API: PR comments, Fix PRs
```

### Component Responsibilities

| Component | Responsibility |
|---|---|
| `main.ts` | Top-level try/finally orchestrator; owns build status and SARIF upload |
| `bridge-cli.ts` | Downloads, extracts, validates, and executes Bridge CLI |
| `tools-parameter.ts` | Generates product-specific JSON input files and assembles `--input` flags |
| `input.ts` | Single source of truth for all task inputs; handles dual-mode and deprecated names |
| `validator.ts` | Per-product required-field checks before command is built |
| `utility.ts` | Singleton HTTP client, semver helpers, SARIF path resolution, source upload validation |
| `azure-service-client.ts` | ADO REST API calls: PR comments, Fix PR creation |
| `diagnostics.ts` | Artifact upload for diagnostics ZIP and SARIF report files |
| `proxy-utils.ts` | Reads `HTTPS_PROXY` / `HTTP_PROXY` / `NO_PROXY` from env |
| `ssl-utils.ts` | Merges custom CA cert with system CAs; supports trust-all mode |

---

## End-to-End Code Flow

```
run() [main.ts]
 │
 ├─ 1. showLogForDeprecatedInputs()          [input.ts]
 │       Logs warnings for any deprecated param names found in inputs
 │
 ├─ 2. bridge.prepareCommand(tempDir)        [bridge-cli.ts → prepareCommand()]
 │       ├─ validateScanTypes()              [validator.ts] — at least one product URL present
 │       ├─ if SCAN_TYPE set (Classic Editor):
 │       │     formatCommandForClassicEditor() → single-product path
 │       └─ else (YAML multi-scan):
 │             preparePolarisCommand()  ──┐
 │             prepareBlackduckCommand()  ├── each calls getFormattedCommandFor{Product}()
 │             prepareCoverityCommand()   │   in tools-parameter.ts which:
 │             prepareSrmCommand()     ──┘     • validates product inputs
 │                                             • populates model/{product}.ts struct
 │                                             • writes {product}_input.json to tempDir
 │                                             • returns "--input /path/to/{product}_input.json"
 │
 ├─ 3. bridge.downloadAndExtractBridgeCli() [bridge-cli.ts]  — skipped if ENABLE_NETWORK_AIRGAP
 │       ├─ getBridgeCliUrl()               — platform-specific URL from artifactory
 │       ├─ getRemoteFile() with retry      — downloads zip
 │       └─ extractZipped()                — extracts to tempDir
 │     OR
 │     bridge.getBridgeCliPath()            — returns BRIDGECLI_INSTALL_DIRECTORY directly
 │
 ├─ 4. getBridgeVersion(bridgePath)         [main.ts]
 │       Reads versions.txt from CLI bundle → semver string
 │
 ├─ 5. util.validateSourceUploadValue()     [utility.ts]
 │       Guards Detect source upload against unsupported Bridge CLI versions
 │
 ├─ 6. util.updateSarifFilePaths()          [utility.ts]
 │       Pre-2.0: root SARIF path  |  2.0+: integrations/ prefix
 │
 ├─ 7. util.updateCoverityConfigForBridgeVersion()  [utility.ts]
 │       Pre-3.9.0: legacy Coverity PR comment format  |  3.9.0+: new format
 │
 ├─ 8. bridge.executeBridgeCliCommand()     [bridge-cli.ts]
 │       Spawns Bridge CLI subprocess with assembled --input flags
 │       Exit code captured; if RETURN_STATUS → emits ##vso[task.setvariable]
 │
 └─ finally (always runs):
       ├─ SARIF upload  (if BLACKDUCKSCA_REPORTS_SARIF_CREATE or POLARIS_REPORTS_SARIF_CREATE)
       │     Only for non-PR events; path chosen by Bridge CLI version
       ├─ Diagnostics upload  (if INCLUDE_DIAGNOSTICS)
       └─ Build status resolution  [main.ts catch → markBuildStatusIfIssuesArePresent()]
             MARK_BUILD_STATUS maps exit code → Succeeded / SucceededWithIssues / Failed
             Exit code 2 (BRIDGE_BREAK_ENABLED) = policy violation → respects MARK_BUILD_STATUS
             All other non-zero codes → always Failed
```

---

## How to Use

When the user asks "how does X work", "walk me through Y", or "explain Z", follow the steps below. Always cite `file:line` references. Never invent behavior — read the source first.

---

## Step 1 — Identify the scope

Map the question to one or more of these areas:

| Area | Key files |
|---|---|
| Entry / orchestration | `src/main.ts` |
| Bridge CLI download & exec | `src/blackduck-security-task/bridge-cli.ts` |
| Input reading & deprecation | `src/blackduck-security-task/input.ts` |
| Product command building | `src/blackduck-security-task/tools-parameter.ts` |
| Validation | `src/blackduck-security-task/validator.ts` |
| Azure DevOps API (PR comments, Fix PRs) | `src/blackduck-security-task/azure-service-client.ts` |
| HTTP client / version utils | `src/blackduck-security-task/utility.ts` |
| Proxy config | `src/blackduck-security-task/proxy-utils.ts` |
| SSL / custom CA | `src/blackduck-security-task/ssl-utils.ts` |
| Diagnostics upload | `src/blackduck-security-task/diagnostics.ts` |
| Product models | `src/blackduck-security-task/model/{polaris,blackduckSCA,coverity,srm,azure,reports}.ts` |
| Constants / param keys | `src/blackduck-security-task/application-constant.ts` |
| Exit codes | `src/blackduck-security-task/enum/ErrorCodes.ts` |
| Build status enum | `src/blackduck-security-task/enum/BuildStatus.ts` |
| ADO env var names | `src/blackduck-security-task/model/azure.ts` → `AZURE_ENVIRONMENT_VARIABLES` |
| Extension manifest | `task.json`, `vss-extension.json` |

---

## Step 2 — Read before answering

Before explaining, read the relevant source files. Do not rely on CLAUDE.md summaries alone for line-level questions.

Key things to check per area:

**Entry flow (`main.ts`)**
- Order of: input validation → Bridge CLI download → version resolution → `tools-parameter` command build → exec → SARIF upload → diagnostics → build status set

**Bridge CLI (`bridge-cli.ts`)**
- Platform detection (Windows/Mac/Linux/ARM) and URL construction
- Version resolution from `versions.txt`
- Airgap branch: when `ENABLE_NETWORK_AIRGAP` is true, download is skipped; `BRIDGECLI_INSTALL_DIRECTORY` used directly
- Retry logic on download failures
- `createSSLConfiguredHttpClient()` used for all HTTP calls

**Input handling (`input.ts`)**
- Dual-mode: YAML pipeline keys (snake_case) vs Classic Editor keys (camelCase)
- Deprecated param fallback chain
- `showLogForDeprecatedInputs()` warning mechanism

**Product command building (`tools-parameter.ts`)**
- JSON input files generated per product: `polaris_input.json`, `bd_input.json`, `coverity_input.json`, `srm_input.json`
- ADO context injected via `tl.getVariable()` calls against `AZURE_ENVIRONMENT_VARIABLES`
- PR comment and Fix PR logic gated on `Build.Reason === "PullRequest"`
- SARIF and JSON report flags per product

**Version compatibility**
- Bridge CLI 2.0+ → SARIF paths use `integrations/` prefix (checked in `utility.ts`)
- Bridge CLI 3.9.0+ → Coverity PR comment format changed
- Bridge CLI 2.5.0+ → assessment mode deprecation warning
- All version comparisons via semver helpers in `utility.ts`

**Proxy & SSL**
- `proxy-utils.ts` reads `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` (and lowercase variants) from `process.env`
- `ssl-utils.ts` merges custom CA cert (`NETWORK_SSL_CERT_FILE`) with system CAs
- `NETWORK_SSL_TRUST_ALL` disables verification (not for production)
- `createSSLConfiguredHttpClient()` in `utility.ts` is a singleton keyed on SSL config hash; invalidated on change

---

## Step 3 — Explain with file:line citations

Structure the explanation as:

1. **What it does** — one sentence
2. **How it works** — step-by-step, each step citing `file:line`
3. **Key conditionals** — version branches, mode flags, fallback chains
4. **Where to look next** — related files if the user wants to go deeper

Keep explanations tight. One sentence per step. If a conditional is version-dependent, name the version threshold explicitly.

---

## Common questions and where to start

| Question | Start here |
|---|---|
| "How does the scan run end-to-end?" | `src/main.ts:1` |
| "How does Bridge CLI get downloaded?" | `bridge-cli.ts` → `downloadBridgeCLI()` |
| "How does airgap mode work?" | `bridge-cli.ts` → airgap branch + `application-constant.ts` → `ENABLE_NETWORK_AIRGAP` |
| "How are PR comments posted?" | `tools-parameter.ts` → PR comment section + `azure-service-client.ts` |
| "How does Fix PR work?" | `tools-parameter.ts` → Fix PR block + `azure-service-client.ts` → `createFixPullRequest()` |
| "How are inputs read / deprecated params handled?" | `input.ts` + `application-constant.ts` |
| "How does SARIF upload work?" | `main.ts` → SARIF upload block + version check in `utility.ts` |
| "How is build status set?" | `main.ts` → final status block + `enum/BuildStatus.ts` + `enum/ErrorCodes.ts` |
| "How does proxy/SSL work?" | `proxy-utils.ts` + `ssl-utils.ts` + `utility.ts` → `createSSLConfiguredHttpClient()` |
| "What ADO variables does the extension use?" | `model/azure.ts` → `AZURE_ENVIRONMENT_VARIABLES` |
| "How does product X get configured?" | `model/{product}.ts` + `tools-parameter.ts` → product section |
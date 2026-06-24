---
name: task-analyzer
description: Use when asked to analyze what changes are needed to implement a new feature in the Black Duck Security Scan ADO extension. Reads the codebase, maps every file that must change, identifies breakage risks, and writes a structured changes.md file with a prioritized change plan and risk table. Trigger on "analyze this feature", "what needs to change for X", "plan this implementation", "impact analysis for X".
---

# Extension Task Analyzer

Analyzes a feature request against the actual codebase, maps the full change surface, and writes `changes.md` to the repo root. Never guess — read source files before mapping changes.

---

## Step 1 — Parse the Feature Request

Extract from the user's request:
- **What** — the capability being added (new product, new param, behavior change, integration, deprecation, etc.)
- **Scope** — which product(s) affected (Polaris, Black Duck SCA, Coverity, SRM, all)
- **Trigger** — YAML input, Classic Editor input, ADO event, Bridge CLI version, environment variable
- **Output** — what changes at runtime (new JSON field sent to Bridge CLI, new ADO artifact, new API call, new pipeline variable)

If any of these is unclear, ask before proceeding.

---

## Step 2 — Read Current State

Before mapping changes, read the relevant source files. Use this dependency map:

```
Feature type                → Read these files first
─────────────────────────────────────────────────────────────────────
New YAML/Classic input      → input.ts, application-constant.ts, task.json
New product                 → model/{closest product}.ts, tools-parameter.ts, validator.ts, bridge-cli.ts
Behavior change in scan     → tools-parameter.ts → getFormattedCommandFor{Product}()
Bridge CLI version gate     → utility.ts → isVersionLess/isVersionGreaterOrEqual, application-constant.ts → VERSION constants
SARIF / report change       → main.ts (finally block), diagnostics.ts, utility.ts → updateSarifFilePaths()
PR comment / Fix PR         → tools-parameter.ts → PR comment block, azure-service-client.ts
ADO API / auth change       → azure-service-client.ts, model/azure.ts
Proxy / SSL change          → proxy-utils.ts, ssl-utils.ts, utility.ts → createSSLConfiguredHttpClient()
Dependency / Node upgrade   → package.json, task.json (execution block), tsconfig.json
Error handling              → enum/ErrorCodes.ts, application-constant.ts → EXIT_CODE_MAP, main.ts → markBuildStatusIfIssuesArePresent()
```

---

## Step 3 — Map the Full Change Surface

For each changed file, determine:
- **Why** it must change (not just "it's related")
- **What specifically** changes (new export, new field, new condition, new entry)
- **Risk level** — see §4

Use this canonical file inventory to check every layer:

### Layer 1 — Constants and Types (always check first)
| File | Change if |
|---|---|
| `application-constant.ts` | New YAML key, Classic Editor key, version threshold, exit code, or message string needed |
| `enum/ErrorCodes.ts` | New error scenario that maps to a distinct exit code |
| `enum/BuildStatus.ts` | New build result mapping (rare) |
| `model/{product}.ts` | New field in product config sent to Bridge CLI |
| `model/azure.ts` | New ADO system variable consumed (`AZURE_ENVIRONMENT_VARIABLES`) |
| `model/reports.ts` | New report format or file path field |
| `model/common.ts` | New shared sub-interface used across products |

### Layer 2 — Input and Validation
| File | Change if |
|---|---|
| `input.ts` | New exported input constant (new YAML or Classic Editor param) |
| `validator.ts` | New required-field check, new allowed-value list, new cross-param validation |

### Layer 3 — Command Building
| File | Change if |
|---|---|
| `tools-parameter.ts` | New field in JSON input file, new `--stage` flag, new PR/Fix PR/SARIF logic, new ADO context field |
| `bridge-cli.ts` | New product stage wired into `prepareCommand()`, new download URL pattern, new version detection |

### Layer 4 — Orchestration and Output
| File | Change if |
|---|---|
| `main.ts` | New SARIF upload block, new diagnostics logic, new pipeline variable emitted, new build status path |
| `diagnostics.ts` | New artifact type uploaded |
| `azure-service-client.ts` | New ADO API call, new auth method, new PR operation |
| `utility.ts` | New version helper, new singleton HTTP client variant, new path resolution |
| `proxy-utils.ts` / `ssl-utils.ts` | New proxy config source, new cert handling |

### Layer 5 — Extension Metadata
| File | Change if |
|---|---|
| `task.json` | New input, new group, new `scanType` option, Node version added, version bump |
| `vss-extension.json` | Extension version bump, new contribution or new task |

### Layer 6 — Tests
| File | Change if |
|---|---|
| `test/unit/blackduck-security-task/{module}.spec.ts` | Any logic change in the corresponding module |

---

## Step 4 — Identify Breakage Risks

For each change, assess against these risk categories:

| Risk ID | Risk | Triggered by |
|---|---|---|
| R1 | **Pipeline breakage** — existing YAML pipelines stop working | Removing/renaming a YAML key, making optional param required, changing validation to reject previously valid values |
| R2 | **Classic Editor breakage** — task UI shows wrong fields or ignores inputs | `task.json` input `name` mismatch with `_KEY_CLASSIC_EDITOR` constant, `visibleRule` change, group removal |
| R3 | **Bridge CLI version breakage** — behavior differs on older Bridge CLI versions | New JSON field added without version gate, behavior assumed universally supported |
| R4 | **Build status breakage** — scan results no longer correctly map to Succeeded/Failed | New exit code not in `EXIT_CODE_MAP`, `MARK_BUILD_STATUS` logic altered |
| R5 | **SARIF path breakage** — SARIF upload fails silently | SARIF path not version-gated (pre-3.5.0 root vs 3.5.0+ `integrations/`) |
| R6 | **Airgap mode breakage** — extension fails when `ENABLE_NETWORK_AIRGAP=true` | New download step added that is not gated behind `!ENABLE_NETWORK_AIRGAP` |
| R7 | **HTTP client bypass** — proxy/SSL config silently ignored | New HTTP call not using `getSharedHttpClient()` / `createSSLConfiguredHttpClient()` |
| R8 | **Credential exposure** | New input containing secrets logged or written outside temp dir |
| R9 | **Test regression** — existing tests break from interface change | Model interface field renamed/removed, `input.ts` export renamed, `validator.ts` return shape changed |
| R10 | **Extension version not bumped** | `task.json` version + `vss-extension.json` version not incremented after interface change |

---

## Step 5 — Write `changes.md`

Write the file to the repo root: `/Users/akibuz/work-items/ADO/blackduck-security-extension/changes.md`

Use this exact structure:

```markdown
# Change Analysis: {Feature Name}

## Summary
{One paragraph: what the feature does, which products it affects, what changes at runtime.}

## Feature Scope
- **Type:** {New product | New parameter | Behavior change | Version gate | Integration | Deprecation | Upgrade}
- **Products affected:** {Polaris | Black Duck SCA | Coverity | SRM | All | N/A}
- **Trigger:** {YAML input | Classic Editor | Bridge CLI version | ADO event | Env var}
- **Runtime output:** {New JSON field to Bridge CLI | New artifact | New ADO variable | New API call}

---

## Files to Change

### Must Change
| File | Change | Risk |
|---|---|---|
| `path/to/file.ts` | Brief description of exact change | R1, R3 |
| ... | ... | ... |

### May Change (conditional on final design)
| File | Change | Condition |
|---|---|---|
| `path/to/file.ts` | Brief description | Only if X |

---

## Breakage Risk Assessment

| Risk ID | Risk | Affected scenario | Mitigation |
|---|---|---|---|
| R1 | Pipeline breakage | Existing YAML pipelines using old key | Keep old key as deprecated fallback |
| R3 | Bridge CLI version | Users on Bridge CLI < X.Y.Z | Gate new behavior behind `isVersionLess()` check |
| ... | ... | ... | ... |

**Overall risk:** {Low | Medium | High}
Reason: {One sentence on the dominant risk factor.}

---

## Implementation Order

Steps in the correct dependency order (later steps depend on earlier):

1. `application-constant.ts` — add constants (all other files import from here)
2. `enum/ErrorCodes.ts` — add new exit code if needed
3. `model/{product}.ts` — add new interface field
4. `input.ts` — export new input constant
5. `validator.ts` — add validation rule
6. `tools-parameter.ts` — consume input, add to JSON builder
7. `bridge-cli.ts` — wire new stage/product if needed
8. `main.ts` — add SARIF/artifact/status logic if needed
9. `task.json` — add Classic Editor input and group
10. `vss-extension.json` — bump extension version
11. `test/unit/...` — add/update tests
12. `npm run all` — verify build, lint, tests pass

---

## Open Questions

{List any decisions that must be made before implementation starts. If none, write "None."}

- [ ] {Decision 1}
- [ ] {Decision 2}
```

---

## Step 6 — Final Checks Before Writing

Verify the `changes.md` draft covers:

- [ ] Every layer (1–6) explicitly checked — no layer skipped silently
- [ ] Every "Must Change" file justified with a specific reason (not "might be related")
- [ ] Every applicable risk ID from §4 assessed — not just the obvious ones
- [ ] Implementation order respects import dependencies (constants before consumers)
- [ ] `task.json` and `vss-extension.json` version bump noted if any user-facing interface changes
- [ ] Open questions list is empty or explicitly listed — no vague "TBD" items

After writing `changes.md`, tell the user the file path and summarize the overall risk level and top 2–3 risks in one sentence.
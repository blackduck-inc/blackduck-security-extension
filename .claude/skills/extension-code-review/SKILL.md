---
name: extension-code-review
description: Use when reviewing changes to the Black Duck Security Scan ADO extension. Checks coding standards, established patterns, and backward compatibility — covering input handling, version-gated behavior, Classic Editor parity, error construction, HTTP client usage, task.json integrity, and test coverage. Flags deviations with file:line citations and prescribes the correct pattern.
---

# Extension Code Review

Reviews diffs or file changes against this codebase's established patterns and backward-compatibility requirements. Always read the actual changed files before producing findings. Never flag style that matches existing code.

---

## How to Use

When the user says "review this", "check my change", or "what did I break", do the following:

1. Read all changed files (`git diff` or user-provided files)
2. Run each checklist section below against the changes
3. Report findings as: `file:line — [SEVERITY] — problem — correct pattern`
4. Severities: `BREAK` (will fail at runtime), `COMPAT` (backward compat risk), `STANDARD` (deviates from project convention), `TEST` (missing or wrong test coverage)

---

## Checklist 1 — Input Handling Standards

**Rule: Every new input must be exported from `input.ts` using the correct helper.**

| Scenario | Correct helper |
|---|---|
| String, URL, token — single Classic Editor key | `getInput(yamlKey, classicEditorKey, deprecatedKey\|null)` |
| Boolean flag | `getBoolInput(yamlKey, classicEditorKey, deprecatedKey\|null)` |
| File or directory path | `getPathInput(yamlKey, classicEditorKey, deprecatedKey\|null)` |
| Shared param across multiple products in Classic Editor | `getInputForMultipleClassicEditor(yamlKey, polarisKey, bdKey, coverityKey, srmKey, deprecated\|null)` |

**Checks:**
- [ ] New input exported from `input.ts` — NOT read inline with `taskLib.getInput()` in `tools-parameter.ts` or `bridge-cli.ts`
- [ ] YAML key constant in `application-constant.ts` follows `{PRODUCT}_{PARAM}_KEY` naming
- [ ] Classic Editor key constant follows `{PRODUCT}_{PARAM}_KEY_CLASSIC_EDITOR` naming (camelCase value)
- [ ] No hardcoded string keys — all keys go through constants
- [ ] `deprecatedKey` is `null` when no deprecation, never omitted or left as empty string
- [ ] `SCAN_TYPE`-gated inputs use `getInputForMultipleClassicEditor` when param is shared across products in Classic Editor

**Common violation:** reading `taskLib.getInput("my_key")` directly instead of exporting from `input.ts`. Breaks the dual-mode contract and skips deprecation tracking.

---

## Checklist 2 — Parameter Deprecation

**Rule: Deprecated keys must route through the `getInput` third-argument mechanism. Never handle deprecation manually.**

- [ ] Deprecated key passed as third arg — NOT checked inline with an `if/else`
- [ ] Old constant kept in `application-constant.ts` — not deleted
- [ ] `showLogForDeprecatedInputs()` is NOT modified — it reads `deprecatedInputs[]` automatically
- [ ] `task.json` Classic Editor entry for old param: still present, `helpMarkDown` updated to note deprecation
- [ ] No hard removal of a YAML key that users may have in existing pipelines

**COMPAT risk:** removing or renaming a YAML key without deprecation silently breaks pipelines that don't get re-run until the next scan.

---

## Checklist 3 — Version-Gated Behavior

**Known version thresholds (from `application-constant.ts`):**

| Threshold | Constant | What changes |
|---|---|---|
| `3.5.0` | `VERSION` | SARIF output path — root dir vs `integrations/` prefix |
| `3.8.0` | `ASSESSMENT_MODE_UNSUPPORTED_BRIDGE_VERSION` | Polaris assessment mode deprecated |
| `3.9.0` | `COVERITY_PRCOMMENT_NEW_FORMAT_VERSION` | Coverity PR comment format |
| `2.1.0` | `MIN_SUPPORTED_BRIDGE_CLI_MAC_ARM_VERSION` | ARM Mac support |
| `3.5.1` | `MIN_SUPPORTED_BRIDGE_CLI_LINUX_ARM_VERSION` | ARM Linux support |

**Checks:**
- [ ] New version-conditional uses `isVersionLess()` or `isVersionGreaterOrEqual()` from `utility.ts` — NOT raw `semver` calls or string comparison
- [ ] Version threshold defined as a named constant in `application-constant.ts` — NOT an inline string literal like `"3.5.0"`
- [ ] Both branches of every version conditional are tested in unit tests
- [ ] New threshold constant name describes the behavioral change, not just a version number
- [ ] SARIF path changes respect `VERSION` constant (pre-`3.5.0` → root dir; `3.5.0`+ → `integrations/` prefix)

**COMPAT risk:** new behavior added without a version gate silently breaks users on older Bridge CLI versions.

---

## Checklist 4 — HTTP Client and Network Usage

**Rule: All HTTP calls use `createSSLConfiguredHttpClient()` or `getSharedHttpClient()` from `utility.ts`. No raw `https.request`, raw `axios`, or `new HttpClient()` calls.**

- [ ] No new `new HttpClient(...)` instantiation — use `getSharedHttpClient(targetUrl?)` instead
- [ ] No raw `https.request()` calls — proxy and SSL config would be bypassed
- [ ] No standalone `axios` calls in production code — `axios` is only for tests
- [ ] Retry logic on download operations uses the `RETRY_COUNT` constant (currently `3`) and `sleep()` from `utility.ts`
- [ ] Non-retryable HTTP codes checked against `NON_RETRY_HTTP_CODES` set — not hardcoded numbers
- [ ] SSL cache not manually mutated — `clearHttpClientCache()` only for tests

**BREAK risk:** bypassing `createSSLConfiguredHttpClient()` means custom CA certs and proxy config are silently ignored for that request.

---

## Checklist 5 — Error Construction

**Rule: All thrown errors append an `ErrorCode` so the caller can map to build status.**

```typescript
// Correct pattern
throw new Error(
  "Human readable message"
    .concat(constants.SPACE)
    .concat(ErrorCode.MY_CODE.toString())
);

// Or via Promise.reject in async context
return Promise.reject(new Error("msg".concat(constants.SPACE).concat(ErrorCode.MY_CODE.toString())));
```

- [ ] Every new `throw new Error(...)` in `validator.ts`, `tools-parameter.ts`, `bridge-cli.ts` appends `.concat(constants.SPACE).concat(ErrorCode.X.toString())`
- [ ] New error type has a corresponding entry in `ErrorCodes.ts` enum
- [ ] New error code added to `EXIT_CODE_MAP` in `application-constant.ts` with a human-readable message
- [ ] No raw `throw new Error("message")` without exit code — `getExitMessage()` in `main.ts` will produce `UNDEFINED_ERROR` for unknown codes
- [ ] `catch (error: any)` — acceptable in `main.ts` catch block only; elsewhere type errors explicitly

---

## Checklist 6 — Logging Standards

**Rule: Internal state → `taskLib.debug()`. User-visible progress → `console.log()`. Errors → `taskLib.error()` (only from `main.ts` catch).**

- [ ] Debug information (variable values, file paths, internal state) uses `taskLib.debug(...)` — not `console.log`
- [ ] Feature flags being enabled (e.g. "Fix PR is enabled") use `console.log`
- [ ] No `console.error()` in production code — errors propagate via thrown exceptions
- [ ] No secrets or tokens logged at any level
- [ ] `taskLib.warning()` used for non-fatal deprecation warnings only (the `showLogForDeprecatedInputs` path handles this already — don't duplicate)

---

## Checklist 7 — `task.json` Integrity

**Rule: Every new YAML input must have a matching Classic Editor entry in `task.json`. Every Classic Editor entry must have a `visibleRule` and a `groupName`.**

- [ ] New input has both a YAML key export in `input.ts` AND a `task.json` entry
- [ ] `task.json` input `name` matches the `*_KEY_CLASSIC_EDITOR` constant value (camelCase)
- [ ] `visibleRule` set to `"scanType = {productKey}"` for product-specific inputs
- [ ] `groupName` references an existing entry in the `groups` array
- [ ] Required inputs have `"required": true`; optional ones `"required": false`
- [ ] Boolean inputs use `"type": "boolean"` — not `"string"` with `"true"/"false"` values
- [ ] File/path inputs use `"type": "filePath"` — not `"string"`
- [ ] `scanType` pickList updated if adding a new product
- [ ] Version numbers in `task.json` (`"Major"`, `"Minor"`, `"Patch"`) bumped appropriately when interface changes

**BREAK risk:** a `task.json` input with a `name` that doesn't match the `_KEY_CLASSIC_EDITOR` constant means Classic Editor users silently get empty values.

---

## Checklist 8 — Model and Type Safety

**Rule: Product config shapes live in `model/{product}.ts`. Use typed `InputData<T>` wrapper. No `any` in model or tools-parameter code.**

- [ ] New product config uses `InputData<MyProduct>` wrapper — `{ data: myProductObject }`
- [ ] Optional fields in model interface marked with `?` — not typed as `string | undefined` without `?`
- [ ] No `as any` casts in `tools-parameter.ts` or model files
- [ ] Shared sub-interfaces (`Network`, `Bridge`, `Reports`, `AzureData`) imported from existing model files — not redefined
- [ ] `AzureData` populated via `getAzureRepoInfo()` — NOT by reading `tl.getVariable()` inline in `getFormattedCommandFor*()`
- [ ] `IS_PR_EVENT` imported from `utility.ts` — not recalculated inline

---

## Checklist 9 — Backward Compatibility: ADO Pipelines

**COMPAT checks that protect users from silent breakage:**

- [ ] No YAML input key renamed without adding the old name as a deprecated fallback
- [ ] No required field made required that was previously optional — existing pipelines won't provide it
- [ ] No change to `validateScanTypes()` that rejects previously valid input combinations
- [ ] No removal of a `task.json` input — use `helpMarkDown` deprecation notice instead
- [ ] No change to `task.json` `groups` `name` field — pipeline YAML referencing the group name breaks
- [ ] Build status behavior unchanged for existing exit codes — `EXIT_CODE_MAP` only extended, not modified
- [ ] `IS_PR_EVENT` detection logic not changed without testing both PR and non-PR pipeline scenarios
- [ ] `MARK_BUILD_STATUS` parameter behavior unchanged — users rely on specific string values (`"Succeeded"`, `"SucceededWithIssues"`, `"Failed"`)

---

## Checklist 10 — Test Coverage

**Rule: Every branch and every new input must be covered.**

- [ ] New `getFormattedCommandFor{Product}()` path has a test verifying the generated JSON shape
- [ ] Missing-required-field path tested and asserts rejection
- [ ] Both branches of any version conditional tested — stub `bridgeVersion` in `utility.ts`
- [ ] `Object.defineProperty(inputs, 'KEY', { value: '' })` reset in `afterEach` for every input set in any test in the context
- [ ] No `sandbox.restore()` missing from `afterEach` — sinon stubs leak across tests
- [ ] Generated JSON files cleaned up with `taskLib.rmRF(filePath)` in `afterEach`
- [ ] New `ErrorCode` tested: assert the error message contains the correct code string
- [ ] Classic Editor path tested separately from YAML path when `getInputForMultipleClassicEditor` is involved

---

## Quick Severity Reference

| Tag | Meaning |
|---|---|
| `BREAK` | Will fail at runtime or silently produce wrong output |
| `COMPAT` | Existing pipelines or Bridge CLI versions may break |
| `STANDARD` | Deviates from project convention; inconsistency risk |
| `TEST` | Missing or incorrect test coverage |
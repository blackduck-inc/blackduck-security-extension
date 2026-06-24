---
name: security-review
description: Use when doing a security review of the Black Duck Security Scan ADO extension. Covers SAST-level checks specific to this codebase — secret/credential logging, command injection, path traversal, TLS bypass, insecure HTTP clients, token leakage in files, proxy credential exposure, input injection into JSON payloads, and ADO pipeline variable security. Produces findings with file:line citations and remediation steps.
---

# Extension Security Review

Security review grounded in this codebase's architecture. Always read changed files before producing findings. Never flag theoretical risks when the code pattern already mitigates them (e.g. `taskLib.exec` with array args is not shell injection).

---

## How to Use

When the user says "security review", "check for vulnerabilities", "SAST review", or invokes this skill, do the following:

1. Read all changed files (or files named by the user)
2. Run all checklists below against the code
3. Report findings as: `file:line — [SEVERITY] — vulnerability — remediation`
4. Severities: `CRITICAL` (exploitable now), `HIGH` (likely exploitable), `MEDIUM` (exploitable under conditions), `LOW` (defense-in-depth / hardening)

---

## Checklist 1 — Secret and Credential Logging

**Context:** Credentials flow through `input.ts` exports (`POLARIS_ACCESS_TOKEN`, `BLACKDUCKSCA_TOKEN`, `COVERITY_USER_PASSWORD`, `SRM_API_KEY`, `AZURE_TOKEN`). These are written into JSON input files and passed to Bridge CLI. Proxy URLs can contain embedded passwords.

**Checks:**
- [ ] No credential input exported from `input.ts` passed to `console.log()`, `taskLib.debug()`, `taskLib.warning()`, or `taskLib.error()`
- [ ] No secret value interpolated into template literals that feed any log call, e.g. `` `token: ${inputs.POLARIS_ACCESS_TOKEN}` ``
- [ ] No `JSON.stringify(fullInputData)` passed to any log function — `fullInputData` contains tokens/passwords
- [ ] `stateFilePath` / `outFilePath` paths only logged, never their contents
- [ ] `proxyConfig.proxyUrl.password` (from `proxy-utils.ts`) not logged — only `proxyUrl.origin` is safe to log
- [ ] `encodedToken` (Base64 in `azure-service-client.ts`) not logged — Base64 is reversible, not encrypted
- [ ] Error objects caught from HTTP calls do not propagate response bodies containing auth headers to user-visible logs

**Remediation pattern:**
```typescript
// Wrong — logs credential
taskLib.debug(`config: ${JSON.stringify(polData)}`);

// Correct — log structure without sensitive fields
taskLib.debug(`Generated input file at: ${stateFilePath}`);
```

---

## Checklist 2 — Credential Exposure in Temporary Files

**Context:** `tools-parameter.ts` writes full product config (including access tokens, passwords) to temp files: `polaris_input.json`, `bd_input.json`, `coverity_input.json`, `srm_input.json`. These live in `Agent.TempDirectory` during pipeline execution.

**Checks:**
- [ ] Temp files written to `Agent.TempDirectory` (via `getTempDir()`) — NOT to workspace dir or a hardcoded path
- [ ] Temp files not written to any path derived from user-controlled input (SSRF/traversal via path)
- [ ] Temp directory cleanup verified — `main.ts` finally block or caller must `rmRF` the temp dir
- [ ] Temp files not uploaded as pipeline artifacts (verify no `uploadArtifact` / `addAttachment` call referencing `*_input.json`)
- [ ] `INCLUDE_DIAGNOSTICS` artifact upload does NOT include `*_input.json` files — only diagnostics ZIP
- [ ] File permissions not explicitly widened (no `chmod 777` or equivalent)

**HIGH risk:** if `Agent.TempDirectory` is shared across pipeline steps, another step could read `polaris_input.json` and exfiltrate the access token before cleanup.

---

## Checklist 3 — Command Injection

**Context:** `executeBridgeCliCommand()` in `bridge-cli.ts` calls `taskLib.exec(executableBridgeCliPath, command, { cwd: workspace })`. `taskLib.exec` with a string `command` arg passes through shell parsing on some platforms. The `command` string is built by concatenating `--stage` and `--input` flags in `tools-parameter.ts`.

**Checks:**
- [ ] `executableBridgeCliPath` is resolved via `path.join()` from a known base — NOT from raw user input
- [ ] No user-supplied string injected directly into `command` without sanitization — product URLs, token values, paths must go into JSON input files, not into the command string
- [ ] File paths embedded in the command string (the `--input` value) are quoted: `'"'.concat(stateFilePath).concat('"')` — verify quote wrapping is present
- [ ] No `eval()`, `new Function()`, `execSync()`, `spawn()` with `shell: true`, or backtick template commands
- [ ] Bridge CLI executable path validated with `taskLib.exist()` before execution — not executed blindly from user-supplied `BRIDGECLI_INSTALL_DIRECTORY`
- [ ] `BRIDGECLI_INSTALL_DIRECTORY` path traversal check: validate the resolved path stays within expected bounds (does not start with `../` after normalize)
- [ ] `cwd: workspace` uses `getWorkSpaceDirectory()` which is from `AGENT_WORKFOLDER` env — not a user input

**Note:** `taskLib.exec(path, string)` on Windows spawns `cmd.exe /D /E:ON /V:OFF /S /C "..."` — a quoted `--input` path containing `&`, `|`, `^` could break out. Ensure input file paths use only alphanumeric + path separators.

---

## Checklist 4 — Path Traversal

**Context:** File paths are constructed in `utility.ts`, `tools-parameter.ts`, and `ssl-utils.ts` using `path.join()` and `path.resolve()`. User-controlled inputs include `BRIDGECLI_INSTALL_DIRECTORY`, `NETWORK_SSL_CERT_FILE`, `COVERITY_INSTALL_DIRECTORY`, SARIF file path inputs.

**Checks:**
- [ ] User-supplied path inputs (`BRIDGECLI_INSTALL_DIRECTORY`, `NETWORK_SSL_CERT_FILE`, `COVERITY_INSTALL_DIRECTORY`) passed through `path.resolve()` or `path.normalize()` before use
- [ ] Resolved path verified to stay within expected base (e.g. agent workspace or temp dir) — check for `..` traversal escaping the allowed tree
- [ ] `NETWORK_SSL_CERT_FILE` read via `fs.readFileSync` in `ssl-utils.ts` — path must be validated to be an existing file, not a directory or special device
- [ ] SARIF file paths (user-overridable via `*_SARIF_FILE_PATH` inputs) resolved relative to workspace — not treated as absolute paths blindly
- [ ] `cleanPath = productInputFilePath.replace(/"/g, "")` in `utility.ts` — verify this sanitization is applied consistently before every `readFileSync`/`writeFileSync` on user-derived paths
- [ ] No `__dirname` or relative path used as base for security-critical file operations

**Remediation pattern:**
```typescript
// Validate user-supplied path stays within allowed base
const resolved = path.resolve(inputs.BRIDGECLI_INSTALL_DIRECTORY);
const allowed = path.resolve(getTempDir());
if (!resolved.startsWith(allowed + path.sep) && resolved !== allowed) {
  throw new Error("Path traversal detected in install directory");
}
```

---

## Checklist 5 — TLS / SSL Security

**Context:** `NETWORK_SSL_TRUST_ALL` disables certificate verification. `NETWORK_SSL_CERT_FILE` loads a custom CA. Both flow through `ssl-utils.ts` into `createSSLConfiguredHttpClient()`.

**Checks:**
- [ ] `NETWORK_SSL_TRUST_ALL=true` does NOT silently default to true — it must be explicitly set; default must be `false`
- [ ] Both `NETWORK_SSL_TRUST_ALL` and `NETWORK_SSL_CERT_FILE` cannot be active simultaneously — mutual exclusion enforced in `prepareCommand()` via `NETWORK_SSL_VALIDATION_ERROR_MESSAGE`; verify this guard is not bypassed
- [ ] `rejectUnauthorized: false` only set when `trustAllCerts === true` — not hardcoded anywhere else
- [ ] Custom CA from `NETWORK_SSL_CERT_FILE` is appended to system CAs (`combinedCAs = [customCA, ...systemCAs]`) — not replacing them entirely
- [ ] No new HTTP request path uses raw `https.request()` or `new http.Agent()` without going through `createSSLConfiguredHttpClient()` — would silently bypass custom CA and trust-all config
- [ ] `NODE_TLS_REJECT_UNAUTHORIZED=0` is never set in the codebase or written to any env

---

## Checklist 6 — Token Handling and Authorization Headers

**Context:** `azure-service-client.ts` uses Basic Auth with Base64-encoded ADO token. Token comes from `AZURE_TOKEN` input, which should be an ADO secret variable.

**Checks:**
- [ ] `Authorization: "Basic " + encodedToken` header only sent over HTTPS endpoints — never HTTP
- [ ] Token not logged at any level (debug, info, warning, error) — Base64 is not encryption
- [ ] `AZURE_TOKEN` consumed from `inputs.AZURE_TOKEN` (which reads `task.json` secret-typed input) — NOT from `process.env` or a hardcoded value
- [ ] No token value included in error messages thrown on HTTP failure — error should reference status code, not headers
- [ ] `Authorization` header not forwarded to non-ADO endpoints (e.g. should not be sent to Bridge CLI download URL)
- [ ] Proxy auth (`proxyPassword` from proxy URL) not included in log output — only proxy host/port logged

---

## Checklist 7 — Input Injection into JSON Payloads

**Context:** User inputs (product URLs, assessment types, branch names, project names) are serialized into `*_input.json` files via `JSON.stringify()`. If input is not sanitized, malicious values could alter the JSON structure or inject unexpected fields consumed by Bridge CLI.

**Checks:**
- [ ] All user string inputs placed into typed model objects (e.g. `PolarisData`, `CoverityData`) before `JSON.stringify()` — typed assignment prevents extra key injection
- [ ] Assessment type values validated against regex `^[a-zA-Z]+$` before use — confirm this check is present for ALL products that accept assessment types, not just Polaris and SRM
- [ ] No user input concatenated directly into a JSON string (manual `"{"key": " + userVal + "}"`) — must use object literals + `JSON.stringify`
- [ ] Failure severity values validated against an allowed list (`BLACKDUCKSCA_FAILURE_SEVERITIES`) before being placed in JSON
- [ ] Branch names, project names, and repository names that come from `tl.getVariable()` treated as untrusted — do not use them in command construction, only in JSON object fields

---

## Checklist 8 — ADO Pipeline Variable Security

**Context:** `##vso[task.setvariable variable=status;isoutput=true]` is used in `main.ts` to emit the exit code as a pipeline variable. ADO variables without `issecret=true` are visible in pipeline logs.

**Checks:**
- [ ] Only non-sensitive data emitted via `##vso[task.setvariable]` — exit code / status string is safe; tokens or passwords must never be emitted this way
- [ ] No new `##vso[task.setvariable]` call emits a value derived from user secrets
- [ ] `##vso[task.setvariable]` for secrets uses `isSecret=true` flag if a secret-derived value must be passed
- [ ] `taskLib.setResult()` message (the build failure reason) does not include credential values — only error codes and human-readable descriptions
- [ ] `getExitMessage()` output only contains exit code and a constant message string — not dynamic user input or token values

---

## Checklist 9 — Dependency and Supply Chain Security

**Checks:**
- [ ] No new dependency added without a pinned exact version in `package.json` (use `"semver": "7.7.3"` not `"^7.7.3"`)
- [ ] No new `devDependency` that ends up in `dist/index.js` (bundled by `@vercel/ncc`) — only runtime deps should be in the bundle
- [ ] `package-lock.json` committed alongside `package.json` after any dependency change
- [ ] `dist/index.js` rebuilt via `npm run package` and committed — running stale `dist/` means new security fixes in source are not deployed
- [ ] No eval-capable packages added (e.g. `vm2`, `eval`, `new Function` wrappers) for untrusted input processing
- [ ] `@vercel/ncc` build does not bundle `.env` files or private keys — verify `dist/` does not contain credential files

---

## Checklist 10 — Error Message Information Disclosure

**Context:** Error messages thrown in `validator.ts`, `bridge-cli.ts`, `tools-parameter.ts` propagate to `main.ts` catch block and are surfaced in `taskLib.error()` and `taskLib.setResult()`, which appear in ADO pipeline logs visible to anyone with pipeline read access.

**Checks:**
- [ ] Error messages reference input parameter names and error codes — NOT actual input values (e.g. "polaris_access_token is missing" is fine; "token abc123 is invalid" is not)
- [ ] HTTP error responses do not include response body in thrown error message if the body could contain server-side stack traces or internal URIs
- [ ] File not found errors reference the parameter name (`NETWORK_SSL_CERT_FILE`) not the resolved file path — resolved paths can reveal internal directory structure
- [ ] No caught exception re-thrown with `JSON.stringify(error)` that might include request headers containing auth tokens
- [ ] Version file parse errors (`getBridgeVersion`) do not expose full file content in the error message

---

## Quick Severity Reference

| Tag | Meaning |
|---|---|
| `CRITICAL` | Direct credential exfiltration or code execution possible |
| `HIGH` | Credential leak to logs or files, TLS bypass enabled by default, path traversal to arbitrary files |
| `MEDIUM` | Conditional exposure (requires specific pipeline config), information disclosure in logs |
| `LOW` | Defense-in-depth hardening; not exploitable on its own but reduces attack surface |

---

## Known Safe Patterns (Do Not Flag)

- `taskLib.exec(exePath, commandString)` — `azure-pipelines-task-lib` escapes args; not raw shell exec
- `Buffer.from(token, "utf8").toString("base64")` — correct Basic Auth encoding; not a vulnerability
- `path.join(tempDir, filename)` for generated JSON files — temp dir is agent-controlled
- `JSON.stringify(typedObject)` where object is constructed from typed model — not vulnerable to prototype pollution injection
- `inputs.NETWORK_SSL_TRUST_ALL` defaulting to `false` — correct secure default
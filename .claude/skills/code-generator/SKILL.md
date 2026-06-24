---
name: code-generator
description: Use when implementing any new task in the Black Duck Security Scan ADO extension — adding a product, adding/deprecating a parameter, adding Classic UI support, writing unit tests, upgrading dependencies, upgrading Node.js version, or any other extension feature work. Produces complete, file-accurate implementation steps grounded in existing patterns.
---

# Extension Code Generator

Produces exact implementation steps for any extension task. Always read existing patterns from source before generating code — never invent structure.

---

## 1. Adding a New Security Product

**Files to touch (in order):**

### 1a. Model — `src/blackduck-security-task/model/{product}.ts`
Create a new file. Model existing products (`polaris.ts`, `blackduckSCA.ts`, `coverity.ts`, `srm.ts`). Top-level interface wraps product-specific data + optional `azure`, `network`, `bridge`, `reports` sub-interfaces.

```typescript
import { AzureData } from "./azure";
import { Network } from "./common";
import { Reports } from "./reports";
import { Bridge } from "./bridge";

export interface MyProduct {
  myproduct: MyProductData;
  azure?: AzureData;
  network?: Network;
  reports?: Reports;
  bridge: Bridge;
}

export interface MyProductData {
  serverUrl: string;
  accesstoken: string;
  // ... product-specific fields
}
```

### 1b. Constants — `src/blackduck-security-task/application-constant.ts`
Add product key + all YAML and Classic Editor key constants:

```typescript
export const MYPRODUCT_KEY = "myproduct";
export const MYPRODUCT_SERVER_URL_KEY = "myproduct_server_url";
export const MYPRODUCT_SERVER_URL_KEY_CLASSIC_EDITOR = "myproductServerUrl";
export const MYPRODUCT_ACCESS_TOKEN_KEY = "myproduct_access_token";
export const MYPRODUCT_ACCESS_TOKEN_KEY_CLASSIC_EDITOR = "myproductAccessToken";
```

### 1c. Inputs — `src/blackduck-security-task/input.ts`
Export constants using the `getInput` / `getBoolInput` / `getPathInput` helpers (third arg is deprecated key or `null`):

```typescript
export const MYPRODUCT_SERVER_URL = getInput(
  constants.MYPRODUCT_SERVER_URL_KEY,
  constants.MYPRODUCT_SERVER_URL_KEY_CLASSIC_EDITOR,
  null
);
export const MYPRODUCT_ACCESS_TOKEN = getInput(
  constants.MYPRODUCT_ACCESS_TOKEN_KEY,
  constants.MYPRODUCT_ACCESS_TOKEN_KEY_CLASSIC_EDITOR,
  null
);
```

### 1d. Validator — `src/blackduck-security-task/validator.ts`
Add `validateMyProductInputs()` mirroring existing validators. Return `string[]` of error messages. Call from `validateScanTypes()` block.

### 1e. Tools Parameter — `src/blackduck-security-task/tools-parameter.ts`
Add `getFormattedCommandForMyProduct(): Promise<string>`. Pattern:
1. Validate via `validateMyProductInputs()`
2. Read ADO context via `this.getAzureRepoInfo()`
3. Construct typed `InputData<MyProduct>` object
4. Write to `{tempDir}/myproduct_input.json` via `fs.writeFileSync`
5. Return `--stage myproduct --input "{filePath}"`

Wire into `prepareCommand()` → add `prepareMyProductCommand()` call in both Classic Editor and YAML paths.

### 1f. Classic Editor — `task.json`
Add a new group and inputs (see §4 below). Add product to the `scanType` pickList options.

### 1g. Extension manifest — `vss-extension.json`
No changes needed unless adding a new task contribution entirely.

### 1h. Tests — `test/unit/blackduck-security-task/`
Add `{product}.spec.ts` and coverage in `tools-parameter.spec.ts` and `validator.spec.ts`. See §6 for test patterns.

---

## 2. Adding a New Parameter to an Existing Product

**Touch these files:**

1. **`application-constant.ts`** — Add YAML key and Classic Editor key constants
2. **`input.ts`** — Export new constant using `getInput` / `getBoolInput` / `getPathInput`
3. **`model/{product}.ts`** — Add field to relevant interface (mark optional with `?` unless always required)
4. **`tools-parameter.ts`** — Read the new input and add to the JSON object in `getFormattedCommandFor{Product}()`
5. **`validator.ts`** — Add to required-field check if mandatory
6. **`task.json`** — Add Classic Editor input entry (see §4)

**Input helper selection:**

| Input type | Helper |
|---|---|
| String / URL / token | `getInput(yamlKey, classicKey, deprecatedKey\|null)` |
| Boolean flag | `getBoolInput(yamlKey, classicKey, deprecatedKey\|null)` |
| File/directory path | `getPathInput(yamlKey, classicKey, deprecatedKey\|null)` |
| Shared across products (YAML only + multi CE key) | `getInputForMultipleClassicEditor(yamlKey, polarisKey, bdKey, coverityKey, srmKey, deprecated\|null)` |

---

## 3. Deprecating a Parameter

**Goal:** old key still works (with warning), new key is the canonical form.

### Step 1 — `application-constant.ts`
Keep the old key constant. Add new key constant:

```typescript
export const MYPRODUCT_NEW_PARAM_KEY = "myproduct_new_param";
export const MYPRODUCT_OLD_PARAM_KEY = "myproduct_old_param"; // keep for deprecation
```

### Step 2 — `input.ts`
Pass old key as third arg to `getInput`:

```typescript
export const MYPRODUCT_NEW_PARAM = getInput(
  constants.MYPRODUCT_NEW_PARAM_KEY,
  constants.MYPRODUCT_NEW_PARAM_KEY_CLASSIC_EDITOR,
  constants.MYPRODUCT_OLD_PARAM_KEY   // ← deprecated key
);
```

`getInputForYMLAndDeprecatedKey()` automatically adds the deprecated key to `deprecatedInputs[]`. `showLogForDeprecatedInputs()` (called from `main.ts`) logs the warning.

### Step 3 — `task.json`
Mark old Classic Editor input as deprecated in `helpMarkDown`. Do not remove it until a major version bump — ADO pipelines referencing it by name will break.

---

## 4. Adding a Parameter to Azure Classic UI (`task.json`)

Every Classic Editor input lives in `task.json` under the `inputs` array. Structure:

```json
{
  "name": "myproductServerUrl",
  "type": "string",
  "label": "Server URL",
  "defaultValue": "",
  "required": true,
  "helpMarkDown": "URL for MyProduct server.",
  "visibleRule": "scanType = myproduct",
  "groupName": "myproductScanOptions"
}
```

**Key rules:**
- `name` = camelCase Classic Editor key (matches `*_KEY_CLASSIC_EDITOR` constant)
- `type` options: `string`, `boolean`, `pickList`, `filePath`
- `visibleRule` = `"scanType = {productKey}"` to show only when that product is selected
- `groupName` must match an entry in the `groups` array

**Adding a group:**
```json
{
  "name": "myproductScanOptions",
  "displayName": "Scan Options",
  "isExpanded": false,
  "visibleRule": "scanType = myproduct"
}
```

Add the group to the `groups` array in `task.json`. Group `visibleRule` controls the entire section collapsing.

**Common groups pattern per product:**
- `{product}ScanOptions` — core credentials and config
- `{product}PREnable` — PR comment options
- `{product}FixPR` — Fix PR options
- `{product}SarifReport` — SARIF report options

---

## 5. Upgrading Dependencies

### Runtime dependency
```bash
cd blackduck-security-task
npm install {package}@{version}
```
Then run `npm run all` to verify build + tests pass.

### Dev dependency
```bash
npm install --save-dev {package}@{version}
```

**After any dependency change:**
- Run `npm run package` — rebuilds `dist/index.js` (what ADO actually runs)
- Commit both `package.json`, `package-lock.json`, and the updated `dist/` directory

**Key runtime deps to know:**

| Package | Purpose |
|---|---|
| `azure-pipelines-task-lib` | `tl.getInput`, `tl.getVariable`, `tl.setResult` |
| `azure-pipelines-tool-lib` | Tool download/cache helpers |
| `axios` | HTTP client base |
| `semver` | Bridge CLI version comparisons |
| `https-proxy-agent` / `http-proxy-agent` | Proxy support |

---

## 6. Upgrading Node.js Version

Three places must be updated together:

### 6a. `package.json` — engines field
```json
"engines": { "node": ">=24.0.0" }
```

### 6b. `package.json` — `@types/node` devDependency
```bash
npm install --save-dev @types/node@{version}
```

### 6c. `task.json` — execution block
Add the new Node version handler. Keep older ones for backward compatibility with agents running older ADO agent versions:

```json
"execution": {
  "Node10":   { "target": "dist/index.js" },
  "Node16":   { "target": "dist/index.js" },
  "Node20_1": { "target": "dist/index.js" },
  "Node24":   { "target": "dist/index.js" }
}
```

ADO picks the highest supported handler the agent can run. All handlers point to the same `dist/index.js`.

---

## 7. Writing Unit Tests

**Framework:** Mocha + Chai + Sinon, transpiled via ts-node.
**Location:** `test/unit/blackduck-security-task/{module}.spec.ts`
**Run:** `npm test` or single file with `npx mocha --require ts-node/register test/unit/blackduck-security-task/{file}.spec.ts`

### Standard test structure

```typescript
import { expect } from "chai";
import * as sinon from "sinon";
import * as inputs from "../../../src/blackduck-security-task/input";
import * as constants from "../../../src/blackduck-security-task/application-constant";
import { BridgeCliToolsParameter } from "../../../src/blackduck-security-task/tools-parameter";
import * as taskLib from "azure-pipelines-task-lib/task";
import * as fs from "fs";
import * as path from "path";

describe("MyProduct command tests", () => {
  context("getFormattedCommandForMyProduct", () => {
    let sandbox: sinon.SinonSandbox;
    let toolsParam: BridgeCliToolsParameter;
    let inputFile: string;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      inputFile = path.join(process.cwd(), "myproduct_input.json");
      toolsParam = new BridgeCliToolsParameter(process.cwd());
    });

    afterEach(() => {
      taskLib.rmRF(inputFile);
      // Reset ALL inputs touched in any test in this context
      Object.defineProperty(inputs, "MYPRODUCT_SERVER_URL", { value: "" });
      Object.defineProperty(inputs, "MYPRODUCT_ACCESS_TOKEN", { value: "" });
      sandbox.restore();
    });

    it("should form correct command with required inputs", async () => {
      Object.defineProperty(inputs, "MYPRODUCT_SERVER_URL", { value: "https://myproduct.example.com" });
      Object.defineProperty(inputs, "MYPRODUCT_ACCESS_TOKEN", { value: "token123" });

      const cmd = await toolsParam.getFormattedCommandForMyProduct();

      const json = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
      expect(json.data.myproduct.serverUrl).to.equal("https://myproduct.example.com");
      expect(json.data.myproduct.accesstoken).to.equal("token123");
      expect(cmd).to.contain("--stage myproduct");
    });

    it("should throw when required inputs missing", async () => {
      Object.defineProperty(inputs, "MYPRODUCT_SERVER_URL", { value: "" });
      Object.defineProperty(inputs, "MYPRODUCT_ACCESS_TOKEN", { value: "" });

      await expect(toolsParam.getFormattedCommandForMyProduct()).to.be.rejectedWith(Error);
    });
  });
});
```

**Key patterns:**
- Use `Object.defineProperty(inputs, 'KEY', { value: '...' })` to override module-level input exports
- Always reset inputs in `afterEach` — stale values bleed between tests and cause false passes
- Use `sandbox.restore()` in `afterEach` for all sinon stubs
- Use `taskLib.rmRF(file)` in `afterEach` to clean up generated JSON files
- Test: happy path, missing-required-field rejection, and any version-conditional branches

---

## 8. Other Implementation Scenarios

### Adding a new error code
1. Add to `src/blackduck-security-task/enum/ErrorCodes.ts`
2. Add to `EXIT_CODE_MAP` in `application-constant.ts` with human-readable message
3. Throw with exit code appended: `throw new Error(message.concat(" ").concat(ErrorCode.MY_CODE.toString()))`

### Adding version-conditional behavior
Utility helpers in `utility.ts`:
- `isVersionLess(version, threshold)` — true if version < threshold
- `isVersionGreaterThanOrEqualTo(version, threshold)` — inverse

Pattern:
```typescript
if (isVersionLess(bridgeVersion, "2.0.0")) {
  // legacy path
} else {
  // new path
}
```
Version thresholds to know: `2.0.0` (SARIF path change), `3.9.0` (Coverity PR comment format), `2.5.0` (assessment mode deprecation).

### Adding SARIF report support to a product
1. Add `reports?: Reports` to the product model interface (already defined in `model/reports.ts`)
2. Read `{PRODUCT}_REPORTS_SARIF_CREATE` and `{PRODUCT}_REPORTS_SARIF_FILE_PATH` inputs
3. Populate `reports.sarif` in the JSON input builder in `tools-parameter.ts`
4. Add SARIF upload block in `main.ts` finally section — mirror existing Polaris/BlackDuck SARIF blocks
5. Version-gate the SARIF file path: pre-2.0 uses root dir, 2.0+ uses `integrations/` prefix

### Adding PR comment support to a product
1. Add `prcomment?: PRComment` to the product model
2. Gate on `IS_PR_EVENT` (from `utility.ts`) and `Build.Reason` ADO variable
3. Call `getAzureRepoInfo()` to populate `AzureData` in the JSON input
4. Wire `azure-service-client.ts` for ADO API calls if custom comment formatting needed

### Adding Fix PR support to a product
1. Add `fixpr` sub-object to product model (see `PolarisFixPrData` / `BlackDuckFixPr` for shape)
2. Require `AZURE_TOKEN` input when Fix PR is enabled
3. Call `createFixPullRequest()` in `azure-service-client.ts` (or add new method if product has different payload)

### Updating the extension version
1. Bump `version` in `vss-extension.json` (semver, e.g. `"2.8.2"`)
2. Bump `version` object in `task.json` (`"Major"`, `"Minor"`, `"Patch"` fields)
3. Update `extension_version.txt` in repo root if present
4. Run `npm run all` from `blackduck-security-task/` to rebuild and test
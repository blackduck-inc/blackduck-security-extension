# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Black Duck Security Scan Extension for Azure DevOps - an Azure Pipeline task extension that enables security scanning for multiple Black Duck products (Polaris, Black Duck SCA, Coverity, SRM) via Bridge CLI integration.

The extension acts as a wrapper that downloads Bridge CLI, configures product-specific parameters, executes scans, and processes results including SARIF report generation and Azure DevOps integration.

## Build and Development Commands

### Main Development Tasks
```bash
# Navigate to task directory first
cd blackduck-security-task

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run linting
npm run lint

# Format code
npm run format

# Package for distribution (creates dist bundle)
npm run package

# Run unit tests with coverage
npm test

# Run all checks (format, lint, build, package, test)
npm run all
```

### Testing
```bash
# Unit tests (with coverage reports in html and text)
npm test

# Integration tests
npm run integrationTest
```

### Single Test Execution
```bash
# Run a specific test file
npx mocha --require ts-node/register test/unit/blackduck-security-task/<test-file>.spec.ts
```

## Architecture

### Core Flow
1. **Entry Point** (`src/main.ts`): Orchestrates the scan workflow
   - Validates inputs and shows deprecation warnings
   - Downloads or locates Bridge CLI based on network mode (airgap or connected)
   - Determines Bridge CLI version from `versions.txt` file
   - Prepares product-specific command with input JSON files
   - Executes Bridge CLI command
   - Handles SARIF report upload and diagnostics
   - Manages build status based on scan results

2. **Bridge CLI Management** (`bridge-cli.ts`):
   - Downloads Bridge CLI from Black Duck artifactory based on platform (Windows/Mac/Linux)
   - Supports versioned and latest downloads with retry logic
   - Extracts to install directory
   - Handles airgap mode (skips download, uses pre-installed CLI)
   - Validates Bridge CLI executables and versions
   - Uses `createSSLConfiguredHttpClient()` from `utility.ts` for API operations with SSL/proxy support

3. **Input Processing** (`input.ts`):
   - Handles dual input modes: YAML pipeline and Classic Editor
   - Supports deprecated parameter names with migration warnings
   - Provides fallback logic for missing application/project names

4. **Tools Parameter Builder** (`tools-parameter.ts`):
   - Creates product-specific JSON input files (`polaris_input.json`, `bd_input.json`, `coverity_input.json`, `srm_input.json`)
   - Populates Azure-specific context (repository, branch, PR info)
   - Handles PR comment and Fix PR features for Black Duck SCA
   - Configures network settings, proxy, and SSL options
   - Manages report generation settings (SARIF, JSON)

5. **Validation** (`validator.ts`):
   - Validates required parameters per scan type
   - Verifies Bridge CLI URL matches OS platform
   - Validates Coverity install directory paths
   - Checks Black Duck failure severity configurations

6. **Azure Integration** (`azure-service-client.ts`):
   - Posts PR comments with security findings
   - Creates Fix PRs for Black Duck SCA vulnerabilities
   - Manages Azure DevOps authentication and API calls

7. **Proxy and SSL Configuration** (`proxy-utils.ts`, `ssl-utils.ts`):
   - `proxy-utils.ts`: Handles HTTP/HTTPS proxy configuration from environment variables, supports NO_PROXY
   - `ssl-utils.ts`: Manages SSL certificate configuration including custom CA certificates
   - Both utilities integrate to provide secure proxy connections with custom SSL certificates
   - `utility.ts` provides singleton HTTP clients via `createSSLConfiguredHttpClient()` for API operations

### Product Support Models
Located in `src/blackduck-security-task/model/`:
- **polaris.ts**: Polaris SAST/SCA configuration (application, project, assessment types/modes, branch, test coverage)
- **blackduckSCA.ts**: Black Duck SCA with Detect configuration, failure severities, Fix PR data
- **coverity.ts**: Coverity Connect configuration (user, stream, project, policy, install directory)
- **srm.ts**: Software Risk Manager configuration
- **reports.ts**: SARIF and JSON report settings
- **azure.ts**: Azure DevOps context data (build reason, PR info, repository details)

### Key Architectural Patterns
- **Version-based Path Resolution**: Bridge CLI 2.0+ uses different directory structures (`integrations/` prefix) - handled in `utility.ts` with version comparisons
- **Backward Compatibility**: Coverity configuration adapts based on Bridge CLI version (pre-2.0 vs 2.0+, pre-3.9.0 vs 3.9.0+ for PR comments)
- **Error Code System**: Exit codes mapped in `ErrorCodes.ts` enum for standardized error handling
- **Network Modes**:
  - Standard: Downloads Bridge CLI from artifactory
  - Airgap: Uses pre-installed Bridge CLI at specified directory
- **Build Status Control**: `MARK_BUILD_STATUS` parameter determines task result (Succeeded/SucceededWithIssues/Failed) independent of scan findings
- **Dual Input Mode**: Supports both YAML pipelines and Classic Editor with parameter name mapping and deprecation warnings
- **Singleton HTTP Clients**: `createSSLConfiguredHttpClient()` in `utility.ts` uses singleton pattern with cache invalidation based on SSL configuration hash

### Extension Metadata
- **vss-extension.json**: Defines Azure DevOps extension manifest (version, publisher, task contributions)
- **task.json**: Defines task inputs/outputs, execution handler, categories visible in Azure Pipeline UI

## Important Notes

### Bridge CLI Version Handling
- Version 2.0+ introduced breaking changes in directory structure
- Version 3.9.0+ introduced new Coverity PR comment format
- Version detection from `versions.txt` file is critical for correct path resolution
- SARIF file paths, Coverity config, and Detect source upload behavior all vary by version
- Assessment mode deprecation warning shown for Bridge CLI 2.5.0+

### Input Parameter Migration
The extension supports both new and deprecated parameter names. When deprecated parameters are used, migration warnings are logged via `showLogForDeprecatedInputs()`.

### Network Airgap Mode
When `ENABLE_NETWORK_AIRGAP` is true:
- Bridge CLI download is skipped
- `BRIDGECLI_INSTALL_DIRECTORY` must point to pre-installed Bridge CLI
- Version validation still occurs from the install directory

### SARIF Report Generation
- Only uploaded as artifacts for non-PR events
- Path varies based on Bridge CLI version (pre-2.0 vs 2.0+)
- Controlled by product-specific flags: `BLACKDUCKSCA_REPORTS_SARIF_CREATE`, `POLARIS_REPORTS_SARIF_CREATE`

### Proxy and SSL Support
- Proxy configuration read from standard environment variables: `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`
- Custom CA certificates supported via `NETWORK_SSL_CERT_FILE` task parameter
- Custom CAs are combined with system CAs for proper certificate chain validation
- SSL verification can be disabled via `NETWORK_SSL_TRUST_ALL` (not recommended for production)
- HTTP client singleton pattern with cache invalidation ensures configuration changes are applied

### Testing Approach
- Unit tests use Mocha/Chai/Sinon with ts-node
- Coverage reporting via nyc
- Integration tests require separate tsconfig (`tsconfig-int-test.json`)

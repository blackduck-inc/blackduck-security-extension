# Reference for blackduck-security-extension Repository

## Overview
This repository provides the **Black Duck Security Scan Extension for Azure DevOps**. It enables integration of Black Duck security testing into Azure DevOps pipelines, leveraging the Bridge CLI to run tests for several Black Duck products (Polaris, Black Duck SCA, Coverity) from the command line.

## Key Features
- Integrates Black Duck security scanning into Azure DevOps pipelines.
- Supports multiple Black Duck products via Bridge CLI.
- Provides migration instructions from the old Synopsys Security Scan extension.
- Offers detailed documentation links for setup and configuration.

## Directory Structure (Partial)
- `README.md`: Main documentation and usage instructions.
- `src/blackduck-security-task/`: TypeScript source code for the Azure DevOps extension.
- `lib/blackduck-security-task/`: Compiled JavaScript output.
- `test/unit/`: Unit tests for the extension.
- `images/`: Icons and images for the extension.
- `vss-extension.json`: Azure DevOps extension manifest.

## Main Components
- **input.ts**: Handles input retrieval and processing for the extension tasks.
- **application-constant.ts**: Stores constants used throughout the extension.
- **bridge-cli.ts**: Manages interactions with the Bridge CLI.
- **azure-service-client.ts**: Handles Azure DevOps service connections.
- **validator.ts**: Input and configuration validation logic.
- **model/**: TypeScript models for various Black Duck products and data structures.

## Usage
1. Configure Azure DevOps as per [Azure Prerequisites](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_azure-prerequisites.html).
2. Install and configure the extension for your Black Duck product:
   - [Polaris](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_azure-with-polaris.html)
   - [Black Duck SCA](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_azure-with-blackduck.html)
   - [Coverity](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_azure-with-coverity.html)
3. For advanced configuration, see [Additional Azure Configuration](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_additional-azure-parameters.html).
4. Alternatively, use Bridge CLI directly ([Bridge CLI docs](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_overview.html)).

## Migration
If migrating from the old Synopsys Security Scan extension, follow the [migration instructions](https://community.blackduck.com/s/article/integrations-black-duck-migration-instructions).

## License
See `LICENSE` file for details.

## Internal Code Structure and Flow

### Main Flow
- The extension is implemented in TypeScript under `src/blackduck-security-task/`.
- The entry point is typically `main.ts`, which orchestrates the scan process.
- Input parameters are defined in `task.json` and accessed via `input.ts` using helper functions that support both YAML and classic editor keys, as well as deprecated keys for backward compatibility.
- The scan type (Polaris, Black Duck SCA, Coverity, SRM) determines which set of parameters and logic paths are used.
- The extension downloads and configures the Bridge CLI, then executes it with the appropriate arguments for the selected scan type.
- Results and diagnostics are handled and optionally uploaded as build artifacts.

### Key Parameters (from `task.json`)
- **bridgeCliDownloadUrl, bridgeCliDownloadVersion, bridgeCliInstallDirectory, networkAirgap**: Control Bridge CLI download and setup.
- **scanType**: Selects the product (Polaris, Black Duck SCA, Coverity, SRM).
- **[product]ServerUrl, [product]AccessToken, [product]ProjectDirectory, [product]MarkBuildStatus, [product]AzureToken, [product]IncludeDiagnostics, [product]WaitForScan**: Core parameters for each product.
- **Tool-specific options**: e.g., build/clean commands, config paths, additional arguments, SARIF report options, PR comment options, Fix PR options, etc.

### Input Handling
- `input.ts` provides robust input retrieval, supporting YAML/classic/deprecated keys, boolean and path inputs, delimited lists, and logs deprecated usage.
- Inputs are validated in `validator.ts` before execution.

### Bridge CLI Management
- `bridge-cli.ts` manages download, extraction, versioning, and execution of the Bridge CLI.
- Handles platform-specific paths and error handling.

### Azure DevOps Integration
- `azure-service-client.ts` manages Azure DevOps API calls, e.g., for PR comments or artifact uploads.

### Validation
- `validator.ts` checks for required parameters, validates URLs, and ensures correct configuration for each scan type.

### Models
- `model/` contains TypeScript interfaces and types for product-specific data (e.g., polaris, blackduckSCA, coverity, azure, etc.).

### Testing
- Unit tests are located under `test/unit/` (structure inferred from workspace, not all files visible).
- Tests likely cover input handling, validation, and main scan flows.

## Adding Features
- Add new parameters to `task.json` and handle them in `input.ts`.
- Update validation logic in `validator.ts` as needed.
- Extend `bridge-cli.ts` for new CLI features or scan types.
- Add/modify models in `model/` for new data structures.
- Update or add tests in `test/unit/` to cover new logic.

## Useful References
- See `README.md` for user-facing setup and migration instructions.
- See [Black Duck Bridge CLI documentation](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_overview.html) for CLI usage.
- See [Azure DevOps Task documentation schema](https://raw.githubusercontent.com/Microsoft/azure-pipelines-task-lib/master/tasks.schema.json) for task.json structure.

---
**This section provides a technical overview for future contributors and agents.**

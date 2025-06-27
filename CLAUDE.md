# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a TypeScript-based Azure DevOps extension that provides security scanning capabilities for multiple Black Duck security platforms including Polaris (SAST/SCA), Black Duck SCA, Coverity, and Software Risk Manager (SRM). The extension integrates with Azure Pipelines and leverages the Bridge CLI as the core execution engine.

## Development Commands

All development commands must be run from the `blackduck-security-task/` directory:

```bash
cd blackduck-security-task

# Install dependencies
npm ci

# Development workflow
npm run all  # format, lint, build, package, test

# Individual commands
npm run build        # TypeScript compilation to lib/
npm run package      # Create distribution bundle with ncc
npm test            # Unit tests with Mocha/Chai and NYC coverage
npm run integrationTest # Integration tests (requires build first)
npm run lint         # ESLint
npm run format       # Prettier formatting

# Run specific test file
npx mocha test/unit/main.spec.ts --require ts-node/register
```

## Architecture Overview

### Core Components

**Main Entry Point (`src/main.ts`)**: Orchestrates the security scanning workflow:
1. Input validation and environment setup
2. Bridge CLI download/installation management 
3. Command preparation for selected security tools
4. Bridge CLI execution
5. Post-scan artifact handling (SARIF reports, diagnostics, PR comments)

**Bridge CLI Management (`src/blackduck-security-task/bridge-cli.ts`)**: Handles Bridge CLI lifecycle:
- Version management and platform-specific downloads
- Multi-platform support (Windows, macOS Intel/ARM, Linux Intel/ARM)
- Air-gapped environment support
- Command execution with proper error handling

**Tools Parameter Builder (`src/blackduck-security-task/tools-parameter.ts`)**: Transforms Azure DevOps task inputs into Bridge CLI command parameters for each security platform

**Input Processing (`src/blackduck-security-task/input.ts`)**: Centralizes all task input parameter definitions and parsing

**Validation Layer (`src/blackduck-security-task/validator.ts`)**: Validates inputs for each security tool before execution

### Security Platform Integration

The extension supports four security platforms with consistent parameter patterns:

- **Polaris**: Full SAST/SCA platform (`polaris_*` parameters)
- **Black Duck SCA**: Software composition analysis (`blackducksca_*` parameters) 
- **Coverity**: Static analysis platform (`coverity_*` parameters)
- **SRM**: Software risk management (`srm_*` parameters)

### Model Architecture (`src/blackduck-security-task/model/`)

- **Platform Models**: Type-safe configuration objects for each security platform
- **Azure Integration**: Azure DevOps API integration for PR comments, artifact upload
- **Input Data**: Structured input parameter management
- **Reports**: SARIF report generation and artifact handling

### Extension Configuration

**Azure DevOps Task Definition (`task.json`)**: Defines the Azure Pipelines task interface with:
- Dynamic UI groups based on selected security platform
- Input validation rules and dependencies
- Conditional field visibility
- Multi-platform execution support (Node 10/16)

**Extension Manifest (`vss-extension.json`)**: Azure DevOps marketplace extension definition

## Testing Strategy

- **Unit Tests**: Located in `test/unit/` using Mocha/Chai with Sinon for mocking
- **Integration Tests**: Full Bridge CLI integration tests with real binaries
- **Coverage Requirements**: Tests use NYC for coverage reporting
- **Test Execution**: TypeScript tests run via ts-node/register

## Key Development Patterns

### Input Parameter Management
- All inputs centralized in `input.ts` with consistent naming conventions
- Platform-specific validation in `validator.ts`
- Dynamic parameter building in `tools-parameter.ts`

### Error Handling
- Structured error codes in `enum/ErrorCodes.ts`
- Error messages with context in `application-constant.ts`
- Build status control based on scan results

### Azure DevOps Integration
- Azure Pipelines Task Library for native integration
- Artifact upload for SARIF reports and diagnostics
- PR comment integration via Azure APIs
- Environment variable detection for pipeline context

### Multi-Platform Support
- Platform-specific Bridge CLI binary management
- ARM64 support with fallback to Intel binaries
- Air-gapped environment detection and handling

## File Structure Patterns

- `src/main.ts` - Main entry point and workflow orchestration
- `src/blackduck-security-task/` - Core task implementation
  - `bridge-cli.ts` - Bridge CLI management
  - `tools-parameter.ts` - Command building logic
  - `input.ts` - Input parameter definitions
  - `validator.ts` - Input validation logic
  - `model/` - TypeScript interfaces and data models
  - `enum/` - Enumerations and constants
- `test/unit/` - Unit test files mirroring src structure
- `lib/` - Compiled JavaScript output
- `dist/` - Packaged distribution bundle

## Extension Distribution

The extension uses `@vercel/ncc` to create a single-file distribution bundle that includes all dependencies, making it suitable for Azure DevOps marketplace distribution.
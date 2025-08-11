# CLAUDE.md - Black Duck Azure DevOps Security Extension

This file provides comprehensive guidance to Claude Code when working with the Black Duck Azure DevOps security extension. This is a TypeScript-based Azure DevOps task that integrates Bridge CLI to provide security scanning capabilities within Azure Pipelines.

## Project Overview

### What is this Azure DevOps Extension?
This Azure DevOps extension provides a unified interface for running Black Duck security scans within Azure Pipelines. It leverages Bridge CLI as the underlying orchestration tool to execute various security scanning tools (Polaris, Coverity, Black Duck SCA, Software Risk Manager) and upload results to Azure DevOps security dashboard.

### Key Capabilities
- **Azure Pipelines Integration**: Native integration with Azure Pipelines task library
- **Artifact Management**: Azure-specific artifact handling via Azure APIs
- **Build Results Integration**: Integration with Azure DevOps build results
- **Multi-Tool Support**: Support for Polaris, Coverity, Black Duck SCA, and Software Risk Manager
- **Enterprise Error Handling**: Comprehensive error code system with 38+ specific codes
- **VSIX Package**: Marketplace-ready Azure DevOps extension

## Architecture

### Design Patterns
- **Azure Pipelines Task Library**: Native Azure DevOps task integration
- **Enterprise Error Handling**: Structured error codes with numeric categorization
- **Artifact Management**: Azure API-based artifact handling
- **SSL Configuration**: Comprehensive SSL certificate support

### Key Components
- **Bridge CLI Integration**: Downloads, installs, and executes Bridge CLI
- **Azure Service Client**: Handles Azure DevOps API interactions
- **SSL Configuration**: Comprehensive SSL certificate handling
- **Error Code System**: 38+ specific error codes for precise error handling
- **Diagnostics System**: Comprehensive diagnostic data collection

## Development Environment

### Prerequisites
- **Node.js**: v20.x
- **npm**: Latest version
- **TypeScript**: ES6 target with CommonJS modules
- **Mocha + Chai**: Testing framework with nyc coverage reporting

### Key Dependencies
- `azure-pipelines-task-lib` v4.13.0 - Task integration
- `azure-pipelines-tool-lib` v2.0.7 - Tool management
- `vss-web-extension-sdk` v5.141.0 - Extension development
- `typed-rest-client` - HTTP operations

### Development Commands
```bash
cd blackduck-security-extension/blackduck-security-task

# Install dependencies
npm ci

# Development workflow (runs all tasks)
npm run all  # format, lint, build, package, test

# Individual commands
npm run build        # TypeScript compilation
npm run package      # Create distribution bundle
npm test            # Unit tests with Mocha/Chai
npm run integrationTest # Integration tests
npm run lint         # ESLint
npm run format       # Prettier formatting

# Debug specific functionality
npm test -- --grep "SSL configuration"
npm test -- --grep "Bridge CLI"
```

## Bridge CLI Integration

### Installation and Management
The task automatically downloads and installs Bridge CLI from:
- **Primary**: https://repo.blackduck.com/
- **Legacy**: sig-repo.synopsys.com (deprecated)

### Configuration Parameters
- `bridgecli_install_directory` / `BRIDGECLI_INSTALL_DIRECTORY` - Installation path
- `bridgecli_download_url` / `BRIDGECLI_DOWNLOAD_URL` - Custom download URL  
- `bridgecli_download_version` / `BRIDGECLI_DOWNLOAD_VERSION` - Specific version

### Air-Gapped Environment Support
- `network_airgap` / `BRIDGE_NETWORK_AIRGAP` - Enable air-gapped mode
- Bridge CLI must be pre-installed when air-gapped mode is enabled

## Security Tool Configuration

### Polaris (SAST/SCA)
**Required Parameters:**
- `BRIDGE_POLARIS_SERVER_URL` - Polaris server URL
- `BRIDGE_POLARIS_ACCESS_TOKEN` - Authentication token
- `BRIDGE_POLARIS_ASSESSMENT_TYPES` - Assessment types (SAST, SCA, or both)

**Optional Parameters:**
- `BRIDGE_POLARIS_APPLICATION_NAME` - Application name (defaults to repository name)
- `BRIDGE_POLARIS_PROJECT_NAME` - Project name (defaults to repository name)
- `BRIDGE_POLARIS_BRANCH_NAME` - Branch name for analysis

### Coverity Connect (SAST)
**Required Parameters:**
- `BRIDGE_COVERITY_URL` - Coverity server URL
- `BRIDGE_COVERITY_USER` - Username for authentication
- `BRIDGE_COVERITY_PASSPHRASE` - Password for authentication

**Optional Parameters:**
- `BRIDGE_COVERITY_PROJECT_NAME` - Project name (defaults to repository name)
- `BRIDGE_COVERITY_STREAM_NAME` - Stream name for analysis
- `coverity_build_command` - Build command for compilation
- `coverity_clean_command` - Clean command before build

### Black Duck SCA
**Required Parameters:**
- `BRIDGE_BLACKDUCKSCA_URL` - Black Duck server URL
- `BRIDGE_BLACKDUCKSCA_TOKEN` - API token for authentication

**Optional Parameters:**
- `BRIDGE_BLACKDUCKSCA_SCAN_FULL` - Full scan vs rapid scan
- `BRIDGE_BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES` - Severities that fail the build
- `detect_search_depth` - Search depth in source directory

### Software Risk Manager (SRM)
**Required Parameters:**
- `BRIDGE_SRM_URL` - SRM server URL
- `BRIDGE_SRM_APIKEY` - API key for authentication
- `BRIDGE_SRM_ASSESSMENT_TYPES` - Assessment types to run

## Azure DevOps Integration Features

### Build Results Integration
- **Build Status Control**: Configurable build failure behavior
- **Task Results**: Integration with Azure DevOps task results
- **Pipeline Status**: Pipeline status propagation based on security findings

### Artifact Management
- **Azure Artifacts**: Native Azure DevOps artifact handling
- **Diagnostic Uploads**: Comprehensive diagnostic artifact uploads
- **Report Storage**: Security report storage in Azure artifacts

### Azure API Integration
- **Personal Access Tokens**: Azure DevOps PAT authentication
- **Enterprise Support**: Azure DevOps Server and Cloud support
- **API Rate Limiting**: Intelligent rate limiting and retry logic

## Error Handling Architecture

### Comprehensive Error Code System (38+ Codes)
The extension includes a comprehensive error code system for precise error identification:

```typescript
enum ErrorCodes {
  // Bridge CLI errors (1000-1099)
  BRIDGE_CLI_DOWNLOAD_FAILED = 1001,
  BRIDGE_CLI_INSTALLATION_FAILED = 1002,
  BRIDGE_CLI_EXECUTION_FAILED = 1003,
  
  // Authentication errors (1100-1199)  
  AUTHENTICATION_FAILED = 1101,
  TOKEN_EXPIRED = 1102,
  INVALID_CREDENTIALS = 1103,
  
  // Configuration errors (1200-1299)
  INVALID_CONFIGURATION = 1201,
  MISSING_REQUIRED_PARAMETER = 1202,
  PARAMETER_VALIDATION_FAILED = 1203,
  
  // Network errors (1300-1399)
  NETWORK_CONNECTION_FAILED = 1301,
  SSL_CERTIFICATE_ERROR = 1302,
  PROXY_CONFIGURATION_ERROR = 1303
}
```

### Error Handling Patterns
- **Structured Error Messages**: Numeric codes with descriptive messages
- **Build Status Control**: `MARK_BUILD_STATUS` parameter controls build failure
- **Retry Logic**: Exponential backoff for transient failures
- **Comprehensive Logging**: Detailed error context collection

## SSL Configuration Architecture

### SSL Parameters
- `NETWORK_SSL_TRUST_ALL` - Boolean flag to disable SSL verification
- `NETWORK_SSL_CERT_FILE` - Path to custom CA certificate file (PEM format)

### Implementation Features
- **Centralized Configuration**: Shared SSL utility functions
- **Custom CA Support**: Combine custom certificates with system certificates  
- **Debug Logging**: Comprehensive SSL configuration logging
- **Graceful Fallback**: Fallback to disabled SSL with warnings

### HTTP Client Optimization
- **Singleton Pattern**: Single HTTP client instance per SSL configuration
- **Smart Caching**: Configuration change detection with hash-based invalidation
- **Connection Reuse**: Better HTTP performance through connection pooling

## Testing Strategy

### Unit Testing with Mocha + Chai
- **Mocha Framework**: BDD-style testing with comprehensive coverage
- **Chai Assertions**: Expressive assertion library
- **nyc Coverage**: Istanbul-based code coverage reporting
- **Mocking Strategy**: Extensive mocking of external dependencies

### Integration Testing
- **Bridge CLI Integration**: E2E tests with actual Bridge CLI binaries
- **Azure API Testing**: Contract tests for Azure DevOps API interactions
- **SSL Testing**: Real SSL certificate and connection testing

### Test Organization
```
test/
└── unit/
    └── blackduck-security-task/
        ├── validator.spec.ts
        ├── ssl-utils.spec.ts
        ├── azure-service-client.spec.ts
        ├── bridge-cli.spec.ts
        ├── diagnostics.spec.ts
        └── tools-parameter.spec.ts
```

## File Structure and Key Components

### Source Code Structure
```
src/
├── main.ts                          # Entry point
└── blackduck-security-task/
    ├── application-constant.ts       # Application constants
    ├── azure-service-client.ts       # Azure API client
    ├── bridge-cli.ts                # Bridge CLI management
    ├── diagnostics.ts               # Diagnostic collection
    ├── download-tool.ts             # Tool download utilities
    ├── input.ts                     # Input parameter handling
    ├── ssl-utils.ts                 # SSL configuration
    ├── utility.ts                   # General utilities
    ├── validator.ts                 # Parameter validation
    ├── tools-parameter.ts           # Tool parameter generation
    ├── enum/
    │   ├── BuildStatus.ts           # Build status enumeration
    │   └── ErrorCodes.ts           # Error code definitions
    └── model/
        ├── input-data.ts            # Input data models
        ├── azure.ts                 # Azure-specific models
        ├── blackduckSCA.ts         # Black Duck SCA models
        ├── polaris.ts              # Polaris models
        ├── coverity.ts             # Coverity models
        ├── srm.ts                  # SRM models
        └── reports.ts              # Report models
```

### Key Utility Functions
```typescript
// SSL configuration and HTTP client management
createSSLConfiguredHttpClient(userAgent?: string): HttpClient
getSharedHttpClient(): HttpClient
clearHttpClientCache(): void

// Azure service integration
uploadArtifact(artifactName: string, filePath: string): Promise<void>
updateBuildResult(result: BuildResult): Promise<void>

// Bridge CLI management
downloadBridgeCli(): Promise<string>
executeBridgeCommand(command: string): Promise<void>

// Diagnostics
collectDiagnostics(): Promise<DiagnosticsData>
uploadDiagnostics(diagnostics: DiagnosticsData): Promise<void>
```

## Performance Optimization

### Caching Strategy
- **Bridge CLI Caching**: Tool cache for Bridge CLI binaries
- **HTTP Client Caching**: Singleton HTTP clients with configuration-based caching
- **SSL Configuration**: Cached SSL configuration to avoid repeated processing
- **Azure API Caching**: Intelligent caching of Azure API responses

### Memory Management
- **Efficient Object Creation**: Minimize object instantiation overhead
- **Connection Pooling**: Reuse HTTP connections for better performance
- **Resource Cleanup**: Proper cleanup of temporary files and resources
- **Garbage Collection**: Explicit cleanup of large objects

## Security Best Practices

### Credential Management
- **Azure PAT**: Secure handling of Azure DevOps Personal Access Tokens
- **Secret Masking**: Automatic masking of sensitive information in logs
- **Transient Fields**: Sensitive data marked as transient
- **Token Scopes**: Minimal required permissions for Azure tokens

### SSL Security
- **Certificate Validation**: Proper SSL certificate validation
- **Custom CA Support**: Support for custom certificate authorities
- **Security Warnings**: Warnings when SSL verification is disabled

## Debugging and Diagnostics

### Debug Output
- **Verbose Logging**: Comprehensive debug information when enabled
- **SSL Debug**: Detailed SSL configuration and connection information
- **HTTP Client Debug**: HTTP client reuse and configuration logging
- **Bridge CLI Debug**: Bridge CLI execution and parameter logging
- **Azure API Debug**: Azure DevOps API interaction details

### Diagnostic Collection System
The extension includes a comprehensive diagnostic collection system:

```typescript
interface DiagnosticsData {
  environment: EnvironmentInfo
  configuration: ConfigurationState
  bridgeCli: BridgeCliInfo
  network: NetworkInfo
  azure: AzureInfo
  errors: ErrorContext[]
}
```

### Diagnostic Features
- **Environment Information**: System and runtime environment details
- **Configuration Dump**: Complete configuration state (with secrets masked)
- **Network Diagnostics**: Network connectivity and SSL configuration
- **Azure API Diagnostics**: Azure DevOps API interaction details
- **Error Context**: Comprehensive error context collection

## Extension Packaging and Distribution

### VSIX Packaging
- **vss-extension.json**: Extension manifest with task definitions
- **Extension Version**: Managed through `extension_version.txt`
- **Marketplace Publishing**: Azure DevOps Marketplace distribution

### Build Configuration
- **TypeScript Compilation**: ES6 target with CommonJS modules
- **Webpack Bundling**: Optimized bundle for distribution
- **Asset Management**: Icon and documentation packaging

## Common Development Tasks

### Adding New Security Tool Support
1. Create model in `model/` directory for the new tool
2. Add validation logic in `validator.ts`
3. Update Bridge CLI parameter generation in `tools-parameter.ts`
4. Add comprehensive unit tests
5. Update task.json with new input parameters

### Extending Azure Integration
1. Update Azure service client in `azure-service-client.ts`
2. Add new Azure API interactions
3. Update artifact management logic
4. Test with Azure DevOps Server and Cloud

### SSL Configuration Updates
1. Update SSL utility functions in `ssl-utils.ts`
2. Update HTTP client caching logic in `utility.ts`
3. Add comprehensive SSL testing
4. Update debug logging

### Error Code Management
1. Add new error codes to `ErrorCodes.ts` enum
2. Update error handling in relevant modules
3. Add error code documentation
4. Update error handling tests

## Troubleshooting Guide

### Common Issues and Solutions

#### Bridge CLI Download Failures (Error Code 1001)
- Check network connectivity and repository access
- Verify `bridgecli_download_url` parameter if using custom URL
- Check proxy configuration and SSL certificates
- Review Azure agent permissions

#### Authentication Issues (Error Codes 1101-1103)
- Verify Azure DevOps Personal Access Token has required permissions
- Check token scope for build and artifact permissions
- Ensure token is not expired
- Validate Azure DevOps organization access

#### SSL Certificate Problems (Error Code 1302)
- Use `NETWORK_SSL_CERT_FILE` for custom CA certificates
- Enable `NETWORK_SSL_TRUST_ALL` for testing (not recommended for production)
- Check SSL debug logs for certificate validation details
- Validate corporate proxy SSL handling

#### Build Status Issues
- Check `MARK_BUILD_STATUS` parameter configuration
- Verify task permissions for build result updates
- Review Azure DevOps build result API limitations

### Debug Information Collection
When reporting issues, collect:
- Azure Pipelines build logs with debug enabled
- Environment variables (with secrets masked)
- SSL configuration and certificate details
- Bridge CLI version and execution logs
- Azure DevOps API response details
- Diagnostic artifacts from the extension

## Future Development Considerations

### Architecture Evolution
- Maintain comprehensive error code system
- Keep SSL configuration centralized and reusable
- Preserve singleton HTTP client pattern for performance
- Expand diagnostic collection capabilities

### New Feature Integration
- Follow established architectural patterns
- Add comprehensive unit and integration tests  
- Update parameter validation and error handling
- Maintain backward compatibility with existing pipelines

### Maintenance Strategy
- Regular dependency updates with security scanning
- Monitor Azure DevOps API changes and deprecations
- Update Bridge CLI compatibility as new versions are released
- Maintain VSIX packaging and marketplace distribution
- Update error code documentation and troubleshooting guides

This Azure DevOps extension provides a robust, enterprise-grade foundation for Black Duck security scanning within Azure Pipelines, with comprehensive error handling, performance optimization, and security best practices specifically designed for Azure DevOps environments.
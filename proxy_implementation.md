# Proxy Implementation Documentation

## Overview

The Black Duck Security Scan extension supports HTTP/HTTPS proxy configuration with custom SSL certificate handling. This implementation allows the extension to work in corporate environments with proxy servers and custom certificate authorities.

## Architecture

The proxy implementation consists of three main components:

### 1. SSL Configuration (`ssl-utils.ts`)

**Purpose**: Manages SSL certificate configuration including custom CA certificates.

**Key Functions**:
- `getSSLConfig()`: Reads SSL configuration from task inputs
  - Returns `trustAllCerts: true` when `NETWORK_SSL_TRUST_ALL` is enabled
  - Loads custom CA certificate from `NETWORK_SSL_CERT_FILE` if specified
  - Combines custom CA with system CAs for proper certificate chain validation

- `createHTTPSAgent(sslConfig)`: Creates HTTPS agent with SSL configuration
  - Disables SSL verification if `trustAllCerts` is true
  - Uses combined CAs (system + custom) for SSL verification

- `getSSLConfigHash()`: Returns hash of current SSL configuration for cache invalidation

**Configuration**:
```typescript
interface SSLConfig {
  trustAllCerts: boolean;
  customCA?: string;           // Custom CA certificate content
  combinedCAs?: string[];      // System CAs + Custom CA
}
```

### 2. Proxy Configuration (`proxy-utils.ts`)

**Purpose**: Handles HTTP/HTTPS proxy configuration from environment variables.

**Key Functions**:
- `getProxyConfig(targetUrl)`: Determines proxy configuration for a target URL
  - Checks `NO_PROXY`/`no_proxy` environment variable first (takes priority)
  - Reads proxy URL from `HTTPS_PROXY`/`https_proxy` or `HTTP_PROXY`/`http_proxy`
  - Supports bypass patterns in `NO_PROXY` (wildcards, domains, subdomains)

- `shouldBypassProxy(targetUrl, noProxy)`: Checks if URL should bypass proxy
  - Supports wildcard patterns: `*.example.com`, `*example.com`
  - Supports domain patterns: `.example.com` (matches subdomains)
  - Supports exact matches: `example.com`

- `createProxyAgent(url, sslConfig)`: Creates appropriate proxy agent
  - Returns `HttpsProxyAgent` for HTTPS connections
  - Returns `HttpProxyAgent` for HTTP connections
  - Integrates SSL configuration for secure proxy connections
  - Returns `undefined` if proxy should not be used

**Environment Variables**:
- `HTTPS_PROXY` / `https_proxy`: HTTPS proxy server URL
- `HTTP_PROXY` / `http_proxy`: HTTP proxy server URL
- `NO_PROXY` / `no_proxy`: Comma-separated list of hosts to bypass proxy

**NO_PROXY Pattern Examples**:
```
*.example.com     # Matches example.com and all subdomains
*example.com      # Matches any host ending with example.com
.example.com      # Matches subdomains of example.com
example.com       # Matches example.com and its subdomains
localhost         # Matches localhost
127.0.0.1         # Matches specific IP
```

### 3. HTTP Client Factory (`utility.ts`)

**Purpose**: Provides singleton HTTP clients with SSL and proxy configuration.

The implementation uses **two different approaches** for proxy and SSL integration based on the use case:

#### Approach 1: typed-rest-client HttpClient (for API operations)

**Function**: `createSSLConfiguredHttpClient(userAgent)`

Creates an `HttpClient` instance from typed-rest-client for structured API operations (Azure DevOps API calls, etc.).

- **Singleton Pattern**: Caches client instance, invalidated when SSL configuration changes
- **Configuration Hash**: Uses `getSSLConfigHash()` to detect configuration changes
- **SSL Support**:
  - Disables SSL verification if `NETWORK_SSL_TRUST_ALL` is true
  - Uses custom CA certificate from `NETWORK_SSL_CERT_FILE`
  - **Limitation**: typed-rest-client cannot combine system CAs + custom CA (only uses custom CA when specified)
- **Proxy Support**:
  - **Automatic detection** from environment variables (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`)
  - typed-rest-client has built-in proxy handling - no explicit proxy agent configuration needed
  - Proxy configuration is transparent to the caller
- **Retry Support**: Built-in retry logic (max 3 retries when configured)

**Usage**:
```typescript
// Proxy is automatically detected from environment variables
const httpClient = createSSLConfiguredHttpClient("BlackDuckSecurityTask");
const response = await httpClient.get(url);
```

**Current Implementation**:
```typescript
export function createSSLConfiguredHttpClient(
  userAgent = "BlackDuckSecurityTask"
): HttpClient {
  const currentConfigHash = getSSLConfigHash();

  // Return cached client if configuration unchanged
  if (_httpClientCache && _httpClientConfigHash === currentConfigHash) {
    return _httpClientCache;
  }

  const sslConfig = getSSLConfig();

  if (sslConfig.trustAllCerts) {
    _httpClientCache = new HttpClient(userAgent, [], { ignoreSslError: true });
  } else if (sslConfig.customCA) {
    _httpClientCache = new HttpClient(userAgent, [], {
      allowRetries: true,
      maxRetries: 3,
      cert: { caFile: inputs.NETWORK_SSL_CERT_FILE }
    });
  } else {
    _httpClientCache = new HttpClient(userAgent);
  }

  // typed-rest-client automatically handles proxy from environment variables
  // No explicit proxy agent configuration needed

  _httpClientConfigHash = currentConfigHash;
  return _httpClientCache;
}
```

#### Approach 2: Direct HTTPS Agent (for file downloads and metadata fetching)

**Function**: `createSSLConfiguredHttpsAgent()`

Creates an `https.Agent` for direct HTTPS operations like Bridge CLI downloads and metadata fetching.

- **Singleton Pattern**: Caches agent instance, invalidated when SSL configuration changes
- **Configuration Hash**: Uses `getSSLConfigHash()` to detect configuration changes
- **SSL Support**:
  - **Properly combines system CAs with custom CA certificates** (solves typed-rest-client limitation)
  - Disables SSL verification if `NETWORK_SSL_TRUST_ALL` is true
  - This is the preferred approach when custom CAs need to work alongside system CAs
- **Proxy Support**:
  - **Explicit integration** required via `createProxyAgent()` from `proxy-utils.ts`
  - Proxy agent must be manually created and applied to requests
  - Provides fine-grained control over proxy behavior

**Usage**:
```typescript
// For direct HTTPS requests with explicit proxy control
const sslConfig = getSSLConfig();
const httpsAgent = createSSLConfiguredHttpsAgent();
const proxyAgent = createProxyAgent(url, sslConfig);

// Use proxy agent if available, otherwise use HTTPS agent
const agent = proxyAgent || httpsAgent;

const requestOptions = {
  agent: agent,
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || 443,
  path: parsedUrl.pathname,
  method: 'GET'
};

const request = https.request(requestOptions, callback);
```

#### `getSharedHttpClient()`
Convenience wrapper for `createSSLConfiguredHttpClient()` with default user agent.

#### `clearHttpClientCache()`
Clears both HTTPS agent and HTTP client caches. Useful for testing.

## Integration Points

### Use Case 1: Bridge CLI Metadata Fetching (`bridge-cli.ts`)

**Approach**: Direct HTTPS with explicit proxy integration (Approach 2)

The `BridgeCli` class uses direct HTTPS requests for fetching Bridge CLI metadata to properly combine custom CAs with system CAs:

```typescript
private async fetchWithDirectHTTPS(
  fetchUrl: string,
  headers: Record<string, string> = {}
): Promise<string> {
  const sslConfig = getSSLConfig();
  const shouldUseDirectHTTPS =
    sslConfig.trustAllCerts || (sslConfig.customCA && sslConfig.combinedCAs);

  if (shouldUseDirectHTTPS) {
    taskLib.debug("Using direct HTTPS with enhanced SSL and proxy support");

    const parsedUrl = new URL(fetchUrl);
    const requestOptions = createHTTPSRequestOptions(parsedUrl, sslConfig, headers);

    // Explicitly integrate proxy agent
    const proxyAgent = createProxyAgent(fetchUrl, sslConfig);
    if (proxyAgent) {
      requestOptions.agent = proxyAgent;
      taskLib.debug("Using proxy for Bridge CLI metadata fetch");
    }

    return await new Promise<string>((resolve, reject) => {
      const request = https.request(requestOptions, (response) => {
        // Handle response...
      });
      request.end();
    });
  } else {
    // Fallback to typed-rest-client for standard scenarios
    taskLib.debug("Using typed-rest-client (automatic proxy detection)");
    const httpClient = getSharedHttpClient();
    const response = await httpClient.get(fetchUrl, headers);
    return await response.readBody();
  }
}
```

**Why Direct HTTPS?**
- Needs to combine custom CA with system CAs (typed-rest-client limitation)
- Requires explicit proxy control for custom SSL configurations
- Used for critical operations like version detection

**Key Operations**:
- `getAllAvailableBridgeCliVersions()`: Fetches available versions from artifactory
- `getBridgeCliVersionFromLatestURL()`: Reads latest version from versions.txt

### Use Case 2: File Downloads (`download-tool.ts`)

**Approach**: Direct HTTPS with HTTPS agent (Approach 2)

Bridge CLI file downloads use the HTTPS agent with SSL configuration:

```typescript
const httpsAgent = createSSLConfiguredHttpsAgent();
// Proxy integration would be added here if needed for downloads
```

**Current State**: Uses HTTPS agent for SSL, proxy support can be added via `createProxyAgent()`

### Use Case 3: Azure DevOps API Calls (`azure-service-client.ts`)

**Approach**: typed-rest-client with automatic proxy detection (Approach 1)

Azure DevOps API operations use the typed-rest-client HTTP client:

```typescript
const httpClient = getSharedHttpClient();
// Automatically handles proxy from environment variables (HTTPS_PROXY, HTTP_PROXY, NO_PROXY)
// No explicit proxy configuration needed
```

**Why typed-rest-client?**
- Structured API operations with typed responses
- Built-in retry logic
- Automatic proxy detection from environment
- Acceptable for scenarios without custom CA requirements

## Configuration

### Task Input Parameters

These parameters are defined in `task.json` and read via `input.ts`:

- **`NETWORK_SSL_CERT_FILE`**: Path to custom CA certificate file (PEM format)
- **`NETWORK_SSL_TRUST_ALL`**: Boolean to disable SSL verification (not recommended for production)

### Environment Variables

Standard proxy environment variables (automatically detected):

- **`HTTPS_PROXY`** / **`https_proxy`**: HTTPS proxy server URL
- **`HTTP_PROXY`** / **`http_proxy`**: HTTP proxy server URL
- **`NO_PROXY`** / **`no_proxy`**: Comma-separated bypass list

## Design Patterns

### Singleton Pattern with Cache Invalidation

Both HTTP client and HTTPS agent use singleton pattern to reuse connections:

```typescript
let _httpClientCache: HttpClient | null = null;
let _httpClientConfigHash: string | null = null;
let _httpsAgentCache: https.Agent | null = null;
let _httpsAgentConfigHash: string | null = null;

export function createSSLConfiguredHttpClient(
  userAgent = "BlackDuckSecurityTask"
): HttpClient {
  const currentConfigHash = getSSLConfigHash();

  // Reuse cached client if configuration unchanged
  if (_httpClientCache && _httpClientConfigHash === currentConfigHash) {
    taskLib.debug("Reusing existing HttpClient instance");
    return _httpClientCache;
  }

  // Create new client and cache it
  const sslConfig = getSSLConfig();

  if (sslConfig.trustAllCerts) {
    _httpClientCache = new HttpClient(userAgent, [], { ignoreSslError: true });
  } else if (sslConfig.customCA) {
    _httpClientCache = new HttpClient(userAgent, [], {
      cert: { caFile: inputs.NETWORK_SSL_CERT_FILE }
    });
  } else {
    _httpClientCache = new HttpClient(userAgent);
  }

  // typed-rest-client handles proxy automatically from environment

  _httpClientConfigHash = currentConfigHash;
  return _httpClientCache;
}

export function createSSLConfiguredHttpsAgent(): https.Agent {
  const currentConfigHash = getSSLConfigHash();

  // Reuse cached agent if configuration unchanged
  if (_httpsAgentCache && _httpsAgentConfigHash === currentConfigHash) {
    taskLib.debug("Reusing existing HTTPS agent instance");
    return _httpsAgentCache;
  }

  // Create new agent and cache it
  const sslConfig = getSSLConfig();
  _httpsAgentCache = createHTTPSAgent(sslConfig);
  _httpsAgentConfigHash = currentConfigHash;

  return _httpsAgentCache;
}
```

**Benefits**:
- Connection reuse improves performance
- Automatic cache invalidation when SSL configuration changes
- Prevents stale configuration issues
- Separate caching for HttpClient vs HTTPS Agent

### Dual Proxy Integration Strategy

The codebase uses two different proxy integration approaches based on requirements:

#### Strategy 1: Implicit Proxy (typed-rest-client)
**When to Use**: API operations, standard HTTP requests without custom CA requirements

**How it Works**:
- typed-rest-client's `HttpClient` automatically detects proxy from environment variables
- No explicit proxy configuration code required
- Transparent to the caller

**Example**:
```typescript
const httpClient = getSharedHttpClient();
const response = await httpClient.get(url);
// Proxy automatically applied if HTTPS_PROXY is set
```

#### Strategy 2: Explicit Proxy (direct HTTPS)
**When to Use**: File downloads, metadata fetching, scenarios requiring custom CA + system CA combination

**How it Works**:
- Manually create proxy agent via `createProxyAgent(url, sslConfig)`
- Explicitly assign to request options
- Full control over proxy behavior

**Example**:
```typescript
const sslConfig = getSSLConfig();
const proxyAgent = createProxyAgent(url, sslConfig);
const requestOptions = {
  agent: proxyAgent || createSSLConfiguredHttpsAgent(),
  // ... other options
};
const request = https.request(requestOptions, callback);
```

### Fallback Strategy

The Bridge CLI implementation uses a conditional approach:

1. **Primary**: Direct HTTPS with explicit SSL+proxy integration
   - Used when: Custom CA configured OR trust all certs enabled
   - Benefits: Proper CA combination, explicit proxy control

2. **Fallback**: typed-rest-client with automatic proxy detection
   - Used when: Standard system CAs sufficient
   - Benefits: Simpler code, built-in retry logic

This ensures compatibility while supporting advanced SSL scenarios.

## Limitations and Architectural Decisions

### typed-rest-client Limitations

The typed-rest-client library has important limitations that influence our architecture:

1. **Cannot combine system CAs + custom CA**:
   - When using `cert.caFile`, only the custom CA is used for verification
   - System CAs are ignored, which can break certificate chains
   - **Workaround**: Use direct HTTPS with `https.Agent` which properly combines CAs via `tls.rootCertificates`

2. **No explicit proxy agent support**:
   - typed-rest-client uses its own internal proxy handling
   - Cannot inject custom proxy agent with specific SSL configuration
   - Relies on environment variable detection (`HTTPS_PROXY`, `HTTP_PROXY`)
   - **Impact**: We use implicit proxy detection for typed-rest-client operations

3. **Architectural Decision**:
   - **Use typed-rest-client** (`createSSLConfiguredHttpClient`) for:
     - Azure DevOps API operations
     - Standard scenarios without custom CA requirements
     - Benefits: Simpler code, automatic proxy detection, built-in retry

   - **Use direct HTTPS** (`createSSLConfiguredHttpsAgent` + `createProxyAgent`) for:
     - Bridge CLI metadata fetching with custom CAs
     - Scenarios requiring system CA + custom CA combination
     - Operations needing explicit proxy control
     - Benefits: Proper CA combination, fine-grained proxy control

### Proxy Integration Approaches

The codebase intentionally uses **two different proxy integration patterns**:

#### Pattern 1: Implicit (typed-rest-client)
```typescript
// Proxy automatically detected from environment - no code changes needed
const httpClient = createSSLConfiguredHttpClient();
const response = await httpClient.get(url);
```

**Characteristics**:
- Zero explicit proxy configuration in code
- typed-rest-client handles proxy internally
- Relies on standard environment variables
- Suitable for most API operations

#### Pattern 2: Explicit (direct HTTPS)
```typescript
// Proxy explicitly created and integrated
const sslConfig = getSSLConfig();
const proxyAgent = createProxyAgent(url, sslConfig);
const requestOptions = { agent: proxyAgent || httpsAgent };
const request = https.request(requestOptions, callback);
```

**Characteristics**:
- Explicit proxy agent creation
- Full control over proxy behavior
- Integrates with custom SSL configuration
- Required when combining custom CA + proxy

### Proxy Agent Version Compatibility

The proxy agent libraries support multiple versions:
- Compatible with http-proxy-agent v5/v6 (two params) and v7+ (options object)
- The implementation uses options object format for forward compatibility
- Both `HttpProxyAgent` and `HttpsProxyAgent` are supported

## Testing Considerations

### Mocking

When writing tests, the singleton pattern requires proper cleanup:

```typescript
import { clearHttpClientCache } from './utility';

afterEach(() => {
  clearHttpClientCache();
});
```

### Environment Detection

SSL configuration automatically detects test environments and returns minimal configuration to preserve mocks:

```typescript
if (process.env.NODE_ENV === "test" || process.env.npm_lifecycle_event === "test") {
  return { trustAllCerts: false }; // Minimal config to avoid interfering with mocks
}
```

## Security Considerations

### SSL Verification

- **Default**: SSL verification is ENABLED with system CAs
- **Custom CA**: Adds custom CA to system CAs (verification still enabled)
- **Trust All**: Disables verification (use only for development/testing)

### Proxy Authentication

Current implementation supports:
- Basic proxy authentication via URL: `http://user:pass@proxy:8080`
- Proxy credentials in environment variable URL

### Certificate Validation

Custom CA certificates:
- Must be in PEM format
- Are combined with system CAs (not replaced)
- Support full certificate chain validation

## Troubleshooting

### Debug Logging

Enable debug output to see proxy and SSL configuration:

```bash
# Azure DevOps variable
SYSTEM_DEBUG=true
```

Debug messages include:
- Proxy detection and bypass decisions
- SSL configuration (custom CA loaded, trust all enabled)
- HTTP client cache hits/misses

### Common Issues

1. **Proxy not being used**:
   - Check `HTTPS_PROXY`/`HTTP_PROXY` environment variables
   - Verify target URL not in `NO_PROXY`
   - Check debug logs for proxy detection

2. **SSL certificate errors**:
   - Verify `NETWORK_SSL_CERT_FILE` path is correct
   - Ensure certificate file is in PEM format
   - Check certificate includes full chain if needed

3. **Cache not invalidating**:
   - SSL configuration hash should change when settings change
   - Use `clearHttpClientCache()` to force refresh

## Future Enhancements

Potential improvements:
- Support for proxy authentication credentials as separate task inputs
- Support for client certificates (mutual TLS)
- Proxy auto-configuration (PAC file support)
- Enhanced proxy authentication methods (NTLM, Kerberos)

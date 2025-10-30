# Proxy Implementation Changes

## Summary

Enhanced `createSSLConfiguredHttpClient()` to support explicit proxy configuration with URL-aware proxy detection, making proxy handling consistent with the direct HTTPS approach used in `downloadWithCustomSSL()`.

## Changes Made

### 1. Enhanced `createSSLConfiguredHttpClient()` in `utility.ts`

**Previous Signature:**
```typescript
export function createSSLConfiguredHttpClient(
  userAgent = "BlackDuckSecurityTask"
): HttpClient
```

**New Signature:**
```typescript
export function createSSLConfiguredHttpClient(
  userAgent = "BlackDuckSecurityTask",
  targetUrl?: string
): HttpClient
```

**Key Enhancements:**

1. **URL-Aware Proxy Configuration**:
   - When `targetUrl` is provided, uses `getProxyConfig(targetUrl)` from `proxy-utils.ts`
   - Properly handles NO_PROXY patterns for specific target URLs
   - Creates explicit proxy configuration for typed-rest-client

2. **Smart Caching Strategy**:
   - URL-specific clients are **not cached** (proxy config can vary per target)
   - Generic clients (no URL) are **cached** for performance
   - Cache invalidation still based on SSL configuration hash

3. **Explicit Proxy Configuration**:
   - Builds `IProxyConfiguration` object from proxy-utils logic
   - Includes proxy credentials (username/password) if present in URL
   - NO_PROXY already handled by `getProxyConfig()`, so no need for bypassHosts

4. **Backward Compatibility**:
   - When `targetUrl` is not provided, falls back to typed-rest-client's automatic proxy detection
   - Existing code without URL parameter continues to work unchanged

### 2. Updated `getSharedHttpClient()` in `utility.ts`

**Previous Signature:**
```typescript
export function getSharedHttpClient(): HttpClient
```

**New Signature:**
```typescript
export function getSharedHttpClient(targetUrl?: string): HttpClient
```

**Purpose**: Convenience wrapper that passes through the optional `targetUrl` parameter.

### 3. Updated `download-tool.ts`

**Changed Line 300:**
```typescript
// Before:
createSSLConfiguredHttpClient(userAgent)

// After:
createSSLConfiguredHttpClient(userAgent, url)
```

**Impact**: Bridge CLI downloads now use explicit proxy configuration with NO_PROXY pattern support.

### 4. Added Import in `utility.ts`

**Line 39:**
```typescript
import { getProxyConfig } from "./proxy-utils";
```

## Architecture Changes

### Before

```
createSSLConfiguredHttpClient()
  └─> Creates HttpClient with SSL config
      └─> typed-rest-client handles proxy implicitly (environment variables)
```

### After

```
createSSLConfiguredHttpClient(userAgent, url?)
  ├─> If URL provided:
  │   ├─> getProxyConfig(url) - checks NO_PROXY patterns
  │   ├─> Build explicit IProxyConfiguration
  │   └─> Create URL-specific HttpClient (not cached)
  │
  └─> If URL not provided:
      ├─> Falls back to typed-rest-client auto-detection
      └─> Create generic HttpClient (cached)
```

## Benefits

1. **Consistent Proxy Handling**: Both direct HTTPS and typed-rest-client approaches now use the same proxy detection logic from `proxy-utils.ts`

2. **NO_PROXY Support**: Properly handles NO_PROXY environment variable patterns:
   - `*.example.com` - wildcard subdomains
   - `*example.com` - wildcard suffix
   - `.example.com` - domain suffix
   - `example.com` - exact match or subdomains

3. **Explicit vs Implicit**:
   - **Explicit** (with URL): Full control, NO_PROXY aware
   - **Implicit** (without URL): Backward compatible, automatic

4. **Performance**:
   - Generic clients still cached for repeated use
   - URL-specific clients not cached (prevents wrong proxy for different targets)

5. **Debugging**:
   - Enhanced debug logging shows when proxy is used/bypassed
   - Clear indication of explicit vs automatic proxy configuration

## Usage Examples

### Example 1: Download Tool (Explicit Proxy)
```typescript
// download-tool.ts line 300
const http = createSSLConfiguredHttpClient(userAgent, url);
// Uses explicit proxy config based on the download URL
// Respects NO_PROXY patterns
```

### Example 2: Azure DevOps API (Implicit Proxy)
```typescript
// azure-service-client.ts
const httpClient = getSharedHttpClient();
// Falls back to typed-rest-client's automatic proxy detection
// Backward compatible with existing code
```

### Example 3: Bridge CLI with URL (Explicit Proxy)
```typescript
// bridge-cli.ts
const httpClient = getSharedHttpClient(fetchUrl);
// Uses explicit proxy configuration for the specific URL
// Handles NO_PROXY patterns correctly
```

## Testing Considerations

1. **Backward Compatibility**: All existing calls without URL parameter continue to work
2. **Proxy Detection**: Test with HTTPS_PROXY, HTTP_PROXY, NO_PROXY environment variables
3. **Caching**: Verify generic clients are cached, URL-specific clients are not
4. **NO_PROXY Patterns**: Test various NO_PROXY patterns (wildcards, domains, IPs)

## Environment Variables

The implementation respects standard proxy environment variables:

- `HTTPS_PROXY` / `https_proxy`: HTTPS proxy URL
- `HTTP_PROXY` / `http_proxy`: HTTP proxy URL
- `NO_PROXY` / `no_proxy`: Comma-separated bypass patterns

## Debug Logging

New debug messages added:
- "Explicit proxy configured for HttpClient: [proxy-url]"
- "No proxy needed for target URL: [url] (either no proxy configured or bypassed via NO_PROXY)"
- "No target URL provided - typed-rest-client will auto-detect proxy from environment variables"
- "Created new URL-specific HttpClient instance (not cached) for: [url]"
- "Created and cached new HttpClient instance with user agent: [userAgent]"

## Files Modified

1. `blackduck-security-task/src/blackduck-security-task/utility.ts`
   - Enhanced `createSSLConfiguredHttpClient()` function
   - Updated `getSharedHttpClient()` function
   - Added import for `getProxyConfig`

2. `blackduck-security-task/src/blackduck-security-task/download-tool.ts`
   - Updated call to `createSSLConfiguredHttpClient()` to pass URL parameter

## Build and Test

✅ TypeScript compilation: Successful
✅ ESLint: No errors
✅ Backward compatibility: Maintained

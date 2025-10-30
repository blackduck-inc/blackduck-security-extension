# Detailed Explanation: Changes to utility.ts

## Table of Contents
1. [Overview](#overview)
2. [The Problem We're Solving](#the-problem-were-solving)
3. [Changes Made](#changes-made)
4. [Why This Approach?](#why-this-approach)
5. [Technical Deep Dive](#technical-deep-dive)
6. [Design Decisions](#design-decisions)
7. [How It Works](#how-it-works)
8. [Examples](#examples)

---

## Overview

**File:** `blackduck-security-task/src/blackduck-security-task/utility.ts`

**Primary Goal:** Enable explicit, URL-aware proxy configuration for all HTTP/HTTPS operations while maintaining backward compatibility.

**Key Changes:**
1. Added import for `getProxyConfig` from `proxy-utils.ts`
2. Enhanced `createSSLConfiguredHttpClient()` to accept optional `targetUrl` parameter
3. Updated `getSharedHttpClient()` to accept optional `targetUrl` parameter

---

## The Problem We're Solving

### Before Our Changes

The original `createSSLConfiguredHttpClient()` function created an HttpClient with SSL configuration, but it relied on **typed-rest-client's internal proxy detection**:

```typescript
// BEFORE
export function createSSLConfiguredHttpClient(
  userAgent = "BlackDuckSecurityTask"
): HttpClient {
  // ... SSL configuration ...
  const httpClient = new HttpClient(userAgent, [], options);
  // typed-rest-client handles proxy internally when httpClient.get(url) is called
  return httpClient;
}
```

### Issues with the Original Approach

1. **No Explicit Control**: Proxy detection happened inside typed-rest-client, not in our code
2. **NO_PROXY Inconsistency**: Our `downloadWithCustomSSL()` had explicit proxy logic with NO_PROXY support, but typed-rest-client used its own internal NO_PROXY handling
3. **Architectural Inconsistency**: Two different proxy approaches in the same codebase:
   - Direct HTTPS downloads: Used `createProxyAgent()` from `proxy-utils.ts`
   - API operations: Used typed-rest-client's internal proxy handling
4. **Limited Debugging**: Couldn't log proxy decisions since they happened inside typed-rest-client
5. **URL Context Missing**: Function created a generic client without knowing the target URL, so proxy decisions couldn't be made upfront

### Why Does This Matter?

In corporate environments:
- **Proxy servers** are common for security/monitoring
- **NO_PROXY patterns** are essential to bypass proxy for internal hosts
- **Consistent behavior** across all HTTP operations is critical for reliability
- **Debug logging** is crucial for troubleshooting proxy issues

---

## Changes Made

### Change 1: Added Import (Line 39)

```typescript
import { getProxyConfig } from "./proxy-utils";
```

**Why?**
- We need access to the proxy configuration logic
- `getProxyConfig()` handles NO_PROXY pattern matching
- Centralizes proxy detection in one place (`proxy-utils.ts`)

---

### Change 2: Enhanced `createSSLConfiguredHttpClient()` (Lines 392-499)

#### Original Signature
```typescript
export function createSSLConfiguredHttpClient(
  userAgent = "BlackDuckSecurityTask"
): HttpClient
```

#### New Signature
```typescript
export function createSSLConfiguredHttpClient(
  userAgent = "BlackDuckSecurityTask",
  targetUrl?: string  // ← NEW: Optional URL parameter
): HttpClient
```

**Why Add `targetUrl` Parameter?**

1. **URL-Aware Proxy Decisions**: Can determine if proxy should be used for specific target URL
2. **NO_PROXY Pattern Matching**: Can check if URL matches NO_PROXY patterns
3. **Explicit Configuration**: Build explicit proxy config before creating HttpClient
4. **Consistency**: Same approach as `downloadWithCustomSSL()` which already uses URL-aware proxy
5. **Backward Compatibility**: Optional parameter means existing code still works

---

### Change 3: Smart Caching Logic

```typescript
// Return cached client if configuration hasn't changed
// Note: We don't cache per-URL since proxy config can change per target
if (_httpClientCache && _httpClientConfigHash === currentConfigHash && !targetUrl) {
  taskLib.debug(`Reusing existing HttpClient instance with user agent: ${userAgent}`);
  return _httpClientCache;
}
```

**Why This Caching Strategy?**

#### Scenario 1: Generic Client (No URL)
```typescript
const client = createSSLConfiguredHttpClient("MyApp");
// ✅ CACHED - Can be reused for multiple requests
```

**Rationale:**
- Without URL, we create a generic client
- typed-rest-client will handle proxy per-request
- Safe to cache and reuse
- Performance benefit from connection reuse

#### Scenario 2: URL-Specific Client
```typescript
const client1 = createSSLConfiguredHttpClient("MyApp", "https://api.example.com");
const client2 = createSSLConfiguredHttpClient("MyApp", "https://internal.company.com");
// ❌ NOT CACHED - Each gets fresh client
```

**Rationale:**
- Different URLs may have different proxy requirements
- `https://api.example.com` → use proxy
- `https://internal.company.com` → bypass proxy (NO_PROXY match)
- If we cached, client1 might have wrong proxy config for client2's URL
- Creating fresh client ensures correct proxy for each URL

**This is a critical design decision to prevent proxy misconfiguration!**

---

### Change 4: Explicit Proxy Configuration (Lines 455-480)

```typescript
// Configure explicit proxy if target URL is provided
if (targetUrl) {
  const proxyConfig = getProxyConfig(targetUrl);

  if (proxyConfig.useProxy && proxyConfig.proxyUrl) {
    // Build IProxyConfiguration object for typed-rest-client
    requestOptions.proxy = {
      proxyUrl: proxyConfig.proxyUrl.href,
      proxyUsername: proxyConfig.proxyUrl.username || undefined,
      proxyPassword: proxyConfig.proxyUrl.password || undefined,
      proxyBypassHosts: [], // NO_PROXY already handled by getProxyConfig
    };
    taskLib.debug(`Explicit proxy configured for HttpClient: ${proxyConfig.proxyUrl.origin}`);
  } else {
    taskLib.debug(`No proxy needed for target URL: ${targetUrl}`);
  }
} else {
  // Fallback to environment variable detection
  taskLib.debug("No target URL provided - typed-rest-client will auto-detect proxy");
}
```

**Why This Implementation?**

#### Step-by-Step Explanation:

**Step 1: Check if URL is provided**
```typescript
if (targetUrl) {
```
- Only do explicit proxy config when we know the target URL
- Otherwise, fall back to typed-rest-client's automatic detection

**Step 2: Get proxy configuration**
```typescript
const proxyConfig = getProxyConfig(targetUrl);
```
- Calls `proxy-utils.ts` which:
  - Checks NO_PROXY environment variable first
  - If NO_PROXY matches → returns `{ useProxy: false }`
  - If no match → checks HTTPS_PROXY/HTTP_PROXY
  - Returns proxy URL if configured

**Step 3: Build explicit proxy config**
```typescript
requestOptions.proxy = {
  proxyUrl: proxyConfig.proxyUrl.href,
  proxyUsername: proxyConfig.proxyUrl.username || undefined,
  proxyPassword: proxyConfig.proxyUrl.password || undefined,
  proxyBypassHosts: [],
};
```

**Why this structure?**
- typed-rest-client's HttpClient expects `IProxyConfiguration` object
- `proxyUrl`: The complete proxy server URL (e.g., "http://proxy.company.com:8080")
- `proxyUsername`/`proxyPassword`: Extracted from URL if present (e.g., "http://user:pass@proxy:8080")
- `proxyBypassHosts`: Empty array because NO_PROXY already handled by `getProxyConfig()`

**Why not use `proxyBypassHosts`?**
- We already checked NO_PROXY in `getProxyConfig(targetUrl)`
- If it matched, we wouldn't be here (useProxy would be false)
- No need to duplicate the bypass logic

---

### Change 5: Updated `getSharedHttpClient()` (Lines 509-512)

```typescript
export function getSharedHttpClient(targetUrl?: string): HttpClient {
  return createSSLConfiguredHttpClient("BlackDuckSecurityTask", targetUrl);
}
```

**Why?**
- Convenience wrapper for common use case
- Passes through the optional `targetUrl` parameter
- Maintains consistent API across codebase

---

## Why This Approach?

### Design Principle: Dual-Mode Operation

Our implementation supports **two modes** based on whether URL is provided:

#### Mode 1: Explicit Proxy (URL provided)
```typescript
const client = createSSLConfiguredHttpClient("MyApp", "https://api.example.com");
```

**How it works:**
1. Calls `getProxyConfig("https://api.example.com")`
2. Checks if "api.example.com" matches NO_PROXY patterns
3. If not bypassed, gets proxy from HTTPS_PROXY
4. Creates explicit IProxyConfiguration object
5. HttpClient is created with this explicit config
6. Client is NOT cached (URL-specific)

**Advantages:**
- ✅ Full control over proxy decision
- ✅ NO_PROXY patterns handled consistently with `proxy-utils.ts`
- ✅ Can log proxy decisions for debugging
- ✅ Prevents wrong proxy for different URLs

**Disadvantages:**
- ❌ No caching (creates fresh client each time)
- ❌ Slightly more overhead

#### Mode 2: Implicit Proxy (No URL)
```typescript
const client = createSSLConfiguredHttpClient("MyApp");
```

**How it works:**
1. No URL provided, skip proxy configuration
2. Create HttpClient with SSL options only
3. typed-rest-client handles proxy when `client.get(url)` is called
4. Client IS cached (generic)

**Advantages:**
- ✅ Caching enabled (better performance)
- ✅ Backward compatible with existing code
- ✅ Simpler code path

**Disadvantages:**
- ❌ Proxy decision happens inside typed-rest-client (less control)
- ❌ Different NO_PROXY implementation than proxy-utils.ts
- ❌ Cannot log proxy decisions upfront

---

## Technical Deep Dive

### How Proxy Configuration Works

#### Environment Variables Read by `getProxyConfig()`:

```bash
# Proxy server URLs
HTTPS_PROXY=http://proxy.company.com:8080
HTTP_PROXY=http://proxy.company.com:8080

# Bypass patterns
NO_PROXY=*.internal.company.com,localhost,127.0.0.1
```

#### Example Flow:

**Scenario 1: External URL (Should Use Proxy)**
```typescript
const client = createSSLConfiguredHttpClient("App", "https://api.github.com");
```

1. Call `getProxyConfig("https://api.github.com")`
2. Check NO_PROXY: `*.internal.company.com` → No match
3. Check HTTPS_PROXY: `http://proxy.company.com:8080` → Found!
4. Return: `{ useProxy: true, proxyUrl: URL("http://proxy.company.com:8080") }`
5. Build explicit proxy config:
   ```typescript
   requestOptions.proxy = {
     proxyUrl: "http://proxy.company.com:8080",
     proxyUsername: undefined,
     proxyPassword: undefined,
     proxyBypassHosts: []
   }
   ```
6. Create HttpClient with proxy config
7. Log: "Explicit proxy configured for HttpClient: http://proxy.company.com:8080"

**Scenario 2: Internal URL (Should Bypass Proxy)**
```typescript
const client = createSSLConfiguredHttpClient("App", "https://api.internal.company.com");
```

1. Call `getProxyConfig("https://api.internal.company.com")`
2. Check NO_PROXY: `*.internal.company.com` → **MATCH!**
3. Return: `{ useProxy: false }`
4. Skip proxy configuration
5. Create HttpClient without proxy
6. Log: "No proxy needed for target URL: https://api.internal.company.com (bypassed via NO_PROXY)"

**Scenario 3: No URL Provided (Fallback Mode)**
```typescript
const client = createSSLConfiguredHttpClient("App");
```

1. `targetUrl` is undefined
2. Skip explicit proxy logic
3. Create HttpClient with SSL options only
4. Log: "No target URL provided - typed-rest-client will auto-detect proxy"
5. Proxy will be detected later when `client.get(url)` is called

---

### Integration with SSL Configuration

The proxy configuration **integrates** with existing SSL configuration:

```typescript
// Get SSL configuration (already existing logic)
const sslConfig = getSSLConfig();

// Build request options with SSL configuration
const requestOptions: any = {
  allowRetries: true,
  maxRetries: 3,
};

// Configure SSL options (existing logic)
if (sslConfig.trustAllCerts) {
  requestOptions.ignoreSslError = true;
} else if (sslConfig.customCA) {
  requestOptions.cert = { caFile: inputs.NETWORK_SSL_CERT_FILE };
}

// Configure proxy options (NEW LOGIC)
if (targetUrl) {
  const proxyConfig = getProxyConfig(targetUrl);
  if (proxyConfig.useProxy && proxyConfig.proxyUrl) {
    requestOptions.proxy = { /* proxy config */ };
  }
}

// Create HttpClient with BOTH SSL and proxy config
const httpClient = new HttpClient(userAgent, [], requestOptions);
```

**Key Point:** SSL and proxy configurations are **independent but complementary**:
- SSL config: Determines how to verify certificates
- Proxy config: Determines whether to use a proxy server
- Both can be active simultaneously (HTTPS through authenticating proxy with custom CA)

---

## Design Decisions

### Decision 1: Optional Parameter vs. Separate Function

**Option A: Optional Parameter (CHOSEN)**
```typescript
createSSLConfiguredHttpClient(userAgent, targetUrl?)
```

**Option B: Separate Function**
```typescript
createSSLConfiguredHttpClient(userAgent)
createSSLConfiguredHttpClientForUrl(userAgent, targetUrl)
```

**Why we chose Option A:**
- ✅ Backward compatible (existing calls work unchanged)
- ✅ Single function to maintain
- ✅ Clear intent: same functionality, URL optional
- ✅ Easy migration path (just add URL when available)

---

### Decision 2: No Caching for URL-Specific Clients

```typescript
// Cache only if no target URL
if (!targetUrl) {
  _httpClientCache = httpClient;
  _httpClientConfigHash = currentConfigHash;
}
```

**Why not cache URL-specific clients?**

**Problem Scenario:**
```typescript
// Request 1: External API (should use proxy)
const client1 = createSSLConfiguredHttpClient("App", "https://api.github.com");
// If we cached this...

// Request 2: Internal API (should NOT use proxy)
const client2 = createSSLConfiguredHttpClient("App", "https://internal.company.com");
// We'd return client1 with proxy config → WRONG!
```

**Solution:** Don't cache URL-specific clients

**Trade-off:**
- ❌ Less efficient (creates new client each time)
- ✅ Correct behavior (right proxy for each URL)

**Performance Impact:**
- Minimal: HttpClient creation is fast
- Creating proxy agent is lightweight
- Main overhead is network operations, not client creation

---

### Decision 3: Empty `proxyBypassHosts` Array

```typescript
requestOptions.proxy = {
  proxyUrl: proxyConfig.proxyUrl.href,
  proxyUsername: proxyConfig.proxyUrl.username || undefined,
  proxyPassword: proxyConfig.proxyUrl.password || undefined,
  proxyBypassHosts: [],  // ← Why empty?
};
```

**Why not populate `proxyBypassHosts`?**

**Reason:** NO_PROXY already handled by `getProxyConfig(targetUrl)`

**Flow:**
1. Before we get here, we called `getProxyConfig(targetUrl)`
2. `getProxyConfig()` already checked if `targetUrl` matches NO_PROXY
3. If it matched, `useProxy` would be `false` and we wouldn't be here
4. If we're here, it means proxy SHOULD be used
5. No need for `proxyBypassHosts` - the decision is already made

**Alternative approach we rejected:**
```typescript
// We could have done this, but it's redundant:
requestOptions.proxy = {
  proxyUrl: proxyConfig.proxyUrl.href,
  proxyBypassHosts: process.env.NO_PROXY?.split(',') || []
};
// Then typed-rest-client would check NO_PROXY again - unnecessary!
```

**Our approach:** Make decision once, upfront, with `getProxyConfig()`

---

## How It Works

### Complete Flow Diagram

```
User calls: createSSLConfiguredHttpClient("MyApp", "https://api.example.com")
                                    ↓
                        Check for cached client?
                                    ↓
                    ┌───────────────┴────────────────┐
                    │                                │
              Has targetUrl?                   No targetUrl
                    │                                │
                    ↓                                ↓
          getProxyConfig(targetUrl)         Use cached client
                    ↓                          (if available)
        Check NO_PROXY environment var              │
                    ↓                                │
        ┌───────────┴───────────┐                   │
        │                       │                   │
    Matches?                Doesn't match            │
        │                       │                   │
        ↓                       ↓                   ↓
  useProxy=false      Check HTTPS_PROXY      Create generic
        │                     │               HttpClient
        ↓                     │                     │
  No proxy needed      Found proxy?                 │
        │                     │                     │
        │            ┌────────┴────────┐            │
        │            │                 │            │
        │        Found            Not found         │
        │            │                 │            │
        │            ↓                 ↓            │
        │     useProxy=true      useProxy=false     │
        │            │                 │            │
        └────────────┴─────────────────┴────────────┘
                            ↓
            Build requestOptions with SSL config
                            ↓
                if (useProxy) add proxy config
                            ↓
            Create HttpClient(userAgent, [], requestOptions)
                            ↓
                Cache if no targetUrl provided
                            ↓
                    Return HttpClient
```

---

## Examples

### Example 1: Download Tool (Explicit Proxy)

```typescript
// In download-tool.ts line 300
const http: httm.HttpClient = createSSLConfiguredHttpClient(userAgent, url);
```

**What happens:**
1. URL = "https://sig-repo.synopsys.com/artifactory/bds-integrations-release/..."
2. Call `getProxyConfig(url)`
3. Check if "sig-repo.synopsys.com" in NO_PROXY → Likely not
4. Get HTTPS_PROXY → e.g., "http://proxy.company.com:8080"
5. Build explicit proxy config
6. Create HttpClient with proxy
7. When `http.get(url)` is called, uses configured proxy
8. Download proceeds through proxy

**Benefit:** Explicit control, can log proxy usage, consistent with `downloadWithCustomSSL()`

---

### Example 2: Azure DevOps API (Explicit Proxy)

```typescript
// In azure-service-client.ts line 52
const httpClient = getSharedHttpClient(endpoint);
const httpResponse = await httpClient.get(endpoint, headers);
```

**What happens:**
1. endpoint = "https://dev.azure.com/{org}/{project}/_apis/git/repositories/..."
2. Call `getProxyConfig(endpoint)`
3. Check if "dev.azure.com" in NO_PROXY → Depends on customer config
4. If not in NO_PROXY, use proxy
5. Create HttpClient with proxy for this specific endpoint
6. API call proceeds through proxy (if configured)

**Benefit:** Respects NO_PROXY for Azure DevOps server (important for on-prem)

---

### Example 3: Bridge CLI Fallback (Explicit Proxy)

```typescript
// In bridge-cli.ts line 550
const httpClient = getSharedHttpClient(fetchUrl);
const response = await httpClient.get(fetchUrl, headers);
```

**What happens:**
1. fetchUrl = "https://sig-repo.synopsys.com/bds-integrations-release/versions.txt"
2. This is fallback path (when direct HTTPS fails)
3. Call `getProxyConfig(fetchUrl)`
4. Likely needs proxy for external Synopsys repo
5. Create HttpClient with proxy
6. Fetch versions.txt through proxy

**Benefit:** Consistent proxy handling in both primary and fallback paths

---

### Example 4: Backward Compatible (No URL)

```typescript
// Hypothetical existing code that doesn't provide URL
const httpClient = createSSLConfiguredHttpClient("MyApp");
const response = await httpClient.get("https://some-api.com/endpoint");
```

**What happens:**
1. No targetUrl provided
2. Skip explicit proxy logic
3. Check cache: If cached and SSL config unchanged, return cached client
4. If not cached, create new generic HttpClient with SSL config only
5. Cache this client for reuse
6. When `client.get("https://some-api.com/endpoint")` is called:
   - typed-rest-client internally checks HTTPS_PROXY
   - typed-rest-client internally checks NO_PROXY
   - Uses proxy if configured and not bypassed
7. Request proceeds

**Benefit:** Existing code works unchanged, automatic proxy detection still works

---

## Summary

### What We Changed
1. Added `targetUrl` parameter to `createSSLConfiguredHttpClient()`
2. Implemented explicit proxy configuration when URL is provided
3. Maintained implicit proxy mode when URL is not provided
4. Smart caching: cache generic clients, don't cache URL-specific clients

### Why We Did It This Way
1. **Consistency**: Same proxy logic across all HTTP operations (uses `proxy-utils.ts`)
2. **Control**: Explicit proxy decisions with logging
3. **Correctness**: Prevents wrong proxy for different URLs via no-cache strategy
4. **Compatibility**: Existing code works unchanged (optional parameter)
5. **Flexibility**: Supports both explicit and implicit proxy modes

### Key Benefits
- ✅ URL-aware proxy configuration
- ✅ NO_PROXY pattern support (consistent with `proxy-utils.ts`)
- ✅ Proxy credential support (username/password in URL)
- ✅ Enhanced debugging (logs proxy decisions)
- ✅ Backward compatible (optional parameter)
- ✅ Correct behavior (right proxy for each URL)
- ✅ SSL + Proxy integration

### Design Philosophy
**"Make the right thing easy, and the safe thing automatic"**

- Right thing: Passing URL for explicit proxy control
- Easy: Just add URL parameter to existing calls
- Safe: Automatic fallback to typed-rest-client if no URL provided
- Automatic: Caching, NO_PROXY, proxy detection all handled

---

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Author:** Enhanced proxy implementation for Black Duck Security Scan Extension

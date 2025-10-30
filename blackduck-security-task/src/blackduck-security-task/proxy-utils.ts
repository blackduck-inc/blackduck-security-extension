// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import * as https from "https";
import * as taskLib from "azure-pipelines-task-lib/task";
import type { SSLConfig } from "./ssl-utils";

// Dynamic imports for proxy agents - will be installed separately
// eslint-disable-next-line @typescript-eslint/no-var-requires
const HttpProxyAgent = require("http-proxy-agent").HttpProxyAgent;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const HttpsProxyAgent = require("https-proxy-agent").HttpsProxyAgent;

export interface ProxyConfig {
  useProxy: boolean;
  proxyUrl?: URL;
}

/**
 * Gets Proxy configuration from environment variables.
 * Supports HTTPS_PROXY/https_proxy and HTTP_PROXY/http_proxy.
 * Respects NO_PROXY/no_proxy which takes priority to bypass proxy for specific hosts.
 * Returns proxy configuration object.
 */
export function getProxyConfig(targetUrl: string): ProxyConfig {
  // Check NO_PROXY first - it takes priority
  const noProxy = process.env.NO_PROXY || process.env.no_proxy;
  if (noProxy && shouldBypassProxy(targetUrl, noProxy)) {
    taskLib.debug(
      `Bypassing proxy for ${targetUrl} due to NO_PROXY configuration`
    );
    return { useProxy: false };
  }

  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;

  const proxyUrl = httpsProxy || httpProxy;
  if (!proxyUrl) {
    taskLib.debug(
      "No proxy configured (HTTPS_PROXY/HTTP_PROXY environment variables not set)"
    );
    return { useProxy: false };
  }

  try {
    const parsedProxyUrl = new URL(proxyUrl);
    taskLib.debug(
      `Using proxy: ${parsedProxyUrl.origin} for target URL: ${targetUrl}`
    );
    return {
      useProxy: true,
      proxyUrl: parsedProxyUrl,
    };
  } catch (error) {
    taskLib.debug(
      `Invalid proxy URL format: ${proxyUrl}. Error: ${error}. Proxy will not be used.`
    );
    return { useProxy: false };
  }
}

/**
 * Checks if a hostname matches a NO_PROXY pattern entry
 */
function matchesNoProxyPattern(hostname: string, pattern: string): boolean {
  // Handle wildcard subdomain patterns (*.example.com)
  if (pattern.startsWith("*.")) {
    const domain = pattern.substring(2);
    return hostname === domain || hostname.endsWith(`.${domain}`);
  }

  // Handle suffix wildcard patterns (*example.com)
  if (pattern.startsWith("*")) {
    const suffix = pattern.substring(1);
    return hostname.endsWith(suffix);
  }

  // Handle domain suffix match (.example.com matches subdomain.example.com)
  if (pattern.startsWith(".")) {
    return hostname.endsWith(pattern);
  }

  // Handle exact match or subdomain match (example.com matches example.com or sub.example.com)
  return hostname === pattern || hostname.endsWith(`.${pattern}`);
}

/**
 * Determines if a target URL should bypass proxy based on NO_PROXY rules
 */
export function shouldBypassProxy(targetUrl: string, noProxy: string): boolean {
  try {
    const target = new URL(targetUrl);
    const hostname = target.hostname.toLowerCase();

    // Split NO_PROXY by comma and trim whitespace
    const noProxyList = noProxy
      .split(",")
      .map((entry) => entry.trim().toLowerCase());

    for (const entry of noProxyList) {
      if (!entry) continue;

      if (matchesNoProxyPattern(hostname, entry)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Creates an appropriate proxy agent based on the protocol and proxy configuration
 * Integrates with SSL configuration for secure proxy connections
 */
export function createProxyAgent(
  url: string,
  sslConfig: SSLConfig
): https.Agent | undefined {
  const proxyConfig = getProxyConfig(url);

  // Check if proxy should be used
  if (!proxyConfig.useProxy || !proxyConfig.proxyUrl) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";

    taskLib.debug(
      `Creating ${isHttps ? "HTTPS" : "HTTP"} proxy agent for: ${
        proxyConfig.proxyUrl.origin
      }`
    );

    // Configure agent options based on SSL config
    const agentOptions: https.AgentOptions = {};

    if (sslConfig.trustAllCerts) {
      agentOptions.rejectUnauthorized = false;
      taskLib.debug("Proxy agent configured with SSL verification disabled");
    } else if (sslConfig.combinedCAs) {
      agentOptions.ca = sslConfig.combinedCAs;
      taskLib.debug("Proxy agent configured with custom CA certificates");
    }

    // Create appropriate proxy agent
    // Compatible with both v5/6 (two params) and v7 (options object with proxy)
    if (isHttps) {
      // For HTTPS proxy agent, combine proxy URL with SSL options
      const httpsProxyOptions = {
        ...agentOptions,
        host: proxyConfig.proxyUrl.hostname,
        port: proxyConfig.proxyUrl.port || "443",
        protocol: proxyConfig.proxyUrl.protocol,
      };
      return new HttpsProxyAgent(httpsProxyOptions);
    } else {
      // For HTTP proxy agent
      const httpProxyOptions = {
        host: proxyConfig.proxyUrl.hostname,
        port: proxyConfig.proxyUrl.port || "80",
        protocol: proxyConfig.proxyUrl.protocol,
      };
      return new HttpProxyAgent(httpProxyOptions);
    }
  } catch (error) {
    taskLib.warning(`Failed to create proxy agent: ${error}`);
    return undefined;
  }
}

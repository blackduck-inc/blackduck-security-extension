// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import path from "path";
import * as utility from "./utility";
import * as constants from "./application-constant";
import { lt, gte, coerce } from "semver";
import {
  MARK_BUILD_STATUS_KEY,
  NON_RETRY_HTTP_CODES,
  RETRY_COUNT,
  RETRY_DELAY_IN_MILLISECONDS,
  BRIDGE_CLI_ZIP_FILE_NAME,
  BRIDGE_CLI_ZIP_NOT_FOUND_FOR_EXTRACT,
  BRIDGE_CLI_EXTRACT_DIRECTORY_NOT_FOUND,
  EMPTY_BRIDGE_CLI_URL,
  BRIDGE_CLI_DOWNLOAD_FAILED,
  WORKSPACE_DIR_NOT_FOUND,
  BRIDGE_CLI_DOWNLOAD_FAILED_RETRY,
} from "./application-constant";

import * as toolLibLocal from ".//download-tool";
import * as process from "process";
import { DownloadFileResponse } from "./model/download-file-response";
import * as taskLib from "azure-pipelines-task-lib/task";
import { TaskResult } from "azure-pipelines-task-lib/task";
import { v4 as uuidv4 } from "uuid";
import * as trm from "azure-pipelines-task-lib/toolrunner";
import {
  AZURE_BUILD_REASON,
  AZURE_ENVIRONMENT_VARIABLES,
  AzurePrResponse,
} from "./model/azure";
import { ErrorCode } from "./enum/ErrorCodes";
import { BuildStatus } from "./enum/BuildStatus";
import { HttpClient } from "typed-rest-client/HttpClient";
import * as https from "https";
import * as inputs from "./input";
import { getSSLConfig, getSSLConfigHash, createHTTPSAgent } from "./ssl-utils";
import { isNullOrEmptyValue } from "./validator";
import { createProxyConfigForHttpClient } from "./proxy-utils";
import { readFileSync, writeFileSync } from "fs";
import { InputData } from "./model/input-data";
import { Polaris } from "./model/polaris";
import { BlackduckSCA } from "./model/blackduckSCA";

export function cleanUrl(url: string): string {
  if (url && url.endsWith("/")) {
    return url.slice(0, url.length - 1);
  }
  return url;
}

export function getTempDir(): string {
  return process.env["AGENT_TEMPDIRECTORY"] || "";
}

export async function extractZipped(
  file: string,
  destinationPath: string
): Promise<boolean> {
  if (file == null || file.length === 0) {
    return Promise.reject(
      new Error(
        BRIDGE_CLI_ZIP_NOT_FOUND_FOR_EXTRACT.concat(constants.SPACE).concat(
          ErrorCode.FILE_DOES_NOT_EXIST.toString()
        )
      )
    );
  }

  // Extract file name from file with full path
  if (destinationPath == null || destinationPath.length === 0) {
    return Promise.reject(
      new Error(
        BRIDGE_CLI_EXTRACT_DIRECTORY_NOT_FOUND.concat(constants.SPACE).concat(
          ErrorCode.NO_DESTINATION_DIRECTORY.toString()
        )
      )
    );
  }

  try {
    console.info(constants.EXTRACTING_BRIDGE_CLI_ARCHIVE);
    await utility.extractZipWithQuiet(file, destinationPath);
    console.info(constants.BRIDGE_CLI_EXTRACTION_COMPLETED);
    return Promise.resolve(true);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function extractZipWithQuiet(
  file: string,
  destination?: string
): Promise<string> {
  if (!file) {
    throw new Error("parameter 'file' is required");
  }

  const dest = _createExtractFolder(destination);
  if (process.platform == "win32") {
    const escapedFile = file.replace(/'/g, "''").replace(/"|\n|\r/g, "");
    const escapedDest = dest.replace(/'/g, "''").replace(/"|\n|\r/g, "");
    const command = `$ErrorActionPreference = 'Stop' ; try { Add-Type -AssemblyName System.IO.Compression.FileSystem } catch { } ; [System.IO.Compression.ZipFile]::ExtractToDirectory('${escapedFile}', '${escapedDest}')`;
    const chcpPath = path.join(
      process.env.windir ?? "",
      "system32",
      "chcp.com"
    );
    await taskLib.exec(chcpPath, "65001");
    const powershell: trm.ToolRunner = taskLib
      .tool("powershell")
      .line(
        "-NoLogo -Sta -NoProfile -NonInteractive -ExecutionPolicy Unrestricted -Command"
      )
      .arg(command);
    await powershell.exec();
  } else {
    const unzip: trm.ToolRunner = taskLib
      .tool("unzip")
      .arg("-q")
      .arg("-o")
      .arg(file);
    await unzip.exec(<trm.IExecOptions>{ cwd: dest });
  }
  return dest;
}

export function _createExtractFolder(dest?: string): string {
  if (!dest) {
    dest = path.join(_getAgentTemp(), uuidv4());
  }
  taskLib.mkdirP(dest);
  return dest;
}

export function _getAgentTemp(): string {
  taskLib.assertAgent("2.115.0");
  const tempDirectory = taskLib.getVariable("Agent.TempDirectory");
  if (!tempDirectory) {
    throw new Error("Agent.TempDirectory is not set");
  }
  return tempDirectory;
}

export async function getRemoteFile(
  destFilePath: string,
  url: string
): Promise<DownloadFileResponse> {
  if (url == null || url.length === 0) {
    return Promise.reject(
      new Error(
        EMPTY_BRIDGE_CLI_URL.concat(constants.SPACE).concat(
          ErrorCode.BRIDGE_CLI_URL_CANNOT_BE_EMPTY.toString()
        )
      )
    );
  }

  let fileNameFromUrl = "";
  if (taskLib.stats(destFilePath).isDirectory()) {
    fileNameFromUrl = url.substring(url.lastIndexOf("/") + 1);
    destFilePath = path.join(
      destFilePath,
      fileNameFromUrl || BRIDGE_CLI_ZIP_FILE_NAME
    );
  }

  let retryCountLocal = RETRY_COUNT;
  let retryDelay = RETRY_DELAY_IN_MILLISECONDS;
  do {
    try {
      const toolPath = await toolLibLocal.downloadTool(url, destFilePath);
      return {
        filePath: toolPath,
        fileName: fileNameFromUrl,
      };
    } catch (err) {
      const error = err as Error;
      if (retryCountLocal == 0) {
        throw error;
      }

      if (
        !NON_RETRY_HTTP_CODES.has(Number(getStatusCode(error.message))) ||
        error.message.includes("did not match downloaded file size")
      ) {
        console.info(
          BRIDGE_CLI_DOWNLOAD_FAILED_RETRY.concat(String(retryCountLocal))
            .concat(", Waiting: ")
            .concat(String(retryDelay / 1000))
            .concat(" Seconds")
        );
        await sleep(retryDelay);
        retryDelay = retryDelay * 2;
        retryCountLocal--;
      } else {
        retryCountLocal = 0;
      }
    }
  } while (retryCountLocal >= 0);
  return Promise.reject(
    BRIDGE_CLI_DOWNLOAD_FAILED.concat(constants.SPACE).concat(
      ErrorCode.BRIDGE_CLI_DOWNLOAD_FAILED.toString()
    )
  );
}

export function parseToBoolean(value: string | boolean | undefined): boolean {
  if (
    value &&
    value !== "" &&
    (value.toString().toLowerCase() === "true" || value === true)
  ) {
    return true;
  }
  return false;
}

export function isBoolean(value: string | boolean | undefined): boolean {
  if (
    value !== undefined &&
    value !== null &&
    value !== "" &&
    (value.toString().toLowerCase() === "true" ||
      value === true ||
      value.toString().toLowerCase() === "false" ||
      value === false)
  ) {
    return true;
  }
  return false;
}

export function getWorkSpaceDirectory(): string {
  const repoLocalPath: string | undefined =
    process.env["BUILD_REPOSITORY_LOCALPATH"];

  if (repoLocalPath !== undefined) {
    return repoLocalPath;
  } else {
    throw new Error(
      WORKSPACE_DIR_NOT_FOUND.concat(constants.SPACE).concat(
        ErrorCode.WORKSPACE_DIRECTORY_NOT_FOUND.toString()
      )
    );
  }
}

export function sleep(duration: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

export function getDefaultSarifReportPath(
  sarifReportDirectory: string,
  appendFilePath: boolean
): string {
  const pwd = getWorkSpaceDirectory();
  return !appendFilePath
    ? path.join(pwd, constants.BRIDGE_CLI_LOCAL_DIRECTORY, sarifReportDirectory)
    : path.join(
        pwd,
        constants.BRIDGE_CLI_LOCAL_DIRECTORY,
        sarifReportDirectory,
        constants.SARIF_DEFAULT_FILE_NAME
      );
}
// Get Integration Default Sarif Report Path
export function getIntegrationDefaultSarifReportPath(
  sarifReportDirectory: string,
  appendFilePath: boolean
): string {
  const pwd = getWorkSpaceDirectory();
  return !appendFilePath
    ? path.join(
        pwd,
        constants.INTEGRATIONS_CLI_LOCAL_DIRECTORY,
        sarifReportDirectory
      )
    : path.join(
        pwd,
        constants.INTEGRATIONS_CLI_LOCAL_DIRECTORY,
        sarifReportDirectory,
        constants.SARIF_DEFAULT_FILE_NAME
      );
}

export function filterEmptyData(data: object) {
  return JSON.parse(JSON.stringify(data), (key, value) =>
    value === null ||
    value === "" ||
    value === 0 ||
    value.length === 0 ||
    (typeof value === "object" && Object.keys(value).length === 0)
      ? undefined
      : value
  );
}

// Global variable to check PR events for uploading SARIF files in main.ts, reducing the need for current code refactoring
export let IS_PR_EVENT = false;

export function isPullRequestEvent(
  azurePrResponse: AzurePrResponse | undefined
): boolean {
  const buildReason =
    taskLib.getVariable(AZURE_ENVIRONMENT_VARIABLES.AZURE_BUILD_REASON) || "";
  IS_PR_EVENT =
    buildReason === AZURE_BUILD_REASON.PULL_REQUEST ||
    (azurePrResponse?.pullRequestId !== undefined &&
      azurePrResponse.pullRequestId > 0);
  return IS_PR_EVENT;
}

export function extractBranchName(branchName: string): string {
  const prefix = "refs/heads/";

  if (!branchName.startsWith(prefix)) {
    return branchName;
  }

  return branchName.substring(prefix.length);
}

// This function extracts the status code from a given error message string.
// Example: "Failed to download Bridge CLI zip from specified URL. HTTP status code: 502 124",
// The function will return the HTTP status code. For the above example: 502
export function getStatusCode(str: string) {
  const words = str.split(" ");
  return words.length < 2 ? str : words[words.length - 2];
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function isVersionLess(version1: string, version2: string): boolean {
  const v1 = coerce(version1);
  const v2 = coerce(version2);
  return v1 != null && v2 != null && lt(v1, v2);
}

export function isVersionGreaterOrEqual(
  version1: string,
  version2: string
): boolean {
  const v1 = coerce(version1);
  const v2 = coerce(version2);
  return v1 != null && v2 != null && gte(v1, v2);
}

export function getMappedTaskResult(
  buildStatus: string
): TaskResult | undefined {
  if (equalsIgnoreCase(buildStatus, BuildStatus.Succeeded)) {
    return TaskResult.Succeeded;
  } else if (equalsIgnoreCase(buildStatus, BuildStatus.SucceededWithIssues)) {
    return TaskResult.SucceededWithIssues;
  } else if (equalsIgnoreCase(buildStatus, BuildStatus.Failed)) {
    return TaskResult.Failed;
  } else {
    if (buildStatus) {
      console.log(
        `Unsupported value for ${MARK_BUILD_STATUS_KEY}: ${buildStatus}`
      );
    }
    return undefined;
  }
}

// Singleton HTTPS agent cache for downloads (with proper system + custom CA combination)
let _httpsAgentCache: https.Agent | null = null;
let _httpsAgentConfigHash: string | null = null;

// Singleton HTTP client cache for API operations
let _httpClientCache: HttpClient | null = null;
let _httpClientConfigHash: string | null = null;

/**
 * Creates an HTTPS agent with SSL configuration based on task inputs.
 * Uses singleton pattern to reuse the same agent instance when configuration hasn't changed.
 * This properly combines system CAs with custom CAs unlike typed-rest-client.
 * Use this for direct HTTPS operations like file downloads.
 *
 * @returns HTTPS agent configured with appropriate SSL settings
 */
export function createSSLConfiguredHttpsAgent(): https.Agent {
  const currentConfigHash = getSSLConfigHash();

  // Return cached agent if configuration hasn't changed
  if (_httpsAgentCache && _httpsAgentConfigHash === currentConfigHash) {
    taskLib.debug("Reusing existing HTTPS agent instance");
    return _httpsAgentCache;
  }

  // Get SSL configuration and create agent
  const sslConfig = getSSLConfig();
  _httpsAgentCache = createHTTPSAgent(sslConfig);

  // Cache the configuration hash
  _httpsAgentConfigHash = currentConfigHash;
  taskLib.debug("Created new HTTPS agent instance with SSL configuration");

  return _httpsAgentCache;
}

/**
 * Creates an HttpClient instance with SSL and proxy configuration based on task inputs.
 * Uses singleton pattern to reuse the same client instance when configuration hasn't changed.
 * This uses typed-rest-client for structured API operations.
 * Note: typed-rest-client has limitations with combining system CAs + custom CAs.
 *
 * @param userAgent The user agent string to use for the HTTP client (default: "BlackDuckSecurityTask")
 * @param targetUrl Optional target URL for explicit proxy configuration. When provided, uses proxy-utils logic for NO_PROXY patterns.
 * @returns HttpClient instance configured with appropriate SSL and proxy settings
 */
export function createSSLConfiguredHttpClient(
  userAgent = "BlackDuckSecurityTask",
  targetUrl?: string
): HttpClient {
  const currentConfigHash = getSSLConfigHash();

  // Return cached client if configuration hasn't changed
  // Note: We don't cache per-URL since proxy config can change per target
  if (
    _httpClientCache &&
    _httpClientConfigHash === currentConfigHash &&
    !targetUrl
  ) {
    taskLib.debug(
      `Reusing existing HttpClient instance with user agent: ${userAgent}`
    );
    return _httpClientCache;
  }

  // Get SSL configuration
  const sslConfig = getSSLConfig();

  // Build request options with SSL configuration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestOptions: any = {
    allowRetries: true,
    maxRetries: 3,
  };

  // Configure SSL options
  if (sslConfig.trustAllCerts) {
    taskLib.debug(
      "SSL certificate verification disabled for HttpClient (NETWORK_SSL_TRUST_ALL=true)"
    );
    requestOptions.ignoreSslError = true;
  } else if (sslConfig.customCA) {
    taskLib.debug(
      `Using custom CA certificate for HttpClient: ${inputs.NETWORK_SSL_CERT_FILE}`
    );
    try {
      // Note: typed-rest-client has limitations with combining system CAs + custom CAs
      // For downloads, use createSSLConfiguredHttpsAgent() which properly combines CAs
      // For API operations, this fallback to caFile option (custom CA only) is acceptable
      requestOptions.cert = {
        caFile: inputs.NETWORK_SSL_CERT_FILE,
      };
      taskLib.debug(
        "HttpClient configured with custom CA certificate (Note: typed-rest-client limitation - system CAs not combined)"
      );
    } catch (err) {
      taskLib.warning(
        `Failed to configure custom CA certificate, using default SSL settings: ${err}`
      );
    }
  } else {
    taskLib.debug("Using default SSL configuration for HttpClient");
  }

  // Configure explicit proxy if target URL is provided
  if (targetUrl) {
    const proxyConfiguration = createProxyConfigForHttpClient(targetUrl);
    if (proxyConfiguration) {
      requestOptions.proxy = proxyConfiguration;
    }
  } else {
    // Fallback to environment variable detection (typed-rest-client's automatic behavior)
    taskLib.debug(
      "No target URL provided - typed-rest-client will auto-detect proxy from environment variables"
    );
  }

  // Create HttpClient with configuration
  const httpClient = new HttpClient(userAgent, [], requestOptions);

  // Cache only if no target URL (URL-specific clients are not cached)
  if (!targetUrl) {
    _httpClientCache = httpClient;
    _httpClientConfigHash = currentConfigHash;
    taskLib.debug(
      `Created and cached new HttpClient instance with user agent: ${userAgent}`
    );
  } else {
    taskLib.debug(
      `Created new URL-specific HttpClient instance (not cached) for: ${targetUrl}`
    );
  }

  return httpClient;
}

/**
 * Gets a shared HttpClient instance with SSL configuration.
 * This is for API operations using typed-rest-client.
 * Use this for structured API operations that need typed responses.
 *
 * @param targetUrl Optional target URL for explicit proxy configuration
 * @returns HttpClient instance configured with appropriate SSL and proxy settings
 */
export function getSharedHttpClient(targetUrl?: string): HttpClient {
  return createSSLConfiguredHttpClient("BlackDuckSecurityTask", targetUrl);
}

/**
 * Clears both HTTPS agent and HTTP client caches. Useful for testing or when you need to force recreation.
 */
export function clearHttpClientCache(): void {
  _httpsAgentCache = null;
  _httpsAgentConfigHash = null;
  _httpClientCache = null;
  _httpClientConfigHash = null;
  taskLib.debug("HTTP client and HTTPS agent caches cleared");
}

// Extract File name from the formatted command
export function extractInputJsonFilename(command: string): string {
  const match = command.match(/--input\s+([^\s]+)/);
  if (match && match[1]) {
    // Extract just the filename from the full path
    const fullPath = match[1];
    return fullPath || "";
  }
  return "";
}
// File system wrapper for testability
export class FileSystemWrapper {
  readFileSync(filePath: string, encoding: BufferEncoding): string {
    return readFileSync(filePath, encoding);
  }

  writeFileSync(filePath: string, data: string): void {
    writeFileSync(filePath, data);
  }
}

// Path wrapper for testability
export class PathWrapper {
  resolve(pathString: string): string {
    return path.resolve(pathString);
  }

  join(...paths: string[]): string {
    return path.join(...paths);
  }
}

// Logger wrapper for testability
export class LoggerWrapper {
  debug(message: string): void {
    taskLib.debug(message);
  }
}
export function updateSarifFilePaths(
  workSpaceDir: string,
  productInputFileName: string,
  bridgeVersion: string,
  productInputFilPath: string
): void {
  const fileName = productInputFileName.replace(/"$/, "");
  if (fileName === "polaris_input.json") {
    let sarifPath: string;
    if (isVersionLess(bridgeVersion, constants.VERSION)) {
      if (isNullOrEmptyValue(inputs.POLARIS_REPORTS_SARIF_FILE_PATH)) {
        sarifPath = path.join(
          constants.BRIDGE_CLI_LOCAL_DIRECTORY,
          constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY,
          constants.SARIF_DEFAULT_FILE_NAME
        );
      } else {
        sarifPath = inputs.POLARIS_REPORTS_SARIF_FILE_PATH.trim();
      }
    } else {
      if (isNullOrEmptyValue(inputs.POLARIS_REPORTS_SARIF_FILE_PATH)) {
        sarifPath = path.join(
          workSpaceDir,
          constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
        );
      } else {
        sarifPath = inputs.POLARIS_REPORTS_SARIF_FILE_PATH.trim();
      }
    }
    updatePolarisSarifPath(productInputFilPath, sarifPath);
  }

  if (fileName === "bd_input.json") {
    let sarifPath: string;
    if (isVersionLess(bridgeVersion, constants.VERSION)) {
      if (isNullOrEmptyValue(inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH)) {
        sarifPath = path.join(
          constants.BRIDGE_CLI_LOCAL_DIRECTORY,
          constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
          constants.SARIF_DEFAULT_FILE_NAME
        );
      } else {
        sarifPath = inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH.trim();
      }
    } else {
      if (isNullOrEmptyValue(inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH)) {
        sarifPath = path.join(
          workSpaceDir,
          constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
        );
      } else {
        sarifPath = inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH.trim();
      }
    }
    updateBlackDuckSarifPath(productInputFilPath, sarifPath);
  }
}

// Update SARIF file path in the input JSON
export function updatePolarisSarifPath(
  productInputFilePath: string,
  sarifPath: string,
  fsWrapper: FileSystemWrapper = new FileSystemWrapper(),
  logger: LoggerWrapper = new LoggerWrapper()
): void {
  try {
    // Read and parse the JSON file
    const cleanPath = productInputFilePath.replace(/"/g, "");
    const jsonContent = fsWrapper.readFileSync(cleanPath, "utf-8");
    const config = JSON.parse(jsonContent) as InputData<Polaris>;

    config.data = config.data || {};
    config.data.polaris = config.data.polaris || {};

    // Initialize reports with required sarif property
    if (!config.data.polaris.reports) {
      config.data.polaris.reports = {
        sarif: {
          file: {
            path: "",
          },
        },
      };
    }

    // Ensure sarif exists (it's required by the interface)
    if (!config.data.polaris.reports.sarif) {
      config.data.polaris.reports.sarif = {
        file: {
          path: "",
        },
      };
    }

    // Ensure file object exists within sarif
    if (!config.data.polaris.reports.sarif.file) {
      config.data.polaris.reports.sarif.file = {
        path: "",
      };
    }

    // Now safely update the path
    config.data.polaris.reports.sarif.file.path = sarifPath;
    logger.debug(
      `Updated SARIF file path to: ${config.data.polaris.reports.sarif.file.path}`
    );

    // Write back the updated JSON with proper formatting
    fsWrapper.writeFileSync(cleanPath, JSON.stringify(config, null, 2));
    logger.debug(`Successfully updated Polaris SARIF file path: ${sarifPath}`);
  } catch (error) {
    logger.debug(`Error updating SARIF file path: ${error}`);
  }
}

// Update SARIF file path in the input JSON
export function updateBlackDuckSarifPath(
  productInputFilePath: string,
  sarifPath: string,
  fsWrapper: FileSystemWrapper = new FileSystemWrapper(),
  logger: LoggerWrapper = new LoggerWrapper()
): void {
  try {
    // Read and parse the JSON file
    const cleanPath = productInputFilePath.replace(/"/g, "");
    const jsonContent = fsWrapper.readFileSync(cleanPath, "utf-8");
    const config = JSON.parse(jsonContent) as InputData<BlackduckSCA>;

    config.data = config.data || {};
    config.data.blackducksca = config.data.blackducksca || {};

    // Initialize reports with required sarif property
    if (!config.data.blackducksca.reports) {
      config.data.blackducksca.reports = {
        sarif: {
          file: {
            path: "",
          },
        },
      };
    }

    // Ensure sarif exists (it's required by the interface)
    if (!config.data.blackducksca.reports.sarif) {
      config.data.blackducksca.reports.sarif = {
        file: {
          path: "",
        },
      };
    }

    // Ensure file object exists within sarif
    if (!config.data.blackducksca.reports.sarif.file) {
      config.data.blackducksca.reports.sarif.file = {
        path: "",
      };
    }

    // Now safely update the path
    config.data.blackducksca.reports.sarif.file.path = sarifPath;
    logger.debug(
      `Updated SARIF file path to: ${config.data.blackducksca.reports.sarif.file.path}`
    );

    // Write back the updated JSON with proper formatting
    fsWrapper.writeFileSync(cleanPath, JSON.stringify(config, null, 2));
    logger.debug(`Successfully updated Polaris SARIF file path: ${sarifPath}`);
  } catch (error) {
    logger.debug(`Error updating SARIF file path: ${error}`);
  }
}
export function formatURLString(url: string, ...args: string[]): string {
  return url.replace(
    /{(\d+)}/g,
    (match, index) => encodeURIComponent(args[index]) || ""
  );
}
export function validateSourceUploadValue(bridgeVersion: string): void {
  if (
    isVersionGreaterOrEqual(
      bridgeVersion,
      constants.ASSESSMENT_MODE_UNSUPPORTED_BRIDGE_VERSION
    ) &&
    !isNullOrEmptyValue(inputs.POLARIS_ASSESSMENT_MODE)
  ) {
    console.info(
      "INFO: polaris_assessment_mode is deprecated. Use polaris_test_sast_location=remote and/or polaris_test_sca_location=remote for source upload scans instead."
    );
  }
}
export function updateCoverityConfigForBridgeVersion(
  productInputFileName: string,
  bridgeVersion: string,
  productInputFilePath: string
): void {
  const inputFileName = productInputFileName.replace(/"/g, "");
  if (inputFileName === "coverity_input.json") {
    try {
      // Remove quotes from the file path
      const cleanFilePath = productInputFilePath.replace(/"/g, "");
      const inputFileContent = readFileSync(cleanFilePath, "utf-8");
      const covData = JSON.parse(inputFileContent);

      // Use semantic version comparison
      if (
        covData.data?.coverity?.prcomment &&
        isVersionLess(
          bridgeVersion,
          constants.COVERITY_PRCOMMENT_NEW_FORMAT_VERSION
        )
      ) {
        // Convert new format to legacy format for Bridge CLI < 3.9.0
        console.debug(
          `Bridge CLI version ${bridgeVersion} < 3.9.0, converting to legacy automation format`
        );

        // Move prcomment to automation and remove prcomment
        covData.data.coverity.automation = { prcomment: true };
        delete covData.data.coverity.prcomment;

        // Write the updated content back to the file
        writeFileSync(cleanFilePath, JSON.stringify(covData, null, 2));
        console.info(
          "Converted Coverity PR comment configuration to legacy format for compatibility with Bridge CLI < 3.9.0"
        );
      }
    } catch (error) {
      console.debug(
        `Failed to update Coverity configuration for bridge version compatibility: ${error}`
      );
    }
  }
}

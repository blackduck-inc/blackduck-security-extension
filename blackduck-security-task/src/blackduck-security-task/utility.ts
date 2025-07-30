// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import path from "path";
import * as fs from "fs";
import * as utility from "./utility";
import * as constants from "./application-constant";
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
    const unzip: trm.ToolRunner = taskLib.tool("unzip").arg("-q").arg(file);
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
// Extract File name from the formatted command
export function extractOutputJsonFilename(command: string): string {
  const match = command.match(/--out\s+([^\s]+)/);
  if (match && match[1]) {
    // Extract the full path and remove any quotes
    const outputFilePath = match[1].replace(/^["']|["']$/g, "");
    taskLib.debug(`Extracted Output Path:::: ${outputFilePath}`);
    return outputFilePath || "";
  }
  return "";
}

// Extract sarif output file path from out json
export function copySarifFileToIntegrationDefaultPath(
  sarifFilePath: string
): void {
  const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
  const sarifFileName = path.basename(sarifFilePath);

  const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
  const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;

  if (!isPolarisFile && !isBlackduckFile) return;

  const sarifOutputPath = extractSarifOutputPath(sarifFilePath, sarifFileName);
  if (!sarifOutputPath) return;

  const integrationSarifDir = path.dirname(
    isPolarisFile
      ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
      : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
  );

  const integrationSarifDirPath = path.join(
    sourceDirectory,
    integrationSarifDir
  );
  const destinationFile = path.join(
    integrationSarifDirPath,
    constants.SARIF_DEFAULT_FILE_NAME
  );

  try {
    fs.mkdirSync(integrationSarifDirPath, { recursive: true });
    fs.copyFileSync(sarifOutputPath, destinationFile);
    taskLib.debug(
      `SARIF file ${
        fs.existsSync(destinationFile) ? "overwritten" : "copied"
      } at: ${destinationFile}`
    );
  } catch (error) {
    console.error("Error copying SARIF file:", error);
  }
}

// Extract the file name from the path
export function extractSarifOutputPath(
  outputJsonPath: string,
  sarifFileName: string
): string {
  try {
    const config = JSON.parse(fs.readFileSync(outputJsonPath, "utf-8"));
    const sarifOutputPath =
      sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
        ? config?.data?.polaris?.reports?.sarif?.file?.output
        : config?.data?.blackducksca?.reports?.sarif?.file?.output;

    if (!sarifOutputPath) {
      return "";
    }
    return sarifOutputPath;
  } catch (error) {
    console.error("Error reading or parsing output JSON file:", error);
    return "";
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
 * Creates an HttpClient instance with SSL configuration based on task inputs.
 * Uses singleton pattern to reuse the same client instance when configuration hasn't changed.
 * This uses typed-rest-client for structured API operations.
 * Note: typed-rest-client has limitations with combining system CAs + custom CAs.
 *
 * @param userAgent The user agent string to use for the HTTP client (default: "BlackDuckSecurityTask")
 * @returns HttpClient instance configured with appropriate SSL settings
 */
export function createSSLConfiguredHttpClient(
  userAgent = "BlackDuckSecurityTask"
): HttpClient {
  const currentConfigHash = getSSLConfigHash();

  // Return cached client if configuration hasn't changed
  if (_httpClientCache && _httpClientConfigHash === currentConfigHash) {
    taskLib.debug(
      `Reusing existing HttpClient instance with user agent: ${userAgent}`
    );
    return _httpClientCache;
  }

  // Get SSL configuration
  const sslConfig = getSSLConfig();

  if (sslConfig.trustAllCerts) {
    taskLib.debug(
      "SSL certificate verification disabled for HttpClient (NETWORK_SSL_TRUST_ALL=true)"
    );
    _httpClientCache = new HttpClient(userAgent, [], { ignoreSslError: true });
  } else if (sslConfig.customCA) {
    taskLib.debug(
      `Using custom CA certificate for HttpClient: ${inputs.NETWORK_SSL_CERT_FILE}`
    );
    try {
      // Note: typed-rest-client has limitations with combining system CAs + custom CAs
      // For downloads, use createSSLConfiguredHttpsAgent() which properly combines CAs
      // For API operations, this fallback to caFile option (custom CA only) is acceptable
      _httpClientCache = new HttpClient(userAgent, [], {
        allowRetries: true,
        maxRetries: 3,
        cert: {
          caFile: inputs.NETWORK_SSL_CERT_FILE,
        },
      });
      taskLib.debug(
        "HttpClient configured with custom CA certificate (Note: typed-rest-client limitation - system CAs not combined)"
      );
    } catch (err) {
      taskLib.warning(
        `Failed to configure custom CA certificate, using default HttpClient: ${err}`
      );
      _httpClientCache = new HttpClient(userAgent);
    }
  } else {
    taskLib.debug("Using default HttpClient with system SSL certificates");
    _httpClientCache = new HttpClient(userAgent);
  }

  // Cache the configuration hash
  _httpClientConfigHash = currentConfigHash;
  taskLib.debug(
    `Created new HttpClient instance with user agent: ${userAgent}`
  );

  return _httpClientCache;
}

/**
 * Gets a shared HttpClient instance with SSL configuration.
 * This is for API operations using typed-rest-client.
 * Use this for structured API operations that need typed responses.
 *
 * @returns HttpClient instance configured with appropriate SSL settings
 */
export function getSharedHttpClient(): HttpClient {
  return createSSLConfiguredHttpClient("BlackDuckSecurityTask");
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

export function stringFormat(url: string, ...args: string[]): string {
  return url.replace(
    /{(\d+)}/g,
    (match, index) => encodeURIComponent(args[index]) || ""
  );
}

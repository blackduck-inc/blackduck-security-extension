// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import path from "path";
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

import * as toolLib from "azure-pipelines-tool-lib";
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

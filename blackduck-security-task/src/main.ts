// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {
  getMappedTaskResult,
  getTempDir,
  getWorkSpaceDirectory,
  IS_PR_EVENT,
  parseToBoolean,
  isVersionLess,
} from "./blackduck-security-task/utility";
import { BridgeCli } from "./blackduck-security-task/bridge-cli";
import * as taskLib from "azure-pipelines-task-lib/task";
import { TaskResult } from "azure-pipelines-task-lib/task";
import * as constants from "./blackduck-security-task/application-constant";
import * as inputs from "./blackduck-security-task/input";
import { showLogForDeprecatedInputs } from "./blackduck-security-task/input";
import * as util from "./blackduck-security-task/utility";
import {
  uploadDiagnostics,
  uploadSarifResultAsArtifact,
} from "./blackduck-security-task/diagnostics";
import { AzurePrResponse } from "./blackduck-security-task/model/azure";
import { ErrorCode } from "./blackduck-security-task/enum/ErrorCodes";
import {
  BLACKDUCKSCA_SARIF_REPOST_ENABLED,
  BLACKDUCKSCA_SECURITY_SCAN_COMPLETED,
  NETWORK_AIR_GAP_ENABLED_SKIP_DOWNLOAD_BRIDGE_CLI,
  POLARISSCA_SARIF_REPORT_ENABLED,
  WORKFLOW_FAILED,
} from "./blackduck-security-task/application-constant";
import { readFileSync } from "fs";
import { basename, join } from "path";

export async function run() {
  console.log("Black Duck Security Scan Task started...");
  const tempDir = getTempDir();
  taskLib.debug(`tempDir: ${tempDir}`);
  const workSpaceDir = getWorkSpaceDirectory();
  taskLib.debug(`workSpaceDir: ${workSpaceDir}`);
  let azurePrResponse: AzurePrResponse | undefined;
  let bridgeVersion = "";
  let productInputFileName = "";
  let productInputFilPath = "";
  try {
    const bridge = new BridgeCli();

    showLogForDeprecatedInputs();
    // Prepare tool commands
    const command: string = await bridge.prepareCommand(tempDir);
    let bridgePath = "";
    if (!inputs.ENABLE_NETWORK_AIRGAP) {
      bridgePath = await bridge.downloadAndExtractBridgeCli(tempDir);
    } else {
      console.log(NETWORK_AIR_GAP_ENABLED_SKIP_DOWNLOAD_BRIDGE_CLI);
      bridgePath = await bridge.getBridgeCliPath();
    }
    // Get Bridge version from bridge Path
    bridgeVersion = getBridgeVersion(bridgePath);
    // Validate Source upload value
    util.validateSourceUploadValue(bridgeVersion);
    //Extract input.json file and update sarif default file path based on bridge version
    productInputFilPath = util.extractInputJsonFilename(command);
    // Extract product input file name from the path (cross-platform compatible)
    productInputFileName = basename(productInputFilPath);
    taskLib.debug(`productInputFileName: ${productInputFileName}`);
    // Based on bridge version and productInputFileName get the sarif file path
    util.updateSarifFilePaths(
      workSpaceDir,
      productInputFileName,
      bridgeVersion,
      productInputFilPath
    );
    // Based on bridge version update Coverity configuration for backward compatibility
    util.updateCoverityConfigForBridgeVersion(
      productInputFileName,
      bridgeVersion,
      productInputFilPath
    );
    // Execute prepared commands
    const result: number = await bridge.executeBridgeCliCommand(
      bridgePath,
      getWorkSpaceDirectory(),
      command
    );
    // The statement set the exit code in the 'status' variable which can be used in the YAML file
    if (parseToBoolean(inputs.RETURN_STATUS)) {
      // Do not move to application constants
      console.log(
        `##vso[task.setvariable variable=status;isoutput=true]${result}`
      );
    }
  } catch (error: any) {
    throw error;
  } finally {
    if (parseToBoolean(inputs.BLACKDUCKSCA_REPORTS_SARIF_CREATE)) {
      if (!IS_PR_EVENT) {
        console.log(BLACKDUCKSCA_SARIF_REPOST_ENABLED);
        if (isVersionLess(bridgeVersion, constants.VERSION)) {
          uploadSarifResultAsArtifact(
            constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
            inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
          );
        } else {
          uploadSarifResultAsArtifact(
            constants.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY,
            inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
          );
        }
      }
    }

    if (parseToBoolean(inputs.POLARIS_REPORTS_SARIF_CREATE)) {
      if (!IS_PR_EVENT) {
        console.log(POLARISSCA_SARIF_REPORT_ENABLED);
        if (isVersionLess(bridgeVersion, constants.VERSION)) {
          uploadSarifResultAsArtifact(
            constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY,
            inputs.POLARIS_REPORTS_SARIF_FILE_PATH
          );
        } else {
          uploadSarifResultAsArtifact(
            constants.INTEGRATIONS_DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY,
            inputs.POLARIS_REPORTS_SARIF_FILE_PATH
          );
        }
      }
    }

    if (parseToBoolean(inputs.INCLUDE_DIAGNOSTICS)) {
      uploadDiagnostics(workSpaceDir);
    }
  }

  console.log(BLACKDUCKSCA_SECURITY_SCAN_COMPLETED);
}

export function getExitMessage(message: string, exitCode: string): string {
  return constants.EXIT_CODE_MAP.has(exitCode)
    ? "Exit Code: " + exitCode + " - " + constants.EXIT_CODE_MAP.get(exitCode)
    : "Exit Code: " +
        ErrorCode.UNDEFINED_ERROR_FROM_EXTENSION.toString() +
        " - " +
        "Undefined error from extension: " +
        message;
}

export function getStatusFromError(errorObject: Error): string {
  return errorObject.message.trim().split(" ").pop() || "";
}

function markBuildStatusIfIssuesArePresent(
  status: string,
  taskResult: TaskResult,
  errorMessage: string
) {
  const exitMessage = getExitMessage(errorMessage, status);

  if (status == ErrorCode.BRIDGE_BREAK_ENABLED.toString()) {
    console.log(errorMessage);
    if (taskResult === TaskResult.Succeeded) {
      console.log(exitMessage);
    }
    console.log(
      `Marking the build ${TaskResult[taskResult]} as configured in the task`
    );
    taskLib.setResult(taskResult, exitMessage);
  } else {
    taskLib.error(errorMessage);
    console.log(
      `Marking build status ${TaskResult[taskResult]} is ignored since exit code is: ${status}`
    );
    taskLib.setResult(
      taskLib.TaskResult.Failed,
      WORKFLOW_FAILED.concat(exitMessage)
    );
  }
}
// Extract version number from bridge path
function getBridgeVersion(bridgePath: string): string {
  try {
    const versionFilePath = join(bridgePath, "versions.txt");
    const content = readFileSync(versionFilePath, "utf-8");
    const match = content.match(/bridge-cli-bundle:\s*([0-9.]+[a-zA-Z0-9]*)/);
    if (match && match[1]) {
      return match[1];
    }
    return "";
  } catch (error) {
    return "";
  }
}

run().catch((error) => {
  if (error.message != undefined) {
    const isReturnStatusEnabled = parseToBoolean(inputs.RETURN_STATUS);
    const status = getStatusFromError(error);

    // The statement set the exit code in the 'status' variable which can be used in the YAML file
    if (isReturnStatusEnabled) {
      console.log(
        `##vso[task.setvariable variable=status;isoutput=true]${status}`
      );
    }

    const taskResult: TaskResult | undefined = getMappedTaskResult(
      inputs.MARK_BUILD_STATUS
    );

    if (taskResult !== undefined && taskResult !== TaskResult.Failed) {
      markBuildStatusIfIssuesArePresent(status, taskResult, error.message);
    } else {
      taskLib.error(error.message);
      taskLib.setResult(
        taskLib.TaskResult.Failed,
        WORKFLOW_FAILED.concat(getExitMessage(error.message, status))
      );
    }
  }
});

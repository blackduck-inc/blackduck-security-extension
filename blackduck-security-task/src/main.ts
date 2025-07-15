// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {
  getMappedTaskResult,
  getTempDir,
  getWorkSpaceDirectory,
  IS_PR_EVENT,
  parseToBoolean,
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
  MARK_THE_BUILD_ON_BRIDGE_BREAK,
  MARK_THE_BUILD_STATUS,
  NETWORK_AIR_GAP_ENABLED_SKIP_DOWNLOAD_BRIDGE_CLI,
  POLARISSCA_SARIF_REPORT_ENABLED,
  TASK_RETURN_STATUS,
  WORKFLOW_FAILED,
} from "./blackduck-security-task/application-constant";
import { readFileSync } from "fs";
import { join } from "path";

export async function run() {
  console.log("Black Duck Security Scan Task started...");
  const tempDir = getTempDir();
  taskLib.debug(`tempDir: ${tempDir}`);
  const workSpaceDir = getWorkSpaceDirectory();
  taskLib.debug(`workSpaceDir: ${workSpaceDir}`);
  let azurePrResponse: AzurePrResponse | undefined;
  let bridgeVersion = "";
  let productOutputFilPath = "";
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
    taskLib.debug(`bridgePath: ${bridgeVersion}`);

    // Execute prepared commands
    const result: number = await bridge.executeBridgeCliCommand(
      bridgePath,
      getWorkSpaceDirectory(),
      command
    );
    // Extract Sarif file out file from the out.json file
    productOutputFilPath = util.extractOutputJsonFilename(command);
    taskLib.debug(`Product out file path: ${productOutputFilPath}`);

    // if (
    //   inputs.POLARIS_REPORTS_SARIF_CREATE === "true" ||
    //   inputs.BLACKDUCKSCA_REPORTS_SARIF_CREATE === "true"
    // ) {
    // Copy Sarif file from out.json to integration default directory
    util.copySarifFileToIntegrationDefaultPath(productOutputFilPath);
    taskLib.debug(`Sarif file copied to integration default path`);
    //}
    // The statement set the exit code in the 'status' variable which can be used in the YAML file
    if (parseToBoolean(inputs.RETURN_STATUS)) {
      console.log(TASK_RETURN_STATUS);
    }
  } catch (error: any) {
    throw error;
  } finally {
    if (parseToBoolean(inputs.BLACKDUCKSCA_REPORTS_SARIF_CREATE)) {
      if (!IS_PR_EVENT) {
        console.log(BLACKDUCKSCA_SARIF_REPOST_ENABLED);
        if (bridgeVersion < constants.VERSION) {
          uploadSarifResultAsArtifact(
            constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
            inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
          );
        }
      } else {
        uploadSarifResultAsArtifact(
          constants.INTEGRATIONS_DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
          inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
        );
      }
    }

    if (parseToBoolean(inputs.POLARIS_REPORTS_SARIF_CREATE)) {
      if (!IS_PR_EVENT) {
        console.log(POLARISSCA_SARIF_REPORT_ENABLED);
        if (bridgeVersion < constants.VERSION) {
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
    console.log(MARK_THE_BUILD_ON_BRIDGE_BREAK);
    taskLib.setResult(taskResult, exitMessage);
  } else {
    taskLib.error(errorMessage);
    console.log(MARK_THE_BUILD_STATUS);
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
    const match = content.match(/bridge-cli-bundle:\s*([0-9.]+)/);
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
      console.log(TASK_RETURN_STATUS);
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

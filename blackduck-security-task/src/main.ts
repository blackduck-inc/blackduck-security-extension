// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {
  getMappedTaskResult,
  getTempDir,
  getWorkSpaceDirectory,
  IS_PR_EVENT,
  parseToBoolean,
} from "./blackduck-security-task/utility";
import { Bridge } from "./blackduck-security-task/bridge";
import * as taskLib from "azure-pipelines-task-lib/task";
import { TaskResult } from "azure-pipelines-task-lib/task";
import * as constants from "./blackduck-security-task/application-constant";
import * as inputs from "./blackduck-security-task/input";
import { showLogForDeprecatedInputs } from "./blackduck-security-task/input";
import {
  uploadDiagnostics,
  uploadSarifResultAsArtifact,
} from "./blackduck-security-task/diagnostics";
import { AzurePrResponse } from "./blackduck-security-task/model/azure";
import { ErrorCode } from "./blackduck-security-task/enum/ErrorCodes";
import {
  BLACKDUCK_SCA_SARIF_REPOST_ENABLED,
  BLACKDUCK_SCA_SECURITY_SCAN_COMPLETED,
  MARK_THE_BUILD_ON_BRIDGE_BREAK,
  MARK_THE_BUILD_STATUS,
  NETWORK_AIR_GAP_ENABLED_SKIP_DOWNLOAD_BRIDGE_CLI,
  POLARIS_SCA_SARIF_REPORT_ENABLED,
  TASK_RETURN_STATUS,
  WORKFLOW_FAILED,
} from "./blackduck-security-task/application-constant";

export async function run() {
  console.log("Black Duck Security Scan Task started...");
  const tempDir = getTempDir();
  taskLib.debug(`tempDir: ${tempDir}`);
  const workSpaceDir = getWorkSpaceDirectory();
  taskLib.debug(`workSpaceDir: ${workSpaceDir}`);
  let azurePrResponse: AzurePrResponse | undefined;
  try {
    const bridge = new Bridge();

    showLogForDeprecatedInputs();
    // Prepare tool commands
    const command: string = await bridge.prepareCommand(tempDir);
    let bridgePath = "";
    if (!inputs.ENABLE_NETWORK_AIRGAP) {
      bridgePath = await bridge.downloadAndExtractBridge(tempDir);
    } else {
      console.log(NETWORK_AIR_GAP_ENABLED_SKIP_DOWNLOAD_BRIDGE_CLI);
      bridgePath = await bridge.getBridgePath();
    }

    // Execute prepared commands
    const result: number = await bridge.executeBridgeCommand(
      bridgePath,
      getWorkSpaceDirectory(),
      command
    );

    // The statement set the exit code in the 'status' variable which can be used in the YAML file
    if (parseToBoolean(inputs.RETURN_STATUS)) {
      console.log(TASK_RETURN_STATUS);
    }
  } catch (error: any) {
    throw error;
  } finally {
    if (parseToBoolean(inputs.BLACKDUCKSCA_REPORTS_SARIF_CREATE)) {
      if (!IS_PR_EVENT) {
        console.log(BLACKDUCK_SCA_SARIF_REPOST_ENABLED);
        uploadSarifResultAsArtifact(
          constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
          inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
        );
      }
    }

    if (parseToBoolean(inputs.POLARIS_REPORTS_SARIF_CREATE)) {
      if (!IS_PR_EVENT) {
        console.log(POLARIS_SCA_SARIF_REPORT_ENABLED);
        uploadSarifResultAsArtifact(
          constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY,
          inputs.POLARIS_REPORTS_SARIF_FILE_PATH
        );
      }
    }

    if (parseToBoolean(inputs.INCLUDE_DIAGNOSTICS)) {
      uploadDiagnostics(workSpaceDir);
    }
  }

  console.log(BLACKDUCK_SCA_SECURITY_SCAN_COMPLETED);
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

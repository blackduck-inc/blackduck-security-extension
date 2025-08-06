"use strict";
// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusFromError = exports.getExitMessage = exports.run = void 0;
const utility_1 = require("./blackduck-security-task/utility");
const bridge_cli_1 = require("./blackduck-security-task/bridge-cli");
const taskLib = __importStar(require("azure-pipelines-task-lib/task"));
const task_1 = require("azure-pipelines-task-lib/task");
const constants = __importStar(require("./blackduck-security-task/application-constant"));
const inputs = __importStar(require("./blackduck-security-task/input"));
const input_1 = require("./blackduck-security-task/input");
const util = __importStar(require("./blackduck-security-task/utility"));
const diagnostics_1 = require("./blackduck-security-task/diagnostics");
const ErrorCodes_1 = require("./blackduck-security-task/enum/ErrorCodes");
const application_constant_1 = require("./blackduck-security-task/application-constant");
const fs_1 = require("fs");
const path_1 = require("path");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Black Duck Security Scan Task started...");
        const tempDir = (0, utility_1.getTempDir)();
        taskLib.debug(`tempDir: ${tempDir}`);
        const workSpaceDir = (0, utility_1.getWorkSpaceDirectory)();
        taskLib.debug(`workSpaceDir: ${workSpaceDir}`);
        let azurePrResponse;
        let bridgeVersion = "";
        let productOutputFilPath = "";
        try {
            const bridge = new bridge_cli_1.BridgeCli();
            (0, input_1.showLogForDeprecatedInputs)();
            // Prepare tool commands
            const command = yield bridge.prepareCommand(tempDir);
            let bridgePath = "";
            if (!inputs.ENABLE_NETWORK_AIRGAP) {
                bridgePath = yield bridge.downloadAndExtractBridgeCli(tempDir);
            }
            else {
                console.log(application_constant_1.NETWORK_AIR_GAP_ENABLED_SKIP_DOWNLOAD_BRIDGE_CLI);
                bridgePath = yield bridge.getBridgeCliPath();
            }
            // Get Bridge version from bridge Path
            bridgeVersion = getBridgeVersion(bridgePath);
            taskLib.debug(`bridgePath: ${bridgeVersion}`);
            // Execute prepared commands
            const result = yield bridge.executeBridgeCliCommand(bridgePath, (0, utility_1.getWorkSpaceDirectory)(), command);
            // Extract Sarif file out file from the out.json file
            productOutputFilPath = util.extractOutputJsonFilename(command);
            taskLib.debug(`Product out file path: ${productOutputFilPath}`);
            if (inputs.POLARIS_REPORTS_SARIF_CREATE === "true" ||
                inputs.BLACKDUCKSCA_REPORTS_SARIF_CREATE === "true") {
                // Copy Sarif file from out.json to integration default directory
                util.copySarifFileToIntegrationDefaultPath(productOutputFilPath);
            }
            // The statement set the exit code in the 'status' variable which can be used in the YAML file
            if ((0, utility_1.parseToBoolean)(inputs.RETURN_STATUS)) {
                console.log(application_constant_1.TASK_RETURN_STATUS);
            }
        }
        catch (error) {
            throw error;
        }
        finally {
            if ((0, utility_1.parseToBoolean)(inputs.BLACKDUCKSCA_REPORTS_SARIF_CREATE)) {
                if (!utility_1.IS_PR_EVENT) {
                    console.log(application_constant_1.BLACKDUCKSCA_SARIF_REPOST_ENABLED);
                    if (bridgeVersion < constants.VERSION) {
                        (0, diagnostics_1.uploadSarifResultAsArtifact)(constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY, inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH);
                    }
                }
                else {
                    (0, diagnostics_1.uploadSarifResultAsArtifact)(constants.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY, inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH);
                }
            }
            if ((0, utility_1.parseToBoolean)(inputs.POLARIS_REPORTS_SARIF_CREATE)) {
                if (!utility_1.IS_PR_EVENT) {
                    console.log(application_constant_1.POLARISSCA_SARIF_REPORT_ENABLED);
                    if (bridgeVersion < constants.VERSION) {
                        (0, diagnostics_1.uploadSarifResultAsArtifact)(constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY, inputs.POLARIS_REPORTS_SARIF_FILE_PATH);
                    }
                    else {
                        (0, diagnostics_1.uploadSarifResultAsArtifact)(constants.INTEGRATIONS_DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY, inputs.POLARIS_REPORTS_SARIF_FILE_PATH);
                    }
                }
            }
            if ((0, utility_1.parseToBoolean)(inputs.INCLUDE_DIAGNOSTICS)) {
                (0, diagnostics_1.uploadDiagnostics)(workSpaceDir);
            }
        }
        console.log(application_constant_1.BLACKDUCKSCA_SECURITY_SCAN_COMPLETED);
    });
}
exports.run = run;
function getExitMessage(message, exitCode) {
    return constants.EXIT_CODE_MAP.has(exitCode)
        ? "Exit Code: " + exitCode + " - " + constants.EXIT_CODE_MAP.get(exitCode)
        : "Exit Code: " +
            ErrorCodes_1.ErrorCode.UNDEFINED_ERROR_FROM_EXTENSION.toString() +
            " - " +
            "Undefined error from extension: " +
            message;
}
exports.getExitMessage = getExitMessage;
function getStatusFromError(errorObject) {
    return errorObject.message.trim().split(" ").pop() || "";
}
exports.getStatusFromError = getStatusFromError;
function markBuildStatusIfIssuesArePresent(status, taskResult, errorMessage) {
    const exitMessage = getExitMessage(errorMessage, status);
    if (status == ErrorCodes_1.ErrorCode.BRIDGE_BREAK_ENABLED.toString()) {
        console.log(errorMessage);
        if (taskResult === task_1.TaskResult.Succeeded) {
            console.log(exitMessage);
        }
        console.log(application_constant_1.MARK_THE_BUILD_ON_BRIDGE_BREAK);
        taskLib.setResult(taskResult, exitMessage);
    }
    else {
        taskLib.error(errorMessage);
        console.log(application_constant_1.MARK_THE_BUILD_STATUS);
        taskLib.setResult(taskLib.TaskResult.Failed, application_constant_1.WORKFLOW_FAILED.concat(exitMessage));
    }
}
// Extract version number from bridge path
function getBridgeVersion(bridgePath) {
    try {
        const versionFilePath = (0, path_1.join)(bridgePath, "versions.txt");
        const content = (0, fs_1.readFileSync)(versionFilePath, "utf-8");
        const match = content.match(/bridge-cli-bundle:\s*([0-9.]+)/);
        if (match && match[1]) {
            return match[1];
        }
        return "";
    }
    catch (error) {
        return "";
    }
}
run().catch((error) => {
    if (error.message != undefined) {
        const isReturnStatusEnabled = (0, utility_1.parseToBoolean)(inputs.RETURN_STATUS);
        const status = getStatusFromError(error);
        // The statement set the exit code in the 'status' variable which can be used in the YAML file
        if (isReturnStatusEnabled) {
            console.log(application_constant_1.TASK_RETURN_STATUS);
        }
        const taskResult = (0, utility_1.getMappedTaskResult)(inputs.MARK_BUILD_STATUS);
        if (taskResult !== undefined && taskResult !== task_1.TaskResult.Failed) {
            markBuildStatusIfIssuesArePresent(status, taskResult, error.message);
        }
        else {
            taskLib.error(error.message);
            taskLib.setResult(taskLib.TaskResult.Failed, application_constant_1.WORKFLOW_FAILED.concat(getExitMessage(error.message, status)));
        }
    }
});

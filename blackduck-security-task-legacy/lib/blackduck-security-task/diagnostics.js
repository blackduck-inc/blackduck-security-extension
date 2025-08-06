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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSarifResultAsArtifact = exports.uploadDiagnostics = void 0;
const taskLib = __importStar(require("azure-pipelines-task-lib/task"));
const constants = __importStar(require("./application-constant"));
const path = __importStar(require("path"));
const utility_1 = require("./utility");
function uploadDiagnostics(workspaceDir) {
    const uploadArtifactPath = path.join(workspaceDir, constants.BRIDGE_CLI_LOCAL_DIRECTORY);
    const uploadIntegrationDefaultArtifactPath = path.join(workspaceDir, constants.INTEGRATIONS_CLI_LOCAL_DIRECTORY);
    let isBridgeDirectoryExists = false;
    isBridgeDirectoryExists = taskLib.exist(uploadArtifactPath);
    if (isBridgeDirectoryExists) {
        taskLib.uploadArtifact(constants.UPLOAD_FOLDER_ARTIFACT_NAME, uploadArtifactPath, constants.UPLOAD_FOLDER_ARTIFACT_NAME);
    }
    else {
        taskLib.uploadArtifact(constants.UPLOAD_FOLDER_ARTIFACT_NAME, uploadIntegrationDefaultArtifactPath, constants.UPLOAD_FOLDER_ARTIFACT_NAME);
    }
}
exports.uploadDiagnostics = uploadDiagnostics;
function uploadSarifResultAsArtifact(defaultSarifReportDirectory, userSarifFilePath) {
    if (defaultSarifReportDirectory ===
        constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY ||
        defaultSarifReportDirectory ===
            constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY) {
        const sarifFilePath = userSarifFilePath
            ? userSarifFilePath
            : (0, utility_1.getDefaultSarifReportPath)(defaultSarifReportDirectory, true);
        let isSarifReportDirectoryExists = false;
        isSarifReportDirectoryExists = taskLib.exist(sarifFilePath);
        if (isSarifReportDirectoryExists) {
            console.log(`Uploading SARIF report as artifact from: ${sarifFilePath}`);
            taskLib.uploadArtifact(constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME, sarifFilePath, constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME);
            console.log("Upload SARIF report successfully in the artifact");
        }
        else {
            console.log(`Uploading SARIF report as artifact failed as file path not found at: ${sarifFilePath}`);
        }
    }
    else {
        const sarifFilePath = userSarifFilePath
            ? userSarifFilePath
            : (0, utility_1.getIntegrationDefaultSarifReportPath)(defaultSarifReportDirectory, true);
        let isSarifReportDirectoryExists = false;
        isSarifReportDirectoryExists = taskLib.exist(sarifFilePath);
        if (isSarifReportDirectoryExists) {
            console.log(`Uploading SARIF report as artifact from: ${sarifFilePath}`);
            taskLib.uploadArtifact(constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME, sarifFilePath, constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME);
            console.log("Upload SARIF report successfully in the artifact");
        }
        else {
            console.log(`Uploading SARIF report as artifact failed as file path not found at: ${sarifFilePath}`);
        }
    }
}
exports.uploadSarifResultAsArtifact = uploadSarifResultAsArtifact;

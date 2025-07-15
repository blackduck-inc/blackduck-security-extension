// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as constants from "./application-constant";
import * as path from "path";
import {
  getDefaultSarifReportPath,
  getIntegrationDefaultSarifReportPath,
} from "./utility";

export function uploadDiagnostics(workspaceDir: string) {
  const uploadArtifactPath = path.join(
    workspaceDir,
    constants.BRIDGE_CLI_LOCAL_DIRECTORY
  );
  taskLib.debug("workspaceDir::: " + workspaceDir);
  taskLib.debug("constant::: " + constants.BRIDGE_CLI_LOCAL_DIRECTORY);
  taskLib.debug("uploadArtifactPath::: " + uploadArtifactPath);
  let isBridgeDirectoryExists = false;
  isBridgeDirectoryExists = taskLib.exist(uploadArtifactPath);
  if (isBridgeDirectoryExists) {
    taskLib.uploadArtifact(
      constants.UPLOAD_FOLDER_ARTIFACT_NAME,
      uploadArtifactPath,
      constants.UPLOAD_FOLDER_ARTIFACT_NAME
    );
  }
}

export function uploadSarifResultAsArtifact(
  defaultSarifReportDirectory: string,
  userSarifFilePath: string
) {
  if (
    defaultSarifReportDirectory ===
      constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY ||
    defaultSarifReportDirectory ===
      constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY
  ) {
    const sarifFilePath = userSarifFilePath
      ? userSarifFilePath
      : getDefaultSarifReportPath(defaultSarifReportDirectory, true);

    let isSarifReportDirectoryExists = false;
    isSarifReportDirectoryExists = taskLib.exist(sarifFilePath);
    if (isSarifReportDirectoryExists) {
      console.log(`Uploading SARIF report as artifact from: ${sarifFilePath}`);
      taskLib.uploadArtifact(
        constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME,
        sarifFilePath,
        constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME
      );
      console.log("Upload SARIF report successfully in the artifact");
    } else {
      console.log(
        `Uploading SARIF report as artifact failed as file path not found at: ${sarifFilePath}`
      );
    }
  } else {
    const sarifFilePath = userSarifFilePath
      ? userSarifFilePath
      : getIntegrationDefaultSarifReportPath(defaultSarifReportDirectory, true);

    let isSarifReportDirectoryExists = false;
    isSarifReportDirectoryExists = taskLib.exist(sarifFilePath);
    if (isSarifReportDirectoryExists) {
      console.log(`Uploading SARIF report as artifact from: ${sarifFilePath}`);
      taskLib.uploadArtifact(
        constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME,
        sarifFilePath,
        constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME
      );
      console.log("Upload SARIF report successfully in the artifact");
    } else {
      console.log(
        `Uploading SARIF report as artifact failed as file path not found at: ${sarifFilePath}`
      );
    }
  }
}

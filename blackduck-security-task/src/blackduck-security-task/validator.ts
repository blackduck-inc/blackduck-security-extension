// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import * as constants from "./application-constant";
import * as inputs from "./input";
import * as taskLib from "azure-pipelines-task-lib/task";
import { ErrorCode } from "./enum/ErrorCodes";
import { INVALID_BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES } from "./application-constant";

export function validateScanTypes(): string[] {
  const paramsMap = new Map();
  paramsMap.set(constants.POLARIS_SERVER_URL_KEY, inputs.POLARIS_SERVER_URL);
  paramsMap.set(constants.BLACKDUCKSCA_URL_KEY, inputs.BLACKDUCKSCA_URL);
  paramsMap.set(constants.COVERITY_URL_KEY, inputs.COVERITY_URL);
  paramsMap.set(constants.SRM_URL_KEY, inputs.SRM_URL);
  return isNullOrEmpty(paramsMap);
}

export function validatePolarisInputs(): string[] {
  let errors: string[] = [];
  if (inputs.POLARIS_SERVER_URL) {
    const paramsMap = new Map();
    paramsMap.set(
      constants.POLARIS_ACCESS_TOKEN_KEY,
      inputs.POLARIS_ACCESS_TOKEN
    );
    paramsMap.set(constants.POLARIS_SERVER_URL_KEY, inputs.POLARIS_SERVER_URL);
    paramsMap.set(
      constants.POLARIS_ASSESSMENT_TYPES_KEY,
      inputs.POLARIS_ASSESSMENT_TYPES
    );
    errors = validateParameters(paramsMap, constants.POLARIS_KEY);
  }
  return errors;
}

export function validateParameters(
  params: Map<string, string>,
  toolName: string
): string[] {
  const invalidParams: string[] = isNullOrEmpty(params);
  const errors: string[] = [];
  if (invalidParams.length > 0) {
    errors.push(
      `[${invalidParams.join()}] - required parameters for ${toolName} is missing`
        .concat(constants.SPACE)
        .concat(ErrorCode.MISSING_REQUIRED_PARAMETERS.toString())
    );
  }
  return errors;
}

export function isNullOrEmpty(params: Map<string, string>): string[] {
  const invalidParams: string[] = [];
  for (const param of params.entries()) {
    if (param[1] == null || param[1].length === 0) {
      invalidParams.push(param[0]);
    }
  }
  return invalidParams;
}

export function validateBridgeUrl(url: string): boolean {
  if (!url.match(".*\\.(zip|ZIP)$")) {
    return false;
  }
  const osName = process.platform;
  taskLib.debug("osName:::" + osName);
  const fileNameComponent = url.substring(url.lastIndexOf("/"), url.length);
  if (osName === "darwin") {
    return fileNameComponent.toLowerCase().includes("mac");
  } else if (osName === "linux") {
    return fileNameComponent.toLowerCase().includes("linux");
  } else if (osName === "win32") {
    return fileNameComponent.toLowerCase().includes("win");
  } else {
    return false;
  }
}

export function validateCoverityInputs(): string[] {
  let errors: string[] = [];
  if (inputs.COVERITY_URL) {
    const paramsMap = new Map();
    paramsMap.set(constants.COVERITY_USER_KEY, inputs.COVERITY_USER);
    paramsMap.set(
      constants.COVERITY_PASSPHRASE_KEY,
      inputs.COVERITY_USER_PASSWORD
    );
    paramsMap.set(constants.COVERITY_URL_KEY, inputs.COVERITY_URL);
    errors = validateParameters(paramsMap, constants.COVERITY_KEY);
  }
  return errors;
}

export function validateCoverityInstallDirectoryParam(
  installDir: string
): boolean {
  if (
    installDir != null &&
    installDir.length > 0 &&
    !taskLib.exist(installDir)
  ) {
    taskLib.error(
      `[${constants.COVERITY_INSTALL_DIRECTORY_KEY}] parameter for Coverity is invalid`
        .concat(constants.SPACE)
        .concat(ErrorCode.INVALID_COVERITY_INSTALL_DIRECTORY.toString())
    );
    return false;
  }
  return true;
}

export function validateBlackduckFailureSeverities(
  severities: string[]
): boolean {
  if (severities == null || severities.length === 0) {
    taskLib.error(
      INVALID_BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES.concat(
        constants.SPACE
      ).concat(ErrorCode.INVALID_BLACKDUCKSCA_FAILURE_SEVERITIES.toString())
    );
    return false;
  }
  return true;
}

export function validateBlackDuckSCAInputs(): string[] {
  let errors: string[] = [];
  if (inputs.BLACKDUCKSCA_URL) {
    const paramsMap = new Map();
    paramsMap.set(constants.BLACKDUCKSCA_URL_KEY, inputs.BLACKDUCKSCA_URL);
    paramsMap.set(
      constants.BLACKDUCKSCA_TOKEN_KEY,
      inputs.BLACKDUCKSCA_API_TOKEN
    );
    errors = validateParameters(paramsMap, constants.BLACKDUCKSCA_KEY);
  }
  return errors;
}
export function validateSrmInputs(): string[] {
  let errors: string[] = [];
  if (inputs.SRM_URL) {
    const paramsMap = new Map();
    paramsMap.set(constants.SRM_URL_KEY, inputs.SRM_URL);
    paramsMap.set(constants.SRM_APIKEY_KEY, inputs.SRM_APIKEY);
    paramsMap.set(
      constants.SRM_ASSESSMENT_TYPES_KEY,
      inputs.SRM_ASSESSMENT_TYPES
    );
    errors = validateParameters(paramsMap, constants.SRM_KEY);
  }
  return errors;
}

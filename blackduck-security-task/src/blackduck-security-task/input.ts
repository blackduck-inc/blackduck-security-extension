// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as constants from "./application-constant";
import { POLARIS_ASSESSMENT_MODES } from "./model/polaris";

const deprecatedInputs: string[] = [];

export function getInput(
  newKey: string,
  classicEditorKey: string,
  deprecatedKey: string | null
) {
  const key = getInputForYMLAndDeprecatedKey(newKey, deprecatedKey);
  if (key) {
    return key;
  }
  const classEditorInput = taskLib.getInput(classicEditorKey);
  if (classEditorInput) {
    return classEditorInput?.trim();
  }

  return "";
}

export function getInputForMultipleClassicEditor(
  newKey: string,
  polarisClassicEditorKey: string,
  blackduckSCAClassicEditorKey: string,
  coverityClassicEditorKey: string,
  srmClassicEditorKey: string | null,
  deprecatedKey: string | null
) {
  const key = getInputForYMLAndDeprecatedKey(newKey, deprecatedKey);
  if (key) {
    return key;
  }

  const scanType = taskLib.getInput(constants.SCAN_TYPE_KEY);
  let classEditorInput;
  if (polarisClassicEditorKey.length > 0 && scanType == constants.POLARIS_KEY) {
    classEditorInput = taskLib.getInput(polarisClassicEditorKey);
  } else if (
    blackduckSCAClassicEditorKey.length > 0 &&
    scanType == constants.BLACKDUCKSCA_KEY
  ) {
    classEditorInput = taskLib.getInput(blackduckSCAClassicEditorKey);
  } else if (
    coverityClassicEditorKey.length > 0 &&
    scanType == constants.COVERITY_KEY
  ) {
    classEditorInput = taskLib.getInput(coverityClassicEditorKey);
  } else if (
    srmClassicEditorKey &&
    srmClassicEditorKey?.length > 0 &&
    scanType == constants.SRM_KEY
  ) {
    classEditorInput = taskLib.getInput(srmClassicEditorKey);
  }
  if (classEditorInput) {
    return classEditorInput?.trim();
  }

  return "";
}

export function getArbitraryInputs(
  yamlKey: string,
  classicEditorKey: string,
  classicEditorKeyForPolaris: string,
  classicEditorKeyForSrm: string,
  deprecatedKey: string | null
) {
  const scanType = taskLib.getInput(constants.SCAN_TYPE_KEY);
  if (
    classicEditorKeyForPolaris.length > 0 &&
    scanType == constants.POLARIS_KEY
  ) {
    return taskLib.getInput(classicEditorKeyForPolaris);
  } else if (
    classicEditorKeyForSrm.length > 0 &&
    scanType == constants.SRM_KEY
  ) {
    return taskLib.getInput(classicEditorKeyForSrm);
  } else if (
    classicEditorKey.length > 0 &&
    (scanType == constants.COVERITY_KEY ||
      scanType == constants.BLACKDUCKSCA_KEY)
  ) {
    return taskLib.getInput(classicEditorKey);
  }
  return getInputForYMLAndDeprecatedKey(yamlKey, deprecatedKey);
}
export function getInputForYMLAndDeprecatedKey(
  newKey: string,
  deprecatedKey: string | null
) {
  const newInput = taskLib.getInput(newKey);
  if (newInput) {
    return newInput?.trim();
  }

  let deprecatedInput;
  if (deprecatedKey) {
    deprecatedInput = taskLib.getInput(deprecatedKey);
    if (deprecatedInput) {
      deprecatedInputs.push(deprecatedKey);
      return deprecatedInput?.trim();
    }
  }
  return "";
}

export function getBoolInput(
  newKey: string,
  classicEditorKey: string,
  deprecatedKey: string | null
) {
  let deprecatedInput;
  if (deprecatedKey) {
    deprecatedInput = taskLib.getBoolInput(deprecatedKey);
    if (deprecatedInput) {
      deprecatedInputs.push(deprecatedKey);
    }
  }

  return (
    taskLib.getBoolInput(newKey) ||
    deprecatedInput ||
    taskLib.getBoolInput(classicEditorKey)
  );
}

export function getPathInput(
  newKey: string,
  classicEditorKey: string,
  deprecatedKey: string | null
) {
  let deprecatedInput;
  if (deprecatedKey) {
    deprecatedInput = taskLib.getPathInput(deprecatedKey);
    if (deprecatedInput) {
      deprecatedInputs.push(deprecatedKey);
    }
  }

  return (
    taskLib.getPathInput(newKey)?.trim() ||
    deprecatedInput?.trim() ||
    taskLib.getPathInput(classicEditorKey)?.trim() ||
    ""
  );
}

export function getDelimitedInput(
  newKey: string,
  classicEditorKey: string,
  deprecatedKey: string | null
) {
  const newKeyInput = taskLib.getDelimitedInput(newKey, ",");
  const classicEditorInput = taskLib.getDelimitedInput(classicEditorKey, ",");
  let deprecatedInput: string[] = [];
  if (deprecatedKey) {
    deprecatedInput = taskLib.getDelimitedInput(deprecatedKey, ",");
    if (deprecatedInput.length > 0) {
      deprecatedInputs.push(deprecatedKey);
    }
  }

  return (
    (newKeyInput.length > 0 && newKeyInput) ||
    (deprecatedInput.length > 0 && deprecatedInput) ||
    (classicEditorInput.length > 0 && classicEditorInput) ||
    []
  );
}

export function showLogForDeprecatedInputs() {
  if (deprecatedInputs.length > 0) {
    console.log(
      `[${deprecatedInputs.join(
        ","
      )}] is/are deprecated for YAML. Check documentation for new parameters: ${
        constants.BLACKDUCKSCA_SECURITY_SCAN_AZURE_DEVOPS_DOCS_URL
      }`
    );
  }
}

function getInputForPolarisAssessmentMode() {
  return (
    taskLib.getInput(constants.POLARIS_ASSESSMENT_MODE_KEY)?.trim() ||
    (taskLib
      .getInput(constants.POLARIS_ASSESSMENT_MODE_KEY_CLASSIC_EDITOR)
      ?.trim() === POLARIS_ASSESSMENT_MODES.CI
      ? POLARIS_ASSESSMENT_MODES.CI
      : taskLib
          .getInput(constants.POLARIS_ASSESSMENT_MODE_KEY_CLASSIC_EDITOR)
          ?.trim() === POLARIS_ASSESSMENT_MODES.SOURCEUPLOAD
      ? POLARIS_ASSESSMENT_MODES.SOURCE_UPLOAD
      : "")
  );
}

//Bridge download url
export const BRIDGECLI_DOWNLOAD_URL = getInput(
  constants.BRIDGECLI_DOWNLOAD_URL_KEY,
  constants.BRIDGECLI_DOWNLOAD_URL_KEY_CLASSIC_EDITOR,
  constants.SYNOPSYS_BRIDGE_DOWNLOAD_URL_KEY
);

export const ENABLE_NETWORK_AIRGAP = getBoolInput(
  constants.NETWORK_AIRGAP_KEY,
  constants.NETWORK_AIRGAP_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_NETWORK_AIRGAP_KEY
);

export const BRIDGECLI_INSTALL_DIRECTORY_KEY = getPathInput(
  constants.BRIDGECLI_INSTALL_DIRECTORY_KEY,
  constants.BRIDGECLI_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR,
  constants.SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY
);

export const BRIDGECLI_DOWNLOAD_VERSION = getInput(
  constants.BRIDGECLI_DOWNLOAD_VERSION_KEY,
  constants.BRIDGECLI_DOWNLOAD_VERSION_KEY_CLASSIC_EDITOR,
  constants.SYNOPSYS_BRIDGE_DOWNLOAD_VERSION_KEY
);

export const INCLUDE_DIAGNOSTICS = getInputForMultipleClassicEditor(
  constants.INCLUDE_DIAGNOSTICS_KEY,
  constants.POLARIS_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCKSCA_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR,
  constants.COVERITY_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR,
  constants.SRM_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR,
  null
);

export const AZURE_TOKEN = getInputForMultipleClassicEditor(
  constants.AZURE_TOKEN_KEY,
  constants.POLARIS_AZURE_TOKEN_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCKSCA_AZURE_TOKEN_KEY_CLASSIC_EDITOR,
  constants.COVERITY_AZURE_TOKEN_KEY_CLASSIC_EDITOR,
  null,
  null
);

export const SCAN_TYPE =
  taskLib.getInput(constants.SCAN_TYPE_KEY)?.trim() || "";

// Polaris related inputs
export const POLARIS_SERVER_URL = getInput(
  constants.POLARIS_SERVER_URL_KEY,
  constants.POLARIS_SERVER_URL_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_ACCESS_TOKEN = getInput(
  constants.POLARIS_ACCESS_TOKEN_KEY,
  constants.POLARIS_ACCESS_TOKEN_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_APPLICATION_NAME = getInput(
  constants.POLARIS_APPLICATION_NAME_KEY,
  constants.POLARIS_APPLICATION_NAME_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_PROJECT_NAME = getInput(
  constants.POLARIS_PROJECT_NAME_KEY,
  constants.POLARIS_PROJECT_NAME_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_ASSESSMENT_TYPES = getDelimitedInput(
  constants.POLARIS_ASSESSMENT_TYPES_KEY,
  constants.POLARIS_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_BRANCH_NAME = getInput(
  constants.POLARIS_BRANCH_NAME_KEY,
  constants.POLARIS_BRANCH_NAME_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_BRANCH_PARENT_NAME = getInput(
  constants.POLARIS_BRANCH_PARENT_NAME_KEY,
  constants.POLARIS_BRANCH_PARENT_NAME_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_TEST_SCA_TYPE = getInput(
  constants.POLARIS_TEST_SCA_TYPE_KEY,
  constants.POLARIS_TEST_SCA_TYPE_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_TEST_SAST_TYPE = getInput(
  constants.POLARIS_TEST_SAST_TYPE_KEY,
  constants.POLARIS_TEST_SAST_TYPE_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_WAITFORSCAN = getInput(
  constants.POLARIS_WAITFORSCAN_KEY,
  constants.POLARIS_WAITFORSCAN_KEY_CLASSIC_EDITOR,
  null
);

export const POLARIS_ASSESSMENT_MODE = getInputForPolarisAssessmentMode();

export const POLARIS_PROJECT_DIRECTORY = getInput(
  constants.PROJECT_DIRECTORY_KEY,
  constants.POLARIS_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR,
  null
);
export const PROJECT_SOURCE_ARCHIVE = getInput(
  constants.PROJECT_SOURCE_ARCHIVE_KEY,
  constants.PROJECT_SOURCE_ARCHIVE_KEY_CLASSIC_EDITOR,
  null
);
export const PROJECT_SOURCE_PRESERVE_SYM_LINKS = getInput(
  constants.PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY,
  constants.PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY_CLASSIC_EDITOR,
  null
);
export const PROJECT_SOURCE_EXCLUDES = getDelimitedInput(
  constants.PROJECT_SOURCE_EXCLUDES_KEY,
  constants.PROJECT_SOURCE_EXCLUDES_KEY_CLASSIC_EDITOR,
  null
);

export const POLARIS_PR_COMMENT_ENABLED = getInput(
  constants.POLARIS_PR_COMMENT_ENABLED_KEY,
  constants.POLARIS_PR_COMMENT_ENABLED_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_PR_COMMENT_SEVERITIES = getDelimitedInput(
  constants.POLARIS_PR_COMMENT_SEVERITIES_KEY,
  constants.POLARIS_PR_COMMENT_SEVERITIES_KEY_CLASSIC_EDITOR,
  null
);

export const POLARIS_REPORTS_SARIF_CREATE = getInput(
  constants.POLARIS_REPORTS_SARIF_CREATE_KEY,
  constants.POLARIS_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_REPORTS_SARIF_FILE_PATH = getInput(
  constants.POLARIS_REPORTS_SARIF_FILE_PATH_KEY,
  constants.POLARIS_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_REPORTS_SARIF_SEVERITIES = getDelimitedInput(
  constants.POLARIS_REPORTS_SARIF_SEVERITIES_KEY,
  constants.POLARIS_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES = getInput(
  constants.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY,
  constants.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR,
  null
);
export const POLARIS_REPORTS_SARIF_ISSUE_TYPES = getDelimitedInput(
  constants.POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY,
  constants.POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY_CLASSIC_EDITOR,
  null
);

// Coverity related inputs
export const COVERITY_URL = getInput(
  constants.COVERITY_URL_KEY,
  constants.COVERITY_URL_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_USER = getInput(
  constants.COVERITY_USER_KEY,
  constants.COVERITY_USER_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_USER_PASSWORD = getInput(
  constants.COVERITY_PASSPHRASE_KEY,
  constants.COVERITY_PASSPHRASE_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_PROJECT_NAME = getInput(
  constants.COVERITY_PROJECT_NAME_KEY,
  constants.COVERITY_PROJECT_NAME_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_STREAM_NAME = getInput(
  constants.COVERITY_STREAM_NAME_KEY,
  constants.COVERITY_STREAM_NAME_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_INSTALL_DIRECTORY = getPathInput(
  constants.COVERITY_INSTALL_DIRECTORY_KEY,
  constants.COVERITY_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_EXECUTION_PATH = getPathInput(
  constants.COVERITY_EXECUTION_PATH_KEY,
  constants.COVERITY_EXECUTION_PATH_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_POLICY_VIEW = getInput(
  constants.COVERITY_POLICY_VIEW_KEY,
  constants.COVERITY_POLICY_VIEW_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_LOCAL = getInput(
  constants.COVERITY_LOCAL_KEY,
  constants.COVERITY_LOCAL_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_AUTOMATION_PRCOMMENT = getBoolInput(
  constants.COVERITY_PRCOMMENT_ENABLED_KEY,
  constants.COVERITY_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_VERSION = getInput(
  constants.COVERITY_VERSION_KEY,
  constants.COVERITY_VERSION_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_WAITFORSCAN = getInput(
  constants.COVERITY_WAITFORSCAN_KEY,
  constants.COVERITY_WAITFORSCAN_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_PROJECT_DIRECTORY = getInput(
  constants.PROJECT_DIRECTORY_KEY,
  constants.COVERITY_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR,
  null
);

export const COVERITY_BUILD_COMMAND = getArbitraryInputs(
  constants.COVERITY_BUILD_COMMAND_KEY,
  constants.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR,
  constants.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR_FOR_POLARIS,
  constants.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR_FOR_SRM,
  null
);
export const COVERITY_CLEAN_COMMAND = getArbitraryInputs(
  constants.COVERITY_CLEAN_COMMAND_KEY,
  constants.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR,
  constants.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR_FOR_POLARIS,
  constants.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR_FOR_SRM,
  null
);
export const COVERITY_CONFIG_PATH = getArbitraryInputs(
  constants.COVERITY_CONFIG_PATH_KEY,
  constants.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR,
  constants.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_POLARIS,
  constants.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_SRM,
  null
);
export const COVERITY_ARGS = getArbitraryInputs(
  constants.COVERITY_ARGS_KEY,
  constants.COVERITY_ARGS_KEY_CLASSIC_EDITOR,
  constants.COVERITY_ARGS_KEY_CLASSIC_EDITOR_FOR_POLARIS,
  constants.COVERITY_ARGS_KEY_CLASSIC_EDITOR_FOR_SRM,
  null
);

// Blackduck related inputs
export const BLACKDUCKSCA_URL = getInput(
  constants.BLACKDUCKSCA_URL_KEY,
  constants.BLACKDUCKSCA_URL_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_URL_KEY
);
export const BLACKDUCKSCA_API_TOKEN = getInput(
  constants.BLACKDUCKSCA_TOKEN_KEY,
  constants.BLACKDUCKSCA_TOKEN_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_TOKEN_KEY
);
export const DETECT_INSTALL_DIRECTORY = getPathInput(
  constants.DETECT_INSTALL_DIRECTORY_KEY,
  constants.DETECT_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_INSTALL_DIRECTORY_KEY
);
export const DETECT_EXECUTION_PATH = getPathInput(
  constants.DETECT_EXECUTION_PATH_KEY,
  constants.DETECT_EXECUTION_PATH_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_EXECUTION_PATH_KEY
);
export const BLACKDUCKSCA_SCAN_FULL = getInput(
  constants.BLACKDUCKSCA_SCAN_FULL_KEY,
  constants.BLACKDUCKSCA_SCAN_FULL_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_SCAN_FULL_KEY
);
export const BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES = getDelimitedInput(
  constants.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY,
  constants.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY
);

export const BLACKDUCKSCA_FIXPR_ENABLED = getBoolInput(
  constants.BLACKDUCKSCA_FIXPR_ENABLED_KEY,
  constants.BLACKDUCKSCA_FIXPR_ENABLED_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_FIXPR_ENABLED_KEY
);
export const BLACKDUCKSCA_PRCOMMENT_ENABLED = getBoolInput(
  constants.BLACKDUCKSCA_PRCOMMENT_ENABLED_KEY,
  constants.BLACKDUCKSCA_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_PRCOMMENT_ENABLED_KEY
);
export const BLACKDUCKSCA_FIXPR_MAXCOUNT = getInput(
  constants.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY,
  constants.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_FIXPR_MAXCOUNT_KEY
);
export const BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR = getInput(
  constants.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY,
  constants.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY
);
export const BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES = getDelimitedInput(
  constants.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES_KEY,
  constants.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY
);
export const BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE = getDelimitedInput(
  constants.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE_KEY,
  constants.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_FIXPR_UPGRADE_GUIDANCE_KEY
);
export const BLACKDUCKSCA_REPORTS_SARIF_CREATE = getInput(
  constants.BLACKDUCKSCA_REPORTS_SARIF_CREATE_KEY,
  constants.BLACKDUCKSCA_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_REPORTS_SARIF_CREATE_KEY
);
export const BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH = getInput(
  constants.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH_KEY,
  constants.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY
);
export const BLACKDUCKSCA_PROJECT_DIRECTORY = getInput(
  constants.PROJECT_DIRECTORY_KEY,
  constants.BLACKDUCKSCA_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR,
  null
);
export const BLACKDUCKSCA_WAITFORSCAN = getInput(
  constants.BLACKDUCKSCA_WAITFORSCAN_KEY,
  constants.BLACKDUCKSCA_WAITFORSCAN_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_WAITFORSCAN_KEY
);

export const BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES = getDelimitedInput(
  constants.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES_KEY,
  constants.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY
);

export const BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES = getInput(
  constants.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY,
  constants.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY
);

export const DETECT_SEARCH_DEPTH = getArbitraryInputs(
  constants.DETECT_SEARCH_DEPTH_KEY,
  constants.DETECT_DEPTH_KEY_CLASSIC_EDITOR,
  constants.DETECT_DEPTH_KEY_CLASSIC_EDITOR_FOR_POLARIS,
  constants.DETECT_DEPTH_KEY_CLASSIC_EDITOR_FOR_SRM,
  constants.BLACKDUCK_SEARCH_DEPTH_KEY
);
export const DETECT_CONFIG_PATH = getArbitraryInputs(
  constants.DETECT_CONFIG_PATH_KEY,
  constants.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR,
  constants.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_POLARIS,
  constants.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_SRM,
  constants.BLACKDUCK_CONFIG_PATH_KEY
);
export const DETECT_ARGS = getArbitraryInputs(
  constants.DETECT_ARGS_KEY,
  constants.DETECT_ARGS_KEY_CLASSIC_EDITOR,
  constants.DETECT_ARGS_KEY_CLASSIC_EDITOR_FOR_POLARIS,
  constants.DETECT_ARGS_KEY_CLASSIC_EDITOR_FOR_SRM,
  constants.BLACKDUCK_ARGS_KEY
);

//SRM inputs
export const SRM_URL = getInput(
  constants.SRM_URL_KEY,
  constants.SRM_URL_KEY_CLASSIC_EDITOR,
  null
);
export const SRM_APIKEY = getInput(
  constants.SRM_APIKEY_KEY,
  constants.SRM_APIKEY_KEY_CLASSIC_EDITOR,
  null
);
export const SRM_ASSESSMENT_TYPES = getDelimitedInput(
  constants.SRM_ASSESSMENT_TYPES_KEY,
  constants.SRM_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR,
  null
);
export const SRM_PROJECT_NAME = getInput(
  constants.SRM_PROJECT_NAME_KEY,
  constants.SRM_PROJECT_NAME_KEY_CLASSIC_EDITOR,
  null
);
export const SRM_PROJECT_ID = getInput(
  constants.SRM_PROJECT_ID_KEY,
  constants.SRM_PROJECT_ID_KEY_CLASSIC_EDITOR,
  null
);
export const SRM_BRANCH_NAME = getInput(
  constants.SRM_BRANCH_NAME_KEY,
  constants.SRM_BRANCH_NAME_KEY_CLASSIC_EDITOR,
  null
);
export const SRM_BRANCH_PARENT = getInput(
  constants.SRM_BRANCH_PARENT_KEY,
  constants.SRM_BRANCH_PARENT_KEY_CLASSIC_EDITOR,
  null
);
export const SRM_WAITFORSCAN = getInput(
  constants.SRM_WAITFORSCAN_KEY,
  constants.SRM_WAITFORSCAN_KEY_CLASSIC_EDITOR,
  null
);
export const SRM_PROJECT_DIRECTORY = getInput(
  constants.PROJECT_DIRECTORY_KEY,
  constants.SRM_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR,
  null
);

export const RETURN_STATUS =
  taskLib.getInput(constants.RETURN_STATUS_KEY)?.trim() || "true";

export const MARK_BUILD_STATUS = getInputForMultipleClassicEditor(
  constants.MARK_BUILD_STATUS_KEY,
  constants.POLARIS_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR,
  constants.BLACKDUCKSCA_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR,
  constants.COVERITY_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR,
  constants.SRM_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR,
  null
);
export const NETWORK_SSL_CERT_FILE = getInput(
  constants.NETWORK_SSL_CERT_FILE_KEY,
  constants.NETWORK_SSL_CERT_FILE_KEY_CLASSIC_EDITOR,
  null
);

export const NETWORK_SSL_TRUST_ALL = getBoolInput(
  constants.NETWORK_SSL_TRUST_ALL_KEY,
  constants.NETWORK_SSL_TRUST_ALL_KEY_CLASSIC_EDITOR,
  null
);

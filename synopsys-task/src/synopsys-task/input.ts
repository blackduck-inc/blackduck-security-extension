import * as taskLib from "azure-pipelines-task-lib/task";
import * as constants from "./application-constant";
import { POLARIS_ASSESSMENT_MODES } from "./model/polaris";

const deprecatedInputs: string[] = [];

export function getInput(
  newKey: string,
  classicEditorKey: string,
  deprecatedKey: string | null
) {
  let deprecatedInput;
  if (deprecatedKey) {
    deprecatedInput = taskLib.getInput(deprecatedKey);
    if (deprecatedInput) {
      deprecatedInputs.push(deprecatedKey);
    }
  }

  return (
    taskLib.getInput(newKey)?.trim() ||
    taskLib.getInput(classicEditorKey)?.trim() ||
    deprecatedInput?.trim() ||
    ""
  );
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
    taskLib.getBoolInput(classicEditorKey) ||
    deprecatedInput
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
    taskLib.getPathInput(classicEditorKey)?.trim() ||
    deprecatedInput?.trim() ||
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
    (classicEditorInput.length > 0 && classicEditorInput) ||
    (deprecatedInput.length > 0 && deprecatedInput) ||
    []
  );
}

export function showLogForDeprecatedInputs() {
  if (deprecatedInputs.length > 0) {
    taskLib.warning(
      `[${deprecatedInputs.join(
        ","
      )}] is/are deprecated. Check documentation for new parameters: ${
        constants.SYNOPSYS_SECURITY_SCAN_AZURE_DEVOPS_DOCS_URL
      }`
    );
  }
}

//Bridge download url
export const BRIDGE_DOWNLOAD_URL = getInput(
  constants.SYNOPSYS_BRIDGE_DOWNLOAD_URL_KEY,
  constants.SYNOPSYS_BRIDGE_DOWNLOAD_URL_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_DOWNLOAD_URL_KEY
);

export const ENABLE_NETWORK_AIRGAP = getBoolInput(
  constants.NETWORK_AIRGAP_KEY,
  constants.NETWORK_AIRGAP_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_NETWORK_AIRGAP_KEY
);

export const SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY = getPathInput(
  constants.SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY,
  constants.SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR,
  null
);

export const BRIDGE_DOWNLOAD_VERSION = getInput(
  constants.SYNOPSYS_BRIDGE_DOWNLOAD_VERSION_KEY,
  constants.SYNOPSYS_BRIDGE_DOWNLOAD_VERSION_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_DOWNLOAD_VERSION_KEY
);

export const SCAN_TYPE =
  taskLib.getInput(constants.SCAN_TYPE_KEY)?.trim() || "";

export const INCLUDE_DIAGNOSTICS = getBoolInput(
  constants.INCLUDE_DIAGNOSTICS_KEY,
  constants.INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR,
  null
);

// Polaris related inputs
export const POLARIS_SERVER_URL = getInput(
  constants.POLARIS_SERVER_URL_KEY,
  constants.POLARIS_SERVER_URL_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_SERVER_URL_KEY
);
export const POLARIS_ACCESS_TOKEN = getInput(
  constants.POLARIS_ACCESS_TOKEN_KEY,
  constants.POLARIS_ACCESS_TOKEN_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_ACCESS_TOKEN_KEY
);
export const POLARIS_APPLICATION_NAME = getInput(
  constants.POLARIS_APPLICATION_NAME_KEY,
  constants.POLARIS_APPLICATION_NAME_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_APPLICATION_NAME_KEY
);
export const POLARIS_PROJECT_NAME = getInput(
  constants.POLARIS_PROJECT_NAME_KEY,
  constants.POLARIS_PROJECT_NAME_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_PROJECT_NAME_KEY
);
export const POLARIS_ASSESSMENT_TYPES = getDelimitedInput(
  constants.POLARIS_ASSESSMENT_TYPES_KEY,
  constants.POLARIS_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_ASSESSMENT_TYPES_KEY
);
export const POLARIS_TRIAGE = getInput(
  constants.POLARIS_TRIAGE_KEY,
  constants.POLARIS_TRIAGE_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_TRIAGE_KEY
);
export const POLARIS_BRANCH_NAME = getInput(
  constants.POLARIS_BRANCH_NAME_KEY,
  constants.POLARIS_BRANCH_NAME_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_BRANCH_NAME_KEY
);
export const POLARIS_BRANCH_PARENT_NAME = getInput(
  constants.POLARIS_BRANCH_PARENT_NAME_KEY,
  constants.POLARIS_BRANCH_PARENT_NAME_KEY_CLASSIC_EDITOR,
  null
);

export const POLARIS_ASSESSMENT_MODE =
  taskLib.getInput(constants.POLARIS_ASSESSMENT_MODE_KEY)?.trim() ||
  (taskLib
    .getInput(constants.POLARIS_ASSESSMENT_MODE_KEY_CLASSIC_EDITOR)
    ?.trim() === POLARIS_ASSESSMENT_MODES.CI
    ? POLARIS_ASSESSMENT_MODES.CI
    : taskLib
        .getInput(constants.POLARIS_ASSESSMENT_MODE_KEY_CLASSIC_EDITOR)
        ?.trim() === POLARIS_ASSESSMENT_MODES.SOURCEUPLOAD
    ? POLARIS_ASSESSMENT_MODES.SOURCE_UPLOAD
    : "");

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
export const PROJECT_SOURCE_PRESERVE_SYM_LINKS = getBoolInput(
  constants.PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY,
  constants.PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY_CLASSIC_EDITOR,
  null
);
export const PROJECT_SOURCE_EXCLUDES = getDelimitedInput(
  constants.PROJECT_SOURCE_EXCLUDES_KEY,
  constants.PROJECT_SOURCE_EXCLUDES_KEY_CLASSIC_EDITOR,
  null
);

export const POLARIS_PR_COMMENT_ENABLED = getBoolInput(
  constants.POLARIS_PR_COMMENT_ENABLED_KEY,
  constants.POLARIS_PR_COMMENT_ENABLED_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_PR_COMMENT_ENABLED_KEY
);
export const POLARIS_PR_COMMENT_SEVERITIES = getDelimitedInput(
  constants.POLARIS_PR_COMMENT_SEVERITIES_KEY,
  constants.POLARIS_PR_COMMENT_SEVERITIES_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_PR_COMMENT_SEVERITIES_KEY
);

export const POLARIS_REPORTS_SARIF_CREATE = getBoolInput(
  constants.POLARIS_REPORTS_SARIF_CREATE_KEY,
  constants.POLARIS_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_REPORTS_SARIF_CREATE_KEY
);
export const POLARIS_REPORTS_SARIF_FILE_PATH = getInput(
  constants.POLARIS_REPORTS_SARIF_FILE_PATH_KEY,
  constants.POLARIS_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_REPORTS_SARIF_FILE_PATH_KEY
);
export const POLARIS_REPORTS_SARIF_SEVERITIES = getDelimitedInput(
  constants.POLARIS_REPORTS_SARIF_SEVERITIES_KEY,
  constants.POLARIS_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_REPORTS_SARIF_SEVERITIES_KEY
);
export const POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES = getInput(
  constants.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY,
  constants.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY
);
export const POLARIS_REPORTS_SARIF_ISSUE_TYPES = getDelimitedInput(
  constants.POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY,
  constants.POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY
);
export const POLARIS_AZURE_TOKEN = getInput(
  constants.AZURE_TOKEN_KEY,
  constants.POLARIS_AZURE_TOKEN_KEY_CLASSIC_EDITOR,
  null
);

// Coverity related inputs
export const COVERITY_URL = getInput(
  constants.COVERITY_URL_KEY,
  constants.COVERITY_URL_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_COVERITY_URL_KEY
);
export const COVERITY_USER = getInput(
  constants.COVERITY_USER_KEY,
  constants.COVERITY_USER_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_COVERITY_USER_NAME_KEY
);
export const COVERITY_USER_PASSWORD = getInput(
  constants.COVERITY_PASSPHRASE_KEY,
  constants.COVERITY_PASSPHRASE_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_COVERITY_USER_PASSWORD_KEY
);
export const COVERITY_PROJECT_NAME = getInput(
  constants.COVERITY_PROJECT_NAME_KEY,
  constants.COVERITY_PROJECT_NAME_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_COVERITY_PROJECT_NAME_KEY
);
export const COVERITY_STREAM_NAME = getInput(
  constants.COVERITY_STREAM_NAME_KEY,
  constants.COVERITY_STREAM_NAME_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_COVERITY_STREAM_NAME_KEY
);
export const COVERITY_INSTALL_DIRECTORY = getPathInput(
  constants.COVERITY_INSTALL_DIRECTORY_KEY,
  constants.COVERITY_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_COVERITY_INSTALL_DIRECTORY_KEY
);
export const COVERITY_POLICY_VIEW = getInput(
  constants.COVERITY_POLICY_VIEW_KEY,
  constants.COVERITY_POLICY_VIEW_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_COVERITY_POLICY_VIEW_KEY
);
export const COVERITY_LOCAL = getBoolInput(
  constants.COVERITY_LOCAL_KEY,
  constants.COVERITY_LOCAL_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_COVERITY_LOCAL_KEY
);
export const COVERITY_AUTOMATION_PRCOMMENT = getBoolInput(
  constants.COVERITY_PRCOMMENT_ENABLED_KEY,
  constants.COVERITY_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_COVERITY_AUTOMATION_PRCOMMENT_KEY
);
export const COVERITY_VERSION = getInput(
  constants.COVERITY_VERSION_KEY,
  constants.COVERITY_VERSION_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_COVERITY_VERSION_KEY
);
export const COVERITY_PROJECT_DIRECTORY = getInput(
  constants.PROJECT_DIRECTORY_KEY,
  constants.COVERITY_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR,
  null
);
export const COVERITY_AZURE_TOKEN = getInput(
  constants.AZURE_TOKEN_KEY,
  constants.COVERITY_AZURE_TOKEN_KEY_CLASSIC_EDITOR,
  null
);

// Blackduck related inputs
export const BLACKDUCK_URL = getInput(
  constants.BLACKDUCK_URL_KEY,
  constants.BLACKDUCK_URL_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_URL_KEY
);
export const BLACKDUCK_API_TOKEN = getInput(
  constants.BLACKDUCK_TOKEN_KEY,
  constants.BLACKDUCK_TOKEN_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_API_TOKEN_KEY
);
export const BLACKDUCK_INSTALL_DIRECTORY = getPathInput(
  constants.BLACKDUCK_INSTALL_DIRECTORY_KEY,
  constants.BLACKDUCK_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_INSTALL_DIRECTORY_KEY
);
export const BLACKDUCK_SCAN_FULL = getBoolInput(
  constants.BLACKDUCK_SCAN_FULL_KEY,
  constants.BLACKDUCK_SCAN_FULL_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_SCAN_FULL_KEY
);
export const BLACKDUCK_SCAN_FAILURE_SEVERITIES = getDelimitedInput(
  constants.BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY,
  constants.BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY
);
/**
 * @deprecated BLACKDUCK_AUTOMATION_FIXPR is deprecated.
 */
const BLACKDUCK_AUTOMATION_FIXPR = taskLib.getBoolInput(
  constants.BLACKDUCK_AUTOMATION_FIXPR_KEY
);
if (BLACKDUCK_AUTOMATION_FIXPR) {
  deprecatedInputs.push(constants.BLACKDUCK_AUTOMATION_FIXPR_KEY);
}
export const BLACKDUCK_FIXPR_ENABLED =
  getBoolInput(
    constants.BLACKDUCK_FIXPR_ENABLED_KEY,
    constants.BLACKDUCK_FIXPR_ENABLED_KEY_CLASSIC_EDITOR,
    constants.BRIDGE_BLACKDUCK_FIXPR_ENABLED_KEY
  ) || BLACKDUCK_AUTOMATION_FIXPR;
export const BLACKDUCK_AUTOMATION_PRCOMMENT = getBoolInput(
  constants.BLACKDUCK_PRCOMMENT_ENABLED_KEY,
  constants.BLACKDUCK_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_AUTOMATION_PRCOMMENT_KEY
);
export const BLACKDUCK_FIXPR_MAXCOUNT = getInput(
  constants.BLACKDUCK_FIXPR_MAXCOUNT_KEY,
  constants.BLACKDUCK_FIXPR_MAXCOUNT_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_FIXPR_MAXCOUNT_KEY
);
export const BLACKDUCK_FIXPR_CREATE_SINGLE_PR = getBoolInput(
  constants.BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY,
  constants.BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY
);
export const BLACKDUCK_FIXPR_FILTER_SEVERITIES = getDelimitedInput(
  constants.BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY,
  constants.BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY
);
export const BLACKDUCK_FIXPR_UPGRADE_GUIDANCE = getDelimitedInput(
  constants.BLACKDUCK_FIXPR_UPGRADE_GUIDANCE_KEY,
  constants.BLACKDUCK_FIXPR_UPGRADE_GUIDANCE_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_FIXPR_UPGRADE_GUIDANCE_KEY
);
export const BLACKDUCK_REPORTS_SARIF_CREATE = getBoolInput(
  constants.BLACKDUCK_REPORTS_SARIF_CREATE_KEY,
  constants.BLACKDUCK_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_REPORTS_SARIF_CREATE_KEY
);
export const BLACKDUCK_REPORTS_SARIF_FILE_PATH = getInput(
  constants.BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY,
  constants.BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY
);
export const BLACKDUCK_PROJECT_DIRECTORY = getInput(
  constants.PROJECT_DIRECTORY_KEY,
  constants.BLACKDUCK_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR,
  null
);

export const BLACKDUCK_REPORTS_SARIF_SEVERITIES = getDelimitedInput(
  constants.BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY,
  constants.BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY
);

export const BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES = getInput(
  constants.BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY,
  constants.BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR,
  constants.BRIDGE_BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES
);

export const BLACKDUCK_AZURE_TOKEN = getInput(
  constants.AZURE_TOKEN_KEY,
  constants.BLACKDUCK_AZURE_TOKEN_KEY_CLASSIC_EDITOR,
  null
);

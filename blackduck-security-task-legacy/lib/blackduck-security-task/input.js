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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.COVERITY_PROJECT_DIRECTORY = exports.COVERITY_WAITFORSCAN = exports.COVERITY_VERSION = exports.COVERITY_AUTOMATION_PRCOMMENT = exports.COVERITY_LOCAL = exports.COVERITY_POLICY_VIEW = exports.COVERITY_EXECUTION_PATH = exports.COVERITY_INSTALL_DIRECTORY = exports.COVERITY_STREAM_NAME = exports.COVERITY_PROJECT_NAME = exports.COVERITY_USER_PASSWORD = exports.COVERITY_USER = exports.COVERITY_URL = exports.POLARIS_REPORTS_SARIF_ISSUE_TYPES = exports.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES = exports.POLARIS_REPORTS_SARIF_SEVERITIES = exports.POLARIS_REPORTS_SARIF_FILE_PATH = exports.POLARIS_REPORTS_SARIF_CREATE = exports.POLARIS_PR_COMMENT_SEVERITIES = exports.POLARIS_PR_COMMENT_ENABLED = exports.PROJECT_SOURCE_EXCLUDES = exports.PROJECT_SOURCE_PRESERVE_SYM_LINKS = exports.PROJECT_SOURCE_ARCHIVE = exports.POLARIS_PROJECT_DIRECTORY = exports.POLARIS_ASSESSMENT_MODE = exports.POLARIS_WAITFORSCAN = exports.POLARIS_TEST_SAST_TYPE = exports.POLARIS_TEST_SCA_TYPE = exports.POLARIS_BRANCH_PARENT_NAME = exports.POLARIS_BRANCH_NAME = exports.POLARIS_ASSESSMENT_TYPES = exports.POLARIS_PROJECT_NAME = exports.POLARIS_APPLICATION_NAME = exports.POLARIS_ACCESS_TOKEN = exports.POLARIS_SERVER_URL = exports.SCAN_TYPE = exports.AZURE_TOKEN = exports.INCLUDE_DIAGNOSTICS = exports.BRIDGECLI_DOWNLOAD_VERSION = exports.BRIDGECLI_INSTALL_DIRECTORY_KEY = exports.ENABLE_NETWORK_AIRGAP = exports.BRIDGECLI_DOWNLOAD_URL = exports.showLogForDeprecatedInputs = exports.getDelimitedInput = exports.getPathInput = exports.getBoolInput = exports.getInputForYMLAndDeprecatedKey = exports.getArbitraryInputs = exports.getInputForMultipleClassicEditor = exports.getInput = void 0;
exports.NETWORK_SSL_TRUST_ALL = exports.NETWORK_SSL_CERT_FILE = exports.MARK_BUILD_STATUS = exports.RETURN_STATUS = exports.SRM_PROJECT_DIRECTORY = exports.SRM_WAITFORSCAN = exports.SRM_BRANCH_PARENT = exports.SRM_BRANCH_NAME = exports.SRM_PROJECT_ID = exports.SRM_PROJECT_NAME = exports.SRM_ASSESSMENT_TYPES = exports.SRM_APIKEY = exports.SRM_URL = exports.DETECT_ARGS = exports.DETECT_CONFIG_PATH = exports.DETECT_SEARCH_DEPTH = exports.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES = exports.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES = exports.BLACKDUCKSCA_WAITFORSCAN = exports.BLACKDUCKSCA_PROJECT_DIRECTORY = exports.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH = exports.BLACKDUCKSCA_REPORTS_SARIF_CREATE = exports.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE = exports.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES = exports.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR = exports.BLACKDUCKSCA_FIXPR_MAXCOUNT = exports.BLACKDUCKSCA_PRCOMMENT_ENABLED = exports.BLACKDUCKSCA_FIXPR_ENABLED = exports.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES = exports.BLACKDUCKSCA_SCAN_FULL = exports.DETECT_EXECUTION_PATH = exports.DETECT_INSTALL_DIRECTORY = exports.BLACKDUCKSCA_API_TOKEN = exports.BLACKDUCKSCA_URL = exports.COVERITY_ARGS = exports.COVERITY_CONFIG_PATH = exports.COVERITY_CLEAN_COMMAND = exports.COVERITY_BUILD_COMMAND = void 0;
const taskLib = __importStar(require("azure-pipelines-task-lib/task"));
const constants = __importStar(require("./application-constant"));
const polaris_1 = require("./model/polaris");
const deprecatedInputs = [];
function getInput(newKey, classicEditorKey, deprecatedKey) {
    const key = getInputForYMLAndDeprecatedKey(newKey, deprecatedKey);
    if (key) {
        return key;
    }
    const classEditorInput = taskLib.getInput(classicEditorKey);
    if (classEditorInput) {
        return classEditorInput === null || classEditorInput === void 0 ? void 0 : classEditorInput.trim();
    }
    return "";
}
exports.getInput = getInput;
function getInputForMultipleClassicEditor(newKey, polarisClassicEditorKey, blackduckSCAClassicEditorKey, coverityClassicEditorKey, srmClassicEditorKey, deprecatedKey) {
    const key = getInputForYMLAndDeprecatedKey(newKey, deprecatedKey);
    if (key) {
        return key;
    }
    const scanType = taskLib.getInput(constants.SCAN_TYPE_KEY);
    let classEditorInput;
    if (polarisClassicEditorKey.length > 0 && scanType == constants.POLARIS_KEY) {
        classEditorInput = taskLib.getInput(polarisClassicEditorKey);
    }
    else if (blackduckSCAClassicEditorKey.length > 0 &&
        scanType == constants.BLACKDUCKSCA_KEY) {
        classEditorInput = taskLib.getInput(blackduckSCAClassicEditorKey);
    }
    else if (coverityClassicEditorKey.length > 0 &&
        scanType == constants.COVERITY_KEY) {
        classEditorInput = taskLib.getInput(coverityClassicEditorKey);
    }
    else if (srmClassicEditorKey &&
        (srmClassicEditorKey === null || srmClassicEditorKey === void 0 ? void 0 : srmClassicEditorKey.length) > 0 &&
        scanType == constants.SRM_KEY) {
        classEditorInput = taskLib.getInput(srmClassicEditorKey);
    }
    if (classEditorInput) {
        return classEditorInput === null || classEditorInput === void 0 ? void 0 : classEditorInput.trim();
    }
    return "";
}
exports.getInputForMultipleClassicEditor = getInputForMultipleClassicEditor;
function getArbitraryInputs(yamlKey, classicEditorKey, classicEditorKeyForPolaris, classicEditorKeyForSrm, deprecatedKey) {
    const scanType = taskLib.getInput(constants.SCAN_TYPE_KEY);
    if (classicEditorKeyForPolaris.length > 0 &&
        scanType == constants.POLARIS_KEY) {
        return taskLib.getInput(classicEditorKeyForPolaris);
    }
    else if (classicEditorKeyForSrm.length > 0 &&
        scanType == constants.SRM_KEY) {
        return taskLib.getInput(classicEditorKeyForSrm);
    }
    else if (classicEditorKey.length > 0 &&
        (scanType == constants.COVERITY_KEY ||
            scanType == constants.BLACKDUCKSCA_KEY)) {
        return taskLib.getInput(classicEditorKey);
    }
    return getInputForYMLAndDeprecatedKey(yamlKey, deprecatedKey);
}
exports.getArbitraryInputs = getArbitraryInputs;
function getInputForYMLAndDeprecatedKey(newKey, deprecatedKey) {
    const newInput = taskLib.getInput(newKey);
    if (newInput) {
        return newInput === null || newInput === void 0 ? void 0 : newInput.trim();
    }
    let deprecatedInput;
    if (deprecatedKey) {
        deprecatedInput = taskLib.getInput(deprecatedKey);
        if (deprecatedInput) {
            deprecatedInputs.push(deprecatedKey);
            return deprecatedInput === null || deprecatedInput === void 0 ? void 0 : deprecatedInput.trim();
        }
    }
    return "";
}
exports.getInputForYMLAndDeprecatedKey = getInputForYMLAndDeprecatedKey;
function getBoolInput(newKey, classicEditorKey, deprecatedKey) {
    let deprecatedInput;
    if (deprecatedKey) {
        deprecatedInput = taskLib.getBoolInput(deprecatedKey);
        if (deprecatedInput) {
            deprecatedInputs.push(deprecatedKey);
        }
    }
    return (taskLib.getBoolInput(newKey) ||
        deprecatedInput ||
        taskLib.getBoolInput(classicEditorKey));
}
exports.getBoolInput = getBoolInput;
function getPathInput(newKey, classicEditorKey, deprecatedKey) {
    var _a, _b;
    let deprecatedInput;
    if (deprecatedKey) {
        deprecatedInput = taskLib.getPathInput(deprecatedKey);
        if (deprecatedInput) {
            deprecatedInputs.push(deprecatedKey);
        }
    }
    return (((_a = taskLib.getPathInput(newKey)) === null || _a === void 0 ? void 0 : _a.trim()) ||
        (deprecatedInput === null || deprecatedInput === void 0 ? void 0 : deprecatedInput.trim()) ||
        ((_b = taskLib.getPathInput(classicEditorKey)) === null || _b === void 0 ? void 0 : _b.trim()) ||
        "");
}
exports.getPathInput = getPathInput;
function getDelimitedInput(newKey, classicEditorKey, deprecatedKey) {
    const newKeyInput = taskLib.getDelimitedInput(newKey, ",");
    const classicEditorInput = taskLib.getDelimitedInput(classicEditorKey, ",");
    let deprecatedInput = [];
    if (deprecatedKey) {
        deprecatedInput = taskLib.getDelimitedInput(deprecatedKey, ",");
        if (deprecatedInput.length > 0) {
            deprecatedInputs.push(deprecatedKey);
        }
    }
    return ((newKeyInput.length > 0 && newKeyInput) ||
        (deprecatedInput.length > 0 && deprecatedInput) ||
        (classicEditorInput.length > 0 && classicEditorInput) ||
        []);
}
exports.getDelimitedInput = getDelimitedInput;
function showLogForDeprecatedInputs() {
    if (deprecatedInputs.length > 0) {
        console.log(`[${deprecatedInputs.join(",")}] is/are deprecated for YAML. Check documentation for new parameters: ${constants.BLACKDUCKSCA_SECURITY_SCAN_AZURE_DEVOPS_DOCS_URL}`);
    }
}
exports.showLogForDeprecatedInputs = showLogForDeprecatedInputs;
function getInputForPolarisAssessmentMode() {
    var _a, _b, _c;
    return (((_a = taskLib.getInput(constants.POLARIS_ASSESSMENT_MODE_KEY)) === null || _a === void 0 ? void 0 : _a.trim()) ||
        (((_b = taskLib
            .getInput(constants.POLARIS_ASSESSMENT_MODE_KEY_CLASSIC_EDITOR)) === null || _b === void 0 ? void 0 : _b.trim()) === polaris_1.POLARIS_ASSESSMENT_MODES.CI
            ? polaris_1.POLARIS_ASSESSMENT_MODES.CI
            : ((_c = taskLib
                .getInput(constants.POLARIS_ASSESSMENT_MODE_KEY_CLASSIC_EDITOR)) === null || _c === void 0 ? void 0 : _c.trim()) === polaris_1.POLARIS_ASSESSMENT_MODES.SOURCEUPLOAD
                ? polaris_1.POLARIS_ASSESSMENT_MODES.SOURCE_UPLOAD
                : ""));
}
//Bridge download url
exports.BRIDGECLI_DOWNLOAD_URL = getInput(constants.BRIDGECLI_DOWNLOAD_URL_KEY, constants.BRIDGECLI_DOWNLOAD_URL_KEY_CLASSIC_EDITOR, constants.SYNOPSYS_BRIDGE_DOWNLOAD_URL_KEY);
exports.ENABLE_NETWORK_AIRGAP = getBoolInput(constants.NETWORK_AIRGAP_KEY, constants.NETWORK_AIRGAP_KEY_CLASSIC_EDITOR, constants.BRIDGE_NETWORK_AIRGAP_KEY);
exports.BRIDGECLI_INSTALL_DIRECTORY_KEY = getPathInput(constants.BRIDGECLI_INSTALL_DIRECTORY_KEY, constants.BRIDGECLI_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR, constants.SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY);
exports.BRIDGECLI_DOWNLOAD_VERSION = getInput(constants.BRIDGECLI_DOWNLOAD_VERSION_KEY, constants.BRIDGECLI_DOWNLOAD_VERSION_KEY_CLASSIC_EDITOR, constants.SYNOPSYS_BRIDGE_DOWNLOAD_VERSION_KEY);
exports.INCLUDE_DIAGNOSTICS = getInputForMultipleClassicEditor(constants.INCLUDE_DIAGNOSTICS_KEY, constants.POLARIS_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR, constants.BLACKDUCKSCA_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR, constants.COVERITY_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR, constants.SRM_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR, null);
exports.AZURE_TOKEN = getInputForMultipleClassicEditor(constants.AZURE_TOKEN_KEY, constants.POLARIS_AZURE_TOKEN_KEY_CLASSIC_EDITOR, constants.BLACKDUCKSCA_AZURE_TOKEN_KEY_CLASSIC_EDITOR, constants.COVERITY_AZURE_TOKEN_KEY_CLASSIC_EDITOR, null, null);
exports.SCAN_TYPE = ((_a = taskLib.getInput(constants.SCAN_TYPE_KEY)) === null || _a === void 0 ? void 0 : _a.trim()) || "";
// Polaris related inputs
exports.POLARIS_SERVER_URL = getInput(constants.POLARIS_SERVER_URL_KEY, constants.POLARIS_SERVER_URL_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_ACCESS_TOKEN = getInput(constants.POLARIS_ACCESS_TOKEN_KEY, constants.POLARIS_ACCESS_TOKEN_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_APPLICATION_NAME = getInput(constants.POLARIS_APPLICATION_NAME_KEY, constants.POLARIS_APPLICATION_NAME_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_PROJECT_NAME = getInput(constants.POLARIS_PROJECT_NAME_KEY, constants.POLARIS_PROJECT_NAME_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_ASSESSMENT_TYPES = getDelimitedInput(constants.POLARIS_ASSESSMENT_TYPES_KEY, constants.POLARIS_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_BRANCH_NAME = getInput(constants.POLARIS_BRANCH_NAME_KEY, constants.POLARIS_BRANCH_NAME_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_BRANCH_PARENT_NAME = getInput(constants.POLARIS_BRANCH_PARENT_NAME_KEY, constants.POLARIS_BRANCH_PARENT_NAME_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_TEST_SCA_TYPE = getInput(constants.POLARIS_TEST_SCA_TYPE_KEY, constants.POLARIS_TEST_SCA_TYPE_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_TEST_SAST_TYPE = getInput(constants.POLARIS_TEST_SAST_TYPE_KEY, constants.POLARIS_TEST_SAST_TYPE_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_WAITFORSCAN = getInput(constants.POLARIS_WAITFORSCAN_KEY, constants.POLARIS_WAITFORSCAN_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_ASSESSMENT_MODE = getInputForPolarisAssessmentMode();
exports.POLARIS_PROJECT_DIRECTORY = getInput(constants.PROJECT_DIRECTORY_KEY, constants.POLARIS_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR, null);
exports.PROJECT_SOURCE_ARCHIVE = getInput(constants.PROJECT_SOURCE_ARCHIVE_KEY, constants.PROJECT_SOURCE_ARCHIVE_KEY_CLASSIC_EDITOR, null);
exports.PROJECT_SOURCE_PRESERVE_SYM_LINKS = getInput(constants.PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY, constants.PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY_CLASSIC_EDITOR, null);
exports.PROJECT_SOURCE_EXCLUDES = getDelimitedInput(constants.PROJECT_SOURCE_EXCLUDES_KEY, constants.PROJECT_SOURCE_EXCLUDES_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_PR_COMMENT_ENABLED = getInput(constants.POLARIS_PR_COMMENT_ENABLED_KEY, constants.POLARIS_PR_COMMENT_ENABLED_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_PR_COMMENT_SEVERITIES = getDelimitedInput(constants.POLARIS_PR_COMMENT_SEVERITIES_KEY, constants.POLARIS_PR_COMMENT_SEVERITIES_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_REPORTS_SARIF_CREATE = getInput(constants.POLARIS_REPORTS_SARIF_CREATE_KEY, constants.POLARIS_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_REPORTS_SARIF_FILE_PATH = getInput(constants.POLARIS_REPORTS_SARIF_FILE_PATH_KEY, constants.POLARIS_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_REPORTS_SARIF_SEVERITIES = getDelimitedInput(constants.POLARIS_REPORTS_SARIF_SEVERITIES_KEY, constants.POLARIS_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES = getInput(constants.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY, constants.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR, null);
exports.POLARIS_REPORTS_SARIF_ISSUE_TYPES = getDelimitedInput(constants.POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY, constants.POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY_CLASSIC_EDITOR, null);
// Coverity related inputs
exports.COVERITY_URL = getInput(constants.COVERITY_URL_KEY, constants.COVERITY_URL_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_USER = getInput(constants.COVERITY_USER_KEY, constants.COVERITY_USER_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_USER_PASSWORD = getInput(constants.COVERITY_PASSPHRASE_KEY, constants.COVERITY_PASSPHRASE_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_PROJECT_NAME = getInput(constants.COVERITY_PROJECT_NAME_KEY, constants.COVERITY_PROJECT_NAME_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_STREAM_NAME = getInput(constants.COVERITY_STREAM_NAME_KEY, constants.COVERITY_STREAM_NAME_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_INSTALL_DIRECTORY = getPathInput(constants.COVERITY_INSTALL_DIRECTORY_KEY, constants.COVERITY_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_EXECUTION_PATH = getPathInput(constants.COVERITY_EXECUTION_PATH_KEY, constants.COVERITY_EXECUTION_PATH_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_POLICY_VIEW = getInput(constants.COVERITY_POLICY_VIEW_KEY, constants.COVERITY_POLICY_VIEW_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_LOCAL = getInput(constants.COVERITY_LOCAL_KEY, constants.COVERITY_LOCAL_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_AUTOMATION_PRCOMMENT = getBoolInput(constants.COVERITY_PRCOMMENT_ENABLED_KEY, constants.COVERITY_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_VERSION = getInput(constants.COVERITY_VERSION_KEY, constants.COVERITY_VERSION_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_WAITFORSCAN = getInput(constants.COVERITY_WAITFORSCAN_KEY, constants.COVERITY_WAITFORSCAN_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_PROJECT_DIRECTORY = getInput(constants.PROJECT_DIRECTORY_KEY, constants.COVERITY_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR, null);
exports.COVERITY_BUILD_COMMAND = getArbitraryInputs(constants.COVERITY_BUILD_COMMAND_KEY, constants.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR, constants.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR_FOR_POLARIS, constants.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR_FOR_SRM, null);
exports.COVERITY_CLEAN_COMMAND = getArbitraryInputs(constants.COVERITY_CLEAN_COMMAND_KEY, constants.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR, constants.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR_FOR_POLARIS, constants.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR_FOR_SRM, null);
exports.COVERITY_CONFIG_PATH = getArbitraryInputs(constants.COVERITY_CONFIG_PATH_KEY, constants.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR, constants.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_POLARIS, constants.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_SRM, null);
exports.COVERITY_ARGS = getArbitraryInputs(constants.COVERITY_ARGS_KEY, constants.COVERITY_ARGS_KEY_CLASSIC_EDITOR, constants.COVERITY_ARGS_KEY_CLASSIC_EDITOR_FOR_POLARIS, constants.COVERITY_ARGS_KEY_CLASSIC_EDITOR_FOR_SRM, null);
// Blackduck related inputs
exports.BLACKDUCKSCA_URL = getInput(constants.BLACKDUCKSCA_URL_KEY, constants.BLACKDUCKSCA_URL_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_URL_KEY);
exports.BLACKDUCKSCA_API_TOKEN = getInput(constants.BLACKDUCKSCA_TOKEN_KEY, constants.BLACKDUCKSCA_TOKEN_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_TOKEN_KEY);
exports.DETECT_INSTALL_DIRECTORY = getPathInput(constants.DETECT_INSTALL_DIRECTORY_KEY, constants.DETECT_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_INSTALL_DIRECTORY_KEY);
exports.DETECT_EXECUTION_PATH = getPathInput(constants.DETECT_EXECUTION_PATH_KEY, constants.DETECT_EXECUTION_PATH_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_EXECUTION_PATH_KEY);
exports.BLACKDUCKSCA_SCAN_FULL = getInput(constants.BLACKDUCKSCA_SCAN_FULL_KEY, constants.BLACKDUCKSCA_SCAN_FULL_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_SCAN_FULL_KEY);
exports.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES = getDelimitedInput(constants.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY, constants.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY);
exports.BLACKDUCKSCA_FIXPR_ENABLED = getBoolInput(constants.BLACKDUCKSCA_FIXPR_ENABLED_KEY, constants.BLACKDUCKSCA_FIXPR_ENABLED_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_FIXPR_ENABLED_KEY);
exports.BLACKDUCKSCA_PRCOMMENT_ENABLED = getBoolInput(constants.BLACKDUCKSCA_PRCOMMENT_ENABLED_KEY, constants.BLACKDUCKSCA_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_PRCOMMENT_ENABLED_KEY);
exports.BLACKDUCKSCA_FIXPR_MAXCOUNT = getInput(constants.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY, constants.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_FIXPR_MAXCOUNT_KEY);
exports.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR = getInput(constants.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY, constants.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY);
exports.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES = getDelimitedInput(constants.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES_KEY, constants.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY);
exports.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE = getDelimitedInput(constants.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE_KEY, constants.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_FIXPR_UPGRADE_GUIDANCE_KEY);
exports.BLACKDUCKSCA_REPORTS_SARIF_CREATE = getInput(constants.BLACKDUCKSCA_REPORTS_SARIF_CREATE_KEY, constants.BLACKDUCKSCA_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_REPORTS_SARIF_CREATE_KEY);
exports.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH = getInput(constants.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH_KEY, constants.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY);
exports.BLACKDUCKSCA_PROJECT_DIRECTORY = getInput(constants.PROJECT_DIRECTORY_KEY, constants.BLACKDUCKSCA_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR, null);
exports.BLACKDUCKSCA_WAITFORSCAN = getInput(constants.BLACKDUCKSCA_WAITFORSCAN_KEY, constants.BLACKDUCKSCA_WAITFORSCAN_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_WAITFORSCAN_KEY);
exports.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES = getDelimitedInput(constants.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES_KEY, constants.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY);
exports.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES = getInput(constants.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY, constants.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR, constants.BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY);
exports.DETECT_SEARCH_DEPTH = getArbitraryInputs(constants.DETECT_SEARCH_DEPTH_KEY, constants.DETECT_DEPTH_KEY_CLASSIC_EDITOR, constants.DETECT_DEPTH_KEY_CLASSIC_EDITOR_FOR_POLARIS, constants.DETECT_DEPTH_KEY_CLASSIC_EDITOR_FOR_SRM, constants.BLACKDUCK_SEARCH_DEPTH_KEY);
exports.DETECT_CONFIG_PATH = getArbitraryInputs(constants.DETECT_CONFIG_PATH_KEY, constants.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR, constants.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_POLARIS, constants.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_SRM, constants.BLACKDUCK_CONFIG_PATH_KEY);
exports.DETECT_ARGS = getArbitraryInputs(constants.DETECT_ARGS_KEY, constants.DETECT_ARGS_KEY_CLASSIC_EDITOR, constants.DETECT_ARGS_KEY_CLASSIC_EDITOR_FOR_POLARIS, constants.DETECT_ARGS_KEY_CLASSIC_EDITOR_FOR_SRM, constants.BLACKDUCK_ARGS_KEY);
//SRM inputs
exports.SRM_URL = getInput(constants.SRM_URL_KEY, constants.SRM_URL_KEY_CLASSIC_EDITOR, null);
exports.SRM_APIKEY = getInput(constants.SRM_APIKEY_KEY, constants.SRM_APIKEY_KEY_CLASSIC_EDITOR, null);
exports.SRM_ASSESSMENT_TYPES = getDelimitedInput(constants.SRM_ASSESSMENT_TYPES_KEY, constants.SRM_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR, null);
exports.SRM_PROJECT_NAME = getInput(constants.SRM_PROJECT_NAME_KEY, constants.SRM_PROJECT_NAME_KEY_CLASSIC_EDITOR, null);
exports.SRM_PROJECT_ID = getInput(constants.SRM_PROJECT_ID_KEY, constants.SRM_PROJECT_ID_KEY_CLASSIC_EDITOR, null);
exports.SRM_BRANCH_NAME = getInput(constants.SRM_BRANCH_NAME_KEY, constants.SRM_BRANCH_NAME_KEY_CLASSIC_EDITOR, null);
exports.SRM_BRANCH_PARENT = getInput(constants.SRM_BRANCH_PARENT_KEY, constants.SRM_BRANCH_PARENT_KEY_CLASSIC_EDITOR, null);
exports.SRM_WAITFORSCAN = getInput(constants.SRM_WAITFORSCAN_KEY, constants.SRM_WAITFORSCAN_KEY_CLASSIC_EDITOR, null);
exports.SRM_PROJECT_DIRECTORY = getInput(constants.PROJECT_DIRECTORY_KEY, constants.SRM_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR, null);
exports.RETURN_STATUS = ((_b = taskLib.getInput(constants.RETURN_STATUS_KEY)) === null || _b === void 0 ? void 0 : _b.trim()) || "true";
exports.MARK_BUILD_STATUS = getInputForMultipleClassicEditor(constants.MARK_BUILD_STATUS_KEY, constants.POLARIS_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR, constants.BLACKDUCKSCA_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR, constants.COVERITY_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR, constants.SRM_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR, null);
exports.NETWORK_SSL_CERT_FILE = getInput(constants.NETWORK_SSL_CERT_FILE_KEY, constants.NETWORK_SSL_CERT_FILE_KEY_CLASSIC_EDITOR, null);
exports.NETWORK_SSL_TRUST_ALL = getBoolInput(constants.NETWORK_SSL_TRUST_ALL_KEY, constants.NETWORK_SSL_TRUST_ALL_KEY_CLASSIC_EDITOR, null);

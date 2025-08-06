"use strict";
// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POLARIS_TEST_SAST_TYPE_KEY = exports.POLARIS_TEST_SCA_TYPE_KEY_CLASSIC_EDITOR = exports.POLARIS_TEST_SCA_TYPE_KEY = exports.POLARIS_ASSESSMENT_MODE_KEY_CLASSIC_EDITOR = exports.POLARIS_ASSESSMENT_MODE_KEY = exports.POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY_CLASSIC_EDITOR = exports.POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY = exports.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR = exports.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY = exports.POLARIS_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR = exports.POLARIS_REPORTS_SARIF_SEVERITIES_KEY = exports.POLARIS_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR = exports.POLARIS_REPORTS_SARIF_FILE_PATH_KEY = exports.POLARIS_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR = exports.POLARIS_REPORTS_SARIF_CREATE_KEY = exports.POLARIS_PR_COMMENT_SEVERITIES_KEY_CLASSIC_EDITOR = exports.POLARIS_PR_COMMENT_SEVERITIES_KEY = exports.POLARIS_PR_COMMENT_ENABLED_KEY_CLASSIC_EDITOR = exports.POLARIS_PR_COMMENT_ENABLED_KEY = exports.POLARIS_BRANCH_PARENT_NAME_KEY_CLASSIC_EDITOR = exports.POLARIS_BRANCH_PARENT_NAME_KEY = exports.POLARIS_BRANCH_NAME_KEY_CLASSIC_EDITOR = exports.POLARIS_BRANCH_NAME_KEY = exports.POLARIS_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR = exports.POLARIS_ASSESSMENT_TYPES_KEY = exports.POLARIS_PROJECT_NAME_KEY_CLASSIC_EDITOR = exports.POLARIS_PROJECT_NAME_KEY = exports.POLARIS_APPLICATION_NAME_KEY_CLASSIC_EDITOR = exports.POLARIS_APPLICATION_NAME_KEY = exports.POLARIS_ACCESS_TOKEN_KEY_CLASSIC_EDITOR = exports.POLARIS_ACCESS_TOKEN_KEY = exports.POLARIS_SERVER_URL_KEY_CLASSIC_EDITOR = exports.POLARIS_SERVER_URL_KEY = exports.SRM_KEY = exports.BLACKDUCKSCA_KEY = exports.COVERITY_KEY = exports.POLARIS_KEY = exports.SPACE = exports.SCAN_TYPE_KEY = exports.COVERITY_AZURE_TOKEN_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_AZURE_TOKEN_KEY_CLASSIC_EDITOR = exports.POLARIS_AZURE_TOKEN_KEY_CLASSIC_EDITOR = exports.AZURE_TOKEN_KEY = exports.BRIDGE_CLI_ZIP_FILE_NAME = exports.BRIDGE_CLI_EXECUTABLE_MAC_LINUX = exports.BRIDGE_CLI_EXECUTABLE_WINDOWS = exports.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_WINDOWS = exports.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_UNIX = exports.BRIDGE_CLI_DEFAULT_PATH_WINDOWS = exports.BRIDGE_CLI_DEFAULT_PATH_UNIX = void 0;
exports.COVERITY_ARGS_KEY_CLASSIC_EDITOR = exports.COVERITY_ARGS_KEY = exports.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_SRM = exports.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_POLARIS = exports.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR = exports.COVERITY_CONFIG_PATH_KEY = exports.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR_FOR_SRM = exports.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR_FOR_POLARIS = exports.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR = exports.COVERITY_CLEAN_COMMAND_KEY = exports.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR_FOR_SRM = exports.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR_FOR_POLARIS = exports.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR = exports.COVERITY_BUILD_COMMAND_KEY = exports.COVERITY_VERSION_KEY_CLASSIC_EDITOR = exports.COVERITY_VERSION_KEY = exports.COVERITY_LOCAL_KEY_CLASSIC_EDITOR = exports.COVERITY_LOCAL_KEY = exports.COVERITY_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR = exports.COVERITY_PRCOMMENT_ENABLED_KEY = exports.COVERITY_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR = exports.COVERITY_WAITFORSCAN_KEY_CLASSIC_EDITOR = exports.COVERITY_WAITFORSCAN_KEY = exports.COVERITY_POLICY_VIEW_KEY_CLASSIC_EDITOR = exports.COVERITY_POLICY_VIEW_KEY = exports.COVERITY_EXECUTION_PATH_KEY_CLASSIC_EDITOR = exports.COVERITY_EXECUTION_PATH_KEY = exports.COVERITY_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR = exports.COVERITY_INSTALL_DIRECTORY_KEY = exports.COVERITY_STREAM_NAME_KEY_CLASSIC_EDITOR = exports.COVERITY_STREAM_NAME_KEY = exports.COVERITY_PROJECT_NAME_KEY_CLASSIC_EDITOR = exports.COVERITY_PROJECT_NAME_KEY = exports.COVERITY_PASSPHRASE_KEY_CLASSIC_EDITOR = exports.COVERITY_PASSPHRASE_KEY = exports.COVERITY_USER_KEY_CLASSIC_EDITOR = exports.COVERITY_USER_KEY = exports.COVERITY_URL_KEY_CLASSIC_EDITOR = exports.COVERITY_URL_KEY = exports.PROJECT_SOURCE_EXCLUDES_KEY_CLASSIC_EDITOR = exports.PROJECT_SOURCE_EXCLUDES_KEY = exports.PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY_CLASSIC_EDITOR = exports.PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY = exports.PROJECT_SOURCE_ARCHIVE_KEY_CLASSIC_EDITOR = exports.PROJECT_SOURCE_ARCHIVE_KEY = exports.POLARIS_WAITFORSCAN_KEY_CLASSIC_EDITOR = exports.POLARIS_WAITFORSCAN_KEY = exports.POLARIS_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR = exports.PROJECT_DIRECTORY_KEY = exports.POLARIS_TEST_SAST_TYPE_KEY_CLASSIC_EDITOR = void 0;
exports.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES_KEY = exports.BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY = exports.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH_KEY = exports.BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY = exports.BLACKDUCKSCA_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_REPORTS_SARIF_CREATE_KEY = exports.BLACKDUCK_REPORTS_SARIF_CREATE_KEY = exports.BLACKDUCKSCA_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_WAITFORSCAN_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_WAITFORSCAN_KEY = exports.BLACKDUCK_WAITFORSCAN_KEY = exports.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE_KEY = exports.BLACKDUCK_FIXPR_UPGRADE_GUIDANCE_KEY = exports.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES_KEY = exports.BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY = exports.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY = exports.BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY = exports.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY = exports.BLACKDUCK_FIXPR_MAXCOUNT_KEY = exports.BLACKDUCKSCA_FIXPR_ENABLED_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_FIXPR_ENABLED_KEY = exports.BLACKDUCK_FIXPR_ENABLED_KEY = exports.BLACKDUCKSCA_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_PRCOMMENT_ENABLED_KEY = exports.BLACKDUCK_PRCOMMENT_ENABLED_KEY = exports.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY = exports.BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY = exports.BLACKDUCKSCA_SCAN_FULL_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_SCAN_FULL_KEY = exports.BLACKDUCK_SCAN_FULL_KEY = exports.DETECT_EXECUTION_PATH_KEY_CLASSIC_EDITOR = exports.DETECT_EXECUTION_PATH_KEY = exports.BLACKDUCK_EXECUTION_PATH_KEY = exports.DETECT_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR = exports.DETECT_INSTALL_DIRECTORY_KEY = exports.BLACKDUCK_INSTALL_DIRECTORY_KEY = exports.BLACKDUCKSCA_TOKEN_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_TOKEN_KEY = exports.BLACKDUCK_TOKEN_KEY = exports.BLACKDUCKSCA_URL_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_URL_KEY = exports.BLACKDUCK_URL_KEY = exports.COVERITY_ARGS_KEY_CLASSIC_EDITOR_FOR_SRM = exports.COVERITY_ARGS_KEY_CLASSIC_EDITOR_FOR_POLARIS = void 0;
exports.BRIDGECLI_DOWNLOAD_VERSION_KEY_CLASSIC_EDITOR = exports.BRIDGECLI_DOWNLOAD_VERSION_KEY = exports.SYNOPSYS_BRIDGE_DOWNLOAD_VERSION_KEY = exports.BRIDGECLI_DOWNLOAD_URL_KEY_CLASSIC_EDITOR = exports.BRIDGECLI_DOWNLOAD_URL_KEY = exports.SYNOPSYS_BRIDGE_DOWNLOAD_URL_KEY = exports.NETWORK_AIRGAP_KEY_CLASSIC_EDITOR = exports.NETWORK_AIRGAP_KEY = exports.BRIDGE_NETWORK_AIRGAP_KEY = exports.SRM_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR = exports.COVERITY_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR = exports.POLARIS_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR = exports.INCLUDE_DIAGNOSTICS_KEY = exports.SRM_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR = exports.SRM_WAITFORSCAN_KEY_CLASSIC_EDITOR = exports.SRM_WAITFORSCAN_KEY = exports.SRM_BRANCH_PARENT_KEY_CLASSIC_EDITOR = exports.SRM_BRANCH_PARENT_KEY = exports.SRM_BRANCH_NAME_KEY_CLASSIC_EDITOR = exports.SRM_BRANCH_NAME_KEY = exports.SRM_PROJECT_ID_KEY_CLASSIC_EDITOR = exports.SRM_PROJECT_ID_KEY = exports.SRM_PROJECT_NAME_KEY_CLASSIC_EDITOR = exports.SRM_PROJECT_NAME_KEY = exports.SRM_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR = exports.SRM_ASSESSMENT_TYPES_KEY = exports.SRM_APIKEY_KEY_CLASSIC_EDITOR = exports.SRM_APIKEY_KEY = exports.SRM_URL_KEY_CLASSIC_EDITOR = exports.SRM_URL_KEY = exports.DETECT_ARGS_KEY_CLASSIC_EDITOR_FOR_SRM = exports.DETECT_ARGS_KEY_CLASSIC_EDITOR_FOR_POLARIS = exports.DETECT_ARGS_KEY_CLASSIC_EDITOR = exports.DETECT_ARGS_KEY = exports.BLACKDUCK_ARGS_KEY = exports.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_SRM = exports.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_POLARIS = exports.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR = exports.DETECT_CONFIG_PATH_KEY = exports.BLACKDUCK_CONFIG_PATH_KEY = exports.DETECT_DEPTH_KEY_CLASSIC_EDITOR_FOR_SRM = exports.DETECT_DEPTH_KEY_CLASSIC_EDITOR_FOR_POLARIS = exports.DETECT_DEPTH_KEY_CLASSIC_EDITOR = exports.DETECT_SEARCH_DEPTH_KEY = exports.BLACKDUCK_SEARCH_DEPTH_KEY = exports.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY = exports.BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY = exports.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR = void 0;
exports.REQUIRE_ONE_SCAN_TYPE = exports.INVALID_BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES = exports.BRIDGE_CLI_DEFAULT_DIRECTORY_NOT_EXISTS = exports.BRIDGE_CLI_INSTALL_DIRECTORY_NOT_EXISTS = exports.BRIDGE_CLI_EXTRACT_DIRECTORY_NOT_FOUND = exports.WORKSPACE_DIR_NOT_FOUND = exports.BRIDGE_CLI_DOWNLOAD_FAILED_RETRY = exports.BRIDGE_CLI_DOWNLOAD_FAILED = exports.BRIDGE_CLI_ZIP_NOT_FOUND_FOR_EXTRACT = exports.WORKFLOW_FAILED = exports.INVALID_BRIDGE_CLI_URL = exports.INVALID_BRIDGE_CLI_URL_SPECIFIED_OS = exports.EMPTY_BRIDGE_CLI_URL = exports.BRIDGE_CLI_EXECUTABLE_FILE_NOT_FOUND = exports.BRIDGE_CLI_VERSION_NOT_FOUND = exports.MISSING_AZURE_TOKEN_FOR_FIX_PR_AND_PR_COMMENT = exports.NETWORK_SSL_TRUST_ALL_KEY_CLASSIC_EDITOR = exports.NETWORK_SSL_TRUST_ALL_KEY = exports.NETWORK_SSL_CERT_FILE_KEY_CLASSIC_EDITOR = exports.NETWORK_SSL_CERT_FILE_KEY = exports.BLACKDUCKSCA_SECURITY_SCAN_AZURE_DEVOPS_DOCS_URL = exports.DEFAULT_AZURE_API_URL = exports.MIN_SUPPORTED_BRIDGE_CLI_LINUX_ARM_VERSION = exports.MIN_SUPPORTED_BRIDGE_CLI_MAC_ARM_VERSION = exports.DARWIN = exports.LINUX = exports.WIN32 = exports.MAC_INTEL_PLATFORM = exports.MAC_ARM_PLATFORM = exports.LINUX_ARM_PLATFORM = exports.LINUX_PLATFORM = exports.WINDOWS_PLATFORM = exports.NON_RETRY_HTTP_CODES = exports.RETRY_COUNT = exports.RETRY_DELAY_IN_MILLISECONDS = exports.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME = exports.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY = exports.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY = exports.SARIF_DEFAULT_FILE_NAME = exports.BRIDGE_CLI_LOCAL_DIRECTORY = exports.UPLOAD_FOLDER_ARTIFACT_NAME = exports.BRIDGECLI_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR = exports.BRIDGECLI_INSTALL_DIRECTORY_KEY = exports.SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY = exports.SRM_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR = exports.COVERITY_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR = exports.BLACKDUCKSCA_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR = exports.POLARIS_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR = exports.MARK_BUILD_STATUS_KEY = exports.RETURN_STATUS_KEY = void 0;
exports.POLARIS_OUTPUT_FILE_NAME = exports.VERSION = exports.INTEGRATIONS_ADO_EE = exports.INTEGRATIONS_ADO_CLOUD = exports.ADO_SERVICES_URL = exports.INTEGRATIONS_CLI_LOCAL_DIRECTORY = exports.INTEGRATIONS_DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY = exports.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY = exports.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH = exports.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH = exports.NETWORK_SSL_VALIDATION_ERROR_MESSAGE = exports.BRIDGE_CLI_ARM_VERSION_FALLBACK_MESSAGE = exports.EXIT_CODE_MAP = exports.SARIF_GAS_API_RATE_LIMIT_FOR_ERROR = exports.PROVIDED_BLACKDUCKSCA_FAILURE_SEVERITIES_ERROR = exports.MISSING_BOOLEAN_VALUE_ERROR = exports.INVALID_VALUE_ERROR = exports.BRIDGE_DOWNLOAD_RETRY_ERROR = exports.SCAN_TYPE_REQUIRED_ERROR = exports.BRIDGE_DEFAULT_DIRECTORY_NOT_FOUND_ERROR = exports.BRIDGE_INSTALL_DIRECTORY_NOT_FOUND_ERROR = exports.BRIDGE_EXECUTABLE_NOT_FOUND_ERROR = exports.MARK_THE_BUILD_STATUS = exports.MARK_THE_BUILD_ON_BRIDGE_BREAK = exports.AZURE_PULL_REQUEST_NUMBER_IS_EMPTY = exports.BLACKDUCKSCA_SECURITY_SCAN_COMPLETED = exports.POLARISSCA_SARIF_REPORT_ENABLED = exports.BLACKDUCKSCA_SARIF_REPOST_ENABLED = exports.TASK_RETURN_STATUS = exports.NETWORK_AIR_GAP_ENABLED_SKIP_DOWNLOAD_BRIDGE_CLI = exports.UNABLE_TO_FIND_PULL_REQUEST_INFO = exports.GETTING_ALL_BRIDGE_VERSIONS_RETRY = exports.UNABLE_TO_GET_RECENT_BRIDGE_VERSION = exports.GETTING_LATEST_BRIDGE_VERSIONS_RETRY = exports.ERROR_READING_VERSION_FILE = exports.VERSION_FILE_NOT_FOUND_AT = exports.VERSION_FILE_FOUND_AT = exports.LOOKING_FOR_BRIDGE_CLI_DEFAULT_PATH = exports.LOOKING_FOR_BRIDGE_CLI_INSTALL_DIR = exports.BRIDGE_CLI_FOUND_AT = exports.BRIDGE_CLI_DOWNLOAD_COMPLETED = exports.BRIDGECLI_VERSION = exports.BRIDGE_CLI_URL_MESSAGE = exports.BRIDGE_CLI_EXTRACTION_COMPLETED = exports.EXTRACTING_BRIDGE_CLI_ARCHIVE = exports.DOWNLOADING_BRIDGE_CLI = exports.CHECK_LATEST_BRIDGE_CLI_VERSION = exports.SKIP_DOWNLOAD_BRIDGE_CLI_WHEN_VERSION_NOT_FOUND = exports.FAILED_TO_GET_PULL_REQUEST_INFO = exports.MISSING_BOOL_VALUE = void 0;
exports.BD_OUTPUT_FILE_NAME = void 0;
const ErrorCodes_1 = require("./enum/ErrorCodes");
const path_1 = __importDefault(require("path"));
exports.BRIDGE_CLI_DEFAULT_PATH_UNIX = "/bridge-cli-bundle"; //Path will be in home
exports.BRIDGE_CLI_DEFAULT_PATH_WINDOWS = "\\bridge-cli-bundle";
exports.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_UNIX = "/bridge-cli-bundle"; //Subdirectory for bridle-cli
exports.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_WINDOWS = "\\bridge-cli-bundle";
exports.BRIDGE_CLI_EXECUTABLE_WINDOWS = "bridge-cli.exe";
exports.BRIDGE_CLI_EXECUTABLE_MAC_LINUX = "bridge-cli";
exports.BRIDGE_CLI_ZIP_FILE_NAME = "bridge-cli-bundle.zip";
exports.AZURE_TOKEN_KEY = "azure_token";
exports.POLARIS_AZURE_TOKEN_KEY_CLASSIC_EDITOR = "polarisAzureToken";
exports.BLACKDUCKSCA_AZURE_TOKEN_KEY_CLASSIC_EDITOR = "blackduckScaAzureToken";
exports.COVERITY_AZURE_TOKEN_KEY_CLASSIC_EDITOR = "coverityAzureToken";
exports.SCAN_TYPE_KEY = "scanType";
exports.SPACE = " ";
// Scan Types
exports.POLARIS_KEY = "polaris";
exports.COVERITY_KEY = "coverity";
exports.BLACKDUCKSCA_KEY = "blackducksca";
exports.SRM_KEY = "srm";
// Polaris
exports.POLARIS_SERVER_URL_KEY = "polaris_server_url";
exports.POLARIS_SERVER_URL_KEY_CLASSIC_EDITOR = "polarisServerUrl";
exports.POLARIS_ACCESS_TOKEN_KEY = "polaris_access_token";
exports.POLARIS_ACCESS_TOKEN_KEY_CLASSIC_EDITOR = "polarisAccessToken";
exports.POLARIS_APPLICATION_NAME_KEY = "polaris_application_name";
exports.POLARIS_APPLICATION_NAME_KEY_CLASSIC_EDITOR = "polarisApplicationName";
exports.POLARIS_PROJECT_NAME_KEY = "polaris_project_name";
exports.POLARIS_PROJECT_NAME_KEY_CLASSIC_EDITOR = "polarisProjectName";
exports.POLARIS_ASSESSMENT_TYPES_KEY = "polaris_assessment_types";
exports.POLARIS_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR = "polarisAssessmentTypes";
exports.POLARIS_BRANCH_NAME_KEY = "polaris_branch_name";
exports.POLARIS_BRANCH_NAME_KEY_CLASSIC_EDITOR = "polarisBranchName";
exports.POLARIS_BRANCH_PARENT_NAME_KEY = "polaris_branch_parent_name";
exports.POLARIS_BRANCH_PARENT_NAME_KEY_CLASSIC_EDITOR = "polarisBranchParentName";
exports.POLARIS_PR_COMMENT_ENABLED_KEY = "polaris_prComment_enabled";
exports.POLARIS_PR_COMMENT_ENABLED_KEY_CLASSIC_EDITOR = "polarisPrCommentEnabled";
exports.POLARIS_PR_COMMENT_SEVERITIES_KEY = "polaris_prComment_severities";
exports.POLARIS_PR_COMMENT_SEVERITIES_KEY_CLASSIC_EDITOR = "polarisPrCommentSeverities";
exports.POLARIS_REPORTS_SARIF_CREATE_KEY = "polaris_reports_sarif_create";
exports.POLARIS_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR = "polarisReportsSarifCreate";
exports.POLARIS_REPORTS_SARIF_FILE_PATH_KEY = "polaris_reports_sarif_file_path";
exports.POLARIS_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR = "polarisReportsSarifFilePath";
exports.POLARIS_REPORTS_SARIF_SEVERITIES_KEY = "polaris_reports_sarif_severities";
exports.POLARIS_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR = "polarisReportsSarifSeverities";
exports.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY = "polaris_reports_sarif_groupSCAIssues";
exports.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR = "polarisReportsSarifGroupSCAIssues";
exports.POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY = "polaris_reports_sarif_issue_types";
exports.POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY_CLASSIC_EDITOR = "polarisReportsSarifIssueTypes";
exports.POLARIS_ASSESSMENT_MODE_KEY = "polaris_assessment_mode";
exports.POLARIS_ASSESSMENT_MODE_KEY_CLASSIC_EDITOR = "polarisAssessmentMode";
exports.POLARIS_TEST_SCA_TYPE_KEY = "polaris_test_sca_type";
exports.POLARIS_TEST_SCA_TYPE_KEY_CLASSIC_EDITOR = "polarisTestScaType";
exports.POLARIS_TEST_SAST_TYPE_KEY = "polaris_test_sast_type";
exports.POLARIS_TEST_SAST_TYPE_KEY_CLASSIC_EDITOR = "polarisTestSastType";
exports.PROJECT_DIRECTORY_KEY = "project_directory";
exports.POLARIS_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR = "polarisProjectDirectory";
exports.POLARIS_WAITFORSCAN_KEY = "polaris_waitForScan";
exports.POLARIS_WAITFORSCAN_KEY_CLASSIC_EDITOR = "polarisWaitForScan";
exports.PROJECT_SOURCE_ARCHIVE_KEY = "project_source_archive";
exports.PROJECT_SOURCE_ARCHIVE_KEY_CLASSIC_EDITOR = "projectSourceArchive";
exports.PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY = "project_source_preserveSymLinks";
exports.PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY_CLASSIC_EDITOR = "projectSourcePreserveSymLinks";
exports.PROJECT_SOURCE_EXCLUDES_KEY = "project_source_excludes";
exports.PROJECT_SOURCE_EXCLUDES_KEY_CLASSIC_EDITOR = "projectSourceExcludes";
// Coverity
exports.COVERITY_URL_KEY = "coverity_url";
exports.COVERITY_URL_KEY_CLASSIC_EDITOR = "coverityUrl";
exports.COVERITY_USER_KEY = "coverity_user";
exports.COVERITY_USER_KEY_CLASSIC_EDITOR = "coverityUser";
exports.COVERITY_PASSPHRASE_KEY = "coverity_passphrase";
exports.COVERITY_PASSPHRASE_KEY_CLASSIC_EDITOR = "coverityUserPassword";
exports.COVERITY_PROJECT_NAME_KEY = "coverity_project_name";
exports.COVERITY_PROJECT_NAME_KEY_CLASSIC_EDITOR = "coverityProjectName";
exports.COVERITY_STREAM_NAME_KEY = "coverity_stream_name";
exports.COVERITY_STREAM_NAME_KEY_CLASSIC_EDITOR = "coverityStreamName";
exports.COVERITY_INSTALL_DIRECTORY_KEY = "coverity_install_directory";
exports.COVERITY_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR = "coverityInstallDirectory";
exports.COVERITY_EXECUTION_PATH_KEY = "coverity_execution_path";
exports.COVERITY_EXECUTION_PATH_KEY_CLASSIC_EDITOR = "coverityExecutionPath";
exports.COVERITY_POLICY_VIEW_KEY = "coverity_policy_view";
exports.COVERITY_POLICY_VIEW_KEY_CLASSIC_EDITOR = "coverityPolicyView";
exports.COVERITY_WAITFORSCAN_KEY = "coverity_waitForScan";
exports.COVERITY_WAITFORSCAN_KEY_CLASSIC_EDITOR = "coverityWaitForScan";
exports.COVERITY_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR = "coverityProjectDirectory";
exports.COVERITY_PRCOMMENT_ENABLED_KEY = "coverity_prComment_enabled";
exports.COVERITY_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR = "coverityPrCommentEnabled";
exports.COVERITY_LOCAL_KEY = "coverity_local";
exports.COVERITY_LOCAL_KEY_CLASSIC_EDITOR = "coverityLocal";
exports.COVERITY_VERSION_KEY = "coverity_version";
exports.COVERITY_VERSION_KEY_CLASSIC_EDITOR = "coverityVersion";
exports.COVERITY_BUILD_COMMAND_KEY = "coverity_build_command";
exports.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR = "coverityBuildCommand";
exports.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR_FOR_POLARIS = "coverityBuildCommandForPolaris";
exports.COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR_FOR_SRM = "coverityBuildCommandForSrm";
exports.COVERITY_CLEAN_COMMAND_KEY = "coverity_clean_command";
exports.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR = "coverityCleanCommand";
exports.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR_FOR_POLARIS = "coverityCleanCommandForPolaris";
exports.COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR_FOR_SRM = "coverityCleanCommandForSrm";
exports.COVERITY_CONFIG_PATH_KEY = "coverity_config_path";
exports.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR = "coverityConfigPath";
exports.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_POLARIS = "coverityConfigPathForPolaris";
exports.COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_SRM = "coverityConfigPathForSrm";
exports.COVERITY_ARGS_KEY = "coverity_args";
exports.COVERITY_ARGS_KEY_CLASSIC_EDITOR = "coverityArgs";
exports.COVERITY_ARGS_KEY_CLASSIC_EDITOR_FOR_POLARIS = "coverityArgsForPolaris";
exports.COVERITY_ARGS_KEY_CLASSIC_EDITOR_FOR_SRM = "coverityArgsForSrm";
// Blackduck
/**
 * @deprecated Use blackducksca_url instead. This can be removed in future release.
 */
exports.BLACKDUCK_URL_KEY = "blackduck_url"; // old key
exports.BLACKDUCKSCA_URL_KEY = "blackducksca_url"; // new key
exports.BLACKDUCKSCA_URL_KEY_CLASSIC_EDITOR = "blackduckScaUrl"; // classic editor key
/**
 * @deprecated Use BLACKDUCKSCA_TOKEN_KEY instead. This can be removed in future release.
 */
exports.BLACKDUCK_TOKEN_KEY = "blackduck_token";
exports.BLACKDUCKSCA_TOKEN_KEY = "blackducksca_token";
exports.BLACKDUCKSCA_TOKEN_KEY_CLASSIC_EDITOR = "blackduckScaToken";
/**
 * @deprecated Use detect_install_directory instead. This can be removed in future release.
 */
exports.BLACKDUCK_INSTALL_DIRECTORY_KEY = "blackduck_install_directory";
exports.DETECT_INSTALL_DIRECTORY_KEY = "detect_install_directory";
exports.DETECT_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR = "detectInstallDirectory";
/**
 * @deprecated Use detect_execution_path instead. This can be removed in future release.
 */
exports.BLACKDUCK_EXECUTION_PATH_KEY = "blackduck_execution_path";
exports.DETECT_EXECUTION_PATH_KEY = "detect_execution_path";
exports.DETECT_EXECUTION_PATH_KEY_CLASSIC_EDITOR = "detectExecutionPath";
/**
 * @deprecated Use detect_scan_full instead. This can be removed in future release.
 */
exports.BLACKDUCK_SCAN_FULL_KEY = "blackduck_scan_full";
exports.BLACKDUCKSCA_SCAN_FULL_KEY = "blackducksca_scan_full";
exports.BLACKDUCKSCA_SCAN_FULL_KEY_CLASSIC_EDITOR = "blackduckScaScanFull";
/**
 * @deprecated Use blackducksca_scan_failure_severities instead. This can be removed in future release.
 */
exports.BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY = "blackduck_scan_failure_severities";
exports.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY = "blackducksca_scan_failure_severities";
exports.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY_CLASSIC_EDITOR = "blackduckScaScanFailureSeverities";
/**
 * @deprecated Use blackducksca_prComment_enabled instead. This can be removed in future release.
 */
exports.BLACKDUCK_PRCOMMENT_ENABLED_KEY = "blackduck_prComment_enabled";
exports.BLACKDUCKSCA_PRCOMMENT_ENABLED_KEY = "blackducksca_prComment_enabled";
exports.BLACKDUCKSCA_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR = "blackduckScaPrCommentEnabled";
/**
 * @deprecated Use blackducksca_fixpr_enabled instead. This can be removed in future release.
 */
exports.BLACKDUCK_FIXPR_ENABLED_KEY = "blackduck_fixpr_enabled";
exports.BLACKDUCKSCA_FIXPR_ENABLED_KEY = "blackducksca_fixpr_enabled";
exports.BLACKDUCKSCA_FIXPR_ENABLED_KEY_CLASSIC_EDITOR = "blackduckScaFixPrEnabled";
/**
 * @deprecated Use blackducksca_fixpr_maxCount instead. This can be removed in future release.
 */
exports.BLACKDUCK_FIXPR_MAXCOUNT_KEY = "blackduck_fixpr_maxCount";
exports.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY = "blackducksca_fixpr_maxCount";
exports.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY_CLASSIC_EDITOR = "blackduckScaFixPrMaxCount";
/**
 * @deprecated Use blackducksca_fixpr_createSinglePR instead. This can be removed in future release.
 */
exports.BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY = "blackduck_fixpr_createSinglePR";
exports.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY = "blackducksca_fixpr_createSinglePR";
exports.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY_CLASSIC_EDITOR = "blackduckScaFixPRCreateSinglePR";
/**
 * @deprecated Use blackducksca_fixpr_filter_severities instead. This can be removed in future release.
 */
exports.BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY = "blackduck_fixpr_filter_severities";
exports.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES_KEY = "blackducksca_fixpr_filter_severities";
exports.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES_KEY_CLASSIC_EDITOR = "blackduckScaFixPrFilterSeverities";
/**
 * @deprecated Use blackducksca_fixpr_useUpgradeGuidance instead. This can be removed in future release.
 */
exports.BLACKDUCK_FIXPR_UPGRADE_GUIDANCE_KEY = "blackduck_fixpr_useUpgradeGuidance";
exports.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE_KEY = "blackducksca_fixpr_useUpgradeGuidance";
exports.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE_KEY_CLASSIC_EDITOR = "blackduckScaFixPrUseUpgradeGuidance";
/**
 * @deprecated Use blackducksca_waitForScan instead. This can be removed in future release.
 */
exports.BLACKDUCK_WAITFORSCAN_KEY = "blackduck_waitForScan";
exports.BLACKDUCKSCA_WAITFORSCAN_KEY = "blackducksca_waitForScan";
exports.BLACKDUCKSCA_WAITFORSCAN_KEY_CLASSIC_EDITOR = "blackduckScaWaitForScan";
exports.BLACKDUCKSCA_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR = "blackduckScaProjectDirectory";
/**
 * @deprecated Use blackducksca_reports_sarif_create instead. This can be removed in future release.
 */
exports.BLACKDUCK_REPORTS_SARIF_CREATE_KEY = "blackduck_reports_sarif_create";
exports.BLACKDUCKSCA_REPORTS_SARIF_CREATE_KEY = "blackducksca_reports_sarif_create";
exports.BLACKDUCKSCA_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR = "blackduckScaReportsSarifCreate";
/**
 * @deprecated Use blackducksca_reports_sarif_file_path instead. This can be removed in future release.
 */
exports.BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY = "blackduck_reports_sarif_file_path";
exports.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH_KEY = "blackducksca_reports_sarif_file_path";
exports.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR = "blackduckScaReportsSarifFilePath";
/**
 * @deprecated Use blackducksca_reports_sarif_severities instead. This can be removed in future release.
 */
exports.BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY = "blackduck_reports_sarif_severities";
exports.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES_KEY = "blackducksca_reports_sarif_severities";
exports.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR = "blackduckScaReportsSarifSeverities";
/**
 * @deprecated Use blackducksca_reports_sarif_groupSCAIssues instead. This can be removed in future release.
 */
exports.BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY = "blackduck_reports_sarif_groupSCAIssues";
exports.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY = "blackducksca_reports_sarif_groupSCAIssues";
exports.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR = "blackduckScaReportsSarifGroupSCAIssues";
/**
 * @deprecated Use detect_search_depth instead. This can be removed in future release.
 */
exports.BLACKDUCK_SEARCH_DEPTH_KEY = "blackduck_search_depth";
exports.DETECT_SEARCH_DEPTH_KEY = "detect_search_depth";
exports.DETECT_DEPTH_KEY_CLASSIC_EDITOR = "detectSearchDepth";
exports.DETECT_DEPTH_KEY_CLASSIC_EDITOR_FOR_POLARIS = "detectSearchDepthForPolaris";
exports.DETECT_DEPTH_KEY_CLASSIC_EDITOR_FOR_SRM = "detectSearchDepthForSrm";
/**
 * @deprecated Use detect_config_path instead. This can be removed in future release.
 */
exports.BLACKDUCK_CONFIG_PATH_KEY = "blackduck_config_path";
exports.DETECT_CONFIG_PATH_KEY = "detect_config_path";
exports.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR = "detectConfigPath";
exports.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_POLARIS = "detectConfigPathForPolaris";
exports.DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_SRM = "detectConfigPathForSrm";
/**
 * @deprecated Use detect_args instead. This can be removed in future release.
 */
exports.BLACKDUCK_ARGS_KEY = "blackduck_args";
exports.DETECT_ARGS_KEY = "detect_args";
exports.DETECT_ARGS_KEY_CLASSIC_EDITOR = "detectArgs";
exports.DETECT_ARGS_KEY_CLASSIC_EDITOR_FOR_POLARIS = "detectArgsForPolaris";
exports.DETECT_ARGS_KEY_CLASSIC_EDITOR_FOR_SRM = "detectArgsForSrm";
//SRM
exports.SRM_URL_KEY = "srm_url";
exports.SRM_URL_KEY_CLASSIC_EDITOR = "srmUrl";
exports.SRM_APIKEY_KEY = "srm_apikey";
exports.SRM_APIKEY_KEY_CLASSIC_EDITOR = "srmApikey";
exports.SRM_ASSESSMENT_TYPES_KEY = "srm_assessment_types";
exports.SRM_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR = "srmAssessmentTypes";
exports.SRM_PROJECT_NAME_KEY = "srm_project_name";
exports.SRM_PROJECT_NAME_KEY_CLASSIC_EDITOR = "srmProjectName";
exports.SRM_PROJECT_ID_KEY = "srm_project_id";
exports.SRM_PROJECT_ID_KEY_CLASSIC_EDITOR = "srmProjectId";
exports.SRM_BRANCH_NAME_KEY = "srm_branch_name";
exports.SRM_BRANCH_NAME_KEY_CLASSIC_EDITOR = "srmBranchName";
exports.SRM_BRANCH_PARENT_KEY = "srm_branch_parent";
exports.SRM_BRANCH_PARENT_KEY_CLASSIC_EDITOR = "srmBranchParent";
exports.SRM_WAITFORSCAN_KEY = "srm_waitForScan";
exports.SRM_WAITFORSCAN_KEY_CLASSIC_EDITOR = "srmWaitForScan";
exports.SRM_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR = "srmProjectDirectory";
exports.INCLUDE_DIAGNOSTICS_KEY = "include_diagnostics";
exports.POLARIS_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR = "polarisIncludeDiagnostics";
exports.BLACKDUCKSCA_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR = "blackduckScaIncludeDiagnostics";
exports.COVERITY_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR = "coverityIncludeDiagnostics";
exports.SRM_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR = "srmIncludeDiagnostics";
/**
 * @deprecated Use network_airgap instead. This can be removed in future release.
 */
exports.BRIDGE_NETWORK_AIRGAP_KEY = "bridge_network_airgap";
exports.NETWORK_AIRGAP_KEY = "network_airgap";
exports.NETWORK_AIRGAP_KEY_CLASSIC_EDITOR = "networkAirgap";
/**
 * @deprecated Use bridgecli_download_url instead. This can be removed in future release.
 */
exports.SYNOPSYS_BRIDGE_DOWNLOAD_URL_KEY = "synopsys_bridge_download_url";
exports.BRIDGECLI_DOWNLOAD_URL_KEY = "bridgecli_download_url";
exports.BRIDGECLI_DOWNLOAD_URL_KEY_CLASSIC_EDITOR = "bridgeCliDownloadUrl";
/**
 * @deprecated Use bridgecli_download_version instead. This can be removed in future release.
 */
exports.SYNOPSYS_BRIDGE_DOWNLOAD_VERSION_KEY = "synopsys_bridge_download_version";
exports.BRIDGECLI_DOWNLOAD_VERSION_KEY = "bridgecli_download_version";
exports.BRIDGECLI_DOWNLOAD_VERSION_KEY_CLASSIC_EDITOR = "bridgeCliDownloadVersion";
exports.RETURN_STATUS_KEY = "return_status";
//export const RETURN_STATUS_KEY_CLASSIC_EDITOR = "returnStatus";
exports.MARK_BUILD_STATUS_KEY = "mark_build_status";
exports.POLARIS_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR = "polarisMarkBuildStatus";
exports.BLACKDUCKSCA_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR = "blackduckScaMarkBuildStatus";
exports.COVERITY_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR = "coverityMarkBuildStatus";
exports.SRM_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR = "srmMarkBuildStatus";
/**
 * @deprecated Use bridgecli_install_directory instead. This can be removed in future release.
 */
exports.SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY = "synopsys_bridge_install_directory";
exports.BRIDGECLI_INSTALL_DIRECTORY_KEY = "bridgecli_install_directory";
exports.BRIDGECLI_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR = "bridgeCliInstallDirectory";
exports.UPLOAD_FOLDER_ARTIFACT_NAME = "bridge_cli_diagnostics";
exports.BRIDGE_CLI_LOCAL_DIRECTORY = ".bridge";
exports.SARIF_DEFAULT_FILE_NAME = "report.sarif.json";
exports.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY = "Blackduck SCA SARIF Generator";
exports.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY = "Polaris SARIF Generator";
exports.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME = "sarif_report";
exports.RETRY_DELAY_IN_MILLISECONDS = 15000;
exports.RETRY_COUNT = 3;
exports.NON_RETRY_HTTP_CODES = new Set([200, 201, 401, 403, 416]);
exports.WINDOWS_PLATFORM = "win64";
exports.LINUX_PLATFORM = "linux64";
exports.LINUX_ARM_PLATFORM = "linux_arm";
exports.MAC_ARM_PLATFORM = "macos_arm";
exports.MAC_INTEL_PLATFORM = "macosx";
exports.WIN32 = "win32";
exports.LINUX = "linux";
exports.DARWIN = "darwin";
exports.MIN_SUPPORTED_BRIDGE_CLI_MAC_ARM_VERSION = "2.1.0";
exports.MIN_SUPPORTED_BRIDGE_CLI_LINUX_ARM_VERSION = "3.5.1";
exports.DEFAULT_AZURE_API_URL = "https://dev.azure.com";
exports.BLACKDUCKSCA_SECURITY_SCAN_AZURE_DEVOPS_DOCS_URL = "https://documentation.blackduck.com/bundle/bridge/page/documentation/c_additional-azure-parameters.html";
exports.NETWORK_SSL_CERT_FILE_KEY = "network_ssl_cert_file";
exports.NETWORK_SSL_CERT_FILE_KEY_CLASSIC_EDITOR = "networkSslCertFile";
exports.NETWORK_SSL_TRUST_ALL_KEY = "network_ssl_trustAll";
exports.NETWORK_SSL_TRUST_ALL_KEY_CLASSIC_EDITOR = "networkSslTrustAll";
// Error Messages
exports.MISSING_AZURE_TOKEN_FOR_FIX_PR_AND_PR_COMMENT = "Missing required azure token for fix pull request/automation comment";
exports.BRIDGE_CLI_VERSION_NOT_FOUND = "Provided Bridge CLI version not found in artifactory";
exports.BRIDGE_CLI_EXECUTABLE_FILE_NOT_FOUND = "Bridge CLI executable file could not be found at ";
exports.EMPTY_BRIDGE_CLI_URL = "Provided Bridge CLI URL cannot be empty ";
exports.INVALID_BRIDGE_CLI_URL_SPECIFIED_OS = "Provided Bridge CLI url is not valid for the configured ";
exports.INVALID_BRIDGE_CLI_URL = "Invalid URL";
exports.WORKFLOW_FAILED = "Workflow failed! ";
exports.BRIDGE_CLI_ZIP_NOT_FOUND_FOR_EXTRACT = "File does not exist";
exports.BRIDGE_CLI_DOWNLOAD_FAILED = "Bridge CLI download has been failed";
exports.BRIDGE_CLI_DOWNLOAD_FAILED_RETRY = "Bridge CLI download has been failed, Retries left: ";
exports.WORKSPACE_DIR_NOT_FOUND = "Workspace directory could not be located";
exports.BRIDGE_CLI_EXTRACT_DIRECTORY_NOT_FOUND = "No destination directory found";
exports.BRIDGE_CLI_INSTALL_DIRECTORY_NOT_EXISTS = "Bridge CLI Install Directory does not exist";
exports.BRIDGE_CLI_DEFAULT_DIRECTORY_NOT_EXISTS = "Bridge CLI default directory does not exist";
exports.INVALID_BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES = "Provided value is not valid - BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES";
exports.REQUIRE_ONE_SCAN_TYPE = "Requires at least one scan type: (";
exports.MISSING_BOOL_VALUE = "Missing boolean value for ";
exports.FAILED_TO_GET_PULL_REQUEST_INFO = "Failed to get pull request info for current build from source branch: ";
// Info Messages
exports.SKIP_DOWNLOAD_BRIDGE_CLI_WHEN_VERSION_NOT_FOUND = "Skipping download as same Bridge CLI version found";
exports.CHECK_LATEST_BRIDGE_CLI_VERSION = "Checking for latest version of Bridge CLI to download and configure";
exports.DOWNLOADING_BRIDGE_CLI = "Downloading and configuring Bridge CLI";
exports.EXTRACTING_BRIDGE_CLI_ARCHIVE = "Extracting Bridge CLI archive";
exports.BRIDGE_CLI_EXTRACTION_COMPLETED = "Extraction of Bridge CLI archive has been completed";
exports.BRIDGE_CLI_URL_MESSAGE = "Bridge CLI URL is - ";
exports.BRIDGECLI_VERSION = "Bridge CLI version is - ";
exports.BRIDGE_CLI_DOWNLOAD_COMPLETED = "Download of Bridge CLI has been completed";
exports.BRIDGE_CLI_FOUND_AT = "Bridge CLI executable found at ";
exports.LOOKING_FOR_BRIDGE_CLI_INSTALL_DIR = "Looking for bridge in Bridge CLI Install Directory";
exports.LOOKING_FOR_BRIDGE_CLI_DEFAULT_PATH = "Looking for Bridge CLI in default path";
exports.VERSION_FILE_FOUND_AT = "Version file found at ";
exports.VERSION_FILE_NOT_FOUND_AT = "Bridge CLI version file could not be found at ";
exports.ERROR_READING_VERSION_FILE = "Error reading version file content: ";
exports.GETTING_LATEST_BRIDGE_VERSIONS_RETRY = "Getting latest Bridge CLI versions has been failed, Retries left: ";
exports.UNABLE_TO_GET_RECENT_BRIDGE_VERSION = "Unable to retrieve the most recent version from Artifactory URL";
exports.GETTING_ALL_BRIDGE_VERSIONS_RETRY = "Getting all available bridge versions has been failed, Retries left: ";
exports.UNABLE_TO_FIND_PULL_REQUEST_INFO = "Unable to find pull request info for the current source build with branch: ";
exports.NETWORK_AIR_GAP_ENABLED_SKIP_DOWNLOAD_BRIDGE_CLI = "Network air gap is enabled, skipping Bridge CLI download.";
exports.TASK_RETURN_STATUS = "`##vso[task.setvariable variable=status;isoutput=true]${result}`";
exports.BLACKDUCKSCA_SARIF_REPOST_ENABLED = "BLACKDUCKSCA_REPORTS_SARIF_CREATE is enabled";
exports.POLARISSCA_SARIF_REPORT_ENABLED = "POLARIS_REPORTS_SARIF_CREATE is enabled";
exports.BLACKDUCKSCA_SECURITY_SCAN_COMPLETED = "Black Duck Security Scan completed";
exports.AZURE_PULL_REQUEST_NUMBER_IS_EMPTY = "azurePullRequestNumber is empty, setting environment.scan.pull as true";
exports.MARK_THE_BUILD_ON_BRIDGE_BREAK = "`Marking the build ${TaskResult[taskResult]} as configured in the task`";
exports.MARK_THE_BUILD_STATUS = "`Marking build status ${TaskResult[taskResult]} is ignored since exit code is: ${status}`";
//export const BRIDGE_VERSION_NOT_FOUND_ERROR = 'Skipping download as same Bridge CLI version found'
exports.BRIDGE_EXECUTABLE_NOT_FOUND_ERROR = "Bridge executable could not be found at ";
exports.BRIDGE_INSTALL_DIRECTORY_NOT_FOUND_ERROR = "Bridge install directory does not exist";
exports.BRIDGE_DEFAULT_DIRECTORY_NOT_FOUND_ERROR = "Bridge default directory does not exist";
exports.SCAN_TYPE_REQUIRED_ERROR = "Requires at least one scan type: ({0},{1},{2},{3})";
exports.BRIDGE_DOWNLOAD_RETRY_ERROR = "max attempts should be greater than or equal to 1";
exports.INVALID_VALUE_ERROR = "Invalid value for ";
exports.MISSING_BOOLEAN_VALUE_ERROR = "Missing boolean value for ";
exports.PROVIDED_BLACKDUCKSCA_FAILURE_SEVERITIES_ERROR = "Provided value is not valid - BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES";
exports.SARIF_GAS_API_RATE_LIMIT_FOR_ERROR = "GitHub API rate limit has been exceeded, retry after {0} minutes.";
// Bridge and ADO Exit Codes
exports.EXIT_CODE_MAP = new Map([
    [
        ErrorCodes_1.ErrorCode.SUCCESSFULLY_COMPLETED.toString(),
        "Bridge execution successfully completed",
    ],
    [
        ErrorCodes_1.ErrorCode.UNDEFINED_ERROR_FROM_BRIDGE.toString(),
        "Undefined error, check error logs",
    ],
    [ErrorCodes_1.ErrorCode.ADAPTER_ERROR.toString(), "Error from adapter end"],
    [
        ErrorCodes_1.ErrorCode.BRIDGE_SHUTDOWN_FAILURE.toString(),
        "Failed to shutdown the bridge",
    ],
    [
        ErrorCodes_1.ErrorCode.BRIDGE_BREAK_ENABLED.toString(),
        "The config option bridge.break has been set to true",
    ],
    [
        ErrorCodes_1.ErrorCode.BRIDGE_INITIALIZATION_FAILED.toString(),
        "Bridge initialization failed",
    ],
    // The list of ADO extension related error codes begins below
    [
        ErrorCodes_1.ErrorCode.MISSING_AT_LEAST_ONE_SCAN_TYPE.toString(),
        "Requires at least one scan type",
    ],
    [
        ErrorCodes_1.ErrorCode.MISSING_REQUIRED_PARAMETERS.toString(),
        "Required Parameters for Scan Type (Polaris/BlackDuck SCA/Coverity/SRM) are missing",
    ],
    [
        ErrorCodes_1.ErrorCode.AGENT_TEMP_DIRECTORY_NOT_SET.toString(),
        "Agent.TempDirectory is not set",
    ],
    [
        ErrorCodes_1.ErrorCode.BLACKDUCKSCA_FIXPR_MAXCOUNT_NOT_APPLICABLE.toString(),
        "blackducksca_fixpr_maxCount is not applicable with blackducksca_fixpr_createSinglePR",
    ],
    [
        ErrorCodes_1.ErrorCode.INVALID_POLARIS_ASSESSMENT_TYPES.toString(),
        "Invalid value for polaris_assessment_types",
    ],
    [
        ErrorCodes_1.ErrorCode.INVALID_BLACKDUCKSCA_FAILURE_SEVERITIES.toString(),
        "Invalid value for blackducksca_scan_failure_severities",
    ],
    [
        ErrorCodes_1.ErrorCode.INVALID_BLACKDUCKSCA_FIXPR_MAXCOUNT.toString(),
        "Invalid value for blackducksca_fixpr_maxCount",
    ],
    [
        ErrorCodes_1.ErrorCode.MISSING_BOOLEAN_VALUE.toString(),
        "Missing boolean value for detect_scan_full",
    ],
    [
        ErrorCodes_1.ErrorCode.INVALID_BRIDGE_CLI_URL.toString(),
        "Provided Bridge CLI URL is not valid for the configured platform runner",
    ],
    [
        ErrorCodes_1.ErrorCode.BRIDGE_CLI_URL_CANNOT_BE_EMPTY.toString(),
        "Provided Bridge CLI URL cannot be empty",
    ],
    [
        ErrorCodes_1.ErrorCode.INVALID_URL.toString(),
        "Invalid URL (Invalid Bridge CLI Download URL)",
    ],
    [
        ErrorCodes_1.ErrorCode.BRIDGE_CLI_VERSION_NOT_FOUND.toString(),
        "Provided Bridge CLI version not found in artifactory",
    ],
    [
        ErrorCodes_1.ErrorCode.BRIDGE_CLI_DOWNLOAD_FAILED.toString(),
        "Bridge CLI download has been failed",
    ],
    [
        ErrorCodes_1.ErrorCode.BRIDGE_INSTALL_DIRECTORY_NOT_EXIST.toString(),
        "Bridge CLI Install Directory does not exist",
    ],
    [
        ErrorCodes_1.ErrorCode.DEFAULT_DIRECTORY_NOT_FOUND.toString(),
        "Bridge CLI default directory does not exist",
    ],
    [
        ErrorCodes_1.ErrorCode.BRIDGE_EXECUTABLE_NOT_FOUND.toString(),
        "Bridge CLI executable file could not be found at executable Bridge path",
    ],
    [
        ErrorCodes_1.ErrorCode.WORKSPACE_DIRECTORY_NOT_FOUND.toString(),
        "Workspace directory could not be located",
    ],
    [
        ErrorCodes_1.ErrorCode.FILE_DOES_NOT_EXIST.toString(),
        "File (Bridge CLI zip) does not exist",
    ],
    [
        ErrorCodes_1.ErrorCode.NO_DESTINATION_DIRECTORY.toString(),
        "No destination directory found for unzipping Bridge CLI",
    ],
    [
        ErrorCodes_1.ErrorCode.FAILED_TO_GET_PULL_REQUEST_INFO_FROM_SOURCE_BRANCH.toString(),
        "Failed to get pull request Id for current build from source branch",
    ],
    [
        ErrorCodes_1.ErrorCode.MISSING_AZURE_TOKEN.toString(),
        exports.MISSING_AZURE_TOKEN_FOR_FIX_PR_AND_PR_COMMENT,
    ],
    [
        ErrorCodes_1.ErrorCode.INVALID_COVERITY_INSTALL_DIRECTORY.toString(),
        "coverity_install_directory parameter for Coverity is invalid",
    ],
    [
        ErrorCodes_1.ErrorCode.REQUIRED_COVERITY_STREAM_NAME_FOR_MANUAL_TRIGGER.toString(),
        "COVERITY_STREAM_NAME is mandatory for azure manual trigger",
    ],
    [
        ErrorCodes_1.ErrorCode.DOWNLOAD_FAILED_WITH_HTTP_STATUS_CODE.toString(),
        "Failed to download Bridge CLI zip from specified URL. HTTP status code: ",
    ],
    [
        ErrorCodes_1.ErrorCode.CONTENT_LENGTH_MISMATCH.toString(),
        "Content-Length of Bridge CLI in the artifactory did not match downloaded file size",
    ],
    [
        ErrorCodes_1.ErrorCode.UNDEFINED_ERROR_FROM_EXTENSION.toString(),
        "Undefined error from extension",
    ],
]);
exports.BRIDGE_CLI_ARM_VERSION_FALLBACK_MESSAGE = "Detected Bridge CLI version ({version}) below the minimum ARM support requirement ({minVersion}). Defaulting to {intelSuffix} platform.";
exports.NETWORK_SSL_VALIDATION_ERROR_MESSAGE = "Both network_ssl_cert_file and network_ssl_trustAll are set. Only one of these resources should be set at a time.";
// Sarif file path related and custom header info messages
exports.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH = path_1.default.join(".blackduck", "integrations", "polaris", "sarif", "report.sarif.json");
exports.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH = path_1.default.join(".blackduck", "integrations", "blackducksca", "sarif", "report.sarif.json");
exports.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY = path_1.default.join("blackducksca", "sarif");
exports.INTEGRATIONS_DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY = path_1.default.join("polaris", "sarif");
exports.INTEGRATIONS_CLI_LOCAL_DIRECTORY = path_1.default.join(".blackduck", "integrations");
exports.ADO_SERVICES_URL = "https://dev.azure.com";
exports.INTEGRATIONS_ADO_CLOUD = "Integrations-ado-cloud";
exports.INTEGRATIONS_ADO_EE = "Integrations-ado-ee";
exports.VERSION = "3.5.0";
exports.POLARIS_OUTPUT_FILE_NAME = "polaris_output.json";
exports.BD_OUTPUT_FILE_NAME = "bd_output.json";

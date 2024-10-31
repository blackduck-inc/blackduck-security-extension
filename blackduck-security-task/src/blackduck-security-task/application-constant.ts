// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import { ErrorCode } from "./enum/ErrorCodes";
export const BRIDGE_CLI_DEFAULT_PATH_MAC =
  "/bridge-cli-bundle/bridge-cli-bundle-$version-$platform"; //Path will be in home
export const BRIDGE_CLI_DEFAULT_PATH_WINDOWS =
  "\\bridge-cli-bundle\\bridge-cli-bundle-$version-$platform";
export const BRIDGE_CLI_DEFAULT_PATH_LINUX =
  "/bridge-cli-bundle/bridge-cli-bundle-$version-$platform";
export const BRIDGE_CLI_EXECUTABLE_WINDOWS = "bridge-cli.exe";
export const BRIDGE_CLI_EXECUTABLE_MAC_LINUX = "bridge-cli";
export const BRIDGE_CLI_ZIP_FILE_NAME = "bridge-cli-bundle.zip";

export const AZURE_TOKEN_KEY = "azure_token";
export const POLARIS_AZURE_TOKEN_KEY_CLASSIC_EDITOR = "polarisAzureToken";
export const BLACKDUCKSCA_AZURE_TOKEN_KEY_CLASSIC_EDITOR =
  "blackduckScaAzureToken";
export const COVERITY_AZURE_TOKEN_KEY_CLASSIC_EDITOR = "coverityAzureToken";
export const SCAN_TYPE_KEY = "scanType";
export const SPACE = " ";

// Scan Types
export const POLARIS_KEY = "polaris";
export const COVERITY_KEY = "coverity";
export const BLACKDUCKSCA_KEY = "blackducksca";
export const SRM_KEY = "srm";

// Polaris
export const POLARIS_SERVER_URL_KEY = "polaris_server_url";
export const POLARIS_SERVER_URL_KEY_CLASSIC_EDITOR = "polarisServerUrl";

export const POLARIS_ACCESS_TOKEN_KEY = "polaris_access_token";
export const POLARIS_ACCESS_TOKEN_KEY_CLASSIC_EDITOR = "polarisAccessToken";

export const POLARIS_APPLICATION_NAME_KEY = "polaris_application_name";
export const POLARIS_APPLICATION_NAME_KEY_CLASSIC_EDITOR =
  "polarisApplicationName";

export const POLARIS_PROJECT_NAME_KEY = "polaris_project_name";
export const POLARIS_PROJECT_NAME_KEY_CLASSIC_EDITOR = "polarisProjectName";

export const POLARIS_ASSESSMENT_TYPES_KEY = "polaris_assessment_types";
export const POLARIS_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR =
  "polarisAssessmentTypes";

export const POLARIS_BRANCH_NAME_KEY = "polaris_branch_name";
export const POLARIS_BRANCH_NAME_KEY_CLASSIC_EDITOR = "polarisBranchName";

export const POLARIS_BRANCH_PARENT_NAME_KEY = "polaris_branch_parent_name";
export const POLARIS_BRANCH_PARENT_NAME_KEY_CLASSIC_EDITOR =
  "polarisBranchParentName";

export const POLARIS_PR_COMMENT_ENABLED_KEY = "polaris_prComment_enabled";
export const POLARIS_PR_COMMENT_ENABLED_KEY_CLASSIC_EDITOR =
  "polarisPrCommentEnabled";

export const POLARIS_PR_COMMENT_SEVERITIES_KEY = "polaris_prComment_severities";
export const POLARIS_PR_COMMENT_SEVERITIES_KEY_CLASSIC_EDITOR =
  "polarisPrCommentSeverities";

export const POLARIS_REPORTS_SARIF_CREATE_KEY = "polaris_reports_sarif_create";
export const POLARIS_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR =
  "polarisReportsSarifCreate";

export const POLARIS_REPORTS_SARIF_FILE_PATH_KEY =
  "polaris_reports_sarif_file_path";
export const POLARIS_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR =
  "polarisReportsSarifFilePath";

export const POLARIS_REPORTS_SARIF_SEVERITIES_KEY =
  "polaris_reports_sarif_severities";
export const POLARIS_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR =
  "polarisReportsSarifSeverities";

export const POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY =
  "polaris_reports_sarif_groupSCAIssues";
export const POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR =
  "polarisReportsSarifGroupSCAIssues";

export const POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY =
  "polaris_reports_sarif_issue_types";
export const POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY_CLASSIC_EDITOR =
  "polarisReportsSarifIssueTypes";

export const POLARIS_ASSESSMENT_MODE_KEY = "polaris_assessment_mode";
export const POLARIS_ASSESSMENT_MODE_KEY_CLASSIC_EDITOR =
  "polarisAssessmentMode";

export const POLARIS_TEST_SCA_TYPE_KEY = "polaris_test_sca_type";
export const POLARIS_TEST_SCA_TYPE_KEY_CLASSIC_EDITOR = "polarisTestScaType";

export const PROJECT_DIRECTORY_KEY = "project_directory";
export const POLARIS_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR =
  "polarisProjectDirectory";

export const POLARIS_WAITFORSCAN_KEY = "polaris_waitForScan";
export const POLARIS_WAITFORSCAN_KEY_CLASSIC_EDITOR = "polarisWaitForScan";

export const PROJECT_SOURCE_ARCHIVE_KEY = "project_source_archive";
export const PROJECT_SOURCE_ARCHIVE_KEY_CLASSIC_EDITOR = "projectSourceArchive";

export const PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY =
  "project_source_preserveSymLinks";
export const PROJECT_SOURCE_PRESERVE_SYM_LINKS_KEY_CLASSIC_EDITOR =
  "projectSourcePreserveSymLinks";

export const PROJECT_SOURCE_EXCLUDES_KEY = "project_source_excludes";
export const PROJECT_SOURCE_EXCLUDES_KEY_CLASSIC_EDITOR =
  "projectSourceExcludes";

// Coverity
export const COVERITY_URL_KEY = "coverity_url";
export const COVERITY_URL_KEY_CLASSIC_EDITOR = "coverityUrl";

export const COVERITY_USER_KEY = "coverity_user";
export const COVERITY_USER_KEY_CLASSIC_EDITOR = "coverityUser";

export const COVERITY_PASSPHRASE_KEY = "coverity_passphrase";
export const COVERITY_PASSPHRASE_KEY_CLASSIC_EDITOR = "coverityUserPassword";

export const COVERITY_PROJECT_NAME_KEY = "coverity_project_name";
export const COVERITY_PROJECT_NAME_KEY_CLASSIC_EDITOR = "coverityProjectName";

export const COVERITY_STREAM_NAME_KEY = "coverity_stream_name";
export const COVERITY_STREAM_NAME_KEY_CLASSIC_EDITOR = "coverityStreamName";

export const COVERITY_INSTALL_DIRECTORY_KEY = "coverity_install_directory";
export const COVERITY_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR =
  "coverityInstallDirectory";

export const COVERITY_EXECUTION_PATH_KEY = "coverity_execution_path";
export const COVERITY_EXECUTION_PATH_KEY_CLASSIC_EDITOR =
  "coverityExecutionPath";

export const COVERITY_POLICY_VIEW_KEY = "coverity_policy_view";
export const COVERITY_POLICY_VIEW_KEY_CLASSIC_EDITOR = "coverityPolicyView";

export const COVERITY_WAITFORSCAN_KEY = "coverity_waitForScan";
export const COVERITY_WAITFORSCAN_KEY_CLASSIC_EDITOR = "coverityWaitForScan";
export const COVERITY_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR =
  "coverityProjectDirectory";

export const COVERITY_PRCOMMENT_ENABLED_KEY = "coverity_prComment_enabled";
export const COVERITY_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR =
  "coverityPrCommentEnabled";

export const COVERITY_LOCAL_KEY = "coverity_local";
export const COVERITY_LOCAL_KEY_CLASSIC_EDITOR = "coverityLocal";

export const COVERITY_VERSION_KEY = "coverity_version";
export const COVERITY_VERSION_KEY_CLASSIC_EDITOR = "coverityVersion";

export const COVERITY_BUILD_COMMAND_KEY = "coverity_build_command";
export const COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR = "coverityBuildCommand";
export const COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR_FOR_POLARIS =
  "coverityBuildCommandForPolaris";
export const COVERITY_BUILD_COMMAND_KEY_CLASSIC_EDITOR_FOR_SRM =
  "coverityBuildCommandForSrm";

export const COVERITY_CLEAN_COMMAND_KEY = "coverity_clean_command";
export const COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR = "coverityCleanCommand";
export const COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR_FOR_POLARIS =
  "coverityCleanCommandForPolaris";
export const COVERITY_CLEAN_COMMAND_KEY_CLASSIC_EDITOR_FOR_SRM =
  "coverityCleanCommandForSrm";

export const COVERITY_CONFIG_PATH_KEY = "coverity_config_path";
export const COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR = "coverityConfigPath";
export const COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_POLARIS =
  "coverityConfigPathForPolaris";
export const COVERITY_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_SRM =
  "coverityConfigPathForSrm";

export const COVERITY_ARGS_KEY = "coverity_args";
export const COVERITY_ARGS_KEY_CLASSIC_EDITOR = "coverityArgs";
export const COVERITY_ARGS_KEY_CLASSIC_EDITOR_FOR_POLARIS =
  "coverityArgsForPolaris";
export const COVERITY_ARGS_KEY_CLASSIC_EDITOR_FOR_SRM = "coverityArgsForSrm";

// Blackduck
/**
 * @deprecated Use blackducksca_url instead. This can be removed in future release.
 */
export const BLACKDUCK_URL_KEY = "blackduck_url"; // old key
export const BLACKDUCKSCA_URL_KEY = "blackducksca_url"; // new key
export const BLACKDUCKSCA_URL_KEY_CLASSIC_EDITOR = "blackduckScaUrl"; // classic editor key

/**
 * @deprecated Use BLACKDUCKSCA_TOKEN_KEY instead. This can be removed in future release.
 */
export const BLACKDUCK_TOKEN_KEY = "blackduck_token";
export const BLACKDUCKSCA_TOKEN_KEY = "blackducksca_token";
export const BLACKDUCKSCA_TOKEN_KEY_CLASSIC_EDITOR = "blackduckScaToken";
/**
 * @deprecated Use detect_install_directory instead. This can be removed in future release.
 */
export const BLACKDUCK_INSTALL_DIRECTORY_KEY = "blackduck_install_directory";
export const DETECT_INSTALL_DIRECTORY_KEY = "detect_install_directory";
export const DETECT_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR =
  "detectInstallDirectory";

/**
 * @deprecated Use detect_execution_path instead. This can be removed in future release.
 */
export const BLACKDUCK_EXECUTION_PATH_KEY = "blackduck_execution_path";
export const DETECT_EXECUTION_PATH_KEY = "detect_execution_path";
export const DETECT_EXECUTION_PATH_KEY_CLASSIC_EDITOR = "detectExecutionPath";
/**
 * @deprecated Use detect_scan_full instead. This can be removed in future release.
 */
export const BLACKDUCK_SCAN_FULL_KEY = "blackduck_scan_full";
export const BLACKDUCKSCA_SCAN_FULL_KEY = "blackducksca_scan_full";
export const BLACKDUCKSCA_SCAN_FULL_KEY_CLASSIC_EDITOR = "blackduckScaScanFull";
/**
 * @deprecated Use blackducksca_scan_failure_severities instead. This can be removed in future release.
 */
export const BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY =
  "blackduck_scan_failure_severities";
export const BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY =
  "blackducksca_scan_failure_severities";
export const BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY_CLASSIC_EDITOR =
  "blackduckScaScanFailureSeverities";
/**
 * @deprecated Use blackducksca_prComment_enabled instead. This can be removed in future release.
 */
export const BLACKDUCK_PRCOMMENT_ENABLED_KEY = "blackduck_prComment_enabled";
export const BLACKDUCKSCA_PRCOMMENT_ENABLED_KEY =
  "blackducksca_prComment_enabled";
export const BLACKDUCKSCA_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR =
  "blackduckScaPrCommentEnabled";
/**
 * @deprecated Use blackducksca_fixpr_enabled instead. This can be removed in future release.
 */
export const BLACKDUCK_FIXPR_ENABLED_KEY = "blackduck_fixpr_enabled";
export const BLACKDUCKSCA_FIXPR_ENABLED_KEY = "blackducksca_fixpr_enabled";
export const BLACKDUCKSCA_FIXPR_ENABLED_KEY_CLASSIC_EDITOR =
  "blackduckScaFixPrEnabled";
/**
 * @deprecated Use blackducksca_fixpr_maxCount instead. This can be removed in future release.
 */
export const BLACKDUCK_FIXPR_MAXCOUNT_KEY = "blackduck_fixpr_maxCount";
export const BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY = "blackducksca_fixpr_maxCount";
export const BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY_CLASSIC_EDITOR =
  "blackduckScaFixPrMaxCount";
/**
 * @deprecated Use blackducksca_fixpr_createSinglePR instead. This can be removed in future release.
 */
export const BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY =
  "blackduck_fixpr_createSinglePR";
export const BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY =
  "blackducksca_fixpr_createSinglePR";
export const BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY_CLASSIC_EDITOR =
  "blackduckScaFixPRCreateSinglePR";
/**
 * @deprecated Use blackducksca_fixpr_filter_severities instead. This can be removed in future release.
 */
export const BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY =
  "blackduck_fixpr_filter_severities";
export const BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES_KEY =
  "blackducksca_fixpr_filter_severities";
export const BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES_KEY_CLASSIC_EDITOR =
  "blackduckScaFixPrFilterSeverities";
/**
 * @deprecated Use blackducksca_fixpr_useUpgradeGuidance instead. This can be removed in future release.
 */
export const BLACKDUCK_FIXPR_UPGRADE_GUIDANCE_KEY =
  "blackduck_fixpr_useUpgradeGuidance";
export const BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE_KEY =
  "blackducksca_fixpr_useUpgradeGuidance";
export const BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE_KEY_CLASSIC_EDITOR =
  "blackduckScaFixPrUseUpgradeGuidance";

/**
 * @deprecated Use blackducksca_waitForScan instead. This can be removed in future release.
 */
export const BLACKDUCK_WAITFORSCAN_KEY = "blackduck_waitForScan";
export const BLACKDUCKSCA_WAITFORSCAN_KEY = "blackducksca_waitForScan";
export const BLACKDUCKSCA_WAITFORSCAN_KEY_CLASSIC_EDITOR =
  "blackduckScaWaitForScan";

export const BLACKDUCKSCA_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR =
  "blackduckProjectDirectory";

/**
 * @deprecated Use blackducksca_reports_sarif_create instead. This can be removed in future release.
 */
export const BLACKDUCK_REPORTS_SARIF_CREATE_KEY =
  "blackduck_reports_sarif_create";
export const BLACKDUCKSCA_REPORTS_SARIF_CREATE_KEY =
  "blackducksca_reports_sarif_create";
export const BLACKDUCKSCA_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR =
  "blackduckScaReportsSarifCreate";
/**
 * @deprecated Use blackducksca_reports_sarif_file_path instead. This can be removed in future release.
 */
export const BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY =
  "blackduck_reports_sarif_file_path";
export const BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH_KEY =
  "blackducksca_reports_sarif_file_path";
export const BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR =
  "blackduckScaReportsSarifFilePath";
/**
 * @deprecated Use blackducksca_reports_sarif_severities instead. This can be removed in future release.
 */
export const BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY =
  "blackduck_reports_sarif_severities";
export const BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES_KEY =
  "blackducksca_reports_sarif_severities";
export const BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR =
  "blackduckScaReportsSarifSeverities";
/**
 * @deprecated Use blackducksca_reports_sarif_groupSCAIssues instead. This can be removed in future release.
 */
export const BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY =
  "blackduck_reports_sarif_groupSCAIssues";
export const BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY =
  "blackducksca_reports_sarif_groupSCAIssues";
export const BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR =
  "blackduckScaReportsSarifGroupSCAIssues";

/**
 * @deprecated Use detect_search_depth instead. This can be removed in future release.
 */
export const BLACKDUCK_SEARCH_DEPTH_KEY = "blackduck_search_depth";
export const DETECT_SEARCH_DEPTH_KEY = "detect_search_depth";
export const DETECT_DEPTH_KEY_CLASSIC_EDITOR = "detectSearchDepth";
export const DETECT_DEPTH_KEY_CLASSIC_EDITOR_FOR_POLARIS =
  "detectSearchDepthForPolaris";
export const DETECT_DEPTH_KEY_CLASSIC_EDITOR_FOR_SRM =
  "detectSearchDepthForSrm";

/**
 * @deprecated Use detect_config_path instead. This can be removed in future release.
 */
export const BLACKDUCK_CONFIG_PATH_KEY = "blackduck_config_path";
export const DETECT_CONFIG_PATH_KEY = "detect_config_path";
export const DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR = "detectConfigPath";
export const DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_POLARIS =
  "detectConfigPathForPolaris";
export const DETECT_CONFIG_PATH_KEY_CLASSIC_EDITOR_FOR_SRM =
  "detectConfigPathForSrm";

/**
 * @deprecated Use detect_args instead. This can be removed in future release.
 */
export const BLACKDUCK_ARGS_KEY = "blackduck_args";
export const DETECT_ARGS_KEY = "detect_args";
export const DETECT_ARGS_KEY_CLASSIC_EDITOR = "detectArgs";
export const DETECT_ARGS_KEY_CLASSIC_EDITOR_FOR_POLARIS =
  "detectArgsForPolaris";
export const DETECT_ARGS_KEY_CLASSIC_EDITOR_FOR_SRM = "detectArgsForSrm";

//SRM
export const SRM_URL_KEY = "srm_url";
export const SRM_URL_KEY_CLASSIC_EDITOR = "srmUrl";

export const SRM_APIKEY_KEY = "srm_apikey";
export const SRM_APIKEY_KEY_CLASSIC_EDITOR = "srmApikey";

export const SRM_ASSESSMENT_TYPES_KEY = "srm_assessment_types";
export const SRM_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR = "srmAssessmentTypes";

export const SRM_PROJECT_NAME_KEY = "srm_project_name";
export const SRM_PROJECT_NAME_KEY_CLASSIC_EDITOR = "srmProjectName";

export const SRM_PROJECT_ID_KEY = "srm_project_id";
export const SRM_PROJECT_ID_KEY_CLASSIC_EDITOR = "srmProjectId";

export const SRM_BRANCH_NAME_KEY = "srm_branch_name";
export const SRM_BRANCH_NAME_KEY_CLASSIC_EDITOR = "srmBranchName";

export const SRM_BRANCH_PARENT_KEY = "srm_branch_parent";
export const SRM_BRANCH_PARENT_KEY_CLASSIC_EDITOR = "srmBranchParent";

export const SRM_WAITFORSCAN_KEY = "srm_waitForScan";
export const SRM_WAITFORSCAN_KEY_CLASSIC_EDITOR = "srmWaitForScan";

export const SRM_PROJECT_DIRECTORY_KEY_CLASSIC_EDITOR = "srmProjectDirectory";

export const INCLUDE_DIAGNOSTICS_KEY = "include_diagnostics";
export const POLARIS_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR =
  "polarisIncludeDiagnostics";
export const BLACKDUCKSCA_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR =
  "blackduckScaIncludeDiagnostics";
export const COVERITY_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR =
  "coverityIncludeDiagnostics";
export const SRM_INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR =
  "srmIncludeDiagnostics";
/**
 * @deprecated Use network_airgap instead. This can be removed in future release.
 */
export const BRIDGE_NETWORK_AIRGAP_KEY = "bridge_network_airgap";
export const NETWORK_AIRGAP_KEY = "network_airgap";
export const NETWORK_AIRGAP_KEY_CLASSIC_EDITOR = "networkAirgap";

/**
 * @deprecated Use bridgecli_download_url instead. This can be removed in future release.
 */
export const SYNOPSYS_BRIDGE_DOWNLOAD_URL_KEY = "synopsys_bridge_download_url";
export const BRIDGECLI_DOWNLOAD_URL_KEY = "bridgecli_download_url";
export const BRIDGECLI_DOWNLOAD_URL_KEY_CLASSIC_EDITOR = "bridgeCliDownloadUrl";
/**
 * @deprecated Use bridgecli_download_version instead. This can be removed in future release.
 */
export const SYNOPSYS_BRIDGE_DOWNLOAD_VERSION_KEY =
  "synopsys_bridge_download_version";
export const BRIDGECLI_DOWNLOAD_VERSION_KEY = "bridgecli_download_version";
export const BRIDGECLI_DOWNLOAD_VERSION_KEY_CLASSIC_EDITOR =
  "bridgeCliDownloadVersion";

export const RETURN_STATUS_KEY = "return_status";
//export const RETURN_STATUS_KEY_CLASSIC_EDITOR = "returnStatus";

export const MARK_BUILD_STATUS_KEY = "mark_build_status";
export const POLARIS_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR =
  "polarisMarkBuildStatus";
export const BLACKDUCKSCA_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR =
  "blackduckScaMarkBuildStatus";
export const COVERITY_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR =
  "coverityMarkBuildStatus";
export const SRM_MARK_BUILD_STATUS_KEY_CLASSIC_EDITOR = "srmMarkBuildStatus";

/**
 * @deprecated Use bridgecli_install_directory instead. This can be removed in future release.
 */
export const SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY =
  "synopsys_bridge_install_directory";
export const BRIDGECLI_INSTALL_DIRECTORY_KEY = "bridgecli_install_directory";
export const BRIDGECLI_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR =
  "bridgeCliInstallDirectory";

export const UPLOAD_FOLDER_ARTIFACT_NAME = "bridge_cli_diagnostics";
export const BRIDGE_CLI_LOCAL_DIRECTORY = ".bridge";
export const SARIF_DEFAULT_FILE_NAME = "report.sarif.json";
export const DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY =
  "Blackduck SCA SARIF Generator";
export const DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY =
  "Polaris SARIF Generator";
export const SARIF_UPLOAD_FOLDER_ARTIFACT_NAME = "sarif_report";
export const RETRY_DELAY_IN_MILLISECONDS = 15000;
export const RETRY_COUNT = 3;
export const NON_RETRY_HTTP_CODES = new Set([200, 201, 401, 403, 416]);
export const WINDOWS_PLATFORM = "win64";
export const LINUX_PLATFORM = "linux64";
export const MAC_ARM_PLATFORM = "macos_arm";
export const MAC_INTEL_PLATFORM = "macosx";
export const MIN_SUPPORTED_BRIDGE_CLI_MAC_ARM_VERSION = "2.1.0";
export const DEFAULT_AZURE_API_URL = "https://dev.azure.com";
export const BLACKDUCKSCA_SECURITY_SCAN_AZURE_DEVOPS_DOCS_URL =
  "https://sig-product-docs.synopsys.com/bundle/bridge/page/documentation/c_synopsys-security-scan-for-azure-devops.html";

// Error Messages
export const MISSING_AZURE_TOKEN_FOR_FIX_PR_AND_PR_COMMENT =
  "Missing required azure token for fix pull request/automation comment";
export const BRIDGE_CLI_VERSION_NOT_FOUND =
  "Provided Bridge CLI version not found in artifactory";
export const BRIDGE_CLI_EXECUTABLE_FILE_NOT_FOUND =
  "Bridge CLI executable file could not be found at ";
export const EMPTY_BRIDGE_CLI_URL = "Provided Bridge CLI URL cannot be empty ";
export const INVALID_BRIDGE_CLI_URL_SPECIFIED_OS =
  "Provided Bridge CLI url is not valid for the configured ";
export const INVALID_BRIDGE_CLI_URL = "Invalid URL";
export const WORKFLOW_FAILED = "Workflow failed! ";
export const BRIDGE_CLI_ZIP_NOT_FOUND_FOR_EXTRACT = "File does not exist";
export const BRIDGE_CLI_DOWNLOAD_FAILED = "Bridge CLI download has been failed";
export const BRIDGE_CLI_DOWNLOAD_FAILED_RETRY =
  "Bridge CLI download has been failed, Retries left: ";
export const WORKSPACE_DIR_NOT_FOUND =
  "Workspace directory could not be located";
export const BRIDGE_CLI_EXTRACT_DIRECTORY_NOT_FOUND =
  "No destination directory found";
export const BRIDGE_CLI_INSTALL_DIRECTORY_NOT_EXISTS =
  "Bridge CLI Install Directory does not exist";
export const BRIDGE_CLI_DEFAULT_DIRECTORY_NOT_EXISTS =
  "Bridge CLI default directory does not exist";

export const INVALID_BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES =
  "Provided value is not valid - BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES";
export const REQUIRE_ONE_SCAN_TYPE = "Requires at least one scan type: (";
export const MISSING_BOOL_VALUE = "Missing boolean value for ";
export const FAILED_TO_GET_PULL_REQUEST_INFO =
  "Failed to get pull request info for current build from source branch: ";

// Info Messages
export const SKIP_DOWNLOAD_BRIDGE_CLI_WHEN_VERSION_NOT_FOUND =
  "Skipping download as same Bridge CLI version found";
export const CHECK_LATEST_BRIDGE_CLI_VERSION =
  "Checking for latest version of Bridge CLI to download and configure";
export const DOWNLOADING_BRIDGE_CLI = "Downloading and configuring Bridge CLI";
export const BRIDGE_CLI_URL_MESSAGE = "Bridge CLI URL is - ";
export const BRIDGE_CLI_DOWNLOAD_COMPLETED =
  "Download of Bridge CLI has been completed";
export const BRIDGE_CLI_FOUND_AT = "Bridge CLI executable found at ";
export const LOOKING_FOR_BRIDGE_CLI_INSTALL_DIR =
  "Looking for bridge in Bridge CLI Install Directory";
export const LOOKING_FOR_BRIDGE_CLI_DEFAULT_PATH =
  "Looking for Bridge CLI in default path";
export const VERSION_FILE_FOUND_AT = "Version file found at ";
export const VERSION_FILE_NOT_FOUND_AT =
  "Bridge CLI version file could not be found at ";
export const ERROR_READING_VERSION_FILE =
  "Error reading version file content: ";
export const GETTING_LATEST_BRIDGE_VERSIONS_RETRY =
  "Getting latest Bridge CLI versions has been failed, Retries left: ";
export const UNABLE_TO_GET_RECENT_BRIDGE_VERSION =
  "Unable to retrieve the most recent version from Artifactory URL";
export const GETTING_ALL_BRIDGE_VERSIONS_RETRY =
  "Getting all available bridge versions has been failed, Retries left: ";

export const UNABLE_TO_FIND_PULL_REQUEST_INFO =
  "Unable to find pull request info for the current source build with branch: ";
export const NETWORK_AIR_GAP_ENABLED_SKIP_DOWNLOAD_BRIDGE_CLI =
  "Network air gap is enabled, skipping Bridge CLI download.";
export const TASK_RETURN_STATUS =
  "`##vso[task.setvariable variable=status;isoutput=true]${result}`";
export const BLACKDUCKSCA_SARIF_REPOST_ENABLED =
  "BLACKDUCKSCA_REPORTS_SARIF_CREATE is enabled";
export const POLARISSCA_SARIF_REPORT_ENABLED =
  "POLARIS_REPORTS_SARIF_CREATE is enabled";
export const BLACKDUCKSCA_SECURITY_SCAN_COMPLETED =
  "Black Duck Security Scan completed";

export const AZURE_PULL_REQUEST_NUMBER_IS_EMPTY =
  "azurePullRequestNumber is empty, setting environment.scan.pull as true";

export const MARK_THE_BUILD_ON_BRIDGE_BREAK =
  "`Marking the build ${TaskResult[taskResult]} as configured in the task`";

export const MARK_THE_BUILD_STATUS =
  "`Marking build status ${TaskResult[taskResult]} is ignored since exit code is: ${status}`";

//export const BRIDGE_VERSION_NOT_FOUND_ERROR = 'Skipping download as same Bridge CLI version found'

export const BRIDGE_EXECUTABLE_NOT_FOUND_ERROR =
  "Bridge executable could not be found at ";
export const BRIDGE_INSTALL_DIRECTORY_NOT_FOUND_ERROR =
  "Bridge install directory does not exist";
export const BRIDGE_DEFAULT_DIRECTORY_NOT_FOUND_ERROR =
  "Bridge default directory does not exist";
export const SCAN_TYPE_REQUIRED_ERROR =
  "Requires at least one scan type: ({0},{1},{2},{3})";

export const BRIDGE_DOWNLOAD_RETRY_ERROR =
  "max attempts should be greater than or equal to 1";
export const INVALID_VALUE_ERROR = "Invalid value for ";
export const MISSING_BOOLEAN_VALUE_ERROR = "Missing boolean value for ";
export const PROVIDED_BLACKDUCKSCA_FAILURE_SEVERITIES_ERROR =
  "Provided value is not valid - BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES";
export const SARIF_GAS_API_RATE_LIMIT_FOR_ERROR =
  "GitHub API rate limit has been exceeded, retry after {0} minutes.";

// Bridge and ADO Exit Codes
export const EXIT_CODE_MAP = new Map<string, string>([
  [
    ErrorCode.SUCCESSFULLY_COMPLETED.toString(),
    "Bridge execution successfully completed",
  ],
  [
    ErrorCode.UNDEFINED_ERROR_FROM_BRIDGE.toString(),
    "Undefined error, check error logs",
  ],
  [ErrorCode.ADAPTER_ERROR.toString(), "Error from adapter end"],
  [
    ErrorCode.BRIDGE_SHUTDOWN_FAILURE.toString(),
    "Failed to shutdown the bridge",
  ],
  [
    ErrorCode.BRIDGE_BREAK_ENABLED.toString(),
    "The config option bridge.break has been set to true",
  ],
  [
    ErrorCode.BRIDGE_INITIALIZATION_FAILED.toString(),
    "Bridge initialization failed",
  ],
  // The list of ADO extension related error codes begins below
  [
    ErrorCode.MISSING_AT_LEAST_ONE_SCAN_TYPE.toString(),
    "Requires at least one scan type",
  ],
  [
    ErrorCode.MISSING_REQUIRED_PARAMETERS.toString(),
    "Required Parameters for Scan Type (Polaris/BlackDuck/Coverity/SRM) are missing",
  ],
  [
    ErrorCode.AGENT_TEMP_DIRECTORY_NOT_SET.toString(),
    "Agent.TempDirectory is not set",
  ],
  [
    ErrorCode.BLACKDUCKSCA_FIXPR_MAXCOUNT_NOT_APPLICABLE.toString(),
    "blackducksca_fixpr_maxCount is not applicable with blackducksca_fixpr_createSinglePR",
  ],
  [
    ErrorCode.INVALID_POLARIS_ASSESSMENT_TYPES.toString(),
    "Invalid value for polaris_assessment_types",
  ],
  [
    ErrorCode.INVALID_BLACKDUCKSCA_FAILURE_SEVERITIES.toString(),
    "Invalid value for blackducksca_scan_failure_severities",
  ],
  [
    ErrorCode.INVALID_BLACKDUCKSCA_FIXPR_MAXCOUNT.toString(),
    "Invalid value for blackducksca_fixpr_maxCount",
  ],
  [
    ErrorCode.MISSING_BOOLEAN_VALUE.toString(),
    "Missing boolean value for detect_scan_full",
  ],
  [
    ErrorCode.INVALID_BRIDGE_CLI_URL.toString(),
    "Provided Bridge CLI URL is not valid for the configured platform runner",
  ],
  [
    ErrorCode.BRIDGE_CLI_URL_CANNOT_BE_EMPTY.toString(),
    "Provided Bridge CLI URL cannot be empty",
  ],
  [
    ErrorCode.INVALID_URL.toString(),
    "Invalid URL (Invalid Bridge CLI Download URL)",
  ],
  [
    ErrorCode.BRIDGE_CLI_VERSION_NOT_FOUND.toString(),
    "Provided Bridge CLI version not found in artifactory",
  ],
  [
    ErrorCode.BRIDGE_CLI_DOWNLOAD_FAILED.toString(),
    "Bridge CLI download has been failed",
  ],
  [
    ErrorCode.BRIDGE_INSTALL_DIRECTORY_NOT_EXIST.toString(),
    "Bridge CLI Install Directory does not exist",
  ],
  [
    ErrorCode.DEFAULT_DIRECTORY_NOT_FOUND.toString(),
    "Bridge CLI default directory does not exist",
  ],
  [
    ErrorCode.BRIDGE_EXECUTABLE_NOT_FOUND.toString(),
    "Bridge CLI executable file could not be found at executable Bridge path",
  ],
  [
    ErrorCode.WORKSPACE_DIRECTORY_NOT_FOUND.toString(),
    "Workspace directory could not be located",
  ],
  [
    ErrorCode.FILE_DOES_NOT_EXIST.toString(),
    "File (Bridge CLI zip) does not exist",
  ],
  [
    ErrorCode.NO_DESTINATION_DIRECTORY.toString(),
    "No destination directory found for unzipping Bridge CLI",
  ],
  [
    ErrorCode.FAILED_TO_GET_PULL_REQUEST_INFO_FROM_SOURCE_BRANCH.toString(),
    "Failed to get pull request Id for current build from source branch",
  ],
  [
    ErrorCode.MISSING_AZURE_TOKEN.toString(),
    MISSING_AZURE_TOKEN_FOR_FIX_PR_AND_PR_COMMENT,
  ],
  [
    ErrorCode.INVALID_COVERITY_INSTALL_DIRECTORY.toString(),
    "coverity_install_directory parameter for Coverity is invalid",
  ],
  [
    ErrorCode.REQUIRED_COVERITY_STREAM_NAME_FOR_MANUAL_TRIGGER.toString(),
    "COVERITY_STREAM_NAME is mandatory for azure manual trigger",
  ],
  [
    ErrorCode.DOWNLOAD_FAILED_WITH_HTTP_STATUS_CODE.toString(),
    "Failed to download Bridge CLI zip from specified URL. HTTP status code: ",
  ],
  [
    ErrorCode.CONTENT_LENGTH_MISMATCH.toString(),
    "Content-Length of Bridge CLI in the artifactory did not match downloaded file size",
  ],
  [
    ErrorCode.UNDEFINED_ERROR_FROM_EXTENSION.toString(),
    "Undefined error from extension",
  ],
]);

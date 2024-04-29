export const SYNOPSYS_BRIDGE_DEFAULT_PATH_MAC = "/synopsys-bridge"; //Path will be in home
export const SYNOPSYS_BRIDGE_DEFAULT_PATH_WINDOWS = "\\synopsys-bridge";
export const SYNOPSYS_BRIDGE_DEFAULT_PATH_LINUX = "/synopsys-bridge";

export const SYNOPSYS_BRIDGE_EXECUTABLE_WINDOWS = "synopsys-bridge.exe";
export const SYNOPSYS_BRIDGE_EXECUTABLE_MAC_LINUX = "synopsys-bridge";

export const SYNOPSYS_BRIDGE_ZIP_FILE_NAME = "synopsys-bridge.zip";

export const APPLICATION_NAME = "synopsys-extension";

// Scan Types
export const POLARIS_KEY = "polaris";
export const COVERITY_KEY = "coverity";
export const BLACKDUCK_KEY = "blackduck";

export const AZURE_TOKEN_KEY = "azure_token";
export const AZURE_TOKEN_KEY_CLASSIC_EDITOR = "azureToken";
export const SCAN_TYPE_KEY = "scanType";

// Polaris
/**
 * @deprecated Use polaris_server_url instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_SERVER_URL_KEY = "bridge_polaris_serverUrl";
export const POLARIS_SERVER_URL_KEY = "polaris_server_url";
export const POLARIS_SERVER_URL_KEY_CLASSIC_EDITOR = "polarisServerUrl";
/**
 * @deprecated Use polaris_access_token instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_ACCESS_TOKEN_KEY = "bridge_polaris_accessToken";
export const POLARIS_ACCESS_TOKEN_KEY = "polaris_access_token";
export const POLARIS_ACCESS_TOKEN_KEY_CLASSIC_EDITOR = "polarisAccessToken";
/**
 * @deprecated Use polaris_application_name instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_APPLICATION_NAME_KEY =
  "bridge_polaris_application_name";
export const POLARIS_APPLICATION_NAME_KEY = "polaris_application_name";
export const POLARIS_APPLICATION_NAME_KEY_CLASSIC_EDITOR =
  "polarisApplicationName";
/**
 * @deprecated Use polaris_project_name instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_PROJECT_NAME_KEY = "bridge_polaris_project_name";
export const POLARIS_PROJECT_NAME_KEY = "polaris_project_name";
export const POLARIS_PROJECT_NAME_KEY_CLASSIC_EDITOR = "polarisProjectName";
/**
 * @deprecated Use polaris_assessment_types instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_ASSESSMENT_TYPES_KEY =
  "bridge_polaris_assessment_types";
export const POLARIS_ASSESSMENT_TYPES_KEY = "polaris_assessment_types";
export const POLARIS_ASSESSMENT_TYPES_KEY_CLASSIC_EDITOR =
  "polarisAssessmentTypes";
/**
 * @deprecated Use polaris_triage instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_TRIAGE_KEY = "bridge_polaris_triage";
export const POLARIS_TRIAGE_KEY = "polaris_triage";
export const POLARIS_TRIAGE_KEY_CLASSIC_EDITOR = "polarisTriage";
/**
 * @deprecated Use polaris_branch_name instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_BRANCH_NAME_KEY = "bridge_polaris_branch_name";
export const POLARIS_BRANCH_NAME_KEY = "polaris_branch_name";
export const POLARIS_BRANCH_NAME_KEY_CLASSIC_EDITOR = "polarisBranchName";
export const POLARIS_BRANCH_PARENT_NAME_KEY = "polaris_branch_parent_name";
export const POLARIS_BRANCH_PARENT_NAME_KEY_CLASSIC_EDITOR =
  "polarisBranchParentName";
/**
 * @deprecated Use polaris_prComment_enabled instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_PR_COMMENT_ENABLED_KEY =
  "bridge_polaris_prcomment_enabled";
export const POLARIS_PR_COMMENT_ENABLED_KEY = "polaris_prComment_enabled";
export const POLARIS_PR_COMMENT_ENABLED_KEY_CLASSIC_EDITOR =
  "polarisPRCommentEnabled";
/**
 * @deprecated Use polaris_prComment_severities instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_PR_COMMENT_SEVERITIES_KEY =
  "bridge_polaris_prcomment_severities";
export const POLARIS_PR_COMMENT_SEVERITIES_KEY = "polaris_prComment_severities";
export const POLARIS_PR_COMMENT_SEVERITIES_KEY_CLASSIC_EDITOR =
  "polarisPRCommentSeverities";
/**
 * @deprecated Use polaris_test_sca_type instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_TEST_SCA_TYPE_KEY = "bridge_polaris_test_sca_type";
export const POLARIS_TEST_SCA_TYPE_KEY = "polaris_test_sca_type";
export const POLARIS_TEST_SCA_TYPE_KEY_CLASSIC_EDITOR = "polarisTestScaType";
/**
 * @deprecated Use polaris_reports_sarif_create instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_REPORTS_SARIF_CREATE_KEY =
  "bridge_polaris_reports_sarif_create";
export const POLARIS_REPORTS_SARIF_CREATE_KEY = "polaris_reports_sarif_create";
export const POLARIS_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR =
  "polarisReportsSarifCreate";
/**
 * @deprecated Use polaris_reports_sarif_file_path instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_REPORTS_SARIF_FILE_PATH_KEY =
  "bridge_polaris_reports_sarif_file_path";
export const POLARIS_REPORTS_SARIF_FILE_PATH_KEY =
  "polaris_reports_sarif_file_path";
export const POLARIS_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR =
  "polarisReportsSarifFilePath";
/**
 * @deprecated Use polaris_reports_sarif_severities instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_REPORTS_SARIF_SEVERITIES_KEY =
  "bridge_polaris_reports_sarif_severities";
export const POLARIS_REPORTS_SARIF_SEVERITIES_KEY =
  "polaris_reports_sarif_severities";
export const POLARIS_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR =
  "polarisReportsSarifSeverities";
/**
 * @deprecated Use polaris_reports_sarif_groupSCAIssues instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY =
  "bridge_polaris_reports_sarif_groupSCAIssues";
export const POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY =
  "polaris_reports_sarif_groupSCAIssues";
export const POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR =
  "polarisReportsSarifGroupSCAIssues";
/**
 * @deprecated Use polaris_reports_sarif_issue_types instead. This can be removed in future release.
 */
export const BRIDGE_POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY =
  "bridge_polaris_reports_sarif_issue_types";
export const POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY =
  "polaris_reports_sarif_issue_types";
export const POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY_CLASSIC_EDITOR =
  "polarisReportsSarifIssueTypes";

// Coverity
/**
 * @deprecated Use coverity_url instead. This can be removed in future release.
 */
export const BRIDGE_COVERITY_URL_KEY = "bridge_coverity_connect_url";
export const COVERITY_URL_KEY = "coverity_url";
export const COVERITY_URL_KEY_CLASSIC_EDITOR = "coverityUrl";
/**
 * @deprecated Use coverity_user instead. This can be removed in future release.
 */
export const BRIDGE_COVERITY_USER_NAME_KEY =
  "bridge_coverity_connect_user_name";
export const COVERITY_USER_KEY = "coverity_user";
export const COVERITY_USER_KEY_CLASSIC_EDITOR = "coverityUser";
/**
 * @deprecated Use coverity_passphrase instead. This can be removed in future release.
 */
export const BRIDGE_COVERITY_USER_PASSWORD_KEY =
  "bridge_coverity_connect_user_password";
export const COVERITY_PASSPHRASE_KEY = "coverity_passphrase";
export const COVERITY_PASSPHRASE_KEY_CLASSIC_EDITOR = "coverityPassphrase";
/**
 * @deprecated Use coverity_project_name instead. This can be removed in future release.
 */
export const BRIDGE_COVERITY_PROJECT_NAME_KEY =
  "bridge_coverity_connect_project_name";
export const COVERITY_PROJECT_NAME_KEY = "coverity_project_name";
export const COVERITY_PROJECT_NAME_KEY_CLASSIC_EDITOR = "coverityProjectName";
/**
 * @deprecated Use coverity_stream_name instead. This can be removed in future release.
 */
export const BRIDGE_COVERITY_STREAM_NAME_KEY =
  "bridge_coverity_connect_stream_name";
export const COVERITY_STREAM_NAME_KEY = "coverity_stream_name";
export const COVERITY_STREAM_NAME_KEY_CLASSIC_EDITOR = "coverityStreamName";
/**
 * @deprecated Use coverity_install_directory instead. This can be removed in future release.
 */
export const BRIDGE_COVERITY_INSTALL_DIRECTORY_KEY =
  "bridge_coverity_install_directory";
export const COVERITY_INSTALL_DIRECTORY_KEY = "coverity_install_directory";
export const COVERITY_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR =
  "coverityInstallDirectory";
/**
 * @deprecated Use coverity_policy_view instead. This can be removed in future release.
 */
export const BRIDGE_COVERITY_POLICY_VIEW_KEY =
  "bridge_coverity_connect_policy_view";
export const COVERITY_POLICY_VIEW_KEY = "coverity_policy_view";
export const COVERITY_POLICY_VIEW_KEY_CLASSIC_EDITOR = "coverityPolicyView";
/**
 * @deprecated Use coverity_prComment_enabled instead. This can be removed in future release.
 */
export const BRIDGE_COVERITY_AUTOMATION_PRCOMMENT_KEY =
  "bridge_coverity_automation_prcomment";
export const COVERITY_PRCOMMENT_ENABLED_KEY = "coverity_prComment_enabled";
export const COVERITY_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR =
  "coverityPRCommentEnabled";
/**
 * @deprecated Use coverity_local instead. This can be removed in future release.
 */
export const BRIDGE_COVERITY_LOCAL_KEY = "bridge_coverity_local";
export const COVERITY_LOCAL_KEY = "coverity_local";
export const COVERITY_LOCAL_KEY_CLASSIC_EDITOR = "coverityLocal";
/**
 * @deprecated Use coverity_version instead. This can be removed in future release.
 */
export const BRIDGE_COVERITY_VERSION_KEY = "bridge_coverity_version";
export const COVERITY_VERSION_KEY = "coverity_version";
export const COVERITY_VERSION_KEY_CLASSIC_EDITOR = "coverityVersion";

// Bridge Exit Codes
export const EXIT_CODE_MAP = new Map<string, string>([
  ["0", "Bridge execution successfully completed"],
  ["1", "Undefined error, check error logs"],
  ["2", "Error from adapter end"],
  ["3", "Failed to shutdown the bridge"],
  ["8", "The config option bridge.break has been set to true"],
  ["9", "Bridge initialization failed"],
  ["101", "Requires at least one scan type"],
  ["102", "Required Parameters for Scan Type (Polaris/BlackDuck/Coverity)  is missing"],
  ["103", "Bridge initialization failed"],
  ["104", "blackduck_fixpr_maxCount is not applicable with blackduck_fixpr_createSinglePR"],
  ["105", "Invalid value for polaris_assessment_types"],
  ["106", "Invalid value for blackduck_scan_failure_severities"],
  ["107", "Invalid value for blackduck_fixpr_maxCount"],
  ["108", "Missing boolean value for blackduck_scan_full"],
  ["109", "Provided value is not valid - BLACKDUCK_SCAN_FAILURE_SEVERITIES"],
  ["110", "Provided Synopsys Bridge URL is not valid for the configured for the platform runner"],
  ["111", "Provided Synopsys Bridge URL cannot be empty"],
  ["112", "Invalid URL (Invalid Synopysys Bridge Download URL)"],
  ["113", "Provided Synopsys Bridge version not found in artifactory"],
  ["114", "Synopsys bridge download has been failed"],
  ["115", "Synopsys Bridge Install Directory does not exist"],
  ["116", "Synopsys Bridge default directory does not exist"],
  ["117", "Synopsys Bridge executable file could not be found at executable Bridge path"],
  ["118", "Workspace directory could not be located"],
  ["119", "File does not exist (Synopsys Bridge zip file doesn't exist)"],
  ["120", "No destination directory found (for unzipping Synopsys  Bridge)"],
  ["121", "Unable to find an Pull request Id from current source build"],
  ["122", "Failed to get pull request Id for current build from source branch "],
  ["123", "Missing required azure token for fix pull request/automation comment"], // need to confirm
  ["124", "coverity_install_directory parameter for Coverity is invalid"],
  ["999", "Undefined error from extension"],
]);

// Blackduck
/**
 * @deprecated Use blackduck_url instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_URL_KEY = "bridge_blackduck_url";
export const BLACKDUCK_URL_KEY = "blackduck_url";
export const BLACKDUCK_URL_KEY_CLASSIC_EDITOR = "blackduckUrl";
/**
 * @deprecated Use blackduck_token instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_API_TOKEN_KEY = "bridge_blackduck_token";
export const BLACKDUCK_TOKEN_KEY = "blackduck_token";
export const BLACKDUCK_TOKEN_KEY_CLASSIC_EDITOR = "blackduckToken";
/**
 * @deprecated Use blackduck_install_directory instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_INSTALL_DIRECTORY_KEY =
  "bridge_blackduck_install_directory";
export const BLACKDUCK_INSTALL_DIRECTORY_KEY = "blackduck_install_directory";
export const BLACKDUCK_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR =
  "blackduckInstallDirectory";
/**
 * @deprecated Use blackduck_scan_full instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_SCAN_FULL_KEY = "bridge_blackduck_scan_full";
export const BLACKDUCK_SCAN_FULL_KEY = "blackduck_scan_full";
export const BLACKDUCK_SCAN_FULL_KEY_CLASSIC_EDITOR = "blackduckScanFull";
/**
 * @deprecated Use blackduck_scan_failure_severities instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY =
  "bridge_blackduck_scan_failure_severities";
export const BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY =
  "blackduck_scan_failure_severities";
export const BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY_CLASSIC_EDITOR =
  "blackduckScanFailureSeverities";
/**
 * @deprecated Use blackduck_prComment_enabled instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_AUTOMATION_PRCOMMENT_KEY =
  "bridge_blackduck_automation_prcomment";
export const BLACKDUCK_PRCOMMENT_ENABLED_KEY = "blackduck_prComment_enabled";
export const BLACKDUCK_PRCOMMENT_ENABLED_KEY_CLASSIC_EDITOR =
  "blackduckPRCommentEnabled";
/**
 * @deprecated Use blackduck_fixpr_enabled instead. This can be removed in future release.
 */
export const BLACKDUCK_AUTOMATION_FIXPR_KEY =
  "bridge_blackduck_automation_fixpr";
/**
 * @deprecated Use blackduck_fixpr_enabled instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_FIXPR_ENABLED_KEY =
  "bridge_blackduck_fixpr_enabled";
export const BLACKDUCK_FIXPR_ENABLED_KEY = "blackduck_fixpr_enabled";
export const BLACKDUCK_FIXPR_ENABLED_KEY_CLASSIC_EDITOR =
  "blackduckFixPREnabled";
/**
 * @deprecated Use blackduck_fixpr_maxCount instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_FIXPR_MAXCOUNT_KEY =
  "bridge_blackduck_fixpr_maxCount";
export const BLACKDUCK_FIXPR_MAXCOUNT_KEY = "blackduck_fixpr_maxCount";
export const BLACKDUCK_FIXPR_MAXCOUNT_KEY_CLASSIC_EDITOR =
  "blackduckFixPRMaxCount";
/**
 * @deprecated Use blackduck_fixpr_createSinglePR instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY =
  "bridge_blackduck_fixpr_createSinglePR";
export const BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY =
  "blackduck_fixpr_createSinglePR";
export const BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY_CLASSIC_EDITOR =
  "blackduckFixPRCreateSinglePR";
/**
 * @deprecated Use blackduck_fixpr_filter_severities instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY =
  "bridge_blackduck_fixpr_filter_severities";
export const BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY =
  "blackduck_fixpr_filter_severities";
export const BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY_CLASSIC_EDITOR =
  "blackduckFixPRFilterSeverities";
/**
 * @deprecated Use blackduck_fixpr_useUpgradeGuidance instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_FIXPR_UPGRADE_GUIDANCE_KEY =
  "bridge_blackduck_fixpr_useUpgradeGuidance";
export const BLACKDUCK_FIXPR_UPGRADE_GUIDANCE_KEY =
  "blackduck_fixpr_useUpgradeGuidance";
export const BLACKDUCK_FIXPR_UPGRADE_GUIDANCE_KEY_CLASSIC_EDITOR =
  "blackduckFixPRUseUpgradeGuidance";
/**
 * @deprecated Use blackduck_reports_sarif_create instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_REPORTS_SARIF_CREATE_KEY =
  "bridge_blackduck_reports_sarif_create";
export const BLACKDUCK_REPORTS_SARIF_CREATE_KEY =
  "blackduck_reports_sarif_create";
export const BLACKDUCK_REPORTS_SARIF_CREATE_KEY_CLASSIC_EDITOR =
  "blackduckReportsSarifCreate";
/**
 * @deprecated Use blackduck_reports_sarif_file_path instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY =
  "bridge_blackduck_reports_sarif_file_path";
export const BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY =
  "blackduck_reports_sarif_file_path";
export const BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY_CLASSIC_EDITOR =
  "blackduckReportsSarifFilePath";
/**
 * @deprecated Use blackduck_reports_sarif_severities instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY =
  "bridge_blackduck_reports_sarif_severities";
export const BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY =
  "blackduck_reports_sarif_severities";
export const BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY_CLASSIC_EDITOR =
  "blackduckReportsSarifSeverities";
/**
 * @deprecated Use blackduck_reports_sarif_groupSCAIssues instead. This can be removed in future release.
 */
export const BRIDGE_BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES =
  "bridge_blackduck_reports_sarif_groupSCAIssues";
export const BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY =
  "blackduck_reports_sarif_groupSCAIssues";
export const BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY_CLASSIC_EDITOR =
  "blackduckReportsSarifGroupSCAIssues";

export const INCLUDE_DIAGNOSTICS_KEY = "include_diagnostics";
export const INCLUDE_DIAGNOSTICS_KEY_CLASSIC_EDITOR = "includeDiagnostics";
/**
 * @deprecated Use network_airgap instead. This can be removed in future release.
 */
export const BRIDGE_NETWORK_AIRGAP_KEY = "bridge_network_airgap";
export const NETWORK_AIRGAP_KEY = "network_airgap";
export const NETWORK_AIRGAP_KEY_CLASSIC_EDITOR = "networkAirGap";

/**
 * @deprecated Use synopsys_bridge_download_url instead. This can be removed in future release.
 */
export const BRIDGE_DOWNLOAD_URL_KEY = "bridge_download_url";
export const SYNOPSYS_BRIDGE_DOWNLOAD_URL_KEY = "synopsys_bridge_download_url";
export const SYNOPSYS_BRIDGE_DOWNLOAD_URL_KEY_CLASSIC_EDITOR =
  "synopsysBridgeDownloadUrl";
/**
 * @deprecated Use synopsys_bridge_download_version instead. This can be removed in future release.
 */
export const BRIDGE_DOWNLOAD_VERSION_KEY = "bridge_download_version";
export const SYNOPSYS_BRIDGE_DOWNLOAD_VERSION_KEY =
  "synopsys_bridge_download_version";
export const SYNOPSYS_BRIDGE_DOWNLOAD_VERSION_KEY_CLASSIC_EDITOR =
  "synopsysBridgeDownloadVersion";

export const SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY =
  "synopsys_bridge_install_directory";
export const SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY_CLASSIC_EDITOR =
  "synopsysBridgeInstallDirectory";

export const UPLOAD_FOLDER_ARTIFACT_NAME = "synopsys_bridge_diagnostics";
export const BRIDGE_LOCAL_DIRECTORY = ".bridge";
export const SARIF_DEFAULT_FILE_NAME = "report.sarif.json";
export const DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY =
  "Blackduck SARIF Generator";
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
export const MIN_SUPPORTED_SYNOPSYS_BRIDGE_MAC_ARM_VERSION = "2.1.0";

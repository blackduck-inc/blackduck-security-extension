export const SYNOPSYS_BRIDGE_DEFAULT_PATH_MAC = "/synopsys-bridge"; //Path will be in home
export const SYNOPSYS_BRIDGE_DEFAULT_PATH_WINDOWS = "\\synopsys-bridge";
export const SYNOPSYS_BRIDGE_DEFAULT_PATH_LINUX = "/synopsys-bridge";

export const SYNOPSYS_BRIDGE_EXECUTABLE_WINDOWS = "synopsys-bridge.exe";
export const SYNOPSYS_BRIDGE_EXECUTABLE_MAC_LINUX = "synopsys-bridge"

export const APPLICATION_NAME = "synopsys-extension";

// Scan Types
export const POLARIS_KEY = "polaris";

// Polaris
export const POLARIS_ACCESS_TOKEN_KEY = "bridge_polaris_accessToken";
export const POLARIS_APPLICATION_NAME_KEY = "bridge_polaris_application_name";
export const POLARIS_PROJECT_NAME_KEY = "bridge_polaris_project_name";
export const POLARIS_ASSESSMENT_TYPES_KEY = "bridge_polaris_assessment_types";
export const POLARIS_SERVER_URL_KEY = "bridge_polaris_serverUrl";

// Bridge Exit Codes
export let EXIT_CODE_MAP = new Map<string, string>([
  ["0", "Bridge execution successfully completed"],
  ["1", "Undefined error, check error logs"],
  ["2", "Error from adapter end"],
  ["3", "Failed to shutdown the bridge"],
  ["8", "The config option bridge.break has been set to true"],
  ["9", "Bridge initialization failed"],
]);

export const COVERITY_AUTOMATION_PRCOMMENT_KEY = 'coverity_automation_prcomment'

// Blackduck
export const BLACKDUCK_URL_KEY = 'blackduck_url'
export const BLACKDUCK_API_TOKEN_KEY = 'blackduck_apiToken'
export const BLACKDUCK_INSTALL_DIRECTORY_KEY = 'blackduck_install_directory'
export const BLACKDUCK_SCAN_FULL_KEY = 'blackduck_scan_full'
export const BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY = 'blackduck_scan_failure_severities'
export const BLACKDUCK_AUTOMATION_FIXPR_KEY = 'blackduck_automation_fixpr'
export const BLACKDUCK_AUTOMATION_PRCOMMENT_KEY = 'blackduck_automation_prcomment'

export const GITHUB_TOKEN_KEY = 'github_token'
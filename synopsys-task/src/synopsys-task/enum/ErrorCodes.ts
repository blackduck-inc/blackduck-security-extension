export enum ErrorCode {
  SUCCESSFULLY_COMPLETED = 0,
  UNDEFINED_ERROR_FROM_BRIDGE = 1,
  ADAPTER_ERROR = 2,
  BRIDGE_SHUTDOWN_FAILURE = 3,
  BRIDGE_BREAK_ENABLED = 8,
  BRIDGE_INITIALIZATION_FAILED = 9,
  // The list of ADO extension related error codes begins below
  MISSING_AT_LEAST_ONE_SCAN_TYPE = 101,
  MISSING_REQUIRED_PARAMETERS = 102,
  AGENT_TEMP_DIRECTORY_NOT_SET = 103,
  BLACKDUCK_FIXPR_MAX_COUNT_NOT_APPLICABLE = 104,
  INVALID_POLARIS_ASSESSMENT_TYPES = 105,
  INVALID_BLACKDUCK_FAILURE_SEVERITIES = 106,
  INVALID_BLACKDUCK_FIXPR_MAXCOUNT = 107,
  MISSING_BOOLEAN_VALUE = 108,
  INVALID_SYNOPSYS_BRIDGE_URL = 109,
  SYNOPSYS_BRIDGE_URL_CANNOT_BE_EMPTY = 110,
  INVALID_URL = 111,
  SYNOPSYS_BRIDGE_VERSION_NOT_FOUND = 112,
  SYNOPSYS_BRIDGE_DOWNLOAD_FAILED = 113,
  BRIDGE_INSTALL_DIRECTORY_NOT_EXIST = 114,
  DEFAULT_DIRECTORY_NOT_FOUND = 115,
  BRIDGE_EXECUTABLE_NOT_FOUND = 116,
  WORKSPACE_DIRECTORY_NOT_FOUND = 117,
  FILE_DOES_NOT_EXIST = 118,
  NO_DESTINATION_DIRECTORY = 119,
  FAILED_TO_GET_PULL_REQUEST_INFO_FROM_SOURCE_BRANCH = 120,
  MISSING_AZURE_TOKEN = 121,
  INVALID_COVERITY_INSTALL_DIRECTORY = 122,
  REQUIRED_COVERITY_STREAM_NAME_FOR_MANUAL_TRIGGER = 123,
  DOWNLOAD_FAILED_WITH_HTTP_STATUS_CODE = 124,
  CONTENT_LENGTH_MISMATCH = 125,
  UNDEFINED_ERROR_FROM_EXTENSION = 999,
  INVALID_SRM_ASSESSMENT_TYPES = 126,
}

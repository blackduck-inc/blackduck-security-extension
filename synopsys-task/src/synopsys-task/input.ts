import * as taskLib from "azure-pipelines-task-lib/task";
import * as constants from "./application-constant";

//Bridge download url
// export const BRIDGE_DOWNLOAD_URL =
//   taskLib.getInput("bridge_download_url") || "";

export const BRIDGE_DOWNLOAD_URL =
  "https://sig-repo.synopsys.com/artifactory/bds-integrations-release/com/synopsys/integration/synopsys-bridge/0.1.244/synopsys-bridge-0.1.244-macosx.zip";

export const SYNOPSYS_BRIDGE_PATH = taskLib.getPathInput(
  "synopsys_bridge_path"
);

export const BRIDGE_DOWNLOAD_VERSION = taskLib.getPathInput(
  "bridge_download_version"
);

// Polaris related inputs
export const POLARIS_ACCESS_TOKEN =
  taskLib.getInput(constants.POLARIS_ACCESS_TOKEN_KEY) || "";
export const POLARIS_APPLICATION_NAME =
  taskLib.getInput(constants.POLARIS_APPLICATION_NAME_KEY) || "";
export const POLARIS_PROJECT_NAME =
  taskLib.getInput(constants.POLARIS_PROJECT_NAME_KEY) || "";
export const POLARIS_ASSESSMENT_TYPES = taskLib.getDelimitedInput(
  constants.POLARIS_ASSESSMENT_TYPES_KEY,
  ","
);
export const POLARIS_SERVER_URL =
  taskLib.getInput(constants.POLARIS_SERVER_URL_KEY) || "";

// Coverity related inputs
export const COVERITY_URL = taskLib.getInput(constants.COVERITY_URL_KEY) || "";
export const COVERITY_USER =
  taskLib.getInput(constants.COVERITY_USER_KEY) || "";
export const COVERITY_PASSPHRASE =
  taskLib.getInput(constants.COVERITY_PASSPHRASE_KEY) || "";
export const COVERITY_PROJECT_NAME =
  taskLib.getInput(constants.COVERITY_PROJECT_NAME_KEY) || "";
export const COVERITY_STREAM_NAME =
  taskLib.getInput(constants.COVERITY_STREAM_NAME_KEY) || "";
export const COVERITY_INSTALL_DIRECTORY =
  taskLib.getInput(constants.COVERITY_INSTALL_DIRECTORY_KEY) || "";
export const COVERITY_POLICY_VIEW =
  taskLib.getInput(constants.COVERITY_POLICY_VIEW_KEY) || "";

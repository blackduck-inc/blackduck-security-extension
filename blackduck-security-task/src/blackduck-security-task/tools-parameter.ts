// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import path from "path";
import * as inputs from "./input";
import { AZURE_TOKEN } from "./input";
import { Polaris } from "./model/polaris";
import { Coverity, CoverityArbitrary, CoverityConnect } from "./model/coverity";
import { Srm } from "./model/srm";
import { Network } from "./model/common";
import {
  BlackduckSCA,
  BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES,
  BlackDuckDetect,
  BlackDuckSCAFixPrData,
  Environment,
} from "./model/blackduckSCA";
import {
  AZURE_BUILD_REASON,
  AZURE_ENVIRONMENT_VARIABLES,
  AzureData,
  AzurePrResponse,
} from "./model/azure";
import { InputData } from "./model/input-data";
import * as constants from "./application-constant";
import * as taskLib from "azure-pipelines-task-lib/task";
import {
  validateBlackduckFailureSeverities,
  validateCoverityInstallDirectoryParam,
} from "./validator";
import {
  extractBranchName,
  filterEmptyData,
  isBoolean,
  isPullRequestEvent,
  parseToBoolean,
} from "./utility";

import * as url from "url";
import { AzureService } from "./azure-service-client";
import { Reports } from "./model/reports";
import { ErrorCode } from "./enum/ErrorCodes";
import {
  AZURE_PULL_REQUEST_NUMBER_IS_EMPTY,
  INVALID_VALUE_ERROR,
  MISSING_AZURE_TOKEN_FOR_FIX_PR_AND_PR_COMMENT,
  MISSING_BOOL_VALUE,
} from "./application-constant";

export class BridgeCliToolsParameter {
  tempDir: string;
  private static STAGE_OPTION = "--stage";
  private static BLACKDUCKSCA_STAGE = "blackducksca";
  private static BD_STATE_FILE_NAME = "bd_input.json";
  private static BD_OUT_FILE_NAME = "bd_output.json";
  private static INPUT_OPTION = "--input";
  private static OUTPUT_OPTION = "--out";
  private static POLARIS_STAGE = "polaris";
  private static POLARIS_STATE_FILE_NAME = "polaris_input.json";
  private static POLARIS_OUT_FILE_NAME = "polaris_output.json";
  static SPACE = " ";
  private static COVERITY_STATE_FILE_NAME = "coverity_input.json";
  private static COVERITY_STAGE = "connect";
  static DIAGNOSTICS_OPTION = "--diagnostics";

  private static SRM_STAGE = "srm";
  private static SRM_STATE_FILE_NAME = "srm_input.json";

  constructor(tempDir: string) {
    this.tempDir = tempDir;
  }

  async getFormattedCommandForPolaris(): Promise<string> {
    let command = "";
    const customHeader =
      this.getInstanceUrl() === constants.ADO_SERVICES_URL
        ? constants.INTEGRATIONS_ADO_CLOUD
        : constants.INTEGRATIONS_ADO_EE;
    const assessmentTypeArray: string[] = [];
    const assessmentTypes = inputs.POLARIS_ASSESSMENT_TYPES;
    if (assessmentTypes != null && assessmentTypes.length > 0) {
      for (const assessmentType of assessmentTypes) {
        console.log(assessmentType);
        const regEx = new RegExp("^[a-zA-Z]+$");
        if (
          assessmentType.trim().length > 0 &&
          regEx.test(assessmentType.trim())
        ) {
          assessmentTypeArray.push(assessmentType.trim());
        } else {
          throw new Error(
            "Invalid value for "
              .concat(constants.POLARIS_ASSESSMENT_TYPES_KEY)
              .concat(constants.SPACE)
              .concat(ErrorCode.INVALID_POLARIS_ASSESSMENT_TYPES.toString())
          );
        }
      }
    }

    const azureRepositoryName = this.getAzureRepositoryName();

    let polarisApplicationName = inputs.POLARIS_APPLICATION_NAME;
    if (!polarisApplicationName) {
      polarisApplicationName = azureRepositoryName;
      taskLib.debug(`POLARIS_APPLICATION_NAME: ${polarisApplicationName}`);
    }

    let polarisProjectName = inputs.POLARIS_PROJECT_NAME;
    if (!polarisProjectName) {
      polarisProjectName = azureRepositoryName;
      taskLib.debug(`POLARIS_PROJECT_NAME: ${polarisProjectName}`);
    }

    let polData: InputData<Polaris> = {
      data: {
        polaris: {
          accesstoken: inputs.POLARIS_ACCESS_TOKEN,
          serverUrl: inputs.POLARIS_SERVER_URL,
          application: { name: polarisApplicationName },
          project: { name: polarisProjectName },
          assessment: {
            types: assessmentTypeArray,
            ...(inputs.POLARIS_ASSESSMENT_MODE && {
              mode: inputs.POLARIS_ASSESSMENT_MODE,
            }),
          },
          branch: { parent: {} },
        },
        bridge: {
          invoked: {
            from: customHeader,
          },
        },
      },
    };

    if (inputs.POLARIS_BRANCH_NAME) {
      polData.data.polaris.branch.name = inputs.POLARIS_BRANCH_NAME;
    }

    if (inputs.POLARIS_TEST_SCA_TYPE || inputs.POLARIS_TEST_SAST_TYPE) {
      polData.data.polaris.test = {};
      if (inputs.POLARIS_TEST_SCA_TYPE) {
        polData.data.polaris.test.sca = {
          type: inputs.POLARIS_TEST_SCA_TYPE,
        };
      }
      if (inputs.POLARIS_TEST_SAST_TYPE) {
        const polarisTestSastTypeList: string[] =
          inputs.POLARIS_TEST_SAST_TYPE.split(",").map((polarisTestSastType) =>
            polarisTestSastType.trim()
          );
        polData.data.polaris.test.sast = {
          type: polarisTestSastTypeList,
        };
      }
    }

    if (isBoolean(inputs.POLARIS_WAITFORSCAN)) {
      polData.data.polaris.waitForScan = parseToBoolean(
        inputs.POLARIS_WAITFORSCAN
      );
    }

    if (
      inputs.POLARIS_PROJECT_DIRECTORY ||
      inputs.PROJECT_SOURCE_ARCHIVE ||
      inputs.PROJECT_SOURCE_EXCLUDES ||
      parseToBoolean(inputs.PROJECT_SOURCE_PRESERVE_SYM_LINKS)
    ) {
      polData.data.project = {};

      if (inputs.POLARIS_PROJECT_DIRECTORY) {
        polData.data.project.directory = inputs.POLARIS_PROJECT_DIRECTORY;
      }

      if (
        inputs.PROJECT_SOURCE_ARCHIVE ||
        inputs.PROJECT_SOURCE_EXCLUDES ||
        parseToBoolean(inputs.PROJECT_SOURCE_PRESERVE_SYM_LINKS)
      ) {
        polData.data.project.source = {};

        if (inputs.PROJECT_SOURCE_ARCHIVE) {
          polData.data.project.source.archive = inputs.PROJECT_SOURCE_ARCHIVE;
        }

        if (parseToBoolean(inputs.PROJECT_SOURCE_PRESERVE_SYM_LINKS)) {
          polData.data.project.source.preserveSymLinks = true;
        }

        if (inputs.PROJECT_SOURCE_EXCLUDES) {
          const sourceExcludes = inputs.PROJECT_SOURCE_EXCLUDES.filter(
            (sourceExclude) => sourceExclude && sourceExclude.trim() !== ""
          ).map((sourceExclude) => sourceExclude.trim());
          if (sourceExcludes.length > 0) {
            polData.data.project.source.excludes = sourceExcludes;
          }
        }
      }
    }

    // Set Coverity or Blackduck Arbitrary Arguments
    polData.data.coverity = this.setCoverityArbitraryArgs();
    polData.data.detect = this.setDetectArgs();

    const azureData = this.getAzureRepoInfo();

    const isPrCommentEnabled = parseToBoolean(
      inputs.POLARIS_PR_COMMENT_ENABLED
    );

    const azurePrResponse = await this.updateAzurePrNumberForManualTriggerFlow(
      azureData,
      isPrCommentEnabled
    );

    const isPullRequest = isPullRequestEvent(azurePrResponse);

    if (isPrCommentEnabled) {
      if (!isPullRequest) {
        console.info("Polaris PR comment is ignored for non pull request scan");
      } else {
        console.info("Polaris PR comment is enabled");
        if (inputs.POLARIS_BRANCH_PARENT_NAME) {
          polData.data.polaris.branch.parent.name =
            inputs.POLARIS_BRANCH_PARENT_NAME;
        }

        polData.data.azure = this.setAzureData(
          "",
          AZURE_TOKEN,
          "",
          "",
          "",
          "",
          ""
        );

        polData.data.polaris.prcomment = { severities: [], enabled: true };

        if (inputs.POLARIS_PR_COMMENT_SEVERITIES) {
          polData.data.polaris.prcomment.severities =
            inputs.POLARIS_PR_COMMENT_SEVERITIES.filter(
              (severity) => severity
            ).map((severity) => severity.trim());
        }
      }
    }

    if (parseToBoolean(inputs.POLARIS_REPORTS_SARIF_CREATE)) {
      if (!isPullRequest) {
        polData.data.polaris.reports = this.setSarifReportsInputsForPolaris();
      } else {
        console.info(
          "Polaris SARIF report create/upload is ignored for pull request scan"
        );
      }
    }
    polData.data.network = this.setNetworkObj();
    // Remove empty data from json object
    polData = filterEmptyData(polData);

    const inputJson = JSON.stringify(polData);

    let stateFilePath = path.join(
      this.tempDir,
      BridgeCliToolsParameter.POLARIS_STATE_FILE_NAME
    );
    taskLib.writeFile(stateFilePath, inputJson);

    // Wrap the file path with double quotes, to make it work with directory path with space as well
    stateFilePath = '"'.concat(stateFilePath).concat('"');

    taskLib.debug("Generated state json file at - ".concat(stateFilePath));

    // Generate out file path
    let outFilePath = path.join(
      this.tempDir,
      BridgeCliToolsParameter.POLARIS_OUT_FILE_NAME
    );
    outFilePath = '"'.concat(outFilePath).concat('"');
    taskLib.debug("Generated out json file at - ".concat(outFilePath));

    command = BridgeCliToolsParameter.STAGE_OPTION.concat(
      BridgeCliToolsParameter.SPACE
    )
      .concat(BridgeCliToolsParameter.POLARIS_STAGE)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(BridgeCliToolsParameter.INPUT_OPTION)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(stateFilePath)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(BridgeCliToolsParameter.OUTPUT_OPTION)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(outFilePath)
      .concat(BridgeCliToolsParameter.SPACE);
    return command;
  }

  async getFormattedCommandForBlackduck(): Promise<string> {
    const failureSeverities: string[] =
      inputs.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES;
    let command = "";
    const customHeader =
      this.getInstanceUrl() === constants.ADO_SERVICES_URL
        ? constants.INTEGRATIONS_ADO_CLOUD
        : constants.INTEGRATIONS_ADO_EE;
    let blackduckData: InputData<BlackduckSCA> = {
      data: {
        blackducksca: {
          url: inputs.BLACKDUCKSCA_URL,
          token: inputs.BLACKDUCKSCA_API_TOKEN,
        },
        bridge: {
          invoked: {
            from: customHeader,
          },
        },
      },
    };

    if (isBoolean(inputs.BLACKDUCKSCA_WAITFORSCAN)) {
      blackduckData.data.blackducksca.waitForScan = parseToBoolean(
        inputs.BLACKDUCKSCA_WAITFORSCAN
      );
    }

    if (inputs.BLACKDUCKSCA_PROJECT_DIRECTORY) {
      blackduckData.data.project = {
        directory: inputs.BLACKDUCKSCA_PROJECT_DIRECTORY,
      };
    }
    if (inputs.BLACKDUCKSCA_SCAN_FULL) {
      if (
        inputs.BLACKDUCKSCA_SCAN_FULL.toLowerCase() === "true" ||
        inputs.BLACKDUCKSCA_SCAN_FULL.toLowerCase() === "false"
      ) {
        const scanFullValue =
          inputs.BLACKDUCKSCA_SCAN_FULL.toLowerCase() === "true";
        blackduckData.data.blackducksca.scan = { full: scanFullValue };
      } else {
        throw new Error(
          MISSING_BOOL_VALUE.concat(constants.BLACKDUCKSCA_SCAN_FULL_KEY)
            .concat(constants.SPACE)
            .concat(ErrorCode.MISSING_BOOLEAN_VALUE.toString())
        );
      }
    }
    blackduckData.data.detect = this.setBlackDuckDetectArgs();

    if (failureSeverities && failureSeverities.length > 0) {
      validateBlackduckFailureSeverities(failureSeverities);
      const failureSeverityEnums: BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES[] = [];

      const values: string[] = [];

      (
        Object.keys(BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES) as Array<
          keyof typeof BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES
        >
      ).map(function (key) {
        values.push(BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES[key]);
      });

      for (const failureSeverity of failureSeverities) {
        if (values.indexOf(failureSeverity) == -1) {
          throw new Error(
            "Invalid value for "
              .concat(constants.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY)
              .concat(constants.SPACE)
              .concat(
                ErrorCode.INVALID_BLACKDUCKSCA_FAILURE_SEVERITIES.toString()
              )
          );
        } else {
          failureSeverityEnums.push(
            BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES[
              failureSeverity as keyof typeof BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES
            ]
          );
        }
      }

      if (blackduckData.data.blackducksca.scan) {
        blackduckData.data.blackducksca.scan.failure = {
          severities: failureSeverityEnums,
        };
      } else {
        blackduckData.data.blackducksca.scan = {
          failure: { severities: failureSeverityEnums },
        };
      }
    }

    const azureData = this.getAzureRepoInfo();

    const isPrCommentEnabled = parseToBoolean(
      inputs.BLACKDUCKSCA_PRCOMMENT_ENABLED
    );
    const isFixPrEnabled = parseToBoolean(inputs.BLACKDUCKSCA_FIXPR_ENABLED);

    const azurePrResponse = await this.updateAzurePrNumberForManualTriggerFlow(
      azureData,
      isPrCommentEnabled || isFixPrEnabled
    );

    const isPullRequest = isPullRequestEvent(azurePrResponse);

    // Check and put environment variable for fix pull request
    if (isFixPrEnabled) {
      if (isPullRequest) {
        console.info("Black Duck SCA Fix PR ignored for pull request scan");
      } else {
        console.log("Black Duck SCA Fix PR is enabled");
        blackduckData.data.blackducksca.fixpr = this.setBlackDuckFixPrInputs();
        blackduckData.data.azure = azureData;
      }
    }

    if (isPrCommentEnabled) {
      if (!isPullRequest) {
        console.info(
          "Black Duck SCA PR comment is ignored for non pull request scan"
        );
      } else {
        console.info("Black Duck SCA PR comment is enabled");
        blackduckData.data.azure = azureData;
        blackduckData.data.environment = this.setEnvironmentScanPullData();
        blackduckData.data.blackducksca.automation = { prcomment: true };
        blackduckData.data;
      }
    }

    blackduckData.data.network = this.setNetworkObj();

    if (parseToBoolean(inputs.BLACKDUCKSCA_REPORTS_SARIF_CREATE)) {
      if (!isPullRequest) {
        blackduckData.data.blackducksca.reports =
          this.setSarifReportsInputsForBlackduck();
      } else {
        console.info(
          "Black Duck SCA SARIF report create/upload is ignored for pull request scan"
        );
      }
    }

    // Remove empty data from json object
    blackduckData = filterEmptyData(blackduckData);

    const inputJson = JSON.stringify(blackduckData);

    let stateFilePath = path.join(
      this.tempDir,
      BridgeCliToolsParameter.BD_STATE_FILE_NAME
    );
    taskLib.writeFile(stateFilePath, inputJson);

    // Wrap the file path with double quotes, to make it work with directory path with space as well
    stateFilePath = '"'.concat(stateFilePath).concat('"');

    taskLib.debug("Generated state json file at - ".concat(stateFilePath));

    // Generate out file path
    let outFilePath = path.join(
      this.tempDir,
      BridgeCliToolsParameter.BD_OUT_FILE_NAME
    );
    outFilePath = '"'.concat(outFilePath).concat('"');
    taskLib.debug("Generated out json file at - ".concat(outFilePath));

    command = BridgeCliToolsParameter.STAGE_OPTION.concat(
      BridgeCliToolsParameter.SPACE
    )
      .concat(BridgeCliToolsParameter.BLACKDUCKSCA_STAGE)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(BridgeCliToolsParameter.INPUT_OPTION)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(stateFilePath)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(BridgeCliToolsParameter.OUTPUT_OPTION)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(outFilePath)
      .concat(BridgeCliToolsParameter.SPACE);

    return command;
  }

  async getFormattedCommandForCoverity(): Promise<string> {
    let command = "";
    const customHeader =
      this.getInstanceUrl() === constants.ADO_SERVICES_URL
        ? constants.INTEGRATIONS_ADO_CLOUD
        : constants.INTEGRATIONS_ADO_EE;
    const azureRepositoryName = this.getAzureRepositoryName();

    let coverityProjectName = inputs.COVERITY_PROJECT_NAME;
    if (!coverityProjectName) {
      coverityProjectName = azureRepositoryName;
      taskLib.debug(`COVERITY_PROJECT_NAME: ${coverityProjectName}`);
    }

    const azureData = this.getAzureRepoInfo();

    const isPrCommentEnabled = parseToBoolean(
      inputs.COVERITY_AUTOMATION_PRCOMMENT
    );

    const azurePrResponse = await this.updateAzurePrNumberForManualTriggerFlow(
      azureData,
      isPrCommentEnabled
    );

    const isPullRequest = isPullRequestEvent(azurePrResponse);

    let coverityStreamName = inputs.COVERITY_STREAM_NAME;
    if (!coverityStreamName) {
      if (isPullRequest) {
        const pullRequestTargetBranchName =
          taskLib.getVariable(
            AZURE_ENVIRONMENT_VARIABLES.AZURE_PULL_REQUEST_TARGET_BRANCH
          ) ||
          azurePrResponse?.targetRefName ||
          "";
        coverityStreamName =
          azureRepositoryName && pullRequestTargetBranchName
            ? azureRepositoryName
                .concat("-")
                .concat(extractBranchName(pullRequestTargetBranchName))
            : "";
      } else {
        const buildReason =
          taskLib.getVariable(AZURE_ENVIRONMENT_VARIABLES.AZURE_BUILD_REASON) ||
          "";
        if (buildReason === AZURE_BUILD_REASON.MANUAL) {
          throw new Error(
            "COVERITY_STREAM_NAME is mandatory for azure manual trigger"
              .concat(constants.SPACE)
              .concat(
                ErrorCode.REQUIRED_COVERITY_STREAM_NAME_FOR_MANUAL_TRIGGER.toString()
              )
          );
        }

        const sourceBranchName =
          taskLib.getVariable(
            AZURE_ENVIRONMENT_VARIABLES.AZURE_SOURCE_BRANCH
          ) || "";
        coverityStreamName =
          azureRepositoryName && sourceBranchName
            ? azureRepositoryName
                .concat("-")
                .concat(extractBranchName(sourceBranchName))
            : "";
      }
      taskLib.debug(`COVERITY_STREAM_NAME: ${coverityStreamName}`);
    }

    let covData: InputData<Coverity> = {
      data: {
        coverity: {
          connect: {
            user: {
              name: inputs.COVERITY_USER,
              password: inputs.COVERITY_USER_PASSWORD,
            },
            url: inputs.COVERITY_URL,
            project: { name: coverityProjectName },
            stream: { name: coverityStreamName },
          },
        },
        bridge: {
          invoked: {
            from: customHeader,
          },
        },
      },
    };

    if (parseToBoolean(inputs.COVERITY_LOCAL)) {
      covData.data.coverity.local = true;
    }

    if (inputs.COVERITY_INSTALL_DIRECTORY) {
      if (
        validateCoverityInstallDirectoryParam(inputs.COVERITY_INSTALL_DIRECTORY)
      ) {
        covData.data.coverity.install = {
          directory: inputs.COVERITY_INSTALL_DIRECTORY,
        };
      }
    }

    if (inputs.COVERITY_POLICY_VIEW) {
      covData.data.coverity.connect.policy = {
        view: inputs.COVERITY_POLICY_VIEW,
      };
    }

    if (isBoolean(inputs.COVERITY_WAITFORSCAN)) {
      covData.data.coverity.waitForScan = parseToBoolean(
        inputs.COVERITY_WAITFORSCAN
      );
    }

    if (inputs.COVERITY_PROJECT_DIRECTORY) {
      covData.data.project = {
        directory: inputs.COVERITY_PROJECT_DIRECTORY,
      };
    }

    if (isPrCommentEnabled) {
      if (!isPullRequest) {
        console.info(
          "Coverity PR comment is ignored for non pull request scan"
        );
      } else {
        console.info("Coverity PR comment is enabled");
        covData.data.azure = azureData;
        covData.data.environment = this.setEnvironmentScanPullData();
        covData.data.coverity.automation = { prcomment: true };
      }
    }

    if (inputs.COVERITY_VERSION) {
      covData.data.coverity.version = inputs.COVERITY_VERSION;
    }

    covData.data.network = this.setNetworkObj();

    // Set arbitrary (To support both Coverity and Polaris)
    covData.data.coverity = Object.assign(
      {},
      this.setCoverityArbitraryArgs() as CoverityConnect,
      covData.data.coverity
    );

    // Remove empty data from json object
    covData = filterEmptyData(covData);

    const inputJson = JSON.stringify(covData);

    let stateFilePath = path.join(
      this.tempDir,
      BridgeCliToolsParameter.COVERITY_STATE_FILE_NAME
    );
    taskLib.writeFile(stateFilePath, inputJson);

    // Wrap the file path with double quotes, to make it work with directory path with space as well
    stateFilePath = '"'.concat(stateFilePath).concat('"');

    taskLib.debug("Generated state json file at - ".concat(stateFilePath));

    command = BridgeCliToolsParameter.STAGE_OPTION.concat(
      BridgeCliToolsParameter.SPACE
    )
      .concat(BridgeCliToolsParameter.COVERITY_STAGE)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(BridgeCliToolsParameter.INPUT_OPTION)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(stateFilePath)
      .concat(BridgeCliToolsParameter.SPACE);
    return command;
  }

  private setBlackDuckFixPrInputs(): BlackDuckSCAFixPrData | undefined {
    if (
      inputs.BLACKDUCKSCA_FIXPR_MAXCOUNT &&
      isNaN(Number(inputs.BLACKDUCKSCA_FIXPR_MAXCOUNT))
    ) {
      throw new Error(
        "Invalid value for "
          .concat(constants.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY)
          .concat(constants.SPACE)
          .concat(ErrorCode.INVALID_BLACKDUCKSCA_FIXPR_MAXCOUNT.toString())
      );
    }
    const createSinglePr = parseToBoolean(
      inputs.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR
    );
    if (createSinglePr && inputs.BLACKDUCKSCA_FIXPR_MAXCOUNT) {
      throw new Error(
        constants.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY.concat(
          " is not applicable with "
        )
          .concat(constants.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY)
          .concat(constants.SPACE)
          .concat(
            ErrorCode.BLACKDUCKSCA_FIXPR_MAXCOUNT_NOT_APPLICABLE.toString()
          )
      );
    }
    const blackDuckFixPrData: BlackDuckSCAFixPrData = {};
    blackDuckFixPrData.enabled = true;
    blackDuckFixPrData.createSinglePR = createSinglePr;
    if (inputs.BLACKDUCKSCA_FIXPR_MAXCOUNT && !createSinglePr) {
      blackDuckFixPrData.maxCount = Number(inputs.BLACKDUCKSCA_FIXPR_MAXCOUNT);
    }
    if (
      inputs.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE &&
      inputs.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE.length > 0
    ) {
      blackDuckFixPrData.useUpgradeGuidance =
        inputs.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE;
    }

    const fixPRFilterSeverities: string[] = [];
    if (
      inputs.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES &&
      inputs.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES != null &&
      inputs.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES.length > 0
    ) {
      for (const fixPrSeverity of inputs.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES) {
        if (fixPrSeverity != null && fixPrSeverity.trim() !== "") {
          fixPRFilterSeverities.push(fixPrSeverity.trim());
        }
      }
    }
    if (fixPRFilterSeverities.length > 0) {
      blackDuckFixPrData.filter = { severities: fixPRFilterSeverities };
    }
    return blackDuckFixPrData;
  }

  async getFormattedCommandForSrm(): Promise<string> {
    let command = "";
    const customHeader =
      this.getInstanceUrl() === constants.ADO_SERVICES_URL
        ? constants.INTEGRATIONS_ADO_CLOUD
        : constants.INTEGRATIONS_ADO_EE;
    const assessmentTypeArray: string[] = [];
    const assessmentTypes = inputs.SRM_ASSESSMENT_TYPES;
    if (assessmentTypes != null && assessmentTypes.length > 0) {
      for (const assessmentType of assessmentTypes) {
        const regEx = new RegExp("^[a-zA-Z]+$");
        if (
          assessmentType.trim().length > 0 &&
          regEx.test(assessmentType.trim())
        ) {
          assessmentTypeArray.push(assessmentType.trim());
        } else {
          throw new Error(
            INVALID_VALUE_ERROR.concat(constants.SRM_ASSESSMENT_TYPES_KEY)
              .concat(constants.SPACE)
              .concat(ErrorCode.INVALID_SRM_ASSESSMENT_TYPES.toString())
          );
        }
      }
    }

    let srmData: InputData<Srm> = {
      data: {
        srm: {
          url: inputs.SRM_URL,
          apikey: inputs.SRM_APIKEY,
          assessment: {
            types: assessmentTypeArray,
          },
        },
        bridge: {
          invoked: {
            from: customHeader,
          },
        },
      },
    };

    if (inputs.SRM_BRANCH_NAME || inputs.SRM_BRANCH_PARENT) {
      srmData.data.srm.branch = {
        ...(inputs.SRM_BRANCH_NAME && { name: inputs.SRM_BRANCH_NAME }),
        ...(inputs.SRM_BRANCH_PARENT && { parent: inputs.SRM_BRANCH_PARENT }),
      };
    }
    if (inputs.SRM_PROJECT_NAME || inputs.SRM_PROJECT_ID) {
      srmData.data.srm.project = {
        ...(inputs.SRM_PROJECT_NAME && { name: inputs.SRM_PROJECT_NAME }),
        ...(inputs.SRM_PROJECT_ID && { id: inputs.SRM_PROJECT_ID }),
      };
    } else {
      const azureRepositoryName = this.getAzureRepositoryName();
      taskLib.debug(`SRM project name: ${azureRepositoryName}`);
      srmData.data.srm.project = {
        name: azureRepositoryName,
      };
    }
    if (inputs.DETECT_EXECUTION_PATH) {
      srmData.data.detect = {
        execution: {
          path: inputs.DETECT_EXECUTION_PATH,
        },
      };
    }

    if (inputs.COVERITY_EXECUTION_PATH) {
      srmData.data.coverity = {
        execution: {
          path: inputs.COVERITY_EXECUTION_PATH,
        },
      };
    }

    if (isBoolean(inputs.SRM_WAITFORSCAN)) {
      srmData.data.srm.waitForScan = parseToBoolean(inputs.SRM_WAITFORSCAN);
    }

    if (inputs.SRM_PROJECT_DIRECTORY) {
      srmData.data.project = {
        directory: inputs.SRM_PROJECT_DIRECTORY,
      };
    }

    // Set Coverity or Blackduck Arbitrary Arguments
    const coverityArgs = this.setCoverityArbitraryArgs();
    const blackduckArgs = this.setDetectArgs();

    if (Object.keys(coverityArgs).length > 0) {
      srmData.data.coverity = { ...srmData.data.coverity, ...coverityArgs };
    }
    if (Object.keys(blackduckArgs).length > 0) {
      srmData.data.detect = { ...srmData.data.detect, ...blackduckArgs };
    }
    // Remove empty data from json object
    srmData = filterEmptyData(srmData);
    const inputJson = JSON.stringify(srmData);

    let stateFilePath = path.join(
      this.tempDir,
      BridgeCliToolsParameter.SRM_STATE_FILE_NAME
    );
    taskLib.writeFile(stateFilePath, inputJson);

    // Wrap the file path with double quotes, to make it work with directory path with space as well
    stateFilePath = '"'.concat(stateFilePath).concat('"');
    taskLib.debug("Generated state json file at - ".concat(stateFilePath));

    command = BridgeCliToolsParameter.STAGE_OPTION.concat(
      BridgeCliToolsParameter.SPACE
    )
      .concat(BridgeCliToolsParameter.SRM_STAGE)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(BridgeCliToolsParameter.INPUT_OPTION)
      .concat(BridgeCliToolsParameter.SPACE)
      .concat(stateFilePath)
      .concat(BridgeCliToolsParameter.SPACE);

    return command;
  }

  private getAzureRepoInfo(): AzureData | undefined {
    let azureOrganization = "";
    const azureToken = AZURE_TOKEN;
    let azureInstanceUrl = "";
    const collectionUri =
      taskLib.getVariable(AZURE_ENVIRONMENT_VARIABLES.AZURE_ORGANIZATION) || "";
    taskLib.debug(
      `Azure API URL, obtained from the environment variable ${AZURE_ENVIRONMENT_VARIABLES.AZURE_ORGANIZATION}, is: ${collectionUri}`
    );
    if (collectionUri != "") {
      const parsedUrl = url.parse(collectionUri);
      azureInstanceUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      azureOrganization = parsedUrl.pathname?.split("/")[1] || "";
      if (
        parsedUrl.host &&
        !azureOrganization &&
        parsedUrl.host.indexOf(".visualstudio.com") !== -1
      ) {
        if (parsedUrl.host.split(".")[0]) {
          azureOrganization = parsedUrl.host.split(".")[0];
          azureInstanceUrl = constants.DEFAULT_AZURE_API_URL;
        }
      }
    }
    taskLib.debug("Azure organization name:".concat(azureOrganization));
    const azureProject =
      taskLib.getVariable(AZURE_ENVIRONMENT_VARIABLES.AZURE_PROJECT) || "";
    taskLib.debug(
      `Azure project, obtained from the environment variable ${AZURE_ENVIRONMENT_VARIABLES.AZURE_PROJECT}, is: ${azureProject}`
    );
    const azureRepo =
      taskLib.getVariable(AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY) || "";
    taskLib.debug(
      `Azure repo, obtained from the environment variable ${AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY}, is: ${azureProject}`
    );
    const buildReason =
      taskLib.getVariable(AZURE_ENVIRONMENT_VARIABLES.AZURE_BUILD_REASON) || "";
    taskLib.debug(`Build Reason: ${buildReason}`);
    const azureRepoBranchName =
      buildReason == AZURE_BUILD_REASON.PULL_REQUEST
        ? taskLib.getVariable(
            AZURE_ENVIRONMENT_VARIABLES.AZURE_PULL_REQUEST_SOURCE_BRANCH
          ) || ""
        : taskLib.getVariable(
            AZURE_ENVIRONMENT_VARIABLES.AZURE_SOURCE_BRANCH
          ) || "";
    taskLib.debug(`Azure repo branch name: ${azureProject}`);

    const azurePullRequestNumber =
      taskLib.getVariable(
        AZURE_ENVIRONMENT_VARIABLES.AZURE_PULL_REQUEST_NUMBER
      ) || "";
    taskLib.debug(
      `Azure pull request number, obtained from the environment variable ${AZURE_ENVIRONMENT_VARIABLES.AZURE_PULL_REQUEST_NUMBER}, is: ${azurePullRequestNumber}`
    );

    taskLib.debug(`Azure Instance Url: ${azureInstanceUrl}`);
    taskLib.debug(`Azure Organization: ${azureOrganization}`);
    taskLib.debug(`Azure Project Name: ${azureProject}`);
    taskLib.debug(`Azure Repository Name: ${azureRepo}`);
    taskLib.debug(`Azure Repository Branch Name: ${azureRepoBranchName}`);
    taskLib.debug(`Azure Pull Request Number: ${azurePullRequestNumber}`);

    return this.setAzureData(
      azureInstanceUrl,
      azureToken,
      azureOrganization,
      azureProject,
      azureRepo,
      azureRepoBranchName,
      azurePullRequestNumber
    );
  }

  private async updateAzurePrNumberForManualTriggerFlow(
    azureData: AzureData | undefined,
    isPrCommentOrFixPrEnabled: boolean
  ): Promise<AzurePrResponse | undefined> {
    let azurePrResponse;

    if (isPrCommentOrFixPrEnabled) {
      if (azureData?.user.token == undefined || azureData.user.token == "") {
        throw new Error(
          MISSING_AZURE_TOKEN_FOR_FIX_PR_AND_PR_COMMENT.concat(
            constants.SPACE
          ).concat(ErrorCode.MISSING_AZURE_TOKEN.toString())
        );
      }

      if (azureData && azureData.repository.pull.number === 0) {
        const azureService = new AzureService();
        azurePrResponse =
          await azureService.getAzurePrResponseForManualTriggerFlow(azureData);
        azureData.repository.pull.number = azurePrResponse?.pullRequestId;
        taskLib.debug(
          `Azure pull request number for manual trigger flow: ${azureData.repository.pull.number}`
        );
      }
    }

    return azurePrResponse;
  }

  private setAzureData(
    azureInstanceUrl: string,
    azureToken: string,
    azureOrganization: string,
    azureProject: string,
    azureRepo: string,
    azureRepoBranchName: string,
    azurePullRequestNumber: string
  ): AzureData {
    const azureData: AzureData = {
      api: {
        url: azureInstanceUrl,
      },
      user: {
        token: azureToken,
      },
      organization: {
        name: azureOrganization,
      },
      project: {
        name: azureProject,
      },
      repository: {
        name: azureRepo,
        branch: {
          name: azureRepoBranchName,
        },
        pull: {},
      },
    };

    if (azurePullRequestNumber != null) {
      azureData.repository.pull.number = Number(azurePullRequestNumber);
    }
    return azureData;
  }

  private setEnvironmentScanPullData(): Environment {
    const azurePullRequestNumber =
      taskLib.getVariable(
        AZURE_ENVIRONMENT_VARIABLES.AZURE_PULL_REQUEST_NUMBER
      ) || "";
    taskLib.debug(`Azure Pull Request Number: ${azurePullRequestNumber}`);
    if (azurePullRequestNumber == "") {
      taskLib.debug(AZURE_PULL_REQUEST_NUMBER_IS_EMPTY);
      const environment: Environment = {
        scan: {
          pull: true,
        },
      };
      return environment;
    }
    return {};
  }

  private setSarifReportsInputsForBlackduck(): Reports {
    const reportData: Reports = {
      sarif: {
        create: true,
      },
    };

    if (
      inputs.BLACKDUCKSCA_URL &&
      inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
    ) {
      reportData.sarif.file = {
        path: inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH,
      };
    }

    const sarifReportFilterSeverities: string[] = [];
    if (
      inputs.BLACKDUCKSCA_URL &&
      inputs.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES &&
      inputs.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES.length > 0
    ) {
      const sarifSeverities =
        inputs.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES.filter(
          (severity) => severity && severity.trim() !== ""
        ).map((severity) => severity.trim());
      sarifReportFilterSeverities.push(...sarifSeverities);
    }
    if (sarifReportFilterSeverities.length > 0) {
      reportData.sarif.severities = sarifReportFilterSeverities;
    }

    const groupSCAIssues = inputs.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES;
    if (inputs.BLACKDUCKSCA_URL && isBoolean(groupSCAIssues)) {
      if (groupSCAIssues !== undefined) {
        reportData.sarif.groupSCAIssues = JSON.parse(groupSCAIssues);
      }
    }

    return reportData;
  }

  private setSarifReportsInputsForPolaris(): Reports {
    const reportData: Reports = {
      sarif: {
        create: true,
      },
    };

    if (inputs.POLARIS_SERVER_URL && inputs.POLARIS_REPORTS_SARIF_FILE_PATH) {
      reportData.sarif.file = {
        path: inputs.POLARIS_REPORTS_SARIF_FILE_PATH,
      };
    }

    const sarifReportFilterSeverities: string[] = [];
    if (
      inputs.POLARIS_SERVER_URL &&
      inputs.POLARIS_REPORTS_SARIF_SEVERITIES &&
      inputs.POLARIS_REPORTS_SARIF_SEVERITIES.length > 0
    ) {
      const severities = inputs.POLARIS_REPORTS_SARIF_SEVERITIES.filter(
        (severity) => severity && severity.trim() !== ""
      ).map((severity) => severity.trim());
      sarifReportFilterSeverities.push(...severities);
    }
    if (sarifReportFilterSeverities.length > 0) {
      reportData.sarif.severities = sarifReportFilterSeverities;
    }

    const groupSCAIssues = inputs.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES;
    if (inputs.POLARIS_SERVER_URL && isBoolean(groupSCAIssues)) {
      if (groupSCAIssues !== undefined) {
        reportData.sarif.groupSCAIssues = JSON.parse(groupSCAIssues);
      }
    }

    const sarifReportIssueTypes: string[] = [];
    if (
      inputs.POLARIS_SERVER_URL &&
      inputs.POLARIS_REPORTS_SARIF_ISSUE_TYPES &&
      inputs.POLARIS_REPORTS_SARIF_ISSUE_TYPES.length > 0
    ) {
      const issueTypes = inputs.POLARIS_REPORTS_SARIF_ISSUE_TYPES.filter(
        (issueType) => issueType && issueType.trim() !== ""
      ).map((issueType) => issueType.trim());
      sarifReportIssueTypes.push(...issueTypes);
    }
    if (sarifReportIssueTypes.length > 0) {
      reportData.sarif.issue = { types: sarifReportIssueTypes };
    }

    return reportData;
  }

  private getAzureRepositoryName(): string {
    const azureRepositoryName =
      taskLib.getVariable(AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY) || "";
    taskLib.debug(`Azure Repository Name: ${azureRepositoryName}`);
    return azureRepositoryName;
  }

  private setCoverityArbitraryArgs(): CoverityArbitrary {
    const covData: InputData<CoverityArbitrary> = { data: {} };
    if (inputs.COVERITY_BUILD_COMMAND) {
      covData.data.build = {
        command: inputs.COVERITY_BUILD_COMMAND,
      };
    }

    if (inputs.COVERITY_CLEAN_COMMAND) {
      covData.data.clean = {
        command: inputs.COVERITY_CLEAN_COMMAND,
      };
    }

    if (inputs.COVERITY_CONFIG_PATH) {
      covData.data.config = {
        path: inputs.COVERITY_CONFIG_PATH,
      };
    }

    if (inputs.COVERITY_ARGS) {
      covData.data.args = inputs.COVERITY_ARGS;
    }
    return covData.data;
  }

  private setBlackDuckDetectArgs(): BlackDuckDetect {
    const blackDuckDetectInputData: InputData<BlackDuckDetect> = { data: {} };
    if (inputs.DETECT_INSTALL_DIRECTORY) {
      blackDuckDetectInputData.data.install = {
        directory: inputs.DETECT_INSTALL_DIRECTORY,
      };
    }

    if (
      inputs.DETECT_SEARCH_DEPTH &&
      Number.isInteger(parseInt(inputs.DETECT_SEARCH_DEPTH))
    ) {
      blackDuckDetectInputData.data.search = {
        depth: parseInt(inputs.DETECT_SEARCH_DEPTH),
      };
    }

    if (inputs.DETECT_CONFIG_PATH) {
      blackDuckDetectInputData.data.config = {
        path: inputs.DETECT_CONFIG_PATH,
      };
    }

    if (inputs.DETECT_ARGS) {
      blackDuckDetectInputData.data.args = inputs.DETECT_ARGS;
    }

    return blackDuckDetectInputData.data;
  }

  // detect config tool for SRM and Polaris
  private setDetectArgs(): BlackDuckDetect {
    const blackDuckDetectInputData: InputData<BlackDuckDetect> = { data: {} };
    if (
      inputs.DETECT_SEARCH_DEPTH &&
      Number.isInteger(parseInt(inputs.DETECT_SEARCH_DEPTH))
    ) {
      blackDuckDetectInputData.data.search = {
        depth: parseInt(inputs.DETECT_SEARCH_DEPTH),
      };
    }

    if (inputs.DETECT_CONFIG_PATH) {
      blackDuckDetectInputData.data.config = {
        path: inputs.DETECT_CONFIG_PATH,
      };
    }

    if (inputs.DETECT_ARGS) {
      blackDuckDetectInputData.data.args = inputs.DETECT_ARGS;
    }

    return blackDuckDetectInputData.data;
  }

  private getInstanceUrl(): string {
    let azureInstanceUrl = "";
    let azureOrganization = "";
    const collectionUri =
      taskLib.getVariable(AZURE_ENVIRONMENT_VARIABLES.AZURE_ORGANIZATION) || "";

    if (collectionUri !== "") {
      const parsedUrl = url.parse(collectionUri);
      azureInstanceUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      azureOrganization = parsedUrl.pathname?.split("/")[1] || "";

      if (
        parsedUrl.host &&
        !azureOrganization &&
        parsedUrl.host.indexOf(".visualstudio.com") !== -1
      ) {
        if (parsedUrl.host.split(".")[0]) {
          azureOrganization = parsedUrl.host.split(".")[0];
          azureInstanceUrl = constants.DEFAULT_AZURE_API_URL;
        }
      }
    }
    taskLib.debug("Azure azureInstanceUrl name:".concat(azureInstanceUrl));
    return azureInstanceUrl;
  }
  private setNetworkObj(): Network {
    const network: Network = {};
    if (isBoolean(inputs.ENABLE_NETWORK_AIRGAP)) {
      network.airGap = parseToBoolean(inputs.ENABLE_NETWORK_AIRGAP);
    }

    if (!network.ssl) {
      network.ssl = {};
    }

    if (inputs.NETWORK_SSL_CERT_FILE) {
      network.ssl.cert = { file: inputs.NETWORK_SSL_CERT_FILE };
    }

    if (inputs.NETWORK_SSL_TRUST_ALL) {
      network.ssl.trustAll = parseToBoolean(inputs.NETWORK_SSL_TRUST_ALL);
    }
    return network;
  }
}

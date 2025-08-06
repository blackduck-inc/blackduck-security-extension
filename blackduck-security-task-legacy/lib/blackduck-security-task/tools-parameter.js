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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeCliToolsParameter = void 0;
const path_1 = __importDefault(require("path"));
const inputs = __importStar(require("./input"));
const input_1 = require("./input");
const blackduckSCA_1 = require("./model/blackduckSCA");
const azure_1 = require("./model/azure");
const constants = __importStar(require("./application-constant"));
const taskLib = __importStar(require("azure-pipelines-task-lib/task"));
const validator_1 = require("./validator");
const utility_1 = require("./utility");
const url = __importStar(require("url"));
const azure_service_client_1 = require("./azure-service-client");
const ErrorCodes_1 = require("./enum/ErrorCodes");
const application_constant_1 = require("./application-constant");
class BridgeCliToolsParameter {
    constructor(tempDir) {
        this.tempDir = tempDir;
    }
    getFormattedCommandForPolaris() {
        return __awaiter(this, void 0, void 0, function* () {
            let command = "";
            const customHeader = this.getInstanceUrl() === constants.ADO_SERVICES_URL
                ? constants.INTEGRATIONS_ADO_CLOUD
                : constants.INTEGRATIONS_ADO_EE;
            const assessmentTypeArray = [];
            const assessmentTypes = inputs.POLARIS_ASSESSMENT_TYPES;
            if (assessmentTypes != null && assessmentTypes.length > 0) {
                for (const assessmentType of assessmentTypes) {
                    console.log(assessmentType);
                    const regEx = new RegExp("^[a-zA-Z]+$");
                    if (assessmentType.trim().length > 0 &&
                        regEx.test(assessmentType.trim())) {
                        assessmentTypeArray.push(assessmentType.trim());
                    }
                    else {
                        throw new Error("Invalid value for "
                            .concat(constants.POLARIS_ASSESSMENT_TYPES_KEY)
                            .concat(constants.SPACE)
                            .concat(ErrorCodes_1.ErrorCode.INVALID_POLARIS_ASSESSMENT_TYPES.toString()));
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
            let polData = {
                data: {
                    polaris: {
                        accesstoken: inputs.POLARIS_ACCESS_TOKEN,
                        serverUrl: inputs.POLARIS_SERVER_URL,
                        application: { name: polarisApplicationName },
                        project: { name: polarisProjectName },
                        assessment: Object.assign({ types: assessmentTypeArray }, (inputs.POLARIS_ASSESSMENT_MODE && {
                            mode: inputs.POLARIS_ASSESSMENT_MODE,
                        })),
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
                    const polarisTestSastTypeList = inputs.POLARIS_TEST_SAST_TYPE.split(",").map((polarisTestSastType) => polarisTestSastType.trim());
                    polData.data.polaris.test.sast = {
                        type: polarisTestSastTypeList,
                    };
                }
            }
            if ((0, utility_1.isBoolean)(inputs.POLARIS_WAITFORSCAN)) {
                polData.data.polaris.waitForScan = (0, utility_1.parseToBoolean)(inputs.POLARIS_WAITFORSCAN);
            }
            if (inputs.POLARIS_PROJECT_DIRECTORY ||
                inputs.PROJECT_SOURCE_ARCHIVE ||
                inputs.PROJECT_SOURCE_EXCLUDES ||
                (0, utility_1.parseToBoolean)(inputs.PROJECT_SOURCE_PRESERVE_SYM_LINKS)) {
                polData.data.project = {};
                if (inputs.POLARIS_PROJECT_DIRECTORY) {
                    polData.data.project.directory = inputs.POLARIS_PROJECT_DIRECTORY;
                }
                if (inputs.PROJECT_SOURCE_ARCHIVE ||
                    inputs.PROJECT_SOURCE_EXCLUDES ||
                    (0, utility_1.parseToBoolean)(inputs.PROJECT_SOURCE_PRESERVE_SYM_LINKS)) {
                    polData.data.project.source = {};
                    if (inputs.PROJECT_SOURCE_ARCHIVE) {
                        polData.data.project.source.archive = inputs.PROJECT_SOURCE_ARCHIVE;
                    }
                    if ((0, utility_1.parseToBoolean)(inputs.PROJECT_SOURCE_PRESERVE_SYM_LINKS)) {
                        polData.data.project.source.preserveSymLinks = true;
                    }
                    if (inputs.PROJECT_SOURCE_EXCLUDES) {
                        const sourceExcludes = inputs.PROJECT_SOURCE_EXCLUDES.filter((sourceExclude) => sourceExclude && sourceExclude.trim() !== "").map((sourceExclude) => sourceExclude.trim());
                        if (sourceExcludes.length > 0) {
                            polData.data.project.source.excludes = sourceExcludes;
                        }
                    }
                }
            }
            // Set Coverity or Blackduck Arbitrary Arguments
            polData.data.coverity = this.setCoverityArbitraryArgs();
            polData.data.detect = this.setDetectArgs();
            const azureData = yield this.getAzureRepoInfo();
            const azureRestAPIVersion = azureData === null || azureData === void 0 ? void 0 : azureData.restAPIVersion;
            const isPrCommentEnabled = (0, utility_1.parseToBoolean)(inputs.POLARIS_PR_COMMENT_ENABLED);
            const azurePrResponse = yield this.updateAzurePrNumberForManualTriggerFlow(azureData, isPrCommentEnabled);
            const isPullRequest = (0, utility_1.isPullRequestEvent)(azurePrResponse);
            if (isPrCommentEnabled) {
                if (!isPullRequest) {
                    console.info("Polaris PR comment is ignored for non pull request scan");
                }
                else {
                    console.info("Polaris PR comment is enabled");
                    if (inputs.POLARIS_BRANCH_PARENT_NAME) {
                        polData.data.polaris.branch.parent.name =
                            inputs.POLARIS_BRANCH_PARENT_NAME;
                    }
                    polData.data.azure = this.setAzureData("", input_1.AZURE_TOKEN, "", "", "", "", "");
                    polData.data.polaris.prcomment = { severities: [], enabled: true };
                    if (inputs.POLARIS_PR_COMMENT_SEVERITIES) {
                        polData.data.polaris.prcomment.severities =
                            inputs.POLARIS_PR_COMMENT_SEVERITIES.filter((severity) => severity).map((severity) => severity.trim());
                    }
                }
            }
            if ((0, utility_1.parseToBoolean)(inputs.POLARIS_REPORTS_SARIF_CREATE)) {
                if (!isPullRequest) {
                    polData.data.polaris.reports = this.setSarifReportsInputsForPolaris();
                }
                else {
                    console.info("Polaris SARIF report create/upload is ignored for pull request scan");
                }
            }
            polData.data.network = this.setNetworkObj();
            // Remove empty data from json object
            polData = (0, utility_1.filterEmptyData)(polData);
            if (azureRestAPIVersion && polData.data.azure) {
                polData.data.azure.restAPIVersion = azureRestAPIVersion;
            }
            const inputJson = JSON.stringify(polData);
            let stateFilePath = path_1.default.join(this.tempDir, BridgeCliToolsParameter.POLARIS_STATE_FILE_NAME);
            taskLib.writeFile(stateFilePath, inputJson);
            // Wrap the file path with double quotes, to make it work with directory path with space as well
            stateFilePath = '"'.concat(stateFilePath).concat('"');
            taskLib.debug("Generated state json file at - ".concat(stateFilePath));
            // Generate out file path
            let outFilePath = path_1.default.join(this.tempDir, BridgeCliToolsParameter.POLARIS_OUT_FILE_NAME);
            outFilePath = '"'.concat(outFilePath).concat('"');
            taskLib.debug("Generated out json file at - ".concat(outFilePath));
            command = BridgeCliToolsParameter.STAGE_OPTION.concat(BridgeCliToolsParameter.SPACE)
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
        });
    }
    getFormattedCommandForBlackduck() {
        return __awaiter(this, void 0, void 0, function* () {
            const failureSeverities = inputs.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES;
            let command = "";
            const customHeader = this.getInstanceUrl() === constants.ADO_SERVICES_URL
                ? constants.INTEGRATIONS_ADO_CLOUD
                : constants.INTEGRATIONS_ADO_EE;
            let blackduckData = {
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
            if ((0, utility_1.isBoolean)(inputs.BLACKDUCKSCA_WAITFORSCAN)) {
                blackduckData.data.blackducksca.waitForScan = (0, utility_1.parseToBoolean)(inputs.BLACKDUCKSCA_WAITFORSCAN);
            }
            if (inputs.BLACKDUCKSCA_PROJECT_DIRECTORY) {
                blackduckData.data.project = {
                    directory: inputs.BLACKDUCKSCA_PROJECT_DIRECTORY,
                };
            }
            if (inputs.BLACKDUCKSCA_SCAN_FULL) {
                if (inputs.BLACKDUCKSCA_SCAN_FULL.toLowerCase() === "true" ||
                    inputs.BLACKDUCKSCA_SCAN_FULL.toLowerCase() === "false") {
                    const scanFullValue = inputs.BLACKDUCKSCA_SCAN_FULL.toLowerCase() === "true";
                    blackduckData.data.blackducksca.scan = { full: scanFullValue };
                }
                else {
                    throw new Error(application_constant_1.MISSING_BOOL_VALUE.concat(constants.BLACKDUCKSCA_SCAN_FULL_KEY)
                        .concat(constants.SPACE)
                        .concat(ErrorCodes_1.ErrorCode.MISSING_BOOLEAN_VALUE.toString()));
                }
            }
            blackduckData.data.detect = this.setBlackDuckDetectArgs();
            if (failureSeverities && failureSeverities.length > 0) {
                (0, validator_1.validateBlackduckFailureSeverities)(failureSeverities);
                const failureSeverityEnums = [];
                const values = [];
                Object.keys(blackduckSCA_1.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES).map(function (key) {
                    values.push(blackduckSCA_1.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES[key]);
                });
                for (const failureSeverity of failureSeverities) {
                    if (values.indexOf(failureSeverity) == -1) {
                        throw new Error("Invalid value for "
                            .concat(constants.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY)
                            .concat(constants.SPACE)
                            .concat(ErrorCodes_1.ErrorCode.INVALID_BLACKDUCKSCA_FAILURE_SEVERITIES.toString()));
                    }
                    else {
                        failureSeverityEnums.push(blackduckSCA_1.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES[failureSeverity]);
                    }
                }
                if (blackduckData.data.blackducksca.scan) {
                    blackduckData.data.blackducksca.scan.failure = {
                        severities: failureSeverityEnums,
                    };
                }
                else {
                    blackduckData.data.blackducksca.scan = {
                        failure: { severities: failureSeverityEnums },
                    };
                }
            }
            const azureData = yield this.getAzureRepoInfo();
            const azureRestAPIVersion = azureData === null || azureData === void 0 ? void 0 : azureData.restAPIVersion;
            const isPrCommentEnabled = (0, utility_1.parseToBoolean)(inputs.BLACKDUCKSCA_PRCOMMENT_ENABLED);
            const isFixPrEnabled = (0, utility_1.parseToBoolean)(inputs.BLACKDUCKSCA_FIXPR_ENABLED);
            const azurePrResponse = yield this.updateAzurePrNumberForManualTriggerFlow(azureData, isPrCommentEnabled || isFixPrEnabled);
            const isPullRequest = (0, utility_1.isPullRequestEvent)(azurePrResponse);
            // Check and put environment variable for fix pull request
            if (isFixPrEnabled) {
                if (isPullRequest) {
                    console.info("Black Duck SCA Fix PR ignored for pull request scan");
                }
                else {
                    console.log("Black Duck SCA Fix PR is enabled");
                    blackduckData.data.blackducksca.fixpr = this.setBlackDuckFixPrInputs();
                    blackduckData.data.azure = azureData;
                }
            }
            if (isPrCommentEnabled) {
                if (!isPullRequest) {
                    console.info("Black Duck SCA PR comment is ignored for non pull request scan");
                }
                else {
                    console.info("Black Duck SCA PR comment is enabled");
                    blackduckData.data.azure = azureData;
                    blackduckData.data.environment = this.setEnvironmentScanPullData();
                    blackduckData.data.blackducksca.automation = { prcomment: true };
                    blackduckData.data;
                }
            }
            blackduckData.data.network = this.setNetworkObj();
            if ((0, utility_1.parseToBoolean)(inputs.BLACKDUCKSCA_REPORTS_SARIF_CREATE)) {
                if (!isPullRequest) {
                    blackduckData.data.blackducksca.reports =
                        this.setSarifReportsInputsForBlackduck();
                }
                else {
                    console.info("Black Duck SCA SARIF report create/upload is ignored for pull request scan");
                }
            }
            // Remove empty data from json object
            blackduckData = (0, utility_1.filterEmptyData)(blackduckData);
            if (azureRestAPIVersion && blackduckData.data.azure) {
                blackduckData.data.azure.restAPIVersion = azureRestAPIVersion;
            }
            const inputJson = JSON.stringify(blackduckData);
            let stateFilePath = path_1.default.join(this.tempDir, BridgeCliToolsParameter.BD_STATE_FILE_NAME);
            taskLib.writeFile(stateFilePath, inputJson);
            // Wrap the file path with double quotes, to make it work with directory path with space as well
            stateFilePath = '"'.concat(stateFilePath).concat('"');
            taskLib.debug("Generated state json file at - ".concat(stateFilePath));
            // Generate out file path
            let outFilePath = path_1.default.join(this.tempDir, BridgeCliToolsParameter.BD_OUT_FILE_NAME);
            outFilePath = '"'.concat(outFilePath).concat('"');
            taskLib.debug("Generated out json file at - ".concat(outFilePath));
            command = BridgeCliToolsParameter.STAGE_OPTION.concat(BridgeCliToolsParameter.SPACE)
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
        });
    }
    getFormattedCommandForCoverity() {
        return __awaiter(this, void 0, void 0, function* () {
            let command = "";
            const customHeader = this.getInstanceUrl() === constants.ADO_SERVICES_URL
                ? constants.INTEGRATIONS_ADO_CLOUD
                : constants.INTEGRATIONS_ADO_EE;
            const azureRepositoryName = this.getAzureRepositoryName();
            let coverityProjectName = inputs.COVERITY_PROJECT_NAME;
            if (!coverityProjectName) {
                coverityProjectName = azureRepositoryName;
                taskLib.debug(`COVERITY_PROJECT_NAME: ${coverityProjectName}`);
            }
            const azureData = yield this.getAzureRepoInfo();
            const azureRestAPIVersion = azureData === null || azureData === void 0 ? void 0 : azureData.restAPIVersion;
            const isPrCommentEnabled = (0, utility_1.parseToBoolean)(inputs.COVERITY_AUTOMATION_PRCOMMENT);
            const azurePrResponse = yield this.updateAzurePrNumberForManualTriggerFlow(azureData, isPrCommentEnabled);
            const isPullRequest = (0, utility_1.isPullRequestEvent)(azurePrResponse);
            let coverityStreamName = inputs.COVERITY_STREAM_NAME;
            if (!coverityStreamName) {
                if (isPullRequest) {
                    const pullRequestTargetBranchName = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_PULL_REQUEST_TARGET_BRANCH) ||
                        (azurePrResponse === null || azurePrResponse === void 0 ? void 0 : azurePrResponse.targetRefName) ||
                        "";
                    coverityStreamName =
                        azureRepositoryName && pullRequestTargetBranchName
                            ? azureRepositoryName
                                .concat("-")
                                .concat((0, utility_1.extractBranchName)(pullRequestTargetBranchName))
                            : "";
                }
                else {
                    const buildReason = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_BUILD_REASON) ||
                        "";
                    if (buildReason === azure_1.AZURE_BUILD_REASON.MANUAL) {
                        throw new Error("COVERITY_STREAM_NAME is mandatory for azure manual trigger"
                            .concat(constants.SPACE)
                            .concat(ErrorCodes_1.ErrorCode.REQUIRED_COVERITY_STREAM_NAME_FOR_MANUAL_TRIGGER.toString()));
                    }
                    const sourceBranchName = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_SOURCE_BRANCH) || "";
                    coverityStreamName =
                        azureRepositoryName && sourceBranchName
                            ? azureRepositoryName
                                .concat("-")
                                .concat((0, utility_1.extractBranchName)(sourceBranchName))
                            : "";
                }
                taskLib.debug(`COVERITY_STREAM_NAME: ${coverityStreamName}`);
            }
            let covData = {
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
            if ((0, utility_1.parseToBoolean)(inputs.COVERITY_LOCAL)) {
                covData.data.coverity.local = true;
            }
            if (inputs.COVERITY_INSTALL_DIRECTORY) {
                if ((0, validator_1.validateCoverityInstallDirectoryParam)(inputs.COVERITY_INSTALL_DIRECTORY)) {
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
            if ((0, utility_1.isBoolean)(inputs.COVERITY_WAITFORSCAN)) {
                covData.data.coverity.waitForScan = (0, utility_1.parseToBoolean)(inputs.COVERITY_WAITFORSCAN);
            }
            if (inputs.COVERITY_PROJECT_DIRECTORY) {
                covData.data.project = {
                    directory: inputs.COVERITY_PROJECT_DIRECTORY,
                };
            }
            if (isPrCommentEnabled) {
                if (!isPullRequest) {
                    console.info("Coverity PR comment is ignored for non pull request scan");
                }
                else {
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
            covData.data.coverity = Object.assign({}, this.setCoverityArbitraryArgs(), covData.data.coverity);
            // Remove empty data from json object
            covData = (0, utility_1.filterEmptyData)(covData);
            if (azureRestAPIVersion && covData.data.azure) {
                covData.data.azure.restAPIVersion = azureRestAPIVersion;
            }
            const inputJson = JSON.stringify(covData);
            let stateFilePath = path_1.default.join(this.tempDir, BridgeCliToolsParameter.COVERITY_STATE_FILE_NAME);
            taskLib.writeFile(stateFilePath, inputJson);
            // Wrap the file path with double quotes, to make it work with directory path with space as well
            stateFilePath = '"'.concat(stateFilePath).concat('"');
            taskLib.debug("Generated state json file at - ".concat(stateFilePath));
            command = BridgeCliToolsParameter.STAGE_OPTION.concat(BridgeCliToolsParameter.SPACE)
                .concat(BridgeCliToolsParameter.COVERITY_STAGE)
                .concat(BridgeCliToolsParameter.SPACE)
                .concat(BridgeCliToolsParameter.INPUT_OPTION)
                .concat(BridgeCliToolsParameter.SPACE)
                .concat(stateFilePath)
                .concat(BridgeCliToolsParameter.SPACE);
            return command;
        });
    }
    setBlackDuckFixPrInputs() {
        if (inputs.BLACKDUCKSCA_FIXPR_MAXCOUNT &&
            isNaN(Number(inputs.BLACKDUCKSCA_FIXPR_MAXCOUNT))) {
            throw new Error("Invalid value for "
                .concat(constants.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY)
                .concat(constants.SPACE)
                .concat(ErrorCodes_1.ErrorCode.INVALID_BLACKDUCKSCA_FIXPR_MAXCOUNT.toString()));
        }
        const createSinglePr = (0, utility_1.parseToBoolean)(inputs.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR);
        if (createSinglePr && inputs.BLACKDUCKSCA_FIXPR_MAXCOUNT) {
            throw new Error(constants.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY.concat(" is not applicable with ")
                .concat(constants.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY)
                .concat(constants.SPACE)
                .concat(ErrorCodes_1.ErrorCode.BLACKDUCKSCA_FIXPR_MAXCOUNT_NOT_APPLICABLE.toString()));
        }
        const blackDuckFixPrData = {};
        blackDuckFixPrData.enabled = true;
        blackDuckFixPrData.createSinglePR = createSinglePr;
        if (inputs.BLACKDUCKSCA_FIXPR_MAXCOUNT && !createSinglePr) {
            blackDuckFixPrData.maxCount = Number(inputs.BLACKDUCKSCA_FIXPR_MAXCOUNT);
        }
        if (inputs.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE &&
            inputs.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE.length > 0) {
            blackDuckFixPrData.useUpgradeGuidance =
                inputs.BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE;
        }
        const fixPRFilterSeverities = [];
        if (inputs.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES &&
            inputs.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES != null &&
            inputs.BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES.length > 0) {
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
    getFormattedCommandForSrm() {
        return __awaiter(this, void 0, void 0, function* () {
            let command = "";
            const customHeader = this.getInstanceUrl() === constants.ADO_SERVICES_URL
                ? constants.INTEGRATIONS_ADO_CLOUD
                : constants.INTEGRATIONS_ADO_EE;
            const assessmentTypeArray = [];
            const assessmentTypes = inputs.SRM_ASSESSMENT_TYPES;
            if (assessmentTypes != null && assessmentTypes.length > 0) {
                for (const assessmentType of assessmentTypes) {
                    const regEx = new RegExp("^[a-zA-Z]+$");
                    if (assessmentType.trim().length > 0 &&
                        regEx.test(assessmentType.trim())) {
                        assessmentTypeArray.push(assessmentType.trim());
                    }
                    else {
                        throw new Error(application_constant_1.INVALID_VALUE_ERROR.concat(constants.SRM_ASSESSMENT_TYPES_KEY)
                            .concat(constants.SPACE)
                            .concat(ErrorCodes_1.ErrorCode.INVALID_SRM_ASSESSMENT_TYPES.toString()));
                    }
                }
            }
            let srmData = {
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
                srmData.data.srm.branch = Object.assign(Object.assign({}, (inputs.SRM_BRANCH_NAME && { name: inputs.SRM_BRANCH_NAME })), (inputs.SRM_BRANCH_PARENT && { parent: inputs.SRM_BRANCH_PARENT }));
            }
            if (inputs.SRM_PROJECT_NAME || inputs.SRM_PROJECT_ID) {
                srmData.data.srm.project = Object.assign(Object.assign({}, (inputs.SRM_PROJECT_NAME && { name: inputs.SRM_PROJECT_NAME })), (inputs.SRM_PROJECT_ID && { id: inputs.SRM_PROJECT_ID }));
            }
            else {
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
            if ((0, utility_1.isBoolean)(inputs.SRM_WAITFORSCAN)) {
                srmData.data.srm.waitForScan = (0, utility_1.parseToBoolean)(inputs.SRM_WAITFORSCAN);
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
                srmData.data.coverity = Object.assign(Object.assign({}, srmData.data.coverity), coverityArgs);
            }
            if (Object.keys(blackduckArgs).length > 0) {
                srmData.data.detect = Object.assign(Object.assign({}, srmData.data.detect), blackduckArgs);
            }
            // Remove empty data from json object
            srmData = (0, utility_1.filterEmptyData)(srmData);
            const inputJson = JSON.stringify(srmData);
            let stateFilePath = path_1.default.join(this.tempDir, BridgeCliToolsParameter.SRM_STATE_FILE_NAME);
            taskLib.writeFile(stateFilePath, inputJson);
            // Wrap the file path with double quotes, to make it work with directory path with space as well
            stateFilePath = '"'.concat(stateFilePath).concat('"');
            taskLib.debug("Generated state json file at - ".concat(stateFilePath));
            command = BridgeCliToolsParameter.STAGE_OPTION.concat(BridgeCliToolsParameter.SPACE)
                .concat(BridgeCliToolsParameter.SRM_STAGE)
                .concat(BridgeCliToolsParameter.SPACE)
                .concat(BridgeCliToolsParameter.INPUT_OPTION)
                .concat(BridgeCliToolsParameter.SPACE)
                .concat(stateFilePath)
                .concat(BridgeCliToolsParameter.SPACE);
            return command;
        });
    }
    getAzureRepoInfo() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let azureOrganization = "";
            const azureToken = input_1.AZURE_TOKEN;
            let azureInstanceUrl = "";
            const collectionUri = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_ORGANIZATION) || "";
            taskLib.debug(`Azure API URL, obtained from the environment variable ${azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_ORGANIZATION}, is: ${collectionUri}`);
            if (collectionUri != "") {
                const parsedUrl = url.parse(collectionUri);
                azureInstanceUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
                azureOrganization = ((_a = parsedUrl.pathname) === null || _a === void 0 ? void 0 : _a.split("/")[1]) || "";
                if (parsedUrl.host &&
                    !azureOrganization &&
                    parsedUrl.host.indexOf(".visualstudio.com") !== -1) {
                    if (parsedUrl.host.split(".")[0]) {
                        azureOrganization = parsedUrl.host.split(".")[0];
                        azureInstanceUrl = constants.DEFAULT_AZURE_API_URL;
                    }
                }
            }
            taskLib.debug("Azure organization name:".concat(azureOrganization));
            const azureProject = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_PROJECT) || "";
            taskLib.debug(`Azure project, obtained from the environment variable ${azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_PROJECT}, is: ${azureProject}`);
            const azureRepo = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY) || "";
            taskLib.debug(`Azure repo, obtained from the environment variable ${azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY}, is: ${azureProject}`);
            const buildReason = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_BUILD_REASON) || "";
            taskLib.debug(`Build Reason: ${buildReason}`);
            const azureRepoBranchName = buildReason == azure_1.AZURE_BUILD_REASON.PULL_REQUEST
                ? taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_PULL_REQUEST_SOURCE_BRANCH) || ""
                : taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_SOURCE_BRANCH) || "";
            taskLib.debug(`Azure repo branch name: ${azureProject}`);
            const azurePullRequestNumber = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_PULL_REQUEST_NUMBER) || "";
            taskLib.debug(`Azure pull request number, obtained from the environment variable ${azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_PULL_REQUEST_NUMBER}, is: ${azurePullRequestNumber}`);
            taskLib.debug(`Azure Instance Url: ${azureInstanceUrl}`);
            taskLib.debug(`Azure Organization: ${azureOrganization}`);
            taskLib.debug(`Azure Project Name: ${azureProject}`);
            taskLib.debug(`Azure Repository Name: ${azureRepo}`);
            taskLib.debug(`Azure Repository Branch Name: ${azureRepoBranchName}`);
            taskLib.debug(`Azure Pull Request Number: ${azurePullRequestNumber}`);
            const azureData = this.setAzureData(azureInstanceUrl, azureToken, azureOrganization, azureProject, azureRepo, azureRepoBranchName, azurePullRequestNumber);
            if (azureData &&
                azureInstanceUrl &&
                azureOrganization &&
                azureProject &&
                azureRepo &&
                azureToken) {
                try {
                    const urlObj = new URL(azureInstanceUrl);
                    if (urlObj.hostname !== "dev.azure.com" &&
                        urlObj.hostname !== "visualstudio.com") {
                        const azureService = new azure_service_client_1.AzureService();
                        const apiVersion = azureService.fetchAzureServerApiVersion(azureInstanceUrl, azureOrganization, azureProject, azureRepo, azureToken);
                        azureData.restAPIVersion = yield apiVersion;
                        taskLib.debug(`Azure REST API Version: ${azureData.restAPIVersion}`);
                    }
                }
                catch (error) {
                    taskLib.warning(`Failed to fetch Azure API version: ${error}`);
                }
            }
            return azureData;
        });
    }
    updateAzurePrNumberForManualTriggerFlow(azureData, isPrCommentOrFixPrEnabled) {
        return __awaiter(this, void 0, void 0, function* () {
            let azurePrResponse;
            if (isPrCommentOrFixPrEnabled) {
                if ((azureData === null || azureData === void 0 ? void 0 : azureData.user.token) == undefined || azureData.user.token == "") {
                    throw new Error(application_constant_1.MISSING_AZURE_TOKEN_FOR_FIX_PR_AND_PR_COMMENT.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.MISSING_AZURE_TOKEN.toString()));
                }
                if (azureData && azureData.repository.pull.number === 0) {
                    const azureService = new azure_service_client_1.AzureService();
                    azurePrResponse =
                        yield azureService.getAzurePrResponseForManualTriggerFlow(azureData);
                    azureData.repository.pull.number = azurePrResponse === null || azurePrResponse === void 0 ? void 0 : azurePrResponse.pullRequestId;
                    taskLib.debug(`Azure pull request number for manual trigger flow: ${azureData.repository.pull.number}`);
                }
            }
            return azurePrResponse;
        });
    }
    setAzureData(azureInstanceUrl, azureToken, azureOrganization, azureProject, azureRepo, azureRepoBranchName, azurePullRequestNumber) {
        const azureData = {
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
    setEnvironmentScanPullData() {
        const azurePullRequestNumber = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_PULL_REQUEST_NUMBER) || "";
        taskLib.debug(`Azure Pull Request Number: ${azurePullRequestNumber}`);
        if (azurePullRequestNumber == "") {
            taskLib.debug(application_constant_1.AZURE_PULL_REQUEST_NUMBER_IS_EMPTY);
            const environment = {
                scan: {
                    pull: true,
                },
            };
            return environment;
        }
        return {};
    }
    setSarifReportsInputsForBlackduck() {
        const reportData = {
            sarif: {
                create: true,
            },
        };
        if (inputs.BLACKDUCKSCA_URL &&
            inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH) {
            reportData.sarif.file = {
                path: inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH,
            };
        }
        const sarifReportFilterSeverities = [];
        if (inputs.BLACKDUCKSCA_URL &&
            inputs.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES &&
            inputs.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES.length > 0) {
            const sarifSeverities = inputs.BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES.filter((severity) => severity && severity.trim() !== "").map((severity) => severity.trim());
            sarifReportFilterSeverities.push(...sarifSeverities);
        }
        if (sarifReportFilterSeverities.length > 0) {
            reportData.sarif.severities = sarifReportFilterSeverities;
        }
        const groupSCAIssues = inputs.BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES;
        if (inputs.BLACKDUCKSCA_URL && (0, utility_1.isBoolean)(groupSCAIssues)) {
            if (groupSCAIssues !== undefined) {
                reportData.sarif.groupSCAIssues = JSON.parse(groupSCAIssues);
            }
        }
        return reportData;
    }
    setSarifReportsInputsForPolaris() {
        const reportData = {
            sarif: {
                create: true,
            },
        };
        if (inputs.POLARIS_SERVER_URL && inputs.POLARIS_REPORTS_SARIF_FILE_PATH) {
            reportData.sarif.file = {
                path: inputs.POLARIS_REPORTS_SARIF_FILE_PATH,
            };
        }
        const sarifReportFilterSeverities = [];
        if (inputs.POLARIS_SERVER_URL &&
            inputs.POLARIS_REPORTS_SARIF_SEVERITIES &&
            inputs.POLARIS_REPORTS_SARIF_SEVERITIES.length > 0) {
            const severities = inputs.POLARIS_REPORTS_SARIF_SEVERITIES.filter((severity) => severity && severity.trim() !== "").map((severity) => severity.trim());
            sarifReportFilterSeverities.push(...severities);
        }
        if (sarifReportFilterSeverities.length > 0) {
            reportData.sarif.severities = sarifReportFilterSeverities;
        }
        const groupSCAIssues = inputs.POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES;
        if (inputs.POLARIS_SERVER_URL && (0, utility_1.isBoolean)(groupSCAIssues)) {
            if (groupSCAIssues !== undefined) {
                reportData.sarif.groupSCAIssues = JSON.parse(groupSCAIssues);
            }
        }
        const sarifReportIssueTypes = [];
        if (inputs.POLARIS_SERVER_URL &&
            inputs.POLARIS_REPORTS_SARIF_ISSUE_TYPES &&
            inputs.POLARIS_REPORTS_SARIF_ISSUE_TYPES.length > 0) {
            const issueTypes = inputs.POLARIS_REPORTS_SARIF_ISSUE_TYPES.filter((issueType) => issueType && issueType.trim() !== "").map((issueType) => issueType.trim());
            sarifReportIssueTypes.push(...issueTypes);
        }
        if (sarifReportIssueTypes.length > 0) {
            reportData.sarif.issue = { types: sarifReportIssueTypes };
        }
        return reportData;
    }
    getAzureRepositoryName() {
        const azureRepositoryName = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY) || "";
        taskLib.debug(`Azure Repository Name: ${azureRepositoryName}`);
        return azureRepositoryName;
    }
    setCoverityArbitraryArgs() {
        const covData = { data: {} };
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
    setBlackDuckDetectArgs() {
        const blackDuckDetectInputData = { data: {} };
        if (inputs.DETECT_INSTALL_DIRECTORY) {
            blackDuckDetectInputData.data.install = {
                directory: inputs.DETECT_INSTALL_DIRECTORY,
            };
        }
        if (inputs.DETECT_SEARCH_DEPTH &&
            Number.isInteger(parseInt(inputs.DETECT_SEARCH_DEPTH))) {
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
    setDetectArgs() {
        const blackDuckDetectInputData = { data: {} };
        if (inputs.DETECT_SEARCH_DEPTH &&
            Number.isInteger(parseInt(inputs.DETECT_SEARCH_DEPTH))) {
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
    getInstanceUrl() {
        var _a;
        let azureInstanceUrl = "";
        let azureOrganization = "";
        const collectionUri = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_ORGANIZATION) || "";
        if (collectionUri !== "") {
            const parsedUrl = url.parse(collectionUri);
            azureInstanceUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
            azureOrganization = ((_a = parsedUrl.pathname) === null || _a === void 0 ? void 0 : _a.split("/")[1]) || "";
            if (parsedUrl.host &&
                !azureOrganization &&
                parsedUrl.host.indexOf(".visualstudio.com") !== -1) {
                if (parsedUrl.host.split(".")[0]) {
                    azureOrganization = parsedUrl.host.split(".")[0];
                    azureInstanceUrl = constants.DEFAULT_AZURE_API_URL;
                }
            }
        }
        return azureInstanceUrl;
    }
    setNetworkObj() {
        const network = {};
        if ((0, utility_1.isBoolean)(inputs.ENABLE_NETWORK_AIRGAP)) {
            network.airGap = (0, utility_1.parseToBoolean)(inputs.ENABLE_NETWORK_AIRGAP);
        }
        if (!network.ssl) {
            network.ssl = {};
        }
        if (inputs.NETWORK_SSL_CERT_FILE) {
            network.ssl.cert = { file: inputs.NETWORK_SSL_CERT_FILE };
        }
        if (inputs.NETWORK_SSL_TRUST_ALL) {
            network.ssl.trustAll = (0, utility_1.parseToBoolean)(inputs.NETWORK_SSL_TRUST_ALL);
        }
        return network;
    }
}
BridgeCliToolsParameter.STAGE_OPTION = "--stage";
BridgeCliToolsParameter.BLACKDUCKSCA_STAGE = "blackducksca";
BridgeCliToolsParameter.BD_STATE_FILE_NAME = "bd_input.json";
BridgeCliToolsParameter.BD_OUT_FILE_NAME = "bd_output.json";
BridgeCliToolsParameter.INPUT_OPTION = "--input";
BridgeCliToolsParameter.OUTPUT_OPTION = "--out";
BridgeCliToolsParameter.POLARIS_STAGE = "polaris";
BridgeCliToolsParameter.POLARIS_STATE_FILE_NAME = "polaris_input.json";
BridgeCliToolsParameter.POLARIS_OUT_FILE_NAME = "polaris_output.json";
BridgeCliToolsParameter.SPACE = " ";
BridgeCliToolsParameter.COVERITY_STATE_FILE_NAME = "coverity_input.json";
BridgeCliToolsParameter.COVERITY_STAGE = "connect";
BridgeCliToolsParameter.DIAGNOSTICS_OPTION = "--diagnostics";
BridgeCliToolsParameter.SRM_STAGE = "srm";
BridgeCliToolsParameter.SRM_STATE_FILE_NAME = "srm_input.json";
exports.BridgeCliToolsParameter = BridgeCliToolsParameter;

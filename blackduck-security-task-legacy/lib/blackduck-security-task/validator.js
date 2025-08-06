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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSrmInputs = exports.validateBlackDuckSCAInputs = exports.validateBlackduckFailureSeverities = exports.validateCoverityInstallDirectoryParam = exports.validateCoverityInputs = exports.validateBridgeUrl = exports.isNullOrEmpty = exports.validateParameters = exports.validatePolarisInputs = exports.validateScanTypes = void 0;
const constants = __importStar(require("./application-constant"));
const inputs = __importStar(require("./input"));
const taskLib = __importStar(require("azure-pipelines-task-lib/task"));
const ErrorCodes_1 = require("./enum/ErrorCodes");
const application_constant_1 = require("./application-constant");
function validateScanTypes() {
    const paramsMap = new Map();
    paramsMap.set(constants.POLARIS_SERVER_URL_KEY, inputs.POLARIS_SERVER_URL);
    paramsMap.set(constants.BLACKDUCKSCA_URL_KEY, inputs.BLACKDUCKSCA_URL);
    paramsMap.set(constants.COVERITY_URL_KEY, inputs.COVERITY_URL);
    paramsMap.set(constants.SRM_URL_KEY, inputs.SRM_URL);
    return isNullOrEmpty(paramsMap);
}
exports.validateScanTypes = validateScanTypes;
function validatePolarisInputs() {
    let errors = [];
    if (inputs.POLARIS_SERVER_URL) {
        const paramsMap = new Map();
        paramsMap.set(constants.POLARIS_ACCESS_TOKEN_KEY, inputs.POLARIS_ACCESS_TOKEN);
        paramsMap.set(constants.POLARIS_SERVER_URL_KEY, inputs.POLARIS_SERVER_URL);
        paramsMap.set(constants.POLARIS_ASSESSMENT_TYPES_KEY, inputs.POLARIS_ASSESSMENT_TYPES);
        errors = validateParameters(paramsMap, constants.POLARIS_KEY);
    }
    return errors;
}
exports.validatePolarisInputs = validatePolarisInputs;
function validateParameters(params, toolName) {
    const invalidParams = isNullOrEmpty(params);
    const errors = [];
    if (invalidParams.length > 0) {
        errors.push(`[${invalidParams.join()}] - required parameters for ${toolName} is missing`
            .concat(constants.SPACE)
            .concat(ErrorCodes_1.ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()));
    }
    return errors;
}
exports.validateParameters = validateParameters;
function isNullOrEmpty(params) {
    const invalidParams = [];
    for (const param of params.entries()) {
        if (param[1] == null || param[1].length === 0) {
            invalidParams.push(param[0]);
        }
    }
    return invalidParams;
}
exports.isNullOrEmpty = isNullOrEmpty;
function validateBridgeUrl(url) {
    if (!url.match(".*\\.(zip|ZIP)$")) {
        return false;
    }
    const osName = process.platform;
    taskLib.debug("osName:::" + osName);
    const fileNameComponent = url.substring(url.lastIndexOf("/"), url.length);
    if (osName === constants.DARWIN) {
        return fileNameComponent.toLowerCase().includes("mac");
    }
    else if (osName === constants.LINUX) {
        return fileNameComponent.toLowerCase().includes("linux");
    }
    else if (osName === constants.WIN32) {
        return fileNameComponent.toLowerCase().includes("win");
    }
    else {
        return false;
    }
}
exports.validateBridgeUrl = validateBridgeUrl;
function validateCoverityInputs() {
    let errors = [];
    if (inputs.COVERITY_URL) {
        const paramsMap = new Map();
        paramsMap.set(constants.COVERITY_USER_KEY, inputs.COVERITY_USER);
        paramsMap.set(constants.COVERITY_PASSPHRASE_KEY, inputs.COVERITY_USER_PASSWORD);
        paramsMap.set(constants.COVERITY_URL_KEY, inputs.COVERITY_URL);
        errors = validateParameters(paramsMap, constants.COVERITY_KEY);
    }
    return errors;
}
exports.validateCoverityInputs = validateCoverityInputs;
function validateCoverityInstallDirectoryParam(installDir) {
    if (installDir != null &&
        installDir.length > 0 &&
        !taskLib.exist(installDir)) {
        taskLib.error(`[${constants.COVERITY_INSTALL_DIRECTORY_KEY}] parameter for Coverity is invalid`
            .concat(constants.SPACE)
            .concat(ErrorCodes_1.ErrorCode.INVALID_COVERITY_INSTALL_DIRECTORY.toString()));
        return false;
    }
    return true;
}
exports.validateCoverityInstallDirectoryParam = validateCoverityInstallDirectoryParam;
function validateBlackduckFailureSeverities(severities) {
    if (severities == null || severities.length === 0) {
        taskLib.error(application_constant_1.INVALID_BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.INVALID_BLACKDUCKSCA_FAILURE_SEVERITIES.toString()));
        return false;
    }
    return true;
}
exports.validateBlackduckFailureSeverities = validateBlackduckFailureSeverities;
function validateBlackDuckSCAInputs() {
    let errors = [];
    if (inputs.BLACKDUCKSCA_URL) {
        const paramsMap = new Map();
        paramsMap.set(constants.BLACKDUCKSCA_URL_KEY, inputs.BLACKDUCKSCA_URL);
        paramsMap.set(constants.BLACKDUCKSCA_TOKEN_KEY, inputs.BLACKDUCKSCA_API_TOKEN);
        errors = validateParameters(paramsMap, constants.BLACKDUCKSCA_KEY);
    }
    return errors;
}
exports.validateBlackDuckSCAInputs = validateBlackDuckSCAInputs;
function validateSrmInputs() {
    let errors = [];
    if (inputs.SRM_URL) {
        const paramsMap = new Map();
        paramsMap.set(constants.SRM_URL_KEY, inputs.SRM_URL);
        paramsMap.set(constants.SRM_APIKEY_KEY, inputs.SRM_APIKEY);
        paramsMap.set(constants.SRM_ASSESSMENT_TYPES_KEY, inputs.SRM_ASSESSMENT_TYPES);
        errors = validateParameters(paramsMap, constants.SRM_KEY);
    }
    return errors;
}
exports.validateSrmInputs = validateSrmInputs;

"use strict";
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
exports.BridgeCli = void 0;
const path = __importStar(require("path"));
const taskLib = __importStar(require("azure-pipelines-task-lib/task"));
const tools_parameter_1 = require("./tools-parameter");
const utility_1 = require("./utility");
const validator_1 = require("./validator");
const constants = __importStar(require("./application-constant"));
const inputs = __importStar(require("./input"));
const utility_2 = require("./utility");
const fs_1 = require("fs");
const dom_parser_1 = __importDefault(require("dom-parser"));
const https = __importStar(require("https"));
const ssl_utils_1 = require("./ssl-utils");
const input_1 = require("./input");
const application_constant_1 = require("./application-constant");
const os_1 = __importDefault(require("os"));
const semver_1 = __importDefault(require("semver"));
const ErrorCodes_1 = require("./enum/ErrorCodes");
class BridgeCli {
    constructor() {
        this.bridgeCliExecutablePath = "";
        this.bridgeCliVersion = "";
        this.bridgeCliArtifactoryURL =
            "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle";
        this.bridgeCliUrlPattern = this.bridgeCliArtifactoryURL.concat("/$version/bridge-cli-bundle-$version-$platform.zip");
        this.bridgeCliUrlLatestPattern = this.bridgeCliArtifactoryURL.concat("/latest/bridge-cli-bundle-$platform.zip");
    }
    extractBridgeCli(fileInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const bridgeCliInstallDirectory = inputs.BRIDGECLI_INSTALL_DIRECTORY_KEY || this.getDefaultBridgeCliPath();
            const bridgeCliFullPath = path.join(String(bridgeCliInstallDirectory), String(this.getDefaultBridgeCliSubDirectory()));
            taskLib.debug("bridgeCliFullPath: " + bridgeCliFullPath);
            // Clear the existing bridge, if available
            if (taskLib.exist(bridgeCliFullPath)) {
                yield taskLib.rmRF(bridgeCliFullPath);
            }
            yield (0, utility_2.extractZipped)(fileInfo.filePath, bridgeCliInstallDirectory);
            if (this.bridgeCliVersion != "") {
                const bridgeCliPathWithVersion = path.join(String(bridgeCliInstallDirectory), String(this.getBridgeCliSubDirectoryWithVersion()));
                taskLib.debug("bridgeCliPathWithVersion: " + bridgeCliPathWithVersion);
                if (taskLib.exist(bridgeCliPathWithVersion)) {
                    taskLib.debug("Renaming bridge versioned path to default bridge-cli path");
                    (0, fs_1.renameSync)(bridgeCliPathWithVersion, bridgeCliFullPath);
                }
            }
            taskLib.debug("Bridge Executable Path: " + bridgeCliFullPath);
            return Promise.resolve(bridgeCliFullPath);
        });
    }
    executeBridgeCliCommand(executablePath, workspace, command) {
        return __awaiter(this, void 0, void 0, function* () {
            taskLib.debug("extractedPath: ".concat(executablePath));
            const executableBridgeCliPath = yield this.setBridgeCliExecutablePath(executablePath);
            if (!taskLib.exist(executableBridgeCliPath)) {
                throw new Error(application_constant_1.BRIDGE_CLI_EXECUTABLE_FILE_NOT_FOUND.concat(executableBridgeCliPath)
                    .concat(constants.SPACE)
                    .concat(ErrorCodes_1.ErrorCode.BRIDGE_EXECUTABLE_NOT_FOUND.toString()));
            }
            try {
                return yield taskLib.exec(executableBridgeCliPath, command, {
                    cwd: workspace,
                });
            }
            catch (errorObject) {
                taskLib.debug("errorObject:" + errorObject);
                throw errorObject;
            }
        });
    }
    prepareCommand(tempDir) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let formattedCommand = "";
                // Validate both Network ssl cert file and network trust all certs are given the input resource
                if (inputs.NETWORK_SSL_CERT_FILE &&
                    inputs.NETWORK_SSL_TRUST_ALL === true) {
                    return Promise.reject(new Error(constants.NETWORK_SSL_VALIDATION_ERROR_MESSAGE));
                }
                const invalidParams = (0, validator_1.validateScanTypes)();
                if (invalidParams.length === 4) {
                    return Promise.reject(new Error(application_constant_1.REQUIRE_ONE_SCAN_TYPE.concat(constants.POLARIS_SERVER_URL_KEY)
                        .concat(",")
                        .concat(constants.COVERITY_URL_KEY)
                        .concat(",")
                        .concat(constants.BLACKDUCKSCA_URL_KEY)
                        .concat(",")
                        .concat(constants.SRM_URL_KEY)
                        .concat(")")
                        .concat(constants.SPACE)
                        .concat(ErrorCodes_1.ErrorCode.MISSING_AT_LEAST_ONE_SCAN_TYPE.toString())));
                }
                let classicEditorErrors = [];
                let polarisErrors = [];
                let coverityErrors = [];
                let blackduckErrors = [];
                let srmErrors = [];
                if (input_1.SCAN_TYPE.length > 0) {
                    // To support single scan using Classic Editor
                    [formattedCommand, classicEditorErrors] =
                        yield this.formatCommandForClassicEditor(formattedCommand, tempDir);
                }
                else {
                    // To support multi-scan using YAML
                    [formattedCommand, polarisErrors] = yield this.preparePolarisCommand(formattedCommand, tempDir);
                    [formattedCommand, coverityErrors] = yield this.prepareBlackduckCommand(formattedCommand, tempDir);
                    [formattedCommand, blackduckErrors] = yield this.prepareCoverityCommand(formattedCommand, tempDir);
                    [formattedCommand, srmErrors] = yield this.prepareSrmCommand(formattedCommand, tempDir);
                }
                let validationErrors = [];
                validationErrors = validationErrors.concat(polarisErrors, coverityErrors, blackduckErrors, srmErrors, classicEditorErrors);
                if (formattedCommand.length === 0) {
                    return Promise.reject(new Error(validationErrors.join(",")));
                }
                if (validationErrors.length > 0) {
                    console.log(new Error(validationErrors.join(",")));
                }
                if ((0, utility_2.parseToBoolean)(inputs.INCLUDE_DIAGNOSTICS)) {
                    formattedCommand = formattedCommand
                        .concat(tools_parameter_1.BridgeCliToolsParameter.SPACE)
                        .concat(tools_parameter_1.BridgeCliToolsParameter.DIAGNOSTICS_OPTION);
                }
                console.log("Formatted command is - ".concat(formattedCommand));
                return Promise.resolve(formattedCommand);
            }
            catch (e) {
                const errorObject = e;
                taskLib.debug(errorObject.stack === undefined ? "" : errorObject.stack.toString());
                return Promise.reject(errorObject);
            }
        });
    }
    formatCommandForClassicEditor(formattedCommand, tempDir) {
        return __awaiter(this, void 0, void 0, function* () {
            let errors = [];
            if (input_1.SCAN_TYPE == "polaris") {
                [formattedCommand, errors] = yield this.preparePolarisCommand(formattedCommand, tempDir);
            }
            else if (input_1.SCAN_TYPE == "blackducksca") {
                [formattedCommand, errors] = yield this.prepareBlackduckCommand(formattedCommand, tempDir);
            }
            else if (input_1.SCAN_TYPE == "coverity") {
                [formattedCommand, errors] = yield this.prepareCoverityCommand(formattedCommand, tempDir);
            }
            else if (input_1.SCAN_TYPE == "srm") {
                [formattedCommand, errors] = yield this.prepareSrmCommand(formattedCommand, tempDir);
            }
            return [formattedCommand, errors];
        });
    }
    prepareSrmCommand(formattedCommand, tempDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const srmErrors = (0, validator_1.validateSrmInputs)();
            if (srmErrors.length === 0 && inputs.SRM_URL) {
                const commandFormatter = new tools_parameter_1.BridgeCliToolsParameter(tempDir);
                formattedCommand = formattedCommand.concat(yield commandFormatter.getFormattedCommandForSrm());
            }
            return [formattedCommand, srmErrors];
        });
    }
    preparePolarisCommand(formattedCommand, tempDir) {
        return __awaiter(this, void 0, void 0, function* () {
            // validating and preparing command for polaris
            const polarisErrors = (0, validator_1.validatePolarisInputs)();
            const commandFormatter = new tools_parameter_1.BridgeCliToolsParameter(tempDir);
            if (polarisErrors.length === 0 && inputs.POLARIS_SERVER_URL) {
                formattedCommand = formattedCommand.concat(yield commandFormatter.getFormattedCommandForPolaris());
            }
            return [formattedCommand, polarisErrors];
        });
    }
    prepareCoverityCommand(formattedCommand, tempDir) {
        return __awaiter(this, void 0, void 0, function* () {
            // validating and preparing command for coverity
            const coverityErrors = (0, validator_1.validateCoverityInputs)();
            if (coverityErrors.length === 0 && inputs.COVERITY_URL) {
                const coverityCommandFormatter = new tools_parameter_1.BridgeCliToolsParameter(tempDir);
                formattedCommand = formattedCommand.concat(yield coverityCommandFormatter.getFormattedCommandForCoverity());
            }
            return [formattedCommand, coverityErrors];
        });
    }
    prepareBlackduckCommand(formattedCommand, tempDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const blackduckErrors = (0, validator_1.validateBlackDuckSCAInputs)();
            if (blackduckErrors.length === 0 && inputs.BLACKDUCKSCA_URL) {
                const blackDuckCommandFormatter = new tools_parameter_1.BridgeCliToolsParameter(tempDir);
                formattedCommand = formattedCommand.concat(yield blackDuckCommandFormatter.getFormattedCommandForBlackduck());
            }
            return [formattedCommand, blackduckErrors];
        });
    }
    validateBridgeVersion(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const versions = yield this.getAllAvailableBridgeCliVersions();
            return Promise.resolve(versions.indexOf(version.trim()) !== -1);
        });
    }
    downloadAndExtractBridgeCli(tempDir) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bridgeUrl = yield this.getBridgeCliUrl();
                if (bridgeUrl != "" && bridgeUrl != null) {
                    const downloadBridge = yield (0, utility_2.getRemoteFile)(tempDir, bridgeUrl);
                    console.info(application_constant_1.BRIDGE_CLI_DOWNLOAD_COMPLETED);
                    // Extracting bridge
                    return yield this.extractBridgeCli(downloadBridge);
                }
                if (inputs.BRIDGECLI_DOWNLOAD_VERSION &&
                    (yield this.checkIfBridgeCliVersionExists(inputs.BRIDGECLI_DOWNLOAD_VERSION))) {
                    return Promise.resolve(this.bridgeCliExecutablePath);
                }
                return this.bridgeCliExecutablePath;
            }
            catch (e) {
                const errorObject = e.message;
                if (errorObject.includes("404") ||
                    errorObject.toLowerCase().includes("invalid url")) {
                    return Promise.reject(new Error(application_constant_1.INVALID_BRIDGE_CLI_URL_SPECIFIED_OS.concat(process.platform, " runner")
                        .concat(constants.SPACE)
                        .concat(ErrorCodes_1.ErrorCode.INVALID_BRIDGE_CLI_URL.toString())));
                }
                else if (errorObject.toLowerCase().includes("empty")) {
                    return Promise.reject(new Error(application_constant_1.EMPTY_BRIDGE_CLI_URL.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.BRIDGE_CLI_URL_CANNOT_BE_EMPTY.toString())));
                }
                else {
                    return Promise.reject(new Error(errorObject));
                }
            }
        });
    }
    getBridgeCliUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            let bridgeUrl;
            let version = "";
            if (inputs.BRIDGECLI_DOWNLOAD_URL) {
                bridgeUrl = inputs.BRIDGECLI_DOWNLOAD_URL;
                if (!(0, validator_1.validateBridgeUrl)(inputs.BRIDGECLI_DOWNLOAD_URL)) {
                    return Promise.reject(new Error(application_constant_1.INVALID_BRIDGE_CLI_URL.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.INVALID_URL.toString())));
                }
                // To check whether bridge already exists with same version mentioned in bridge url
                const versionsArray = bridgeUrl.match(".*bridge-cli-bundle-([0-9.]*).*");
                if (versionsArray) {
                    version = versionsArray[1];
                    if (!version) {
                        const regex = /\w*(bridge-cli-bundle-(win64|linux64|linux_arm|macosx|macos_arm).zip)/;
                        version = yield this.getBridgeCliVersionFromLatestURL(bridgeUrl.replace(regex, "versions.txt"));
                    }
                }
            }
            else if (inputs.BRIDGECLI_DOWNLOAD_VERSION) {
                if (yield this.validateBridgeVersion(inputs.BRIDGECLI_DOWNLOAD_VERSION)) {
                    bridgeUrl = this.getVersionUrl(inputs.BRIDGECLI_DOWNLOAD_VERSION.trim()).trim();
                    version = inputs.BRIDGECLI_DOWNLOAD_VERSION;
                }
                else {
                    return Promise.reject(new Error(application_constant_1.BRIDGE_CLI_VERSION_NOT_FOUND.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.BRIDGE_CLI_VERSION_NOT_FOUND.toString())));
                }
            }
            else {
                taskLib.debug(application_constant_1.CHECK_LATEST_BRIDGE_CLI_VERSION);
                version = yield this.getBridgeCliVersionFromLatestURL(this.bridgeCliArtifactoryURL.concat("/latest/versions.txt"));
                bridgeUrl = this.getLatestVersionUrl();
            }
            if (version != "") {
                if (yield this.checkIfBridgeCliVersionExists(version)) {
                    console.info(application_constant_1.BRIDGECLI_VERSION, version);
                    console.log(application_constant_1.SKIP_DOWNLOAD_BRIDGE_CLI_WHEN_VERSION_NOT_FOUND);
                    return Promise.resolve("");
                }
            }
            this.bridgeCliVersion = version;
            console.info(application_constant_1.BRIDGECLI_VERSION, version);
            console.info(application_constant_1.DOWNLOADING_BRIDGE_CLI);
            console.info(application_constant_1.BRIDGE_CLI_URL_MESSAGE.concat(bridgeUrl));
            return bridgeUrl;
        });
    }
    checkIfBridgeCliVersionExists(bridgeVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            this.bridgeCliExecutablePath = yield this.getBridgeCliPath();
            const osName = process.platform;
            let versionFilePath;
            if (osName === constants.WIN32) {
                versionFilePath = this.bridgeCliExecutablePath.concat("\\versions.txt");
            }
            else {
                versionFilePath = this.bridgeCliExecutablePath.concat("/versions.txt");
            }
            if (taskLib.exist(versionFilePath) && this.bridgeCliExecutablePath) {
                taskLib.debug(application_constant_1.BRIDGE_CLI_FOUND_AT.concat(this.bridgeCliExecutablePath));
                taskLib.debug(application_constant_1.VERSION_FILE_FOUND_AT.concat(this.bridgeCliExecutablePath));
                if (yield this.checkIfVersionExists(bridgeVersion, versionFilePath)) {
                    return Promise.resolve(true);
                }
            }
            else {
                taskLib.debug(application_constant_1.VERSION_FILE_NOT_FOUND_AT.concat(this.bridgeCliExecutablePath));
            }
            return Promise.resolve(false);
        });
    }
    /**
     * Fetch content using direct HTTPS with enhanced SSL support.
     * Falls back to typed-rest-client if direct HTTPS fails.
     */
    fetchWithDirectHTTPS(fetchUrl, headers = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const sslConfig = (0, ssl_utils_1.getSSLConfig)();
            const shouldUseDirectHTTPS = sslConfig.trustAllCerts || (sslConfig.customCA && sslConfig.combinedCAs);
            if (shouldUseDirectHTTPS) {
                try {
                    taskLib.debug("Using direct HTTPS for Bridge CLI metadata fetch with enhanced SSL support");
                    return yield new Promise((resolve, reject) => {
                        const parsedUrl = new URL(fetchUrl);
                        const requestOptions = (0, ssl_utils_1.createHTTPSRequestOptions)(parsedUrl, sslConfig, headers);
                        const request = https.request(requestOptions, (response) => {
                            const statusCode = response.statusCode || 0;
                            if (statusCode !== 200) {
                                reject(new Error(`HTTP ${statusCode}: ${response.statusMessage}`));
                                return;
                            }
                            let data = "";
                            response.on("data", (chunk) => {
                                data += chunk;
                            });
                            response.on("end", () => {
                                resolve(data);
                            });
                        });
                        request.on("error", (err) => {
                            reject(err);
                        });
                        request.setTimeout(30000, () => {
                            request.destroy();
                            reject(new Error("Request timeout"));
                        });
                        request.end();
                    });
                }
                catch (error) {
                    taskLib.debug(`Direct HTTPS fetch failed, falling back to typed-rest-client: ${error}`);
                    // Fall through to typed-rest-client approach
                }
            }
            // Fallback to typed-rest-client
            taskLib.debug("Using typed-rest-client for Bridge CLI metadata fetch");
            const httpClient = (0, utility_1.getSharedHttpClient)();
            const response = yield httpClient.get(fetchUrl, headers);
            if (response.message.statusCode !== 200) {
                throw new Error(`HTTP ${response.message.statusCode}: ${response.message.statusMessage}`);
            }
            return yield response.readBody();
        });
    }
    getAllAvailableBridgeCliVersions() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let retryCountLocal = application_constant_1.RETRY_COUNT;
            let retryDelay = application_constant_1.RETRY_DELAY_IN_MILLISECONDS;
            const versionArray = [];
            do {
                try {
                    const htmlResponse = yield this.fetchWithDirectHTTPS(this.bridgeCliArtifactoryURL, {
                        Accept: "text/html",
                    });
                    const domParser = new dom_parser_1.default();
                    const doms = domParser.parseFromString(htmlResponse);
                    const elems = doms.getElementsByTagName("a");
                    if (elems != null) {
                        for (const el of elems) {
                            const content = el.textContent;
                            if (content != null) {
                                const v = content.match("^[0-9]+.[0-9]+.[0-9]+");
                                if (v != null && v.length === 1) {
                                    versionArray.push(v[0]);
                                }
                            }
                        }
                    }
                    // Success - break out of retry loop
                    break;
                }
                catch (error) {
                    const err = error;
                    const statusCode = (_a = err.message.match(/HTTP (\d+):/)) === null || _a === void 0 ? void 0 : _a[1];
                    if (!statusCode || !application_constant_1.NON_RETRY_HTTP_CODES.has(Number(statusCode))) {
                        retryDelay = yield this.retrySleepHelper(application_constant_1.GETTING_ALL_BRIDGE_VERSIONS_RETRY, retryCountLocal, retryDelay);
                        retryCountLocal--;
                    }
                    else {
                        retryCountLocal = 0;
                    }
                }
                if (retryCountLocal === 0 && !(versionArray.length > 0)) {
                    taskLib.warning(application_constant_1.UNABLE_TO_GET_RECENT_BRIDGE_VERSION);
                }
            } while (retryCountLocal > 0);
            return versionArray;
        });
    }
    checkIfVersionExists(bridgeVersion, bridgeVersionFilePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const contents = (0, fs_1.readFileSync)(bridgeVersionFilePath, "utf-8");
                return contents.includes("bridge-cli-bundle: ".concat(bridgeVersion));
            }
            catch (e) {
                console.info(application_constant_1.ERROR_READING_VERSION_FILE.concat(e.message));
            }
            return false;
        });
    }
    getBridgeCliVersionFromLatestURL(latestVersionsUrl) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let retryCountLocal = application_constant_1.RETRY_COUNT;
                let retryDelay = application_constant_1.RETRY_DELAY_IN_MILLISECONDS;
                do {
                    try {
                        const htmlResponse = yield this.fetchWithDirectHTTPS(latestVersionsUrl, {
                            Accept: "text/html",
                        });
                        const lines = htmlResponse.trim().split("\n");
                        for (const line of lines) {
                            if (line.includes("bridge-cli-bundle")) {
                                return line.split(":")[1].trim();
                            }
                        }
                        // Success but no version found - break out of retry loop
                        break;
                    }
                    catch (error) {
                        const err = error;
                        const statusCode = (_a = err.message.match(/HTTP (\d+):/)) === null || _a === void 0 ? void 0 : _a[1];
                        if (!statusCode || !application_constant_1.NON_RETRY_HTTP_CODES.has(Number(statusCode))) {
                            retryDelay = yield this.retrySleepHelper(application_constant_1.GETTING_LATEST_BRIDGE_VERSIONS_RETRY, retryCountLocal, retryDelay);
                            retryCountLocal--;
                        }
                        else {
                            retryCountLocal = 0;
                        }
                    }
                    if (retryCountLocal == 0) {
                        taskLib.warning(application_constant_1.UNABLE_TO_GET_RECENT_BRIDGE_VERSION);
                    }
                } while (retryCountLocal > 0);
            }
            catch (e) {
                taskLib.debug(application_constant_1.ERROR_READING_VERSION_FILE.concat(e.message));
            }
            return "";
        });
    }
    getDefaultBridgeCliPath() {
        let bridgeDefaultPath = "";
        const osName = process.platform;
        if (osName === constants.DARWIN || osName === constants.LINUX) {
            bridgeDefaultPath = path.join(process.env["HOME"], constants.BRIDGE_CLI_DEFAULT_PATH_UNIX);
        }
        else if (osName === constants.WIN32) {
            bridgeDefaultPath = path.join(process.env["USERPROFILE"], constants.BRIDGE_CLI_DEFAULT_PATH_WINDOWS);
        }
        taskLib.debug("bridgeDefaultPath:" + bridgeDefaultPath);
        return bridgeDefaultPath;
    }
    getDefaultBridgeCliSubDirectory() {
        let bridgeSubDirectory = "";
        const osName = process.platform;
        if (osName === constants.DARWIN || osName === constants.LINUX) {
            const osPlatform = osName === constants.DARWIN
                ? this.getMacOsSuffix()
                : this.getLinuxOsSuffix();
            bridgeSubDirectory =
                constants.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_UNIX.concat("-").concat(osPlatform);
        }
        else if (osName === constants.WIN32) {
            bridgeSubDirectory =
                constants.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_WINDOWS.concat("-").concat(constants.WINDOWS_PLATFORM);
        }
        taskLib.debug("bridgeSubDirectory:" + bridgeSubDirectory);
        return bridgeSubDirectory;
    }
    getBridgeCliSubDirectoryWithVersion() {
        let bridgeSubDirectoryWithVersion = "";
        const osName = process.platform;
        const version = this.bridgeCliVersion != "" ? "-".concat(this.bridgeCliVersion) : "";
        if (osName === constants.DARWIN || osName === constants.LINUX) {
            const osPlatform = osName === constants.DARWIN
                ? this.getMacOsSuffix()
                : this.getLinuxOsSuffix();
            bridgeSubDirectoryWithVersion =
                constants.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_UNIX.concat(version)
                    .concat("-")
                    .concat(osPlatform);
        }
        else if (osName === constants.WIN32) {
            bridgeSubDirectoryWithVersion =
                constants.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_WINDOWS.concat(version)
                    .concat("-")
                    .concat(constants.WINDOWS_PLATFORM);
        }
        taskLib.debug("bridgeSubDirectoryWithVersion:" + bridgeSubDirectoryWithVersion);
        return bridgeSubDirectoryWithVersion;
    }
    // Get bridge version url
    getVersionUrl(version) {
        const osName = process.platform;
        let bridgeDownloadUrl = this.bridgeCliUrlPattern.replace("$version", version);
        bridgeDownloadUrl = bridgeDownloadUrl.replace("$version", version);
        // Helper function to determine the appropriate platform suffix based on CPU architecture.
        const getOsSuffix = (osName, isValidVersion, minVersion, intelSuffix, armSuffix) => {
            if (!isValidVersion) {
                console.log(application_constant_1.BRIDGE_CLI_ARM_VERSION_FALLBACK_MESSAGE.replace("{version}", version)
                    .replace("{minVersion}", minVersion)
                    .replace("{intelSuffix}", intelSuffix));
                return intelSuffix;
            }
            let isIntel = true;
            const cpuInfo = os_1.default.cpus();
            taskLib.debug(`cpuInfo :: ${JSON.stringify(cpuInfo)}`);
            if (osName === constants.DARWIN) {
                isIntel = cpuInfo[0].model.includes("Intel");
            }
            else if (osName === constants.LINUX) {
                isIntel = !/^(arm.*|aarch.*)$/.test(process.arch);
            }
            return isIntel ? intelSuffix : armSuffix;
        };
        if (osName === constants.DARWIN) {
            const isValidVersionForARM = semver_1.default.gte(version, constants.MIN_SUPPORTED_BRIDGE_CLI_MAC_ARM_VERSION);
            const osSuffix = getOsSuffix(osName, isValidVersionForARM, constants.MIN_SUPPORTED_BRIDGE_CLI_MAC_ARM_VERSION, constants.MAC_INTEL_PLATFORM, constants.MAC_ARM_PLATFORM);
            bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", osSuffix);
        }
        else if (osName === constants.LINUX) {
            const isValidVersionForARM = semver_1.default.gte(version, constants.MIN_SUPPORTED_BRIDGE_CLI_LINUX_ARM_VERSION);
            const osSuffix = getOsSuffix(osName, isValidVersionForARM, constants.MIN_SUPPORTED_BRIDGE_CLI_LINUX_ARM_VERSION, constants.LINUX_PLATFORM, constants.LINUX_ARM_PLATFORM);
            bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", osSuffix);
        }
        else if (osName === constants.WIN32) {
            bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", constants.WINDOWS_PLATFORM);
        }
        return bridgeDownloadUrl;
    }
    getLatestVersionUrl() {
        const osName = process.platform;
        let bridgeDownloadUrl = this.bridgeCliUrlLatestPattern;
        if (osName === constants.DARWIN) {
            const osSuffix = this.getMacOsSuffix();
            bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", osSuffix);
        }
        else if (osName === constants.LINUX) {
            const osSuffix = this.getLinuxOsSuffix();
            bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", osSuffix);
        }
        else if (osName === constants.WIN32) {
            bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", constants.WINDOWS_PLATFORM);
        }
        return bridgeDownloadUrl;
    }
    getMacOsSuffix() {
        const cpuInfo = os_1.default.cpus();
        taskLib.debug(`cpuInfo :: ${JSON.stringify(cpuInfo)}`);
        const isIntel = cpuInfo[0].model.includes("Intel");
        return isIntel ? constants.MAC_INTEL_PLATFORM : constants.MAC_ARM_PLATFORM;
    }
    // Helper function to determine the appropriate linux platform suffix based on CPU architecture.
    getLinuxOsSuffix() {
        const cpuInfo = os_1.default.cpus();
        taskLib.debug(`cpuInfo :: ${JSON.stringify(cpuInfo)}`);
        const isIntel = !/^(arm.*|aarch.*)$/.test(process.arch);
        return isIntel ? constants.LINUX_PLATFORM : constants.LINUX_ARM_PLATFORM;
    }
    setBridgeCliExecutablePath(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.platform === constants.WIN32) {
                this.bridgeCliExecutablePath = path.join(filePath, constants.BRIDGE_CLI_EXECUTABLE_WINDOWS);
            }
            else if (process.platform === constants.DARWIN ||
                process.platform === constants.LINUX) {
                this.bridgeCliExecutablePath = path.join(filePath, constants.BRIDGE_CLI_EXECUTABLE_MAC_LINUX);
            }
            return this.bridgeCliExecutablePath;
        });
    }
    //contains executable path with extension file
    getBridgeCliPath() {
        return __awaiter(this, void 0, void 0, function* () {
            let bridgeDirectoryPath = path.join(String(this.getDefaultBridgeCliPath()), String(this.getDefaultBridgeCliSubDirectory()));
            if (input_1.BRIDGECLI_INSTALL_DIRECTORY_KEY) {
                bridgeDirectoryPath = path.join(String(input_1.BRIDGECLI_INSTALL_DIRECTORY_KEY), String(this.getDefaultBridgeCliSubDirectory()));
                console.info(application_constant_1.LOOKING_FOR_BRIDGE_CLI_INSTALL_DIR);
                if (!taskLib.exist(input_1.BRIDGECLI_INSTALL_DIRECTORY_KEY)) {
                    throw new Error(application_constant_1.BRIDGE_CLI_INSTALL_DIRECTORY_NOT_EXISTS.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.BRIDGE_INSTALL_DIRECTORY_NOT_EXIST.toString()));
                }
            }
            else {
                console.info(application_constant_1.LOOKING_FOR_BRIDGE_CLI_DEFAULT_PATH);
                if (input_1.ENABLE_NETWORK_AIRGAP && bridgeDirectoryPath) {
                    if (!taskLib.exist(bridgeDirectoryPath)) {
                        throw new Error(application_constant_1.BRIDGE_CLI_DEFAULT_DIRECTORY_NOT_EXISTS.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.DEFAULT_DIRECTORY_NOT_FOUND.toString()));
                    }
                }
            }
            return bridgeDirectoryPath;
        });
    }
    retrySleepHelper(message, retryCountLocal, retryDelay) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info(message
                .concat(String(retryCountLocal))
                .concat(", Waiting: ")
                .concat(String(retryDelay / 1000))
                .concat(" Seconds"));
            yield (0, utility_1.sleep)(retryDelay);
            // Delayed exponentially starting from 15 seconds
            retryDelay = retryDelay * 2;
            return retryDelay;
        });
    }
}
exports.BridgeCli = BridgeCli;

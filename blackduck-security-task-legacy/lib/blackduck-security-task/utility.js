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
exports.stringFormat = exports.clearHttpClientCache = exports.getSharedHttpClient = exports.createSSLConfiguredHttpClient = exports.createSSLConfiguredHttpsAgent = exports.extractSarifOutputPath = exports.copySarifFileToIntegrationDefaultPath = exports.extractOutputJsonFilename = exports.getMappedTaskResult = exports.equalsIgnoreCase = exports.getStatusCode = exports.extractBranchName = exports.isPullRequestEvent = exports.IS_PR_EVENT = exports.filterEmptyData = exports.getIntegrationDefaultSarifReportPath = exports.getDefaultSarifReportPath = exports.sleep = exports.getWorkSpaceDirectory = exports.isBoolean = exports.parseToBoolean = exports.getRemoteFile = exports._getAgentTemp = exports._createExtractFolder = exports.extractZipWithQuiet = exports.extractZipped = exports.getTempDir = exports.cleanUrl = void 0;
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const utility = __importStar(require("./utility"));
const constants = __importStar(require("./application-constant"));
const application_constant_1 = require("./application-constant");
const toolLibLocal = __importStar(require(".//download-tool"));
const process = __importStar(require("process"));
const taskLib = __importStar(require("azure-pipelines-task-lib/task"));
const task_1 = require("azure-pipelines-task-lib/task");
const uuid_1 = require("uuid");
const azure_1 = require("./model/azure");
const ErrorCodes_1 = require("./enum/ErrorCodes");
const BuildStatus_1 = require("./enum/BuildStatus");
const HttpClient_1 = require("typed-rest-client/HttpClient");
const inputs = __importStar(require("./input"));
const ssl_utils_1 = require("./ssl-utils");
function cleanUrl(url) {
    if (url && url.endsWith("/")) {
        return url.slice(0, url.length - 1);
    }
    return url;
}
exports.cleanUrl = cleanUrl;
function getTempDir() {
    return process.env["AGENT_TEMPDIRECTORY"] || "";
}
exports.getTempDir = getTempDir;
function extractZipped(file, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (file == null || file.length === 0) {
            return Promise.reject(new Error(application_constant_1.BRIDGE_CLI_ZIP_NOT_FOUND_FOR_EXTRACT.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.FILE_DOES_NOT_EXIST.toString())));
        }
        // Extract file name from file with full path
        if (destinationPath == null || destinationPath.length === 0) {
            return Promise.reject(new Error(application_constant_1.BRIDGE_CLI_EXTRACT_DIRECTORY_NOT_FOUND.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.NO_DESTINATION_DIRECTORY.toString())));
        }
        try {
            console.info(constants.EXTRACTING_BRIDGE_CLI_ARCHIVE);
            yield utility.extractZipWithQuiet(file, destinationPath);
            console.info(constants.BRIDGE_CLI_EXTRACTION_COMPLETED);
            return Promise.resolve(true);
        }
        catch (error) {
            return Promise.reject(error);
        }
    });
}
exports.extractZipped = extractZipped;
function extractZipWithQuiet(file, destination) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!file) {
            throw new Error("parameter 'file' is required");
        }
        const dest = _createExtractFolder(destination);
        if (process.platform == "win32") {
            const escapedFile = file.replace(/'/g, "''").replace(/"|\n|\r/g, "");
            const escapedDest = dest.replace(/'/g, "''").replace(/"|\n|\r/g, "");
            const command = `$ErrorActionPreference = 'Stop' ; try { Add-Type -AssemblyName System.IO.Compression.FileSystem } catch { } ; [System.IO.Compression.ZipFile]::ExtractToDirectory('${escapedFile}', '${escapedDest}')`;
            const chcpPath = path_1.default.join((_a = process.env.windir) !== null && _a !== void 0 ? _a : "", "system32", "chcp.com");
            yield taskLib.exec(chcpPath, "65001");
            const powershell = taskLib
                .tool("powershell")
                .line("-NoLogo -Sta -NoProfile -NonInteractive -ExecutionPolicy Unrestricted -Command")
                .arg(command);
            yield powershell.exec();
        }
        else {
            const unzip = taskLib.tool("unzip").arg("-q").arg(file);
            yield unzip.exec({ cwd: dest });
        }
        return dest;
    });
}
exports.extractZipWithQuiet = extractZipWithQuiet;
function _createExtractFolder(dest) {
    if (!dest) {
        dest = path_1.default.join(_getAgentTemp(), (0, uuid_1.v4)());
    }
    taskLib.mkdirP(dest);
    return dest;
}
exports._createExtractFolder = _createExtractFolder;
function _getAgentTemp() {
    taskLib.assertAgent("2.115.0");
    const tempDirectory = taskLib.getVariable("Agent.TempDirectory");
    if (!tempDirectory) {
        throw new Error("Agent.TempDirectory is not set");
    }
    return tempDirectory;
}
exports._getAgentTemp = _getAgentTemp;
function getRemoteFile(destFilePath, url) {
    return __awaiter(this, void 0, void 0, function* () {
        if (url == null || url.length === 0) {
            return Promise.reject(new Error(application_constant_1.EMPTY_BRIDGE_CLI_URL.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.BRIDGE_CLI_URL_CANNOT_BE_EMPTY.toString())));
        }
        let fileNameFromUrl = "";
        if (taskLib.stats(destFilePath).isDirectory()) {
            fileNameFromUrl = url.substring(url.lastIndexOf("/") + 1);
            destFilePath = path_1.default.join(destFilePath, fileNameFromUrl || application_constant_1.BRIDGE_CLI_ZIP_FILE_NAME);
        }
        let retryCountLocal = application_constant_1.RETRY_COUNT;
        let retryDelay = application_constant_1.RETRY_DELAY_IN_MILLISECONDS;
        do {
            try {
                const toolPath = yield toolLibLocal.downloadTool(url, destFilePath);
                return {
                    filePath: toolPath,
                    fileName: fileNameFromUrl,
                };
            }
            catch (err) {
                const error = err;
                if (retryCountLocal == 0) {
                    throw error;
                }
                if (!application_constant_1.NON_RETRY_HTTP_CODES.has(Number(getStatusCode(error.message))) ||
                    error.message.includes("did not match downloaded file size")) {
                    console.info(application_constant_1.BRIDGE_CLI_DOWNLOAD_FAILED_RETRY.concat(String(retryCountLocal))
                        .concat(", Waiting: ")
                        .concat(String(retryDelay / 1000))
                        .concat(" Seconds"));
                    yield sleep(retryDelay);
                    retryDelay = retryDelay * 2;
                    retryCountLocal--;
                }
                else {
                    retryCountLocal = 0;
                }
            }
        } while (retryCountLocal >= 0);
        return Promise.reject(application_constant_1.BRIDGE_CLI_DOWNLOAD_FAILED.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.BRIDGE_CLI_DOWNLOAD_FAILED.toString()));
    });
}
exports.getRemoteFile = getRemoteFile;
function parseToBoolean(value) {
    if (value &&
        value !== "" &&
        (value.toString().toLowerCase() === "true" || value === true)) {
        return true;
    }
    return false;
}
exports.parseToBoolean = parseToBoolean;
function isBoolean(value) {
    if (value !== undefined &&
        value !== null &&
        value !== "" &&
        (value.toString().toLowerCase() === "true" ||
            value === true ||
            value.toString().toLowerCase() === "false" ||
            value === false)) {
        return true;
    }
    return false;
}
exports.isBoolean = isBoolean;
function getWorkSpaceDirectory() {
    const repoLocalPath = process.env["BUILD_REPOSITORY_LOCALPATH"];
    if (repoLocalPath !== undefined) {
        return repoLocalPath;
    }
    else {
        throw new Error(application_constant_1.WORKSPACE_DIR_NOT_FOUND.concat(constants.SPACE).concat(ErrorCodes_1.ErrorCode.WORKSPACE_DIRECTORY_NOT_FOUND.toString()));
    }
}
exports.getWorkSpaceDirectory = getWorkSpaceDirectory;
function sleep(duration) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}
exports.sleep = sleep;
function getDefaultSarifReportPath(sarifReportDirectory, appendFilePath) {
    const pwd = getWorkSpaceDirectory();
    return !appendFilePath
        ? path_1.default.join(pwd, constants.BRIDGE_CLI_LOCAL_DIRECTORY, sarifReportDirectory)
        : path_1.default.join(pwd, constants.BRIDGE_CLI_LOCAL_DIRECTORY, sarifReportDirectory, constants.SARIF_DEFAULT_FILE_NAME);
}
exports.getDefaultSarifReportPath = getDefaultSarifReportPath;
// Get Integration Default Sarif Report Path
function getIntegrationDefaultSarifReportPath(sarifReportDirectory, appendFilePath) {
    const pwd = getWorkSpaceDirectory();
    return !appendFilePath
        ? path_1.default.join(pwd, constants.INTEGRATIONS_CLI_LOCAL_DIRECTORY, sarifReportDirectory)
        : path_1.default.join(pwd, constants.INTEGRATIONS_CLI_LOCAL_DIRECTORY, sarifReportDirectory, constants.SARIF_DEFAULT_FILE_NAME);
}
exports.getIntegrationDefaultSarifReportPath = getIntegrationDefaultSarifReportPath;
function filterEmptyData(data) {
    return JSON.parse(JSON.stringify(data), (key, value) => value === null ||
        value === "" ||
        value === 0 ||
        value.length === 0 ||
        (typeof value === "object" && Object.keys(value).length === 0)
        ? undefined
        : value);
}
exports.filterEmptyData = filterEmptyData;
// Global variable to check PR events for uploading SARIF files in main.ts, reducing the need for current code refactoring
exports.IS_PR_EVENT = false;
function isPullRequestEvent(azurePrResponse) {
    const buildReason = taskLib.getVariable(azure_1.AZURE_ENVIRONMENT_VARIABLES.AZURE_BUILD_REASON) || "";
    exports.IS_PR_EVENT =
        buildReason === azure_1.AZURE_BUILD_REASON.PULL_REQUEST ||
            ((azurePrResponse === null || azurePrResponse === void 0 ? void 0 : azurePrResponse.pullRequestId) !== undefined &&
                azurePrResponse.pullRequestId > 0);
    return exports.IS_PR_EVENT;
}
exports.isPullRequestEvent = isPullRequestEvent;
function extractBranchName(branchName) {
    const prefix = "refs/heads/";
    if (!branchName.startsWith(prefix)) {
        return branchName;
    }
    return branchName.substring(prefix.length);
}
exports.extractBranchName = extractBranchName;
// This function extracts the status code from a given error message string.
// Example: "Failed to download Bridge CLI zip from specified URL. HTTP status code: 502 124",
// The function will return the HTTP status code. For the above example: 502
function getStatusCode(str) {
    const words = str.split(" ");
    return words.length < 2 ? str : words[words.length - 2];
}
exports.getStatusCode = getStatusCode;
function equalsIgnoreCase(a, b) {
    return a.toLowerCase() === b.toLowerCase();
}
exports.equalsIgnoreCase = equalsIgnoreCase;
function getMappedTaskResult(buildStatus) {
    if (equalsIgnoreCase(buildStatus, BuildStatus_1.BuildStatus.Succeeded)) {
        return task_1.TaskResult.Succeeded;
    }
    else if (equalsIgnoreCase(buildStatus, BuildStatus_1.BuildStatus.SucceededWithIssues)) {
        return task_1.TaskResult.SucceededWithIssues;
    }
    else if (equalsIgnoreCase(buildStatus, BuildStatus_1.BuildStatus.Failed)) {
        return task_1.TaskResult.Failed;
    }
    else {
        if (buildStatus) {
            console.log(`Unsupported value for ${application_constant_1.MARK_BUILD_STATUS_KEY}: ${buildStatus}`);
        }
        return undefined;
    }
}
exports.getMappedTaskResult = getMappedTaskResult;
// Extract File name from the formatted command
function extractOutputJsonFilename(command) {
    const match = command.match(/--out\s+([^\s]+)/);
    if (match && match[1]) {
        // Extract the full path and remove any quotes
        const outputFilePath = match[1].replace(/^["']|["']$/g, "");
        taskLib.debug(`Extracted Output Path:::: ${outputFilePath}`);
        return outputFilePath || "";
    }
    return "";
}
exports.extractOutputJsonFilename = extractOutputJsonFilename;
// Extract sarif output file path from out json
function copySarifFileToIntegrationDefaultPath(sarifFilePath) {
    const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
    const sarifFileName = path_1.default.basename(sarifFilePath);
    const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
    const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;
    if (!isPolarisFile && !isBlackduckFile)
        return;
    const sarifOutputPath = extractSarifOutputPath(sarifFilePath, sarifFileName);
    if (!sarifOutputPath)
        return;
    const integrationSarifDir = path_1.default.dirname(isPolarisFile
        ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
        : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH);
    const integrationSarifDirPath = path_1.default.join(sourceDirectory, integrationSarifDir);
    const destinationFile = path_1.default.join(integrationSarifDirPath, constants.SARIF_DEFAULT_FILE_NAME);
    try {
        fs.mkdirSync(integrationSarifDirPath, { recursive: true });
        fs.copyFileSync(sarifOutputPath, destinationFile);
        taskLib.debug(`SARIF file ${fs.existsSync(destinationFile) ? "overwritten" : "copied"} at: ${destinationFile}`);
    }
    catch (error) {
        console.error("Error copying SARIF file:", error);
    }
}
exports.copySarifFileToIntegrationDefaultPath = copySarifFileToIntegrationDefaultPath;
// Extract the file name from the path
function extractSarifOutputPath(outputJsonPath, sarifFileName) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const config = JSON.parse(fs.readFileSync(outputJsonPath, "utf-8"));
        const sarifOutputPath = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
            ? (_e = (_d = (_c = (_b = (_a = config === null || config === void 0 ? void 0 : config.data) === null || _a === void 0 ? void 0 : _a.polaris) === null || _b === void 0 ? void 0 : _b.reports) === null || _c === void 0 ? void 0 : _c.sarif) === null || _d === void 0 ? void 0 : _d.file) === null || _e === void 0 ? void 0 : _e.output
            : (_k = (_j = (_h = (_g = (_f = config === null || config === void 0 ? void 0 : config.data) === null || _f === void 0 ? void 0 : _f.blackducksca) === null || _g === void 0 ? void 0 : _g.reports) === null || _h === void 0 ? void 0 : _h.sarif) === null || _j === void 0 ? void 0 : _j.file) === null || _k === void 0 ? void 0 : _k.output;
        if (!sarifOutputPath) {
            return "";
        }
        return sarifOutputPath;
    }
    catch (error) {
        console.error("Error reading or parsing output JSON file:", error);
        return "";
    }
}
exports.extractSarifOutputPath = extractSarifOutputPath;
// Singleton HTTPS agent cache for downloads (with proper system + custom CA combination)
let _httpsAgentCache = null;
let _httpsAgentConfigHash = null;
// Singleton HTTP client cache for API operations
let _httpClientCache = null;
let _httpClientConfigHash = null;
/**
 * Creates an HTTPS agent with SSL configuration based on task inputs.
 * Uses singleton pattern to reuse the same agent instance when configuration hasn't changed.
 * This properly combines system CAs with custom CAs unlike typed-rest-client.
 * Use this for direct HTTPS operations like file downloads.
 *
 * @returns HTTPS agent configured with appropriate SSL settings
 */
function createSSLConfiguredHttpsAgent() {
    const currentConfigHash = (0, ssl_utils_1.getSSLConfigHash)();
    // Return cached agent if configuration hasn't changed
    if (_httpsAgentCache && _httpsAgentConfigHash === currentConfigHash) {
        taskLib.debug("Reusing existing HTTPS agent instance");
        return _httpsAgentCache;
    }
    // Get SSL configuration and create agent
    const sslConfig = (0, ssl_utils_1.getSSLConfig)();
    _httpsAgentCache = (0, ssl_utils_1.createHTTPSAgent)(sslConfig);
    // Cache the configuration hash
    _httpsAgentConfigHash = currentConfigHash;
    taskLib.debug("Created new HTTPS agent instance with SSL configuration");
    return _httpsAgentCache;
}
exports.createSSLConfiguredHttpsAgent = createSSLConfiguredHttpsAgent;
/**
 * Creates an HttpClient instance with SSL configuration based on task inputs.
 * Uses singleton pattern to reuse the same client instance when configuration hasn't changed.
 * This uses typed-rest-client for structured API operations.
 * Note: typed-rest-client has limitations with combining system CAs + custom CAs.
 *
 * @param userAgent The user agent string to use for the HTTP client (default: "BlackDuckSecurityTask")
 * @returns HttpClient instance configured with appropriate SSL settings
 */
function createSSLConfiguredHttpClient(userAgent = "BlackDuckSecurityTask") {
    const currentConfigHash = (0, ssl_utils_1.getSSLConfigHash)();
    // Return cached client if configuration hasn't changed
    if (_httpClientCache && _httpClientConfigHash === currentConfigHash) {
        taskLib.debug(`Reusing existing HttpClient instance with user agent: ${userAgent}`);
        return _httpClientCache;
    }
    // Get SSL configuration
    const sslConfig = (0, ssl_utils_1.getSSLConfig)();
    if (sslConfig.trustAllCerts) {
        taskLib.debug("SSL certificate verification disabled for HttpClient (NETWORK_SSL_TRUST_ALL=true)");
        _httpClientCache = new HttpClient_1.HttpClient(userAgent, [], { ignoreSslError: true });
    }
    else if (sslConfig.customCA) {
        taskLib.debug(`Using custom CA certificate for HttpClient: ${inputs.NETWORK_SSL_CERT_FILE}`);
        try {
            // Note: typed-rest-client has limitations with combining system CAs + custom CAs
            // For downloads, use createSSLConfiguredHttpsAgent() which properly combines CAs
            // For API operations, this fallback to caFile option (custom CA only) is acceptable
            _httpClientCache = new HttpClient_1.HttpClient(userAgent, [], {
                allowRetries: true,
                maxRetries: 3,
                cert: {
                    caFile: inputs.NETWORK_SSL_CERT_FILE,
                },
            });
            taskLib.debug("HttpClient configured with custom CA certificate (Note: typed-rest-client limitation - system CAs not combined)");
        }
        catch (err) {
            taskLib.warning(`Failed to configure custom CA certificate, using default HttpClient: ${err}`);
            _httpClientCache = new HttpClient_1.HttpClient(userAgent);
        }
    }
    else {
        taskLib.debug("Using default HttpClient with system SSL certificates");
        _httpClientCache = new HttpClient_1.HttpClient(userAgent);
    }
    // Cache the configuration hash
    _httpClientConfigHash = currentConfigHash;
    taskLib.debug(`Created new HttpClient instance with user agent: ${userAgent}`);
    return _httpClientCache;
}
exports.createSSLConfiguredHttpClient = createSSLConfiguredHttpClient;
/**
 * Gets a shared HttpClient instance with SSL configuration.
 * This is for API operations using typed-rest-client.
 * Use this for structured API operations that need typed responses.
 *
 * @returns HttpClient instance configured with appropriate SSL settings
 */
function getSharedHttpClient() {
    return createSSLConfiguredHttpClient("BlackDuckSecurityTask");
}
exports.getSharedHttpClient = getSharedHttpClient;
/**
 * Clears both HTTPS agent and HTTP client caches. Useful for testing or when you need to force recreation.
 */
function clearHttpClientCache() {
    _httpsAgentCache = null;
    _httpsAgentConfigHash = null;
    _httpClientCache = null;
    _httpClientConfigHash = null;
    taskLib.debug("HTTP client and HTTPS agent caches cleared");
}
exports.clearHttpClientCache = clearHttpClientCache;
function stringFormat(url, ...args) {
    return url.replace(/{(\d+)}/g, (match, index) => encodeURIComponent(args[index]) || "");
}
exports.stringFormat = stringFormat;

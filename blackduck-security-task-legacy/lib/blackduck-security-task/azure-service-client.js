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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureService = void 0;
const taskLib = __importStar(require("azure-pipelines-task-lib/task"));
const constants = __importStar(require("./application-constant"));
const ErrorCodes_1 = require("./enum/ErrorCodes");
const application_constant_1 = require("./application-constant");
const utility_1 = require("./utility");
class AzureService {
    constructor() {
        this.azureGetMergeRequestsAPI =
            "/{0}/{1}/_apis/git/repositories/{2}/pullrequests?searchCriteria.status=active&$top=1&searchCriteria.sourceRefName={3}&api-version={4}";
        this.azureGetRepositoryAPI = "/{0}/{1}/_apis/git/repositories/{2}";
        this.apiVersion = "7.0";
    }
    getAzurePrResponseForManualTriggerFlow(azureData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (azureData &&
                process.env["BUILD_REASON"] &&
                process.env["BUILD_REASON"] !== "PullRequest") {
                const StringFormat = (url, ...args) => url.replace(/{(\d+)}/g, (match, index) => encodeURIComponent(args[index]) || "");
                const endpoint = StringFormat(azureData.api.url.concat(this.azureGetMergeRequestsAPI), azureData.organization.name, azureData.project.name, azureData.repository.name, azureData.repository.branch.name, azureData.restAPIVersion || this.apiVersion);
                taskLib.debug(`Azure check pull request API: ${endpoint}`);
                const token = ":".concat(azureData.user.token);
                const encodedToken = Buffer.from(token, "utf8").toString("base64");
                const httpClient = (0, utility_1.getSharedHttpClient)();
                const httpResponse = yield httpClient.get(endpoint, {
                    Authorization: "Basic ".concat(encodedToken),
                    Accept: "application/json",
                });
                if (httpResponse.message.statusCode === 200) {
                    const azurePrResponse = JSON.parse(yield httpResponse.readBody());
                    if (azurePrResponse.count === 1) {
                        return {
                            pullRequestId: azurePrResponse.value[0].pullRequestId,
                            targetRefName: azurePrResponse.value[0].targetRefName,
                        };
                    }
                    else {
                        console.info(application_constant_1.UNABLE_TO_FIND_PULL_REQUEST_INFO.concat(azureData.repository.branch.name));
                    }
                }
                else {
                    throw new Error(application_constant_1.FAILED_TO_GET_PULL_REQUEST_INFO.concat(azureData.repository.branch.name)
                        .concat(constants.SPACE)
                        .concat(ErrorCodes_1.ErrorCode.FAILED_TO_GET_PULL_REQUEST_INFO_FROM_SOURCE_BRANCH.toString()));
                }
            }
            return undefined;
        });
    }
    fetchAzureServerApiVersion(url, orgName, projectName, repoName, userToken) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const repoEndpoint = (0, utility_1.stringFormat)(url + this.azureGetRepositoryAPI, orgName, projectName, repoName);
            const encodedToken = Buffer.from(`:${userToken}`, "utf8").toString("base64");
            const response = yield (0, utility_1.getSharedHttpClient)().get(repoEndpoint, {
                Authorization: `Basic ${encodedToken}`,
                Accept: "application/json",
            });
            const header = response.message.headers["content-type"] ||
                response.message.headers["Content-Type"];
            const version = typeof header === "string"
                ? (_b = (_a = header.match(/api-version=([\d.]+)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : ""
                : "";
            taskLib.debug(`Fetched Azure server API version: ${version}`);
            if (!version)
                throw new Error(`Unable to fetch API version for Azure server at ${repoEndpoint}`);
            return version;
        });
    }
}
exports.AzureService = AzureService;

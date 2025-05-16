// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {expect} from "chai";
import * as utility from "../../../src/blackduck-security-task/utility";
import {
    extractZipped, getStatusCode,
    getWorkSpaceDirectory,
    parseToBoolean
} from "../../../src/blackduck-security-task/utility";
import process from "process";
import * as sinon from "sinon";
import * as toolLib from "azure-pipelines-tool-lib";
import * as toolLibLocal from "../../../src/blackduck-security-task/download-tool";
import {DownloadFileResponse} from "../../../src/blackduck-security-task/model/download-file-response";
import * as constants from "../../../src/blackduck-security-task/application-constant";
import * as taskLib from "azure-pipelines-task-lib";
import {AZURE_BUILD_REASON, AZURE_ENVIRONMENT_VARIABLES} from "../../../src/blackduck-security-task/model/azure";
import { ErrorCode } from "../../../src/blackduck-security-task/enum/ErrorCodes";
import {BuildStatus} from "../../../src/blackduck-security-task/enum/BuildStatus";
import {TaskResult} from "azure-pipelines-task-lib/task";

describe("Utilities", () => {

    Object.defineProperty(constants, "RETRY_COUNT", {value: 3});
    Object.defineProperty(constants, "RETRY_DELAY_IN_MILLISECONDS", {value: 100});
    Object.defineProperty(constants, "NON_RETRY_HTTP_CODES", {value: new Set([200,201,401,403,416]), configurable: true});

    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    context('Clean Url', () => {
        it('Clean Url', async function () {
            const result = utility.cleanUrl("/temp/");
            expect(result).contains("/temp")
        });

        it('Clean Url - 2', async function () {
            const result = utility.cleanUrl("/temp");
            expect(result).contains("/temp")
        });
    });

    context('getTempDir', () => {
        it('getTempDir', async function () {
            process.env["AGENT_TEMPDIRECTORY"] = "/tmp"
            const result = utility.getTempDir();
            expect(result).contains("/tmp")
            process.env["AGENT_TEMPDIRECTORY"] = ""
        });

    });

    context('extractZipped', () => {

        it('extractZipped - success', async function () {
            sandbox.stub(utility, "extractZipWithQuiet").returns(Promise.resolve("/"));
            const result = await utility.extractZipped("bridge.zip", "/dest_path");
            expect(result).equals(true)
        });

        it('extractZipped - failure', async function () {
            sandbox.stub(utility, "extractZipWithQuiet").throws(new Error("invalid path"));
            await utility.extractZipped("bridge.zip", "/dest_path").catch(error => {
                expect(error.message).includes("invalid path")})
        });

        it('extractZipped - failure- file name empty', async function () {
            sandbox.stub(utility, "extractZipWithQuiet").returns(Promise.resolve("/"));
            await utility.extractZipped("", "/dest_path").catch(errorObj => {
                expect(errorObj.message).includes("File does not exist");
                expect(errorObj.message).includes(ErrorCode.FILE_DOES_NOT_EXIST.toString());
            })
        });

        it('extractZipped - failure- destination path empty', async function () {
            sandbox.stub(utility, "extractZipWithQuiet").returns(Promise.resolve("/"));
            await utility.extractZipped("bridge.zip", "").catch(errorObj => {
                expect(errorObj.message).includes("No destination directory found");
                expect(errorObj.message).includes(ErrorCode.NO_DESTINATION_DIRECTORY.toString());
            })
        });
    });

    context('getWorkSpaceDirectory', () => {

        it('getWorkSpaceDirectory - success', async function () {
            process.env["BUILD_REPOSITORY_LOCALPATH"] = "/"
            const result = utility.getWorkSpaceDirectory();
            expect(result).equals("/")
            process.env["BUILD_REPOSITORY_LOCALPATH"] = ""
        });
    });

    context('getRemoteFile', async function () {

        it('getRemoteFile - success', async function () {
            const downloadFileResponse = {filePath: "/", fileName: "bridge-cli-bundle.zip"} as DownloadFileResponse
            sandbox.stub(toolLibLocal, "downloadTool").returns(Promise.resolve("/"));
            const result = await utility.getRemoteFile("/", "https://blackduck.com/bridge-cli-bundle.zip");
            expect(result.fileName).equals(downloadFileResponse.fileName)
            expect(result.filePath).equals(downloadFileResponse.filePath)
        });

        it('getRemoteFile - failure - url empty', async function () {
            await utility.getRemoteFile("/", "").catch(error => {
                expect(error.message).includes("URL cannot be empty")
                expect(error.message).includes(ErrorCode.BRIDGE_CLI_URL_CANNOT_BE_EMPTY.toString())
            });

        });

        it('getRemoteFile - failure 401', async function () {
            sandbox.stub(toolLibLocal, "downloadTool").throws(new Error("401"))
            await utility.getRemoteFile("/", "https://blackduck.com/bridge-cli.zip").catch(error => {
                expect(error.message).contains("401")
            });
        });

        it('getRemoteFile - retry with 500', async function () {
            sandbox.stub(toolLibLocal, "downloadTool").throws(new Error("500"))
            await utility.getRemoteFile("/", "https://blackduck.com/bridge-cli.zip").catch(error => {
                expect(error.message).contains("500")
            });
        });

    });

    context('parseToBoolean', () => {

        it('parseToBoolean - true string', async function () {
            const result = utility.parseToBoolean("true");
            expect(result).equals(true)
        });

        it('parseToBoolean - true', async function () {
            const result = utility.parseToBoolean(true);
            expect(result).equals(true)
        });

        it('parseToBoolean - TRUE', async function () {
            const result = utility.parseToBoolean("TRUE");
            expect(result).equals(true)
        });

        it('parseToBoolean - false string', async function () {
            const result = utility.parseToBoolean("false");
            expect(result).equals(false)
        });

        it('parseToBoolean - false', async function () {
            const result = utility.parseToBoolean(false);
            expect(result).equals(false)
        });

        it('parseToBoolean - FALSE', async function () {
            const result = utility.parseToBoolean("FALSE");
            expect(result).equals(false)
        });
    });

    context('isBoolean', () => {

        it('should return true with string value as true', function () {
            const result = utility.isBoolean("true");
            expect(result).equals(true)
        });

        it('should return true with boolean input as true', function () {
            const result = utility.isBoolean(true);
            expect(result).equals(true)
        });

        it('should return true with string value as FALSE', function () {
            const result = utility.isBoolean("FALSE");
            expect(result).equals(true)
        });

        it('should return true with boolean input as false', function () {
            const result = utility.isBoolean(false);
            expect(result).equals(true)
        });

        it('should return false with any random string value', function () {
            const result = utility.isBoolean("test");
            expect(result).equals(false)
        });
    });

    context('isPullRequestEvent', () => {
        it('should return true for PR automation flow', () => {
            const getStubVariable = sandbox.stub(taskLib, "getVariable");
            getStubVariable.withArgs(AZURE_ENVIRONMENT_VARIABLES.AZURE_BUILD_REASON).returns(AZURE_BUILD_REASON.PULL_REQUEST);

            expect(utility.isPullRequestEvent(undefined)).to.be.true;
        });

        it('should return true for manual trigger PR flow', () => {
            expect(utility.isPullRequestEvent({pullRequestId: 10, targetRefName: 'refs/heads/main'})).to.be.true;
        });

        it('should return false for non-PR event or manual trigger no-PR flow', () => {
            expect(utility.isPullRequestEvent(undefined)).to.be.false;
        });
    });

    context('extractBranchName', () => {
        it('should extract main or feature branch correctly without prefix refs/heads/', () => {
            expect(utility.extractBranchName("main")).equals("main");
            expect(utility.extractBranchName("feature-test")).equals("feature-test");
            expect(utility.extractBranchName("feature_test")).equals("feature_test");
        });

        it('should extract main or feature branch correctly with prefix refs/heads/', () => {
            expect(utility.extractBranchName("refs/heads/main")).equals("main");
            expect(utility.extractBranchName("refs/heads/feature-test")).equals("feature-test");
            expect(utility.extractBranchName("refs/heads/feature_test")).equals("feature_test");
        });

        it('should extract hierarchical feature branches correctly with prefix refs/heads/', () => {
            expect(utility.extractBranchName("refs/heads/dev/test")).equals("dev/test");
            expect(utility.extractBranchName("refs/heads/feature/test/new_feature")).equals("feature/test/new_feature");
        });
    });

    context('equalsIgnoreCase', () => {
        it('should equals ignore case correctly', () => {
            expect(utility.equalsIgnoreCase("", "")).to.be.true;
            expect(utility.equalsIgnoreCase("Failed", "failed")).to.be.true;
            expect(utility.equalsIgnoreCase("Failed", "FAILED")).to.be.true;
            expect(utility.equalsIgnoreCase("Failed", "Succeeded")).to.be.false;
        });
    });

    context('getMappedTaskResult', () => {
        it('should map build status to task result correctly', () => {
            expect(utility.getMappedTaskResult(BuildStatus.Failed)).equals(TaskResult.Failed);
            expect(utility.getMappedTaskResult(BuildStatus.Succeeded)).equals(TaskResult.Succeeded);
            expect(utility.getMappedTaskResult(BuildStatus.SucceededWithIssues)).equals(TaskResult.SucceededWithIssues);
            expect(utility.getMappedTaskResult("")).equals(undefined);
        });
    });
});
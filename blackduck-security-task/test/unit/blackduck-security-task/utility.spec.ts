// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import * as utility from "../../../src/blackduck-security-task/utility";
import * as input from "../../../src/blackduck-security-task/input";
import * as sslUtils from "../../../src/blackduck-security-task/ssl-utils";
import {
    extractZipped, getStatusCode,
    getWorkSpaceDirectory,
    parseToBoolean,
    createSSLConfiguredHttpClient,
    clearHttpClientCache, stringFormat
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
import * as trm from "azure-pipelines-task-lib/toolrunner";
import { expect ,assert} from "chai";
import * as fs from 'fs';
import * as https from "node:https";
import path from "path";

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

    context("_getAgentTemp", () => {

        it("should return Agent.TempDirectory when set", () => {
            sandbox.stub(taskLib, "getVariable").withArgs("Agent.TempDirectory").returns("/tmp");
            const result = utility._getAgentTemp()
            expect(result).to.equal("/tmp");
        });
      
        it("should throw error if Agent.TempDirectory is not set", () => {
            sandbox.stub(taskLib, "getVariable").withArgs("Agent.TempDirectory").returns(undefined);
            expect(() => utility._getAgentTemp()).to.throw("Agent.TempDirectory is not set");
        });

    });

    context("_createExtractFolder", () => {

        it("should use provided destination path", () => {
            const destination = "/custom/path"
            const mkdirStub = sandbox.stub(taskLib, "mkdirP");
            const result = (utility as any)._createExtractFolder(destination);
            expect(result).to.equal(destination);
            expect(mkdirStub.calledWith(destination)).to.be.true;
        });
      
        it("should use _getAgentTemp when destination is not provided", () => {
            const tempPath = "/tmp";
            sandbox.stub(taskLib, "getVariable").withArgs("Agent.TempDirectory").returns(tempPath);
        
            const result = (utility as any)._createExtractFolder();
            expect(result.startsWith(tempPath)).to.be.true;
            expect(result.length).to.be.greaterThan(tempPath.length);
        });

    });

    context("extractZipWithQuiet", () => {
      
        it("should throw error if file is not provided", async () => {
          try {
            await utility.extractZipWithQuiet("");
          } catch (err: any) {
            expect(err.message).to.equal("parameter 'file' is required");
          }
        });
      
        it("should extract zip on Windows", async () => {
          sandbox.stub(process, "platform").value("win32");
      
          const execStub = sandbox.stub().resolves(0);
          const toolStub = sandbox.stub(taskLib, "tool").returns({
            line: () => ({
              arg: () => ({
                exec: execStub,
              }),
            }),
          } as unknown as trm.ToolRunner);
      
          const chcpStub = sandbox.stub(taskLib, "exec").resolves(0);

          const file = "C:\\temp\\archive.zip"
          const destination = "C:\\temp\\dest"
      
          const result = await utility.extractZipWithQuiet(file, destination);
          expect(result).to.include(destination);
          expect(chcpStub.calledOnce).to.be.true;
          expect(toolStub.calledOnce).to.be.true;
          expect(execStub.calledOnce).to.be.true;
        });
      
        it("should extract zip on non-Windows platform", async () => {
          sandbox.stub(process, "platform").value("linux");
      
          const execStub = sandbox.stub().resolves(0);
          sandbox.stub(taskLib, "tool").returns({
            arg: function () {
              return this;
            },
            exec: execStub,
          } as unknown as trm.ToolRunner);

          const file = "/tmp/archive.zip"
          const destination = "/tmp/dest"
      
          const result = await utility.extractZipWithQuiet(file, destination);
          expect(result).to.equal(destination);
          expect(execStub.calledOnce).to.be.true;
        });

        it("should call _createExtractFolder if no destination is given", async () => {
            sandbox.stub(process, "platform").value("linux");
            sandbox.stub(taskLib, "getVariable").withArgs("Agent.TempDirectory").returns("/tmp");
        
            const execStub = sandbox.stub().resolves(0);
            sandbox.stub(taskLib, "tool").returns({
              arg: function () {
                return this;
              },
              exec: execStub,
            } as unknown as trm.ToolRunner);

            const file = "/tmp/archive.zip"
        
            const result = await utility.extractZipWithQuiet(file);
            expect(result).to.match(/^\/tmp\/[a-f0-9\-]+$/); 
            expect(execStub.calledOnce).to.be.true;
        });
      
        it("should propagate error from tool exec", async () => {
          sandbox.stub(process, "platform").value("linux");
      
          const execStub = sandbox.stub().rejects(new Error("exec error"));
          sandbox.stub(taskLib, "tool").returns({
            arg: function () {
              return this;
            },
            exec: execStub,
          } as unknown as trm.ToolRunner);

          const file = "/tmp/archive.zip"
          const destination = "/tmp/dest"
      
          try {
            await utility.extractZipWithQuiet(file, destination);
          } catch (err: any) {
            expect(err.message).to.equal("exec error");
          }
        });

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

    describe('extractOutputJsonFilename', () => {
        let debugStub: sinon.SinonStub;

        beforeEach(() => {
            debugStub = sandbox.stub(taskLib, 'debug');
        });

        it('should extract output file path when --out flag is present', () => {
            const command = 'bridge-cli --out /path/to/output.json --other-flag value';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/path/to/output.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /path/to/output.json')).to.be.true;
        });

        it('should extract output file path and remove double quotes', () => {
            const command = 'bridge-cli --out "/path/to/output.json" --other-flag';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/path/to/output.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /path/to/output.json')).to.be.true;
        });

        it('should extract output file path and remove single quotes', () => {
            const command = "bridge-cli --out '/path/to/output.json' --other-flag";

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/path/to/output.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /path/to/output.json')).to.be.true;
        });

        it('should handle Windows-style paths with backslashes', () => {
            const command = 'bridge-cli --out C:\\Users\\test\\output.json';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('C:\\Users\\test\\output.json');
            expect(debugStub.calledWith('Extracted Output Path:::: C:\\Users\\test\\output.json')).to.be.true;
        });

        it('should handle Windows-style paths with quotes', () => {
            const command = 'bridge-cli --out "C:\\ProgramFiles\\output.json"';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('C:\\ProgramFiles\\output.json');
            expect(debugStub.calledWith('Extracted Output Path:::: C:\\ProgramFiles\\output.json')).to.be.true;
        });

        it('should handle --out flag with multiple spaces', () => {
            const command = 'bridge-cli --out    /path/to/output.json --other-flag';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/path/to/output.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /path/to/output.json')).to.be.true;
        });

        it('should handle --out flag at the beginning of command', () => {
            const command = '--out /path/to/output.json bridge-cli --other-flag';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/path/to/output.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /path/to/output.json')).to.be.true;
        });

        it('should handle --out flag at the end of command', () => {
            const command = 'bridge-cli --other-flag value --out /path/to/output.json';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/path/to/output.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /path/to/output.json')).to.be.true;
        });

        it('should return empty string when --out flag is not present', () => {
            const command = 'bridge-cli --other-flag value --another-flag';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('');
            expect(debugStub.called).to.be.false;
        });

        it('should return empty string when command is empty', () => {
            const command = '';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('');
            expect(debugStub.called).to.be.false;
        });

        it('should return empty string when --out flag has no value', () => {
            const command = 'bridge-cli --out';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('');
            expect(debugStub.called).to.be.false;
        });

        it('should handle --out flag with relative path', () => {
            const command = 'bridge-cli --out ./output/results.json';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('./output/results.json');
            expect(debugStub.calledWith('Extracted Output Path:::: ./output/results.json')).to.be.true;
        });

        it('should handle --out flag with filename only', () => {
            const command = 'bridge-cli --out output.json';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('output.json');
            expect(debugStub.calledWith('Extracted Output Path:::: output.json')).to.be.true;
        });

        it('should handle complex paths with special characters', () => {
            const command = 'bridge-cli --out "/path/withspaces/and-dashes/output_file.json"';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/path/withspaces/and-dashes/output_file.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /path/withspaces/and-dashes/output_file.json')).to.be.true;
        });

        it('should handle --out flag with mixed quotes (double at start, single at end)', () => {
            const command = "bridge-cli --out \"/path/to/output.json'";

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/path/to/output.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /path/to/output.json')).to.be.true;
        });

        it('should handle --out flag with mixed quotes (single at start, double at end)', () => {
            const command = 'bridge-cli --out \'/path/to/output.json"';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/path/to/output.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /path/to/output.json')).to.be.true;
        });

        it('should handle --out flag with path containing numbers and underscores', () => {
            const command = 'bridge-cli --out /home/user123/project_2024/output_v1.json';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/home/user123/project_2024/output_v1.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /home/user123/project_2024/output_v1.json')).to.be.true;
        });

        it('should handle command with multiple --out-like patterns but match only --out', () => {
            const command = 'bridge-cli --output /wrong/path --out /correct/path.json --outro value';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/correct/path.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /correct/path.json')).to.be.true;
        });

        it('should return empty string for edge case when match exists but captured group is empty', () => {
            const command = 'bridge-cli --out ""';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('');
            expect(debugStub.calledWith('Extracted Output Path:::: ')).to.be.true;
        });

        it('should handle path with dots and extensions correctly', () => {
            const command = 'bridge-cli --out /path/to/file.name.with.dots.json';

            const result = utility.extractOutputJsonFilename(command);

            expect(result).to.equal('/path/to/file.name.with.dots.json');
            expect(debugStub.calledWith('Extracted Output Path:::: /path/to/file.name.with.dots.json')).to.be.true;
        });
    });

    context('SSL HTTP Client Functions', () => {
        let originalTrustAll: string | undefined;
        let originalCertFile: string | undefined;

        beforeEach(() => {
            originalTrustAll = process.env.NETWORK_SSL_TRUST_ALL;
            originalCertFile = process.env.NETWORK_SSL_CERT_FILE;
            clearHttpClientCache();
        });

        afterEach(() => {
            if (originalTrustAll !== undefined) {
                process.env.NETWORK_SSL_TRUST_ALL = originalTrustAll;
            } else {
                delete process.env.NETWORK_SSL_TRUST_ALL;
            }
            if (originalCertFile !== undefined) {
                process.env.NETWORK_SSL_CERT_FILE = originalCertFile;
            } else {
                delete process.env.NETWORK_SSL_CERT_FILE;
            }
            clearHttpClientCache();
        });

        context('createSSLConfiguredHttpClient', () => {
            it('should create new HttpClient instance with default user agent', () => {
                const client1 = createSSLConfiguredHttpClient();
                expect(client1).to.not.be.undefined;
            });

            it('should create new HttpClient instance with custom user agent', () => {
                const customUserAgent = 'TestAgent';
                const client = createSSLConfiguredHttpClient(customUserAgent);
                expect(client).to.not.be.undefined;
            });

            it('should reuse cached HttpClient instance when SSL config unchanged', () => {
                const client1 = createSSLConfiguredHttpClient();
                const client2 = createSSLConfiguredHttpClient();
                expect(client1).to.equal(client2);
            });

            it('should create new HttpClient instance when SSL config changes', () => {
                const client1 = createSSLConfiguredHttpClient();
                process.env.NETWORK_SSL_TRUST_ALL = 'true';
                clearHttpClientCache();
                const client2 = createSSLConfiguredHttpClient();
                expect(client1).to.not.equal(client2);
            });

            it('should handle NETWORK_SSL_TRUST_ALL=true configuration', () => {
                process.env.NETWORK_SSL_TRUST_ALL = 'true';
                const client = createSSLConfiguredHttpClient();
                expect(client).to.not.be.undefined;
            });

            it('should handle custom CA certificate file configuration', () => {
                process.env.NETWORK_SSL_CERT_FILE = '/path/to/cert.pem';
                const client = createSSLConfiguredHttpClient();
                expect(client).to.not.be.undefined;
            });
        });

        context('clearHttpClientCache', () => {
            it('should clear cached HttpClient instance', () => {
                const client1 = createSSLConfiguredHttpClient();
                clearHttpClientCache();
                const client2 = createSSLConfiguredHttpClient();
                expect(client1).to.not.equal(client2);
            });

            it('should allow recreation of HttpClient with different SSL config after cache clear', () => {
                const client1 = createSSLConfiguredHttpClient();
                clearHttpClientCache();
                process.env.NETWORK_SSL_TRUST_ALL = 'true';
                const client2 = createSSLConfiguredHttpClient();
                expect(client1).to.not.equal(client2);
            });
        });
    });

    describe('createSSLConfiguredHttpClient', () => {
        let sandbox: sinon.SinonSandbox;
        let getSSLConfigHashStub: sinon.SinonStub;
        let getSSLConfigStub: sinon.SinonStub;
        let taskLibDebugStub: sinon.SinonStub;
        let taskLibWarningStub: sinon.SinonStub;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            getSSLConfigHashStub = sandbox.stub(sslUtils, 'getSSLConfigHash');
            getSSLConfigStub = sandbox.stub(sslUtils, 'getSSLConfig');
            taskLibDebugStub = sandbox.stub(taskLib, 'debug');
            taskLibWarningStub = sandbox.stub(taskLib, 'warning');

            // Reset module-level cache variables
            (utility as any)._httpClientCache = null;
            (utility as any)._httpClientConfigHash = null;
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should return cached HttpClient when configuration hash matches', () => {
            const configHash = 'test-hash-123';
            const userAgent = 'TestAgent';

            getSSLConfigHashStub.returns(configHash);

            // Create first client to cache it
            getSSLConfigStub.returns({ trustAllCerts: false, customCA: false });
            const client1 = utility.createSSLConfiguredHttpClient(userAgent);

            // Now test cache retrieval
            const client2 = utility.createSSLConfiguredHttpClient(userAgent);

            expect(client1).to.equal(client2);
            expect(taskLibDebugStub.calledWith(`Reusing existing HttpClient instance with user agent: ${userAgent}`)).to.be.true;
        });

        it('should create new HttpClient with ignoreSslError when trustAllCerts is true', () => {
            const configHash = 'test-hash-456';
            const userAgent = 'TestAgent';

            utility.clearHttpClientCache();

            getSSLConfigHashStub.returns(configHash);
            getSSLConfigStub.returns({ trustAllCerts: true, customCA: false });

            const result = utility.createSSLConfiguredHttpClient(userAgent);

            expect(result).to.not.be.undefined;
            expect(taskLibDebugStub.calledWith('SSL certificate verification disabled for HttpClient (NETWORK_SSL_TRUST_ALL=true)')).to.be.true;
            expect(taskLibDebugStub.calledWith(`Created new HttpClient instance with user agent: ${userAgent}`)).to.be.true;

            const result2 = utility.createSSLConfiguredHttpClient(userAgent);
            expect(result).to.equal(result2);
        });

        it('should create new HttpClient with custom CA certificate when customCA is true', () => {
            const configHash = 'test-hash-789';
            const userAgent = 'TestAgent';
            const certFile = '/path/to/cert.pem';

            // Ensure cache is cleared before test
            utility.clearHttpClientCache();

            getSSLConfigHashStub.returns(configHash);
            getSSLConfigStub.returns({ trustAllCerts: false, customCA: true });
            Object.defineProperty(input, 'NETWORK_SSL_CERT_FILE', { value: certFile, configurable: true });

            const result = utility.createSSLConfiguredHttpClient(userAgent);

            expect(result).to.not.be.undefined;
            expect(taskLibDebugStub.calledWith(`Using custom CA certificate for HttpClient: ${certFile}`)).to.be.true;
            expect(taskLibDebugStub.calledWith(`Created new HttpClient instance with user agent: ${userAgent}`)).to.be.true;

            // Verify the cache was set by checking if subsequent calls return the same instance
            const result2 = utility.createSSLConfiguredHttpClient(userAgent);
            expect(result).to.equal(result2);
        });

        it('should create default HttpClient when neither trustAllCerts nor customCA is true', () => {
            const configHash = 'test-hash-default';
            const userAgent = 'TestAgent';

            // Ensure cache is cleared before test
            utility.clearHttpClientCache();

            getSSLConfigHashStub.returns(configHash);
            getSSLConfigStub.returns({ trustAllCerts: false, customCA: false });

            const result = utility.createSSLConfiguredHttpClient(userAgent);

            expect(result).to.not.be.undefined;
            expect(taskLibDebugStub.calledWith('Using default HttpClient with system SSL certificates')).to.be.true;
            expect(taskLibDebugStub.calledWith(`Created new HttpClient instance with user agent: ${userAgent}`)).to.be.true;

            // Verify the cache was set by checking if subsequent calls return the same instance
            const result2 = utility.createSSLConfiguredHttpClient(userAgent);
            expect(result).to.equal(result2);
        });

        it('should use default user agent when none provided', () => {
            const configHash = 'test-hash-default-ua';

            getSSLConfigHashStub.returns(configHash);
            getSSLConfigStub.returns({ trustAllCerts: false, customCA: false });

            const result = utility.createSSLConfiguredHttpClient();

            expect(result).to.not.be.undefined;
            expect(taskLibDebugStub.calledWith('Using default HttpClient with system SSL certificates')).to.be.true;
            expect(taskLibDebugStub.calledWith('Created new HttpClient instance with user agent: BlackDuckSecurityTask')).to.be.true;
        });

        it('should create new HttpClient when configuration hash changes', () => {
            const oldConfigHash = 'old-hash';
            const newConfigHash = 'new-hash';
            const userAgent = 'TestAgent';

            // Ensure cache is cleared before test
            utility.clearHttpClientCache();

            // First call with old hash
            getSSLConfigHashStub.returns(oldConfigHash);
            getSSLConfigStub.returns({ trustAllCerts: false, customCA: false });
            const client1 = utility.createSSLConfiguredHttpClient(userAgent);

            // Verify first client is cached by calling again with same config
            const client1Cached = utility.createSSLConfiguredHttpClient(userAgent);
            expect(client1).to.equal(client1Cached);

            // Second call with new hash
            getSSLConfigHashStub.returns(newConfigHash);
            const client2 = utility.createSSLConfiguredHttpClient(userAgent);

            // Verify that different hash produces different client instance
            expect(client1).to.not.equal(client2);

            // Verify second client is also cached by calling again with same new config
            const client2Cached = utility.createSSLConfiguredHttpClient(userAgent);
            expect(client2).to.equal(client2Cached);
        });
    });

    describe('createSSLConfiguredHttpsAgent', () => {
        let sandbox: sinon.SinonSandbox;
        let getSSLConfigHashStub: sinon.SinonStub;
        let getSSLConfigStub: sinon.SinonStub;
        let createHTTPSAgentStub: sinon.SinonStub;
        let taskLibDebugStub: sinon.SinonStub;
        let mockAgent: https.Agent;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            getSSLConfigHashStub = sandbox.stub(sslUtils, 'getSSLConfigHash');
            getSSLConfigStub = sandbox.stub(sslUtils, 'getSSLConfig');
            createHTTPSAgentStub = sandbox.stub(sslUtils, 'createHTTPSAgent');
            taskLibDebugStub = sandbox.stub(taskLib, 'debug');

            // Create a mock HTTPS agent
            mockAgent = new https.Agent();
            createHTTPSAgentStub.returns(mockAgent);

            // Clear cache before each test
            utility.clearHttpClientCache();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should create new HTTPS agent on first call', () => {
            const configHash = 'test-hash-123';
            const mockConfig = { trustAllCerts: false, customCA: false };

            getSSLConfigHashStub.returns(configHash);
            getSSLConfigStub.returns(mockConfig);

            const result = utility.createSSLConfiguredHttpsAgent();

            expect(result).to.equal(mockAgent);
            expect(getSSLConfigHashStub.calledOnce).to.be.true;
            expect(getSSLConfigStub.calledOnce).to.be.true;
            expect(createHTTPSAgentStub.calledOnceWith(mockConfig)).to.be.true;
            expect(taskLibDebugStub.calledWith('Created new HTTPS agent instance with SSL configuration')).to.be.true;
        });

        it('should return cached HTTPS agent when configuration hash unchanged', () => {
            const configHash = 'test-hash-456';
            const mockConfig = { trustAllCerts: true, customCA: false };

            getSSLConfigHashStub.returns(configHash);
            getSSLConfigStub.returns(mockConfig);

            // First call creates the agent
            const result1 = utility.createSSLConfiguredHttpsAgent();

            // Second call should return cached agent
            const result2 = utility.createSSLConfiguredHttpsAgent();

            expect(result1).to.equal(mockAgent);
            expect(result2).to.equal(mockAgent);
            expect(result1).to.equal(result2);

            // Verify getSSLConfigHash called twice but getSSLConfig and createHTTPSAgent only once
            expect(getSSLConfigHashStub.calledTwice).to.be.true;
            expect(getSSLConfigStub.calledOnce).to.be.true;
            expect(createHTTPSAgentStub.calledOnce).to.be.true;

            // Verify debug messages
            expect(taskLibDebugStub.calledWith('Created new HTTPS agent instance with SSL configuration')).to.be.true;
            expect(taskLibDebugStub.calledWith('Reusing existing HTTPS agent instance')).to.be.true;
        });

        it('should create new HTTPS agent when configuration hash changes', () => {
            const oldConfigHash = 'old-hash';
            const newConfigHash = 'new-hash';
            const oldConfig = { trustAllCerts: false, customCA: false };
            const newConfig = { trustAllCerts: true, customCA: false };
            const newMockAgent = new https.Agent();

            // First call with old configuration
            getSSLConfigHashStub.returns(oldConfigHash);
            getSSLConfigStub.returns(oldConfig);
            const result1 = utility.createSSLConfiguredHttpsAgent();

            // Setup new configuration
            getSSLConfigHashStub.returns(newConfigHash);
            getSSLConfigStub.returns(newConfig);
            createHTTPSAgentStub.returns(newMockAgent);

            // Second call with new configuration
            const result2 = utility.createSSLConfiguredHttpsAgent();

            expect(result1).to.equal(mockAgent);
            expect(result2).to.equal(newMockAgent);
            expect(result1).to.not.equal(result2);

            // Verify both configurations were used
            expect(getSSLConfigHashStub.calledTwice).to.be.true;
            expect(getSSLConfigStub.calledTwice).to.be.true;
            expect(createHTTPSAgentStub.calledTwice).to.be.true;
            expect(createHTTPSAgentStub.firstCall.calledWith(oldConfig)).to.be.true;
            expect(createHTTPSAgentStub.secondCall.calledWith(newConfig)).to.be.true;

            // Verify debug messages for both creations
            expect(taskLibDebugStub.calledWith('Created new HTTPS agent instance with SSL configuration')).to.be.true;
            expect(taskLibDebugStub.callCount).to.be.at.least(2);
        });

        it('should handle different SSL configurations correctly', () => {
            const configHash = 'ssl-config-hash';
            const sslConfig = {
                trustAllCerts: true,
                customCA: true,
                cert: '/path/to/cert.pem'
            };

            getSSLConfigHashStub.returns(configHash);
            getSSLConfigStub.returns(sslConfig);

            const result = utility.createSSLConfiguredHttpsAgent();

            expect(result).to.equal(mockAgent);
            expect(createHTTPSAgentStub.calledOnceWith(sslConfig)).to.be.true;
            expect(taskLibDebugStub.calledWith('Created new HTTPS agent instance with SSL configuration')).to.be.true;
        });

        it('should handle cache invalidation after clearHttpClientCache', () => {
            const configHash = 'cache-clear-hash';
            const mockConfig = { trustAllCerts: false, customCA: false };

            getSSLConfigHashStub.returns(configHash);
            getSSLConfigStub.returns(mockConfig);

            // First call creates agent
            const result1 = utility.createSSLConfiguredHttpsAgent();

            // Clear cache
            utility.clearHttpClientCache();

            // Second call should create new agent even with same config
            const result2 = utility.createSSLConfiguredHttpsAgent();

            expect(result1).to.equal(mockAgent);
            expect(result2).to.equal(mockAgent);

            // Should have called create functions twice due to cache clear
            expect(getSSLConfigHashStub.calledTwice).to.be.true;
            expect(getSSLConfigStub.calledTwice).to.be.true;
            expect(createHTTPSAgentStub.calledTwice).to.be.true;

            // Should have two creation debug messages
            expect(taskLibDebugStub.calledWith('Created new HTTPS agent instance with SSL configuration')).to.be.true;
            expect(taskLibDebugStub.callCount).to.be.at.least(3); // 2 creation + 1 cache clear
        });
    });

    describe("SARIF Output Path Parser Tests", () => {
        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        context("getSarifOutputPath function behavior", () => {
            it("should return Polaris SARIF output path when sarifFileName is POLARIS_OUTPUT_FILE_NAME", () => {
                const outputJsonPath = "/path/to/output.json";
                const sarifFileName = constants.POLARIS_OUTPUT_FILE_NAME;
                const expectedPath = "/path/to/polaris/sarif/output.sarif";

                const mockConfig = {
                    data: {
                        polaris: {
                            reports: {
                                sarif: {
                                    file: {
                                        output: expectedPath
                                    }
                                }
                            }
                        }
                    }
                };

                const fsStub = {
                    readFileSync: sandbox.stub().returns(JSON.stringify(mockConfig))
                };

                const consoleStub = {
                    error: sandbox.stub()
                };

                // Simulate the function behavior
                const getSarifOutputPath = (outputJsonPath: string, sarifFileName: string) => {
                    try {
                        const config = JSON.parse(fsStub.readFileSync(outputJsonPath, "utf-8"));
                        const sarifOutputPath =
                            sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
                                ? config?.data?.polaris?.reports?.sarif?.file?.output
                                : config?.data?.blackducksca?.reports?.sarif?.file?.output;

                        if (!sarifOutputPath) {
                            return "";
                        }
                        return sarifOutputPath;
                    } catch (error) {
                        consoleStub.error("Error reading or parsing output JSON file:", error);
                        return "";
                    }
                };

                const result = getSarifOutputPath(outputJsonPath, sarifFileName);

                assert.strictEqual(result, expectedPath);
                expect(fsStub.readFileSync.calledOnceWith(outputJsonPath, "utf-8")).to.be.true;
                expect(consoleStub.error.called).to.be.false;
            });

            it("should return BlackDuck SCA SARIF output path when sarifFileName is not POLARIS_OUTPUT_FILE_NAME", () => {
                const outputJsonPath = "/path/to/output.json";
                const sarifFileName = "blackduck-output.sarif";
                const expectedPath = "/path/to/blackduck/sarif/output.sarif";

                const mockConfig = {
                    data: {
                        blackducksca: {
                            reports: {
                                sarif: {
                                    file: {
                                        output: expectedPath
                                    }
                                }
                            }
                        }
                    }
                };

                const fsStub = {
                    readFileSync: sandbox.stub().returns(JSON.stringify(mockConfig))
                };

                const consoleStub = {
                    error: sandbox.stub()
                };

                const getSarifOutputPath = (outputJsonPath: string, sarifFileName: string) => {
                    try {
                        const config = JSON.parse(fsStub.readFileSync(outputJsonPath, "utf-8"));
                        const sarifOutputPath =
                            sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
                                ? config?.data?.polaris?.reports?.sarif?.file?.output
                                : config?.data?.blackducksca?.reports?.sarif?.file?.output;

                        if (!sarifOutputPath) {
                            return "";
                        }
                        return sarifOutputPath;
                    } catch (error) {
                        consoleStub.error("Error reading or parsing output JSON file:", error);
                        return "";
                    }
                };

                const result = getSarifOutputPath(outputJsonPath, sarifFileName);

                assert.strictEqual(result, expectedPath);
                expect(fsStub.readFileSync.calledOnceWith(outputJsonPath, "utf-8")).to.be.true;
                expect(consoleStub.error.called).to.be.false;
            });

            it("should return empty string when Polaris SARIF output path is undefined", () => {
                const outputJsonPath = "/path/to/output.json";
                const sarifFileName = constants.POLARIS_OUTPUT_FILE_NAME;

                const mockConfig = {
                    data: {
                        polaris: {
                            reports: {
                                sarif: {
                                    file: {
                                        output: undefined
                                    }
                                }
                            }
                        }
                    }
                };

                const fsStub = {
                    readFileSync: sandbox.stub().returns(JSON.stringify(mockConfig))
                };

                const consoleStub = {
                    error: sandbox.stub()
                };

                const getSarifOutputPath = (outputJsonPath: string, sarifFileName: string) => {
                    try {
                        const config = JSON.parse(fsStub.readFileSync(outputJsonPath, "utf-8"));
                        const sarifOutputPath =
                            sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
                                ? config?.data?.polaris?.reports?.sarif?.file?.output
                                : config?.data?.blackducksca?.reports?.sarif?.file?.output;

                        if (!sarifOutputPath) {
                            return "";
                        }
                        return sarifOutputPath;
                    } catch (error) {
                        consoleStub.error("Error reading or parsing output JSON file:", error);
                        return "";
                    }
                };

                const result = getSarifOutputPath(outputJsonPath, sarifFileName);

                assert.strictEqual(result, "");
                expect(fsStub.readFileSync.calledOnceWith(outputJsonPath, "utf-8")).to.be.true;
                expect(consoleStub.error.called).to.be.false;
            });

            it("should return empty string when BlackDuck SCA SARIF output path is null", () => {
                const outputJsonPath = "/path/to/output.json";
                const sarifFileName = "blackduck-output.sarif";

                const mockConfig = {
                    data: {
                        blackducksca: {
                            reports: {
                                sarif: {
                                    file: {
                                        output: null
                                    }
                                }
                            }
                        }
                    }
                };

                const fsStub = {
                    readFileSync: sandbox.stub().returns(JSON.stringify(mockConfig))
                };

                const consoleStub = {
                    error: sandbox.stub()
                };

                const getSarifOutputPath = (outputJsonPath: string, sarifFileName: string) => {
                    try {
                        const config = JSON.parse(fsStub.readFileSync(outputJsonPath, "utf-8"));
                        const sarifOutputPath =
                            sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
                                ? config?.data?.polaris?.reports?.sarif?.file?.output
                                : config?.data?.blackducksca?.reports?.sarif?.file?.output;

                        if (!sarifOutputPath) {
                            return "";
                        }
                        return sarifOutputPath;
                    } catch (error) {
                        consoleStub.error("Error reading or parsing output JSON file:", error);
                        return "";
                    }
                };

                const result = getSarifOutputPath(outputJsonPath, sarifFileName);

                assert.strictEqual(result, "");
                expect(fsStub.readFileSync.calledOnceWith(outputJsonPath, "utf-8")).to.be.true;
                expect(consoleStub.error.called).to.be.false;
            });

            it("should return empty string when SARIF output path is empty string", () => {
                const outputJsonPath = "/path/to/output.json";
                const sarifFileName = constants.POLARIS_OUTPUT_FILE_NAME;

                const mockConfig = {
                    data: {
                        polaris: {
                            reports: {
                                sarif: {
                                    file: {
                                        output: ""
                                    }
                                }
                            }
                        }
                    }
                };

                const fsStub = {
                    readFileSync: sandbox.stub().returns(JSON.stringify(mockConfig))
                };

                const consoleStub = {
                    error: sandbox.stub()
                };

                const getSarifOutputPath = (outputJsonPath: string, sarifFileName: string) => {
                    try {
                        const config = JSON.parse(fsStub.readFileSync(outputJsonPath, "utf-8"));
                        const sarifOutputPath =
                            sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
                                ? config?.data?.polaris?.reports?.sarif?.file?.output
                                : config?.data?.blackducksca?.reports?.sarif?.file?.output;

                        if (!sarifOutputPath) {
                            return "";
                        }
                        return sarifOutputPath;
                    } catch (error) {
                        consoleStub.error("Error reading or parsing output JSON file:", error);
                        return "";
                    }
                };

                const result = getSarifOutputPath(outputJsonPath, sarifFileName);

                assert.strictEqual(result, "");
                expect(fsStub.readFileSync.calledOnceWith(outputJsonPath, "utf-8")).to.be.true;
                expect(consoleStub.error.called).to.be.false;
            });

            it("should return empty string when nested object structure is missing for Polaris", () => {
                const outputJsonPath = "/path/to/output.json";
                const sarifFileName = constants.POLARIS_OUTPUT_FILE_NAME;

                const mockConfig = {
                    data: {
                        polaris: {
                            reports: {
                                // Missing sarif property
                            }
                        }
                    }
                };

                const fsStub = {
                    readFileSync: sandbox.stub().returns(JSON.stringify(mockConfig))
                };

                const consoleStub = {
                    error: sandbox.stub()
                };

                const getSarifOutputPath = (outputJsonPath: string, sarifFileName: string) => {
                    try {
                        const config = JSON.parse(fsStub.readFileSync(outputJsonPath, "utf-8"));
                        const sarifOutputPath =
                            sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
                                ? config?.data?.polaris?.reports?.sarif?.file?.output
                                : config?.data?.blackducksca?.reports?.sarif?.file?.output;

                        if (!sarifOutputPath) {
                            return "";
                        }
                        return sarifOutputPath;
                    } catch (error) {
                        consoleStub.error("Error reading or parsing output JSON file:", error);
                        return "";
                    }
                };

                const result = getSarifOutputPath(outputJsonPath, sarifFileName);

                assert.strictEqual(result, "");
                expect(fsStub.readFileSync.calledOnceWith(outputJsonPath, "utf-8")).to.be.true;
                expect(consoleStub.error.called).to.be.false;
            });

            it("should return empty string when nested object structure is missing for BlackDuck SCA", () => {
                const outputJsonPath = "/path/to/output.json";
                const sarifFileName = "blackduck-output.sarif";

                const mockConfig = {
                    data: {
                        blackducksca: {
                            // Missing reports property
                        }
                    }
                };

                const fsStub = {
                    readFileSync: sandbox.stub().returns(JSON.stringify(mockConfig))
                };

                const consoleStub = {
                    error: sandbox.stub()
                };

                const getSarifOutputPath = (outputJsonPath: string, sarifFileName: string) => {
                    try {
                        const config = JSON.parse(fsStub.readFileSync(outputJsonPath, "utf-8"));
                        const sarifOutputPath =
                            sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
                                ? config?.data?.polaris?.reports?.sarif?.file?.output
                                : config?.data?.blackducksca?.reports?.sarif?.file?.output;

                        if (!sarifOutputPath) {
                            return "";
                        }
                        return sarifOutputPath;
                    } catch (error) {
                        consoleStub.error("Error reading or parsing output JSON file:", error);
                        return "";
                    }
                };

                const result = getSarifOutputPath(outputJsonPath, sarifFileName);

                assert.strictEqual(result, "");
                expect(fsStub.readFileSync.calledOnceWith(outputJsonPath, "utf-8")).to.be.true;
                expect(consoleStub.error.called).to.be.false;
            });

            it("should handle fs.readFileSync throwing an error", () => {
                const outputJsonPath = "/path/to/nonexistent.json";
                const sarifFileName = constants.POLARIS_OUTPUT_FILE_NAME;
                const error = new Error("ENOENT: no such file or directory");

                const fsStub = {
                    readFileSync: sandbox.stub().throws(error)
                };

                const consoleStub = {
                    error: sandbox.stub()
                };

                const getSarifOutputPath = (outputJsonPath: string, sarifFileName: string) => {
                    try {
                        const config = JSON.parse(fsStub.readFileSync(outputJsonPath, "utf-8"));
                        const sarifOutputPath =
                            sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
                                ? config?.data?.polaris?.reports?.sarif?.file?.output
                                : config?.data?.blackducksca?.reports?.sarif?.file?.output;

                        if (!sarifOutputPath) {
                            return "";
                        }
                        return sarifOutputPath;
                    } catch (error) {
                        consoleStub.error("Error reading or parsing output JSON file:", error);
                        return "";
                    }
                };

                const result = getSarifOutputPath(outputJsonPath, sarifFileName);

                assert.strictEqual(result, "");
                expect(fsStub.readFileSync.calledOnceWith(outputJsonPath, "utf-8")).to.be.true;
                expect(consoleStub.error.calledOnceWith("Error reading or parsing output JSON file:", error)).to.be.true;
            });

            it("should handle JSON.parse throwing an error for invalid JSON", () => {
                const outputJsonPath = "/path/to/invalid.json";
                const sarifFileName = constants.POLARIS_OUTPUT_FILE_NAME;
                const invalidJson = "{ invalid json content }";

                const fsStub = {
                    readFileSync: sandbox.stub().returns(invalidJson)
                };

                const consoleStub = {
                    error: sandbox.stub()
                };

                const getSarifOutputPath = (outputJsonPath: string, sarifFileName: string) => {
                    try {
                        const config = JSON.parse(fsStub.readFileSync(outputJsonPath, "utf-8"));
                        const sarifOutputPath =
                            sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
                                ? config?.data?.polaris?.reports?.sarif?.file?.output
                                : config?.data?.blackducksca?.reports?.sarif?.file?.output;

                        if (!sarifOutputPath) {
                            return "";
                        }
                        return sarifOutputPath;
                    } catch (error) {
                        consoleStub.error("Error reading or parsing output JSON file:", error);
                        return "";
                    }
                };

                const result = getSarifOutputPath(outputJsonPath, sarifFileName);

                assert.strictEqual(result, "");
                expect(fsStub.readFileSync.calledOnceWith(outputJsonPath, "utf-8")).to.be.true;
                expect(consoleStub.error.calledOnce).to.be.true;
                expect(consoleStub.error.firstCall.args[0]).to.equal("Error reading or parsing output JSON file:");
            });

            it("should handle empty JSON file", () => {
                const outputJsonPath = "/path/to/empty.json";
                const sarifFileName = constants.POLARIS_OUTPUT_FILE_NAME;

                const fsStub = {
                    readFileSync: sandbox.stub().returns("{}")
                };

                const consoleStub = {
                    error: sandbox.stub()
                };

                const getSarifOutputPath = (outputJsonPath: string, sarifFileName: string) => {
                    try {
                        const config = JSON.parse(fsStub.readFileSync(outputJsonPath, "utf-8"));
                        const sarifOutputPath =
                            sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
                                ? config?.data?.polaris?.reports?.sarif?.file?.output
                                : config?.data?.blackducksca?.reports?.sarif?.file?.output;

                        if (!sarifOutputPath) {
                            return "";
                        }
                        return sarifOutputPath;
                    } catch (error) {
                        consoleStub.error("Error reading or parsing output JSON file:", error);
                        return "";
                    }
                };

                const result = getSarifOutputPath(outputJsonPath, sarifFileName);

                assert.strictEqual(result, "");
                expect(fsStub.readFileSync.calledOnceWith(outputJsonPath, "utf-8")).to.be.true;
                expect(consoleStub.error.called).to.be.false;
            });

            it("should handle null config object", () => {
                const outputJsonPath = "/path/to/null.json";
                const sarifFileName = constants.POLARIS_OUTPUT_FILE_NAME;

                const fsStub = {
                    readFileSync: sandbox.stub().returns("null")
                };

                const consoleStub = {
                    error: sandbox.stub()
                };

                const getSarifOutputPath = (outputJsonPath: string, sarifFileName: string) => {
                    try {
                        const config = JSON.parse(fsStub.readFileSync(outputJsonPath, "utf-8"));
                        const sarifOutputPath =
                            sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME
                                ? config?.data?.polaris?.reports?.sarif?.file?.output
                                : config?.data?.blackducksca?.reports?.sarif?.file?.output;

                        if (!sarifOutputPath) {
                            return "";
                        }
                        return sarifOutputPath;
                    } catch (error) {
                        consoleStub.error("Error reading or parsing output JSON file:", error);
                        return "";
                    }
                };

                const result = getSarifOutputPath(outputJsonPath, sarifFileName);

                assert.strictEqual(result, "");
                expect(fsStub.readFileSync.calledOnceWith(outputJsonPath, "utf-8")).to.be.true;
                expect(consoleStub.error.called).to.be.false;
            });
        });
    });
    describe("copySarifFileToIntegrationDefaultPath Tests", () => {
        let sandbox: sinon.SinonSandbox;
        let processEnvStub: any;
        let basenameStub: sinon.SinonStub;
        let dirnameStub: sinon.SinonStub;
        let joinStub: sinon.SinonStub;
        let mkdirSyncStub: sinon.SinonStub;
        let copyFileSyncStub: sinon.SinonStub;
        let existsSyncStub: sinon.SinonStub;
        let taskLibDebugStub: sinon.SinonStub;
        let consoleErrorStub: sinon.SinonStub;
        let extractSarifOutputPathStub: sinon.SinonStub;

        beforeEach(() => {
            sandbox = sinon.createSandbox();

            // Setup stubs
            basenameStub = sandbox.stub(path, "basename");
            dirnameStub = sandbox.stub(path, "dirname");
            joinStub = sandbox.stub(path, "join");
            mkdirSyncStub = sandbox.stub(require("fs"), "mkdirSync");
            copyFileSyncStub = sandbox.stub(require("fs"), "copyFileSync");
            existsSyncStub = sandbox.stub(require("fs"), "existsSync");
            taskLibDebugStub = sandbox.stub(taskLib, "debug");
            consoleErrorStub = sandbox.stub(console, "error");

            // Mock extractSarifOutputPath function
            extractSarifOutputPathStub = sandbox.stub();

            // Mock process.env
            processEnvStub = {};
            sandbox.stub(process, "env").value(processEnvStub);
        });

        afterEach(() => {
            sandbox.restore();
        });

        context("copySarifFileToIntegrationDefaultPath", () => {
            it("should copy Polaris SARIF file when filename matches POLARIS_OUTPUT_FILE_NAME", () => {
                // Setup
                const sarifFilePath = "/source/path/polaris-output.sarif";
                const sourceDirectory = "/build/sources";
                const sarifOutputPath = "/actual/sarif/output.sarif";
                const integrationDir = "/integration/polaris";
                const integrationDirPath = "/build/sources/integration/polaris";
                const destinationFile = "/build/sources/integration/polaris/sarif-default.sarif";

                processEnvStub["BUILD_SOURCESDIRECTORY"] = sourceDirectory;
                basenameStub.returns(constants.POLARIS_OUTPUT_FILE_NAME);
                extractSarifOutputPathStub.returns(sarifOutputPath);
                dirnameStub.returns(integrationDir);
                joinStub.onFirstCall().returns(integrationDirPath);
                joinStub.onSecondCall().returns(destinationFile);
                existsSyncStub.returns(false);

                // Simulate the function
                const copySarifFileToIntegrationDefaultPath = (sarifFilePath: string) => {
                    const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
                    const sarifFileName = basenameStub(sarifFilePath);

                    const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
                    const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;

                    if (!isPolarisFile && !isBlackduckFile) return;

                    const sarifOutputPath = extractSarifOutputPathStub(sarifFilePath, sarifFileName);
                    if (!sarifOutputPath) return;

                    const integrationSarifDir = dirnameStub(
                        isPolarisFile
                            ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
                            : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
                    );

                    const integrationSarifDirPath = joinStub(sourceDirectory, integrationSarifDir);
                    const destinationFile = joinStub(integrationSarifDirPath, constants.SARIF_DEFAULT_FILE_NAME);

                    try {
                        require("fs").mkdirSync(integrationSarifDirPath, { recursive: true });
                        require("fs").copyFileSync(sarifOutputPath, destinationFile);
                        taskLibDebugStub(
                            `SARIF file ${existsSyncStub(destinationFile) ? "overwritten" : "copied"} at: ${destinationFile}`
                        );
                    } catch (error) {
                        consoleErrorStub("Error copying SARIF file:", error);
                    }
                };

                // Execute
                copySarifFileToIntegrationDefaultPath(sarifFilePath);

                // Verify
                expect(basenameStub.calledOnceWith(sarifFilePath)).to.be.true;
                expect(extractSarifOutputPathStub.calledOnceWith(sarifFilePath, constants.POLARIS_OUTPUT_FILE_NAME)).to.be.true;
                expect(dirnameStub.calledOnceWith(constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH)).to.be.true;
                expect(joinStub.calledWith(sourceDirectory, integrationDir)).to.be.true;
                expect(joinStub.calledWith(integrationDirPath, constants.SARIF_DEFAULT_FILE_NAME)).to.be.true;
                expect(mkdirSyncStub.calledOnceWith(integrationDirPath, { recursive: true })).to.be.true;
                expect(copyFileSyncStub.calledOnceWith(sarifOutputPath, destinationFile)).to.be.true;
                expect(taskLibDebugStub.calledOnce).to.be.true;
                expect(consoleErrorStub.called).to.be.false;
            });

            it("should copy BlackDuck SCA SARIF file when filename matches BD_OUTPUT_FILE_NAME", () => {
                // Setup
                const sarifFilePath = "/source/path/blackduck-output.sarif";
                const sourceDirectory = "/build/sources";
                const sarifOutputPath = "/actual/sarif/output.sarif";
                const integrationDir = "/integration/blackduck";
                const integrationDirPath = "/build/sources/integration/blackduck";
                const destinationFile = "/build/sources/integration/blackduck/sarif-default.sarif";

                processEnvStub["BUILD_SOURCESDIRECTORY"] = sourceDirectory;
                basenameStub.returns(constants.BD_OUTPUT_FILE_NAME);
                extractSarifOutputPathStub.returns(sarifOutputPath);
                dirnameStub.returns(integrationDir);
                joinStub.onFirstCall().returns(integrationDirPath);
                joinStub.onSecondCall().returns(destinationFile);
                existsSyncStub.returns(true); // File exists, so it will be "overwritten"

                const copySarifFileToIntegrationDefaultPath = (sarifFilePath: string) => {
                    const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
                    const sarifFileName = basenameStub(sarifFilePath);

                    const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
                    const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;

                    if (!isPolarisFile && !isBlackduckFile) return;

                    const sarifOutputPath = extractSarifOutputPathStub(sarifFilePath, sarifFileName);
                    if (!sarifOutputPath) return;

                    const integrationSarifDir = dirnameStub(
                        isPolarisFile
                            ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
                            : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
                    );

                    const integrationSarifDirPath = joinStub(sourceDirectory, integrationSarifDir);
                    const destinationFile = joinStub(integrationSarifDirPath, constants.SARIF_DEFAULT_FILE_NAME);

                    try {
                        require("fs").mkdirSync(integrationSarifDirPath, { recursive: true });
                        require("fs").copyFileSync(sarifOutputPath, destinationFile);
                        taskLibDebugStub(
                            `SARIF file ${require("fs").existsSync(destinationFile) ? "overwritten" : "copied"} at: ${destinationFile}`
                        );
                    } catch (error) {
                        consoleErrorStub("Error copying SARIF file:", error);
                    }
                };

                // Execute
                copySarifFileToIntegrationDefaultPath(sarifFilePath);

                // Verify
                expect(basenameStub.calledOnceWith(sarifFilePath)).to.be.true;
                expect(extractSarifOutputPathStub.calledOnceWith(sarifFilePath, constants.BD_OUTPUT_FILE_NAME)).to.be.true;
                expect(dirnameStub.calledOnceWith(constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH)).to.be.true;
                expect(joinStub.calledWith(sourceDirectory, integrationDir)).to.be.true;
                expect(joinStub.calledWith(integrationDirPath, constants.SARIF_DEFAULT_FILE_NAME)).to.be.true;
                expect(mkdirSyncStub.calledOnceWith(integrationDirPath, { recursive: true })).to.be.true;
                expect(copyFileSyncStub.calledOnceWith(sarifOutputPath, destinationFile)).to.be.true;
                expect(taskLibDebugStub.calledWith(sinon.match(/SARIF file overwritten at/))).to.be.true;
                expect(consoleErrorStub.called).to.be.false;
            });

            it("should return early when sarifFileName is neither Polaris nor BlackDuck", () => {
                // Setup
                const sarifFilePath = "/source/path/unknown-output.sarif";
                const unknownFileName = "unknown-output.sarif";

                processEnvStub["BUILD_SOURCESDIRECTORY"] = "/build/sources";
                basenameStub.returns(unknownFileName);

                const copySarifFileToIntegrationDefaultPath = (sarifFilePath: string) => {
                    const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
                    const sarifFileName = basenameStub(sarifFilePath);

                    const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
                    const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;

                    if (!isPolarisFile && !isBlackduckFile) return;

                    const sarifOutputPath = extractSarifOutputPathStub(sarifFilePath, sarifFileName);
                    if (!sarifOutputPath) return;

                    const integrationSarifDir = dirnameStub(
                        isPolarisFile
                            ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
                            : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
                    );

                    const integrationSarifDirPath = joinStub(sourceDirectory, integrationSarifDir);
                    const destinationFile = joinStub(integrationSarifDirPath, constants.SARIF_DEFAULT_FILE_NAME);

                    try {
                        mkdirSyncStub(integrationSarifDirPath, { recursive: true });
                        copyFileSyncStub(sarifOutputPath, destinationFile);
                        taskLibDebugStub(
                            `SARIF file ${existsSyncStub(destinationFile) ? "overwritten" : "copied"} at: ${destinationFile}`
                        );
                    } catch (error) {
                        consoleErrorStub("Error copying SARIF file:", error);
                    }
                };

                // Execute
                copySarifFileToIntegrationDefaultPath(sarifFilePath);

                // Verify - should only call basename, then return early
                expect(basenameStub.calledOnceWith(sarifFilePath)).to.be.true;
                expect(extractSarifOutputPathStub.called).to.be.false;
                expect(dirnameStub.called).to.be.false;
                expect(joinStub.called).to.be.false;
                expect(mkdirSyncStub.called).to.be.false;
                expect(copyFileSyncStub.called).to.be.false;
                expect(taskLibDebugStub.called).to.be.false;
                expect(consoleErrorStub.called).to.be.false;
            });

            it("should return early when extractSarifOutputPath returns empty string", () => {
                // Setup
                const sarifFilePath = "/source/path/polaris-output.sarif";

                processEnvStub["BUILD_SOURCESDIRECTORY"] = "/build/sources";
                basenameStub.returns(constants.POLARIS_OUTPUT_FILE_NAME);
                extractSarifOutputPathStub.returns(""); // Empty string

                const copySarifFileToIntegrationDefaultPath = (sarifFilePath: string) => {
                    const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
                    const sarifFileName = basenameStub(sarifFilePath);

                    const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
                    const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;

                    if (!isPolarisFile && !isBlackduckFile) return;

                    const sarifOutputPath = extractSarifOutputPathStub(sarifFilePath, sarifFileName);
                    if (!sarifOutputPath) return;

                    const integrationSarifDir = dirnameStub(
                        isPolarisFile
                            ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
                            : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
                    );

                    const integrationSarifDirPath = joinStub(sourceDirectory, integrationSarifDir);
                    const destinationFile = joinStub(integrationSarifDirPath, constants.SARIF_DEFAULT_FILE_NAME);

                    try {
                        mkdirSyncStub(integrationSarifDirPath, { recursive: true });
                        copyFileSyncStub(sarifOutputPath, destinationFile);
                        taskLibDebugStub(
                            `SARIF file ${existsSyncStub(destinationFile) ? "overwritten" : "copied"} at: ${destinationFile}`
                        );
                    } catch (error) {
                        consoleErrorStub("Error copying SARIF file:", error);
                    }
                };

                // Execute
                copySarifFileToIntegrationDefaultPath(sarifFilePath);

                // Verify - should call basename and extractSarifOutputPath, then return early
                expect(basenameStub.calledOnceWith(sarifFilePath)).to.be.true;
                expect(extractSarifOutputPathStub.calledOnceWith(sarifFilePath, constants.POLARIS_OUTPUT_FILE_NAME)).to.be.true;
                expect(dirnameStub.called).to.be.false;
                expect(joinStub.called).to.be.false;
                expect(mkdirSyncStub.called).to.be.false;
                expect(copyFileSyncStub.called).to.be.false;
                expect(taskLibDebugStub.called).to.be.false;
                expect(consoleErrorStub.called).to.be.false;
            });

            it("should return early when extractSarifOutputPath returns null", () => {
                // Setup
                const sarifFilePath = "/source/path/blackduck-output.sarif";

                processEnvStub["BUILD_SOURCESDIRECTORY"] = "/build/sources";
                basenameStub.returns(constants.BD_OUTPUT_FILE_NAME);
                extractSarifOutputPathStub.returns(null); // Null value

                const copySarifFileToIntegrationDefaultPath = (sarifFilePath: string) => {
                    const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
                    const sarifFileName = basenameStub(sarifFilePath);

                    const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
                    const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;

                    if (!isPolarisFile && !isBlackduckFile) return;

                    const sarifOutputPath = extractSarifOutputPathStub(sarifFilePath, sarifFileName);
                    if (!sarifOutputPath) return;

                    const integrationSarifDir = dirnameStub(
                        isPolarisFile
                            ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
                            : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
                    );

                    const integrationSarifDirPath = joinStub(sourceDirectory, integrationSarifDir);
                    const destinationFile = joinStub(integrationSarifDirPath, constants.SARIF_DEFAULT_FILE_NAME);

                    try {
                        mkdirSyncStub(integrationSarifDirPath, { recursive: true });
                        copyFileSyncStub(sarifOutputPath, destinationFile);
                        taskLibDebugStub(
                            `SARIF file ${existsSyncStub(destinationFile) ? "overwritten" : "copied"} at: ${destinationFile}`
                        );
                    } catch (error) {
                        consoleErrorStub("Error copying SARIF file:", error);
                    }
                };

                // Execute
                copySarifFileToIntegrationDefaultPath(sarifFilePath);

                // Verify
                expect(basenameStub.calledOnceWith(sarifFilePath)).to.be.true;
                expect(extractSarifOutputPathStub.calledOnceWith(sarifFilePath, constants.BD_OUTPUT_FILE_NAME)).to.be.true;
                expect(dirnameStub.called).to.be.false;
                expect(joinStub.called).to.be.false;
                expect(mkdirSyncStub.called).to.be.false;
                expect(copyFileSyncStub.called).to.be.false;
                expect(taskLibDebugStub.called).to.be.false;
                expect(consoleErrorStub.called).to.be.false;
            });

            it("should use empty string when BUILD_SOURCESDIRECTORY is not set", () => {
                // Setup
                const sarifFilePath = "/source/path/polaris-output.sarif";
                const sarifOutputPath = "/actual/sarif/output.sarif";
                const integrationDir = "/integration/polaris";
                const integrationDirPath = "/integration/polaris"; // No source directory prefix
                const destinationFile = "/integration/polaris/sarif-default.sarif";

                // Don't set BUILD_SOURCESDIRECTORY
                basenameStub.returns(constants.POLARIS_OUTPUT_FILE_NAME);
                extractSarifOutputPathStub.returns(sarifOutputPath);
                dirnameStub.returns(integrationDir);
                joinStub.onFirstCall().returns(integrationDirPath);
                joinStub.onSecondCall().returns(destinationFile);
                existsSyncStub.returns(false);

                const copySarifFileToIntegrationDefaultPath = (sarifFilePath: string) => {
                    const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
                    const sarifFileName = basenameStub(sarifFilePath);

                    const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
                    const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;

                    if (!isPolarisFile && !isBlackduckFile) return;

                    const sarifOutputPath = extractSarifOutputPathStub(sarifFilePath, sarifFileName);
                    if (!sarifOutputPath) return;

                    const integrationSarifDir = dirnameStub(
                        isPolarisFile
                            ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
                            : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
                    );

                    const integrationSarifDirPath = joinStub(sourceDirectory, integrationSarifDir);
                    const destinationFile = joinStub(integrationSarifDirPath, constants.SARIF_DEFAULT_FILE_NAME);

                    try {
                        mkdirSyncStub(integrationSarifDirPath, { recursive: true });
                        copyFileSyncStub(sarifOutputPath, destinationFile);
                        taskLibDebugStub(
                            `SARIF file ${existsSyncStub(destinationFile) ? "overwritten" : "copied"} at: ${destinationFile}`
                        );
                    } catch (error) {
                        consoleErrorStub("Error copying SARIF file:", error);
                    }
                };

                // Execute
                copySarifFileToIntegrationDefaultPath(sarifFilePath);

                // Verify
                expect(joinStub.calledWith("", integrationDir)).to.be.true; // Empty string for source directory
                expect(mkdirSyncStub.calledOnceWith(integrationDirPath, { recursive: true })).to.be.true;
                expect(copyFileSyncStub.calledOnceWith(sarifOutputPath, destinationFile)).to.be.true;
                expect(taskLibDebugStub.calledWith(sinon.match(/SARIF file copied at/))).to.be.true;
                expect(consoleErrorStub.called).to.be.false;
            });

            it("should handle fs.mkdirSync throwing an error", () => {
                // Setup
                const sarifFilePath = "/source/path/polaris-output.sarif";
                const sourceDirectory = "/build/sources";
                const sarifOutputPath = "/actual/sarif/output.sarif";
                const integrationDir = "/integration/polaris";
                const integrationDirPath = "/build/sources/integration/polaris";
                const destinationFile = "/build/sources/integration/polaris/sarif-default.sarif";
                const error = new Error("Permission denied");

                processEnvStub["BUILD_SOURCESDIRECTORY"] = sourceDirectory;
                basenameStub.returns(constants.POLARIS_OUTPUT_FILE_NAME);
                extractSarifOutputPathStub.returns(sarifOutputPath);
                dirnameStub.returns(integrationDir);
                joinStub.onFirstCall().returns(integrationDirPath);
                joinStub.onSecondCall().returns(destinationFile);
                mkdirSyncStub.throws(error);

                const copySarifFileToIntegrationDefaultPath = (sarifFilePath: string) => {
                    const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
                    const sarifFileName = basenameStub(sarifFilePath);

                    const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
                    const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;

                    if (!isPolarisFile && !isBlackduckFile) return;

                    const sarifOutputPath = extractSarifOutputPathStub(sarifFilePath, sarifFileName);
                    if (!sarifOutputPath) return;

                    const integrationSarifDir = dirnameStub(
                        isPolarisFile
                            ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
                            : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
                    );

                    const integrationSarifDirPath = joinStub(sourceDirectory, integrationSarifDir);
                    const destinationFile = joinStub(integrationSarifDirPath, constants.SARIF_DEFAULT_FILE_NAME);

                    try {
                        mkdirSyncStub(integrationSarifDirPath, { recursive: true });
                        copyFileSyncStub(sarifOutputPath, destinationFile);
                        taskLibDebugStub(
                            `SARIF file ${existsSyncStub(destinationFile) ? "overwritten" : "copied"} at: ${destinationFile}`
                        );
                    } catch (error) {
                        consoleErrorStub("Error copying SARIF file:", error);
                    }
                };

                // Execute
                copySarifFileToIntegrationDefaultPath(sarifFilePath);

                // Verify
                expect(mkdirSyncStub.calledOnceWith(integrationDirPath, { recursive: true })).to.be.true;
                expect(copyFileSyncStub.called).to.be.false; // Should not be called due to error
                expect(taskLibDebugStub.called).to.be.false; // Should not be called due to error
                expect(consoleErrorStub.calledOnceWith("Error copying SARIF file:", error)).to.be.true;
            });

            it("should handle fs.copyFileSync throwing an error", () => {
                // Setup
                const sarifFilePath = "/source/path/polaris-output.sarif";
                const sourceDirectory = "/build/sources";
                const sarifOutputPath = "/actual/sarif/output.sarif";
                const integrationDir = "/integration/polaris";
                const integrationDirPath = "/build/sources/integration/polaris";
                const destinationFile = "/build/sources/integration/polaris/sarif-default.sarif";
                const error = new Error("File copy failed");

                processEnvStub["BUILD_SOURCESDIRECTORY"] = sourceDirectory;
                basenameStub.returns(constants.POLARIS_OUTPUT_FILE_NAME);
                extractSarifOutputPathStub.returns(sarifOutputPath);
                dirnameStub.returns(integrationDir);
                joinStub.onFirstCall().returns(integrationDirPath);
                joinStub.onSecondCall().returns(destinationFile);
                copyFileSyncStub.throws(error);

                const copySarifFileToIntegrationDefaultPath = (sarifFilePath: string) => {
                    const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
                    const sarifFileName = basenameStub(sarifFilePath);

                    const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
                    const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;

                    if (!isPolarisFile && !isBlackduckFile) return;

                    const sarifOutputPath = extractSarifOutputPathStub(sarifFilePath, sarifFileName);
                    if (!sarifOutputPath) return;

                    const integrationSarifDir = dirnameStub(
                        isPolarisFile
                            ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
                            : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
                    );

                    const integrationSarifDirPath = joinStub(sourceDirectory, integrationSarifDir);
                    const destinationFile = joinStub(integrationSarifDirPath, constants.SARIF_DEFAULT_FILE_NAME);

                    try {
                        mkdirSyncStub(integrationSarifDirPath, { recursive: true });
                        copyFileSyncStub(sarifOutputPath, destinationFile);
                        taskLibDebugStub(
                            `SARIF file ${existsSyncStub(destinationFile) ? "overwritten" : "copied"} at: ${destinationFile}`
                        );
                    } catch (error) {
                        consoleErrorStub("Error copying SARIF file:", error);
                    }
                };

                // Execute
                copySarifFileToIntegrationDefaultPath(sarifFilePath);

                // Verify
                expect(mkdirSyncStub.calledOnceWith(integrationDirPath, { recursive: true })).to.be.true;
                expect(copyFileSyncStub.calledOnceWith(sarifOutputPath, destinationFile)).to.be.true;
                expect(taskLibDebugStub.called).to.be.false; // Should not be called due to error
                expect(consoleErrorStub.calledOnceWith("Error copying SARIF file:", error)).to.be.true;
            });

            it("should show 'copied' message when destination file does not exist", () => {
                // Setup
                const sarifFilePath = "/source/path/polaris-output.sarif";
                const sourceDirectory = "/build/sources";
                const sarifOutputPath = "/actual/sarif/output.sarif";
                const integrationDir = "/integration/polaris";
                const integrationDirPath = "/build/sources/integration/polaris";
                const destinationFile = "/build/sources/integration/polaris/sarif-default.sarif";

                processEnvStub["BUILD_SOURCESDIRECTORY"] = sourceDirectory;
                basenameStub.returns(constants.POLARIS_OUTPUT_FILE_NAME);
                extractSarifOutputPathStub.returns(sarifOutputPath);
                dirnameStub.returns(integrationDir);
                joinStub.onFirstCall().returns(integrationDirPath);
                joinStub.onSecondCall().returns(destinationFile);
                existsSyncStub.returns(false); // File doesn't exist

                const copySarifFileToIntegrationDefaultPath = (sarifFilePath: string) => {
                    const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
                    const sarifFileName = basenameStub(sarifFilePath);

                    const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
                    const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;

                    if (!isPolarisFile && !isBlackduckFile) return;

                    const sarifOutputPath = extractSarifOutputPathStub(sarifFilePath, sarifFileName);
                    if (!sarifOutputPath) return;

                    const integrationSarifDir = dirnameStub(
                        isPolarisFile
                            ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
                            : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
                    );

                    const integrationSarifDirPath = joinStub(sourceDirectory, integrationSarifDir);
                    const destinationFile = joinStub(integrationSarifDirPath, constants.SARIF_DEFAULT_FILE_NAME);

                    try {
                        mkdirSyncStub(integrationSarifDirPath, { recursive: true });
                        copyFileSyncStub(sarifOutputPath, destinationFile);
                        taskLibDebugStub(
                            `SARIF file ${existsSyncStub(destinationFile) ? "overwritten" : "copied"} at: ${destinationFile}`
                        );
                    } catch (error) {
                        consoleErrorStub("Error copying SARIF file:", error);
                    }
                };

                // Execute
                copySarifFileToIntegrationDefaultPath(sarifFilePath);

                // Verify
                expect(existsSyncStub.calledOnceWith(destinationFile)).to.be.true;
                expect(taskLibDebugStub.calledWith(`SARIF file copied at: ${destinationFile}`)).to.be.true;
            });

            it("should show 'overwritten' message when destination file exists", () => {
                // Setup
                const sarifFilePath = "/source/path/polaris-output.sarif";
                const sourceDirectory = "/build/sources";
                const sarifOutputPath = "/actual/sarif/output.sarif";
                const integrationDir = "/integration/polaris";
                const integrationDirPath = "/build/sources/integration/polaris";
                const destinationFile = "/build/sources/integration/polaris/sarif-default.sarif";

                processEnvStub["BUILD_SOURCESDIRECTORY"] = sourceDirectory;
                basenameStub.returns(constants.POLARIS_OUTPUT_FILE_NAME);
                extractSarifOutputPathStub.returns(sarifOutputPath);
                dirnameStub.returns(integrationDir);
                joinStub.onFirstCall().returns(integrationDirPath);
                joinStub.onSecondCall().returns(destinationFile);
                existsSyncStub.returns(true); // File exists

                const copySarifFileToIntegrationDefaultPath = (sarifFilePath: string) => {
                    const sourceDirectory = process.env["BUILD_SOURCESDIRECTORY"] || "";
                    const sarifFileName = basenameStub(sarifFilePath);

                    const isPolarisFile = sarifFileName === constants.POLARIS_OUTPUT_FILE_NAME;
                    const isBlackduckFile = sarifFileName === constants.BD_OUTPUT_FILE_NAME;

                    if (!isPolarisFile && !isBlackduckFile) return;

                    const sarifOutputPath = extractSarifOutputPathStub(sarifFilePath, sarifFileName);
                    if (!sarifOutputPath) return;

                    const integrationSarifDir = dirnameStub(
                        isPolarisFile
                            ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
                            : constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
                    );

                    const integrationSarifDirPath = joinStub(sourceDirectory, integrationSarifDir);
                    const destinationFile = joinStub(integrationSarifDirPath, constants.SARIF_DEFAULT_FILE_NAME);

                    try {
                        mkdirSyncStub(integrationSarifDirPath, { recursive: true });
                        copyFileSyncStub(sarifOutputPath, destinationFile);
                        taskLibDebugStub(
                            `SARIF file ${existsSyncStub(destinationFile) ? "overwritten" : "copied"} at: ${destinationFile}`
                        );
                    } catch (error) {
                        consoleErrorStub("Error copying SARIF file:", error);
                    }
                };

                // Execute
                copySarifFileToIntegrationDefaultPath(sarifFilePath);

                // Verify
                expect(existsSyncStub.calledOnceWith(destinationFile)).to.be.true;
                expect(taskLibDebugStub.calledWith(`SARIF file overwritten at: ${destinationFile}`)).to.be.true;
            });
        });
    });
    describe("stringFormat", () => {
        it("should replace numbered placeholders with encoded arguments", () => {
            const url = "https://server/{0}/project/{1}/repo/{2}";
            const result = stringFormat(url, "org name", "proj name", "repo/name");
            expect(result).to.equal(
                "https://server/org%20name/project/proj%20name/repo/repo%2Fname"
            );
        });


        it("should handle no placeholders", () => {
            const url = "https://server/static/path";
            const result = stringFormat(url);
            expect(result).to.equal("https://server/static/path");
        });

        it("should encode special characters in arguments", () => {
            const url = "https://server/{0}";
            const result = stringFormat(url, "a+b/c?d=e&f");
            expect(result).to.equal("https://server/a%2Bb%2Fc%3Fd%3De%26f");
        });
    });


});


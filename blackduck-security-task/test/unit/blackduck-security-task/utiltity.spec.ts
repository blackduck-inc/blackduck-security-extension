// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import * as utility from "../../../src/blackduck-security-task/utility";
import * as input from "../../../src/blackduck-security-task/input";
import * as sslUtils from "../../../src/blackduck-security-task/ssl-utils";
import {
    createSSLConfiguredHttpClient,
    clearHttpClientCache, FileSystemWrapper,
    PathWrapper, LoggerWrapper,extractInputJsonFilename,
    updateSarifFilePaths,
    updatePolarisSarifPath,
    updateBlackDuckSarifPath,
    updateCoverityConfigForBridgeVersion
} from "../../../src/blackduck-security-task/utility";
import process from "process";
import * as toolLibLocal from "../../../src/blackduck-security-task/download-tool";
import {DownloadFileResponse} from "../../../src/blackduck-security-task/model/download-file-response";
import {AZURE_BUILD_REASON, AZURE_ENVIRONMENT_VARIABLES} from "../../../src/blackduck-security-task/model/azure";
import { ErrorCode } from "../../../src/blackduck-security-task/enum/ErrorCodes";
import {BuildStatus} from "../../../src/blackduck-security-task/enum/BuildStatus";
import {TaskResult} from "azure-pipelines-task-lib/task";
import * as trm from "azure-pipelines-task-lib/toolrunner";
import * as https from "node:https";
import { expect } from "chai";
import * as sinon from "sinon";
import * as taskLib from "azure-pipelines-task-lib";
import * as constants from "../../../src/blackduck-security-task/application-constant";
import * as validator from "../../../src/blackduck-security-task/validator";
import * as inputs from "../../../src/blackduck-security-task/input";
import { describe, it, beforeEach, afterEach } from 'mocha';

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
    describe("updateSarifFilePaths", () => {
        let sandbox: sinon.SinonSandbox;
        let updatePolarisSarifPathStub: sinon.SinonStub;
        let updateBlackDuckSarifPathStub: sinon.SinonStub;
        let debugStub: sinon.SinonStub;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            updatePolarisSarifPathStub = sandbox.stub(utility, "updatePolarisSarifPath");
            updateBlackDuckSarifPathStub = sandbox.stub(utility, "updateBlackDuckSarifPath");
            debugStub = sandbox.stub(taskLib, "debug");
            // Stub validator on the module used by utility
            sandbox.stub(validator, "isNullOrEmptyValue").returns(true);
        });

        afterEach(() => {
            sandbox.restore();
        });
        it("should not call any update function for unknown file name", () => {
            utility.updateSarifFilePaths("/workspace", "other.json", "0.0.1", "/input.json");
            sinon.assert.notCalled(updatePolarisSarifPathStub);
            sinon.assert.notCalled(updateBlackDuckSarifPathStub);
        });
    });
    describe("SARIF File Path Functions", () => {
        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        context("extractInputJsonFilename", () => {
            it("should extract filename from command with --input flag", () => {
                const command = "bridge --input polaris_input.json --stage sast";
                const result = extractInputJsonFilename(command);
                expect(result).to.equal("polaris_input.json");
            });

            it("should extract filename with full path from command", () => {
                const command = "bridge --input /path/to/bd_input.json --stage sca";
                const result = extractInputJsonFilename(command);
                expect(result).to.equal("/path/to/bd_input.json");
            });

            it("should handle command with multiple flags", () => {
                const command = "bridge --verbose --input config.json --output results";
                const result = extractInputJsonFilename(command);
                expect(result).to.equal("config.json");
            });

            it("should return empty string when no --input flag found", () => {
                const command = "bridge --stage sast --output results";
                const result = extractInputJsonFilename(command);
                expect(result).to.equal("");
            });

            it("should return empty string for empty command", () => {
                const command = "";
                const result = extractInputJsonFilename(command);
                expect(result).to.equal("");
            });

            it("should handle --input flag at the end of command", () => {
                const command = "bridge --stage sast --input final_config.json";
                const result = extractInputJsonFilename(command);
                expect(result).to.equal("final_config.json");
            });
        });

        context("updateSarifFilePaths", () => {

            let updatePolarisSarifPathStub: sinon.SinonStub;
            let updateBlackDuckSarifPathStub: sinon.SinonStub;
            let isNullOrEmptyValueStub: sinon.SinonStub;
            let debugStub: sinon.SinonStub; // <-- Add this line

            beforeEach(() => {
                sandbox = sinon.createSandbox();
                updatePolarisSarifPathStub = sandbox.stub(utility, "updatePolarisSarifPath");
                updateBlackDuckSarifPathStub = sandbox.stub(utility, "updateBlackDuckSarifPath");
                isNullOrEmptyValueStub = sandbox.stub(validator, "isNullOrEmptyValue");
                debugStub = sandbox.stub(taskLib, "debug"); // <-- Add this line
            });

            afterEach(() => {
                sandbox.restore();
            });

            it("should not call any update function for unknown file name", () => {
                updateSarifFilePaths("/workspace", "other_input.json", "1.0.0", "/input.json");

                expect(updatePolarisSarifPathStub.called).to.be.false;
                expect(updateBlackDuckSarifPathStub.called).to.be.false;
            });
        });
    });
    describe('updateSarifFilePaths', () => {
        const workSpaceDir = '/workspace';
        const bridgeVersion = '2.0.0';
        const productInputFilePath = '/path/to/input.json';

        let sandbox: sinon.SinonSandbox;
        let updatePolarisSarifPathStub: sinon.SinonStub;
        let updateBlackDuckSarifPathStub: sinon.SinonStub;
        let pathJoinStub: sinon.SinonStub;
        let taskLibDebugStub: sinon.SinonStub;
        let isNullOrEmptyValueStub: sinon.SinonStub;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            updatePolarisSarifPathStub = sandbox.stub();
            updateBlackDuckSarifPathStub = sandbox.stub();
            pathJoinStub = sandbox.stub();
            taskLibDebugStub = sandbox.stub();
            isNullOrEmptyValueStub = sandbox.stub();

            // Mock constants
            sandbox.stub(constants, 'VERSION').value('2.0.0');
            sandbox.stub(constants, 'BRIDGE_CLI_LOCAL_DIRECTORY').value('/bridge/cli');
            sandbox.stub(constants, 'DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY').value('polaris-sarif');
            sandbox.stub(constants, 'DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY').value('blackduck-sarif');
            sandbox.stub(constants, 'SARIF_DEFAULT_FILE_NAME').value('results.sarif');
            sandbox.stub(constants, 'INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH').value('polaris/results.sarif');
            sandbox.stub(constants, 'INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH').value('blackduck/results.sarif');

            // Replace the actual functions with stubs
            sandbox.replace(require('../../../src/blackduck-security-task/utility'), 'updatePolarisSarifPath', updatePolarisSarifPathStub);
            sandbox.replace(require('../../../src/blackduck-security-task/utility'), 'updateBlackDuckSarifPath', updateBlackDuckSarifPathStub);
            sandbox.replace(require('path'), 'join', pathJoinStub);
            sandbox.replace(require('azure-pipelines-task-lib'), 'debug', taskLibDebugStub);
            sandbox.replace(require('../../../src/blackduck-security-task/validator'), 'isNullOrEmptyValue', isNullOrEmptyValueStub);
        });

        afterEach(() => {
            sandbox.restore();
        });

        describe('Polaris input file scenarios', () => {
            it('should handle polaris_input.json with bridge version less than constants.VERSION and custom SARIF path', () => {
                const fileName = 'polaris_input.json';
                const lowerBridgeVersion = '1.9.0';
                const customSarifPath = '/custom/sarif/path.sarif';

                isNullOrEmptyValueStub.returns(false);
                sandbox.stub(inputs, 'POLARIS_REPORTS_SARIF_FILE_PATH').value(' ' + customSarifPath + ' ');

                updateSarifFilePaths(workSpaceDir, fileName, lowerBridgeVersion, productInputFilePath);

                expect(isNullOrEmptyValueStub.calledWith(inputs.POLARIS_REPORTS_SARIF_FILE_PATH)).to.be.true;
            });

            it('should handle polaris_input.json with bridge version greater than or equal to constants.VERSION and empty SARIF path', () => {
                const fileName = 'polaris_input.json';
                const higherBridgeVersion = '2.1.0';

                isNullOrEmptyValueStub.returns(true);
                pathJoinStub.returns('/workspace/polaris/results.sarif');

                updateSarifFilePaths(workSpaceDir, fileName, higherBridgeVersion, productInputFilePath);

                expect(isNullOrEmptyValueStub.calledWith(inputs.POLARIS_REPORTS_SARIF_FILE_PATH)).to.be.true;
                expect(pathJoinStub.calledWith(
                    workSpaceDir,
                    constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
                )).to.be.true;
            });

            it('should handle polaris_input.json with bridge version greater than or equal to constants.VERSION and custom SARIF path', () => {
                const fileName = 'polaris_input.json';
                const higherBridgeVersion = '2.1.0';
                const customSarifPath = '/custom/polaris/sarif.sarif';

                isNullOrEmptyValueStub.returns(false);
                sandbox.stub(inputs, 'POLARIS_REPORTS_SARIF_FILE_PATH').value(customSarifPath);

                updateSarifFilePaths(workSpaceDir, fileName, higherBridgeVersion, productInputFilePath);

                expect(isNullOrEmptyValueStub.calledWith(inputs.POLARIS_REPORTS_SARIF_FILE_PATH)).to.be.true;
            });

        });

        describe('BlackDuck input file scenarios', () => {

            it('should handle bd_input.json with bridge version less than constants.VERSION and custom SARIF path', () => {
                const fileName = 'bd_input.json';
                const lowerBridgeVersion = '1.9.0';
                const customSarifPath = '/custom/blackduck/sarif.sarif';

                isNullOrEmptyValueStub.returns(false);
                sandbox.stub(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH').value(' ' + customSarifPath + ' ');

                updateSarifFilePaths(workSpaceDir, fileName, lowerBridgeVersion, productInputFilePath);

                expect(isNullOrEmptyValueStub.calledWith(inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH)).to.be.true;
            });

            it('should handle bd_input.json with bridge version greater than or equal to constants.VERSION and empty SARIF path', () => {
                const fileName = 'bd_input.json';
                const higherBridgeVersion = '2.1.0';

                isNullOrEmptyValueStub.returns(true);
                pathJoinStub.returns('/workspace/blackduck/results.sarif');

                updateSarifFilePaths(workSpaceDir, fileName, higherBridgeVersion, productInputFilePath);

                expect(isNullOrEmptyValueStub.calledWith(inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH)).to.be.true;
                expect(pathJoinStub.calledWith(
                    workSpaceDir,
                    constants.INTEGRATIONS_BLACKDUCKSCA_DEFAULT_SARIF_FILE_PATH
                )).to.be.true;
            });

            it('should handle bd_input.json with bridge version greater than or equal to constants.VERSION and custom SARIF path', () => {
                const fileName = 'bd_input.json';
                const higherBridgeVersion = '2.1.0';
                const customSarifPath = '/custom/blackduck/sarif.sarif';

                isNullOrEmptyValueStub.returns(false);
                sandbox.stub(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH').value(customSarifPath);

                updateSarifFilePaths(workSpaceDir, fileName, higherBridgeVersion, productInputFilePath);

                expect(isNullOrEmptyValueStub.calledWith(inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH)).to.be.true;
            });

        });

    });

// Updated tests for updatePolarisSarifPath (converted ternary to if-else)
    describe('updatePolarisSarifPath', () => {
        const productInputFilePath = '/path/to/input.json';
        const sarifPath = 'reports/sarif-output.sarif';

        let sandbox: sinon.SinonSandbox;
        let mockFsWrapper: sinon.SinonStubbedInstance<FileSystemWrapper>;
        let mockLogger: sinon.SinonStubbedInstance<LoggerWrapper>;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            mockFsWrapper = sandbox.createStubInstance(FileSystemWrapper);
            mockLogger = sandbox.createStubInstance(LoggerWrapper);
        });

        afterEach(() => {
            sandbox.restore();
        });

        describe('Successful scenarios', () => {
            it('should update SARIF path in a complete JSON config', () => {
                const inputConfig = {
                    data: {
                        polaris: {
                            reports: {
                                sarif: {
                                    file: {
                                        path: '/old/path/sarif.sarif'
                                    }
                                }
                            }
                        }
                    }
                };

                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath(productInputFilePath, sarifPath, mockFsWrapper, mockLogger);

                expect(mockFsWrapper.readFileSync.calledOnceWith(productInputFilePath, 'utf-8')).to.be.true;

                const expectedConfig = {
                    ...inputConfig,
                    data: {
                        polaris: {
                            reports: {
                                sarif: {
                                    file: {
                                        path: sarifPath
                                    }
                                }
                            }
                        }
                    }
                };

                expect(mockFsWrapper.writeFileSync.calledOnceWith(
                    productInputFilePath,
                    JSON.stringify(expectedConfig, null, 2)
                )).to.be.true;
                expect(mockLogger.debug.calledWith(`Updated SARIF file path to: ${sarifPath}`)).to.be.true;
                expect(mockLogger.debug.calledWith(`Successfully updated Polaris SARIF file path: ${sarifPath}`)).to.be.true;
                expect(mockLogger.debug.callCount).to.equal(2);
            });

            it('should handle JSON config with missing data property', () => {
                const inputConfig = {};
                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath(productInputFilePath, sarifPath, mockFsWrapper, mockLogger);

                const expectedConfig = {
                    data: {
                        polaris: {
                            reports: {
                                sarif: {
                                    file: {
                                        path: sarifPath
                                    }
                                }
                            }
                        }
                    }
                };

                expect(mockFsWrapper.writeFileSync.calledOnceWith(
                    productInputFilePath,
                    JSON.stringify(expectedConfig, null, 2)
                )).to.be.true;
                expect(mockLogger.debug.callCount).to.equal(2);
            });

            it('should handle JSON config with missing polaris property', () => {
                const inputConfig = { data: {} };
                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath(productInputFilePath, sarifPath, mockFsWrapper, mockLogger);

                const expectedConfig = {
                    data: {
                        polaris: {
                            reports: {
                                sarif: {
                                    file: {
                                        path: sarifPath
                                    }
                                }
                            }
                        }
                    }
                };

                expect(mockFsWrapper.writeFileSync.calledOnceWith(
                    productInputFilePath,
                    JSON.stringify(expectedConfig, null, 2)
                )).to.be.true;
                expect(mockLogger.debug.callCount).to.equal(2);
            });

            it('should handle JSON config with missing reports property', () => {
                const inputConfig = {
                    data: {
                        polaris: {}
                    }
                };
                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath(productInputFilePath, sarifPath, mockFsWrapper, mockLogger);

                const expectedConfig = {
                    data: {
                        polaris: {
                            reports: {
                                sarif: {
                                    file: {
                                        path: sarifPath
                                    }
                                }
                            }
                        }
                    }
                };

                expect(mockFsWrapper.writeFileSync.calledOnceWith(
                    productInputFilePath,
                    JSON.stringify(expectedConfig, null, 2)
                )).to.be.true;
                expect(mockLogger.debug.callCount).to.equal(2);
            });

            it('should handle JSON config with missing sarif property', () => {
                const inputConfig = {
                    data: {
                        polaris: {
                            reports: {}
                        }
                    }
                };
                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath(productInputFilePath, sarifPath, mockFsWrapper, mockLogger);

                const expectedConfig = {
                    data: {
                        polaris: {
                            reports: {
                                sarif: {
                                    file: {
                                        path: sarifPath
                                    }
                                }
                            }
                        }
                    }
                };

                expect(mockFsWrapper.writeFileSync.calledOnceWith(
                    productInputFilePath,
                    JSON.stringify(expectedConfig, null, 2)
                )).to.be.true;
                expect(mockLogger.debug.callCount).to.equal(2);
            });

            it('should handle JSON config with missing file property', () => {
                const inputConfig = {
                    data: {
                        polaris: {
                            reports: {
                                sarif: {}
                            }
                        }
                    }
                };
                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath(productInputFilePath, sarifPath, mockFsWrapper, mockLogger);

                const expectedConfig = {
                    data: {
                        polaris: {
                            reports: {
                                sarif: {
                                    file: {
                                        path: sarifPath
                                    }
                                }
                            }
                        }
                    }
                };

                expect(mockFsWrapper.writeFileSync.calledOnceWith(
                    productInputFilePath,
                    JSON.stringify(expectedConfig, null, 2)
                )).to.be.true;
                expect(mockLogger.debug.callCount).to.equal(2);
            });

            it('should remove quotes from file path', () => {
                const quotedPath = '"/path/to/quoted/input.json"';
                const cleanPath = '/path/to/quoted/input.json';
                const inputConfig = { data: {} };

                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath(quotedPath, sarifPath, mockFsWrapper, mockLogger);

                expect(mockFsWrapper.readFileSync.calledOnceWith(cleanPath, 'utf-8')).to.be.true;
                expect(mockLogger.debug.callCount).to.equal(2);
            });

            it('should preserve other properties in the config', () => {
                const inputConfig = {
                    version: '1.0',
                    metadata: {
                        author: 'test'
                    },
                    data: {
                        polaris: {
                            apiUrl: 'https://api.example.com',
                            reports: {
                                sarif: {
                                    file: {
                                        path: '/old/path'
                                    }
                                }
                            }
                        },
                        otherTool: {
                            config: 'value'
                        }
                    }
                };

                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath(productInputFilePath, sarifPath, mockFsWrapper, mockLogger);

                const expectedConfig = {
                    ...inputConfig,
                    data: {
                        ...inputConfig.data,
                        polaris: {
                            ...inputConfig.data.polaris,
                            reports: {
                                sarif: {
                                    file: {
                                        path: sarifPath
                                    }
                                }
                            }
                        }
                    }
                };

                expect(mockFsWrapper.writeFileSync.calledOnceWith(
                    productInputFilePath,
                    JSON.stringify(expectedConfig, null, 2)
                )).to.be.true;
                expect(mockLogger.debug.callCount).to.equal(2);
            });
        });

        describe('Error scenarios', () => {
            it('should handle file read error gracefully', () => {
                const error = new Error('File not found');
                mockFsWrapper.readFileSync.throws(error);

                expect(() => {
                    updatePolarisSarifPath(productInputFilePath, sarifPath, mockFsWrapper, mockLogger);
                }).to.not.throw();

                expect(mockLogger.debug.calledWith(`Error updating SARIF file path: ${error}`)).to.be.true;
                expect(mockFsWrapper.writeFileSync.called).to.be.false;
                expect(mockLogger.debug.callCount).to.equal(1);
            });

            it('should handle JSON parse error gracefully', () => {
                mockFsWrapper.readFileSync.returns('invalid json content {');

                expect(() => {
                    updatePolarisSarifPath(productInputFilePath, sarifPath, mockFsWrapper, mockLogger);
                }).to.not.throw();

                expect(mockLogger.debug.calledWithMatch('Error updating SARIF file path:')).to.be.true;
                expect(mockFsWrapper.writeFileSync.called).to.be.false;
                expect(mockLogger.debug.callCount).to.equal(1);
            });

            it('should handle file write error gracefully', () => {
                const inputConfig = { data: {} };
                const writeError = new Error('Permission denied');

                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));
                mockFsWrapper.writeFileSync.throws(writeError);

                expect(() => {
                    updatePolarisSarifPath(productInputFilePath, sarifPath, mockFsWrapper, mockLogger);
                }).to.not.throw();

                expect(mockLogger.debug.calledWith(`Error updating SARIF file path: ${writeError}`)).to.be.true;
                expect(mockLogger.debug.callCount).to.equal(2); // One for update message, one for error
            });
        });

        describe('Edge cases', () => {
            it('should handle empty strings for parameters', () => {
                const inputConfig = { data: {} };
                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath('', '', mockFsWrapper, mockLogger);

                expect(mockLogger.debug.callCount).to.equal(2);
            });

            it('should handle null data in config', () => {
                const inputConfig = { data: null };
                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath(productInputFilePath, sarifPath, mockFsWrapper, mockLogger);

                const expectedConfig = {
                    data: {
                        polaris: {
                            reports: {
                                sarif: {
                                    file: {
                                        path: sarifPath
                                    }
                                }
                            }
                        }
                    }
                };

                expect(mockFsWrapper.writeFileSync.calledOnceWith(
                    productInputFilePath,
                    JSON.stringify(expectedConfig, null, 2)
                )).to.be.true;
                expect(mockLogger.debug.callCount).to.equal(2);
            });

            it('should handle special characters in paths', () => {
                const specialCharPath = 'reports/sárif-output with spaces & symbols!.sarif';
                const inputConfig = { data: {} };

                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath(productInputFilePath, specialCharPath, mockFsWrapper, mockLogger);

                expect(mockLogger.debug.callCount).to.equal(2);
            });

            it('should handle multiple quotes in file path', () => {
                const multiQuotedPath = '"""/path/to/"quoted"/input.json"""';
                const expectedCleanPath = '/path/to/quoted/input.json';
                const inputConfig = { data: {} };

                mockFsWrapper.readFileSync.returns(JSON.stringify(inputConfig));

                updatePolarisSarifPath(multiQuotedPath, sarifPath, mockFsWrapper, mockLogger);

                expect(mockFsWrapper.readFileSync.calledWith(expectedCleanPath, 'utf-8')).to.be.true;
                expect(mockLogger.debug.callCount).to.equal(2);
            });
        });
    });
    describe('stringFormat', () => {
        it('should replace a single placeholder', () => {
            const result = utility.formatURLString('api/{0}/details', 'user');
            expect(result).to.equal('api/user/details');
        });
        it('should replace multiple placeholders', () => {
            const result = utility.formatURLString('api/{0}/details/{1}', 'user', '42');
            expect(result).to.equal('api/user/details/42');
        });
        it('should encode special characters', () => {
            const result = utility.formatURLString('search/{0}', 'a b/c?');
            expect(result).to.equal('search/a%20b%2Fc%3F');
        });
        it('should return original string if no placeholders', () => {
            const result = utility.formatURLString('api/user/details');
            expect(result).to.equal('api/user/details');
        });
    });

// Updated tests for updateBlackDuckSarifPath (converted ternary to if-else)
    describe('updateBlackDuckSarifPath', () => {
        const productInputFilePath = '/path/to/input.json';
        const sarifPath = 'reports/sarif-output.sarif';

        let sandbox: sinon.SinonSandbox;
        let mockFsWrapper: sinon.SinonStubbedInstance<FileSystemWrapper>;
        let mockLogger: sinon.SinonStubbedInstance<LoggerWrapper>;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            mockFsWrapper = sandbox.createStubInstance(FileSystemWrapper);
            mockLogger = sandbox.createStubInstance(LoggerWrapper);
        });

        afterEach(() => {
            sandbox.restore();
        });
    });

    describe('validateSourceUploadValue', () => {
        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should show info message when bridge version is >= ASSESSMENT_MODE_UNSUPPORTED_BRIDGE_VERSION and assessment mode is not null/empty', () => {
            const infoStub = sandbox.stub(console, 'info');
            sandbox.stub(inputs, 'POLARIS_ASSESSMENT_MODE').value('SOURCE_UPLOAD');
            sandbox.stub(constants, 'ASSESSMENT_MODE_UNSUPPORTED_BRIDGE_VERSION').value('3.8.0');

            utility.validateSourceUploadValue('3.8.0');

            expect(infoStub.calledOnce).to.be.true;
            expect(infoStub.calledWith("INFO: polaris_assessment_mode is deprecated. Use polaris_test_sast_location=remote and/or polaris_test_sca_location=remote for source upload scans instead.")).to.be.true;
        });

        it('should show info message when bridge version is higher than ASSESSMENT_MODE_UNSUPPORTED_BRIDGE_VERSION and assessment mode is not null/empty', () => {
            const infoStub = sandbox.stub(console, 'info');
            sandbox.stub(inputs, 'POLARIS_ASSESSMENT_MODE').value('CI');
            sandbox.stub(constants, 'ASSESSMENT_MODE_UNSUPPORTED_BRIDGE_VERSION').value('3.8.0');

            utility.validateSourceUploadValue('3.9.0');

            expect(infoStub.calledOnce).to.be.true;
            expect(infoStub.calledWith("INFO: polaris_assessment_mode is deprecated. Use polaris_test_sast_location=remote and/or polaris_test_sca_location=remote for source upload scans instead.")).to.be.true;
        });

        it('should not show info message when bridge version is < ASSESSMENT_MODE_UNSUPPORTED_BRIDGE_VERSION', () => {
            const infoStub = sandbox.stub(console, 'info');
            sandbox.stub(inputs, 'POLARIS_ASSESSMENT_MODE').value('SOURCE_UPLOAD');
            sandbox.stub(constants, 'ASSESSMENT_MODE_UNSUPPORTED_BRIDGE_VERSION').value('3.8.0');

            utility.validateSourceUploadValue('3.7.9');

            expect(infoStub.called).to.be.false;
        });

        it('should not show info message when assessment mode is null', () => {
            const infoStub = sandbox.stub(console, 'info');
            sandbox.stub(inputs, 'POLARIS_ASSESSMENT_MODE').value(null);
            sandbox.stub(constants, 'ASSESSMENT_MODE_UNSUPPORTED_BRIDGE_VERSION').value('3.8.0');

            utility.validateSourceUploadValue('3.8.0');

            expect(infoStub.called).to.be.false;
        });

        it('should not show info message when assessment mode is undefined', () => {
            const infoStub = sandbox.stub(console, 'info');
            sandbox.stub(inputs, 'POLARIS_ASSESSMENT_MODE').value(undefined);
            sandbox.stub(constants, 'ASSESSMENT_MODE_UNSUPPORTED_BRIDGE_VERSION').value('3.8.0');

            utility.validateSourceUploadValue('3.8.0');

            expect(infoStub.called).to.be.false;
        });

        it('should not show info message when assessment mode is empty string', () => {
            const infoStub = sandbox.stub(console, 'info');
            sandbox.stub(inputs, 'POLARIS_ASSESSMENT_MODE').value('');
            sandbox.stub(constants, 'ASSESSMENT_MODE_UNSUPPORTED_BRIDGE_VERSION').value('3.8.0');

            utility.validateSourceUploadValue('3.8.0');

            expect(infoStub.called).to.be.false;
        });
    });

    describe('updateCoverityConfigForBridgeVersion', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('fs');
        let tempFile: string;

        afterEach(() => {
            if (tempFile && fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        });

        it('should convert new format to legacy for Bridge CLI < 3.9.0', function () {
            tempFile = '/tmp/test_coverity_input.json';
            const testData = {
                data: {
                    coverity: {
                        prcomment: {
                            enabled: true,
                            impacts: ['HIGH', 'MEDIUM']
                        }
                    }
                }
            };

            fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

            updateCoverityConfigForBridgeVersion('coverity_input.json', '3.8.0', tempFile);

            const updatedData = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));

            expect(updatedData.data.coverity.automation).to.deep.equal({ prcomment: true });
            expect(updatedData.data.coverity.prcomment).to.be.undefined;
        });

        it('should preserve new format for Bridge CLI >= 3.9.0', function () {
            tempFile = '/tmp/test_coverity_input2.json';
            const testData = {
                data: {
                    coverity: {
                        prcomment: {
                            enabled: true,
                            impacts: ['HIGH', 'MEDIUM']
                        }
                    }
                }
            };

            fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

            updateCoverityConfigForBridgeVersion('coverity_input.json', '3.9.0', tempFile);

            const updatedData = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));

            expect(updatedData.data.coverity.prcomment).to.deep.equal({
                enabled: true,
                impacts: ['HIGH', 'MEDIUM']
            });
            expect(updatedData.data.coverity.automation).to.be.undefined;
        });
    });
});
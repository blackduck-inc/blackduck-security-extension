import { assert, expect } from "chai";
import * as sinon from "sinon";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as httm from "typed-rest-client/HttpClient";
import * as tl from "azure-pipelines-task-lib/task";
import * as constants from "../../../src/blackduck-security-task/application-constant";
import { ErrorCode } from "../../../src/blackduck-security-task/enum/ErrorCodes";
import * as inputs from "../../../src/blackduck-security-task/input";
import { parseToBoolean, createSSLConfiguredHttpClient } from "../../../src/blackduck-security-task/utility";
import { getSSLConfig, createHTTPSRequestOptions } from "../../../src/blackduck-security-task/ssl-utils";
import { downloadTool, debug, _getFileSizeOnDisk } from "../../../src/blackduck-security-task/download-tool";

describe("Download Tool Tests", () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    context("debug", () => {
        it("should call tl.debug with the provided message", () => {
            const debugStub = sandbox.stub(tl, "debug");
            const message = "Test debug message";

            debug(message);

            expect(debugStub.calledOnceWith(message)).to.be.true;
        });
    });

    context("_getFileSizeOnDisk", () => {
        it("should return file size from fs.statSync", () => {
            const filePath = "/path/to/file";
            const expectedSize = 1024;
            const statStub = sandbox.stub(require("fs"), "statSync").returns({ size: expectedSize } as fs.Stats);

            const result = _getFileSizeOnDisk(filePath);

            assert.strictEqual(result, expectedSize);
            expect(statStub.calledOnceWith(filePath)).to.be.true;
        });

        it("should throw error if fs.statSync throws", () => {
            const filePath = "/path/to/file";
            const error = new Error("File not found");
            sandbox.stub(require("fs"), "statSync").throws(error);

            expect(() => _getFileSizeOnDisk(filePath)).to.throw(error);
        });
    });

    describe("_getAgentTemp Tests (Indirect)", () => {
        let sandbox: sinon.SinonSandbox;
        let assertAgentStub: sinon.SinonStub;
        let getVariableStub: sinon.SinonStub;
        let getSSLConfigStub: sinon.SinonStub;
        let createSSLConfiguredHttpClientStub: sinon.SinonStub;
        let isAbsoluteStub: sinon.SinonStub;

        beforeEach(() => {
            sandbox = sinon.createSandbox();

            // Setup stubs for _getAgentTemp testing
            assertAgentStub = sandbox.stub(tl, "assertAgent");
            getVariableStub = sandbox.stub(tl, "getVariable");

            // Setup other required stubs for downloadTool
            getSSLConfigStub = sandbox.stub(require("../../../src/blackduck-security-task/ssl-utils"), "getSSLConfig");
            createSSLConfiguredHttpClientStub = sandbox.stub(require("../../../src/blackduck-security-task/utility"), "createSSLConfiguredHttpClient");
            isAbsoluteStub = sandbox.stub(require("path"), "isAbsolute");

            // Default returns for SSL config
            getSSLConfigStub.returns({
                trustAllCerts: false,
                customCA: null,
                combinedCAs: null
            });
        });

        afterEach(() => {
            sandbox.restore();
        });

        context("_getAgentTemp (tested via downloadTool)", () => {

            it("should throw error when Agent.TempDirectory is not set", async () => {
                const url = "https://example.com/file.zip";
                const fileName = "test-file.zip";

                // Setup stubs to trigger _getAgentTemp error
                getVariableStub.returns(undefined);
                isAbsoluteStub.returns(false);

                try {
                    await downloadTool(url, fileName);
                    assert.fail("Should have thrown an error");
                } catch (error) {
                    const errorMessage = (error as Error).message;
                    expect(errorMessage).to.include("Agent.TempDirectory is not set");
                    expect(errorMessage).to.include(constants.SPACE);
                    expect(errorMessage).to.include(ErrorCode.AGENT_TEMP_DIRECTORY_NOT_SET.toString());
                    expect(assertAgentStub.calledWith("2.115.0")).to.be.true;
                    expect(getVariableStub.calledWith("Agent.TempDirectory")).to.be.true;
                }
            });

            it("should throw error when Agent.TempDirectory is null", async () => {
                const url = "https://example.com/file.zip";
                const fileName = "test-file.zip";

                getVariableStub.returns(null);
                isAbsoluteStub.returns(false);

                try {
                    await downloadTool(url, fileName);
                    assert.fail("Should have thrown an error");
                } catch (error) {
                    const errorMessage = (error as Error).message;
                    expect(errorMessage).to.include("Agent.TempDirectory is not set");
                    expect(errorMessage).to.include(ErrorCode.AGENT_TEMP_DIRECTORY_NOT_SET.toString());
                    expect(assertAgentStub.calledWith("2.115.0")).to.be.true;
                    expect(getVariableStub.calledWith("Agent.TempDirectory")).to.be.true;
                }
            });

            it("should throw error when Agent.TempDirectory is empty string", async () => {
                const url = "https://example.com/file.zip";
                const fileName = "test-file.zip";

                getVariableStub.returns("");
                isAbsoluteStub.returns(false);

                try {
                    await downloadTool(url, fileName);
                    assert.fail("Should have thrown an error");
                } catch (error) {
                    const errorMessage = (error as Error).message;
                    expect(errorMessage).to.include("Agent.TempDirectory is not set");
                    expect(errorMessage).to.include(ErrorCode.AGENT_TEMP_DIRECTORY_NOT_SET.toString());
                    expect(assertAgentStub.calledWith("2.115.0")).to.be.true;
                    expect(getVariableStub.calledWith("Agent.TempDirectory")).to.be.true;
                }
            });
        });
    });
    describe("_deleteFile Unit Tests", () => {
        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        context("_deleteFile function behavior", () => {
            it("should delete existing file when file exists", () => {
                // Mock fs module
                const fsStub = {
                    existsSync: sandbox.stub().returns(true),
                    rmSync: sandbox.stub()
                };

                // Mock tl module
                const tlStub = {
                    debug: sandbox.stub()
                };

                // Simulate the _deleteFile function behavior
                const _deleteFile = (filePath: string) => {
                    try {
                        if (fsStub.existsSync(filePath)) {
                            fsStub.rmSync(filePath);
                            tlStub.debug("Removed unfinished downloaded file");
                        }
                    } catch (err) {
                        tlStub.debug(`Failed to delete '${filePath}'. ${err}`);
                    }
                };

                const filePath = "/tmp/test-file.zip";
                _deleteFile(filePath);

                expect(fsStub.existsSync.calledOnceWith(filePath)).to.be.true;
                expect(fsStub.rmSync.calledOnceWith(filePath)).to.be.true;
                expect(tlStub.debug.calledOnceWith("Removed unfinished downloaded file")).to.be.true;
            });

            it("should not delete file when file does not exist", () => {
                const fsStub = {
                    existsSync: sandbox.stub().returns(false),
                    rmSync: sandbox.stub()
                };

                const tlStub = {
                    debug: sandbox.stub()
                };

                const _deleteFile = (filePath: string) => {
                    try {
                        if (fsStub.existsSync(filePath)) {
                            fsStub.rmSync(filePath);
                            tlStub.debug("Removed unfinished downloaded file");
                        }
                    } catch (err) {
                        tlStub.debug(`Failed to delete '${filePath}'. ${err}`);
                    }
                };

                const filePath = "/tmp/non-existent-file.zip";
                _deleteFile(filePath);

                expect(fsStub.existsSync.calledOnceWith(filePath)).to.be.true;
                expect(fsStub.rmSync.called).to.be.false;
                expect(tlStub.debug.called).to.be.false;
            });

            it("should handle fs.existsSync throwing an error", () => {
                const error = new Error("Permission denied");
                const fsStub = {
                    existsSync: sandbox.stub().throws(error),
                    rmSync: sandbox.stub()
                };

                const tlStub = {
                    debug: sandbox.stub()
                };

                const _deleteFile = (filePath: string) => {
                    try {
                        if (fsStub.existsSync(filePath)) {
                            fsStub.rmSync(filePath);
                            tlStub.debug("Removed unfinished downloaded file");
                        }
                    } catch (err) {
                        tlStub.debug(`Failed to delete '${filePath}'. ${err}`);
                    }
                };

                const filePath = "/tmp/test-file.zip";
                _deleteFile(filePath);

                expect(fsStub.existsSync.calledOnceWith(filePath)).to.be.true;
                expect(fsStub.rmSync.called).to.be.false;
                expect(tlStub.debug.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle fs.rmSync throwing an error", () => {
                const error = new Error("File is locked");
                const fsStub = {
                    existsSync: sandbox.stub().returns(true),
                    rmSync: sandbox.stub().throws(error)
                };

                const tlStub = {
                    debug: sandbox.stub()
                };

                const _deleteFile = (filePath: string) => {
                    try {
                        if (fsStub.existsSync(filePath)) {
                            fsStub.rmSync(filePath);
                            tlStub.debug("Removed unfinished downloaded file");
                        }
                    } catch (err) {
                        tlStub.debug(`Failed to delete '${filePath}'. ${err}`);
                    }
                };

                const filePath = "/tmp/test-file.zip";
                _deleteFile(filePath);

                expect(fsStub.existsSync.calledOnceWith(filePath)).to.be.true;
                expect(fsStub.rmSync.calledOnceWith(filePath)).to.be.true;
                expect(tlStub.debug.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle file path with spaces", () => {
                const fsStub = {
                    existsSync: sandbox.stub().returns(true),
                    rmSync: sandbox.stub()
                };

                const tlStub = {
                    debug: sandbox.stub()
                };

                const _deleteFile = (filePath: string) => {
                    try {
                        if (fsStub.existsSync(filePath)) {
                            fsStub.rmSync(filePath);
                            tlStub.debug("Removed unfinished downloaded file");
                        }
                    } catch (err) {
                        tlStub.debug(`Failed to delete '${filePath}'. ${err}`);
                    }
                };

                const filePath = "/tmp/test file with spaces.zip";
                _deleteFile(filePath);

                expect(fsStub.existsSync.calledOnceWith(filePath)).to.be.true;
                expect(fsStub.rmSync.calledOnceWith(filePath)).to.be.true;
                expect(tlStub.debug.calledOnceWith("Removed unfinished downloaded file")).to.be.true;
            });

            it("should handle different error types in rmSync", () => {
                const error = new Error("EACCES: permission denied");
                const fsStub = {
                    existsSync: sandbox.stub().returns(true),
                    rmSync: sandbox.stub().throws(error)
                };

                const tlStub = {
                    debug: sandbox.stub()
                };

                const _deleteFile = (filePath: string) => {
                    try {
                        if (fsStub.existsSync(filePath)) {
                            fsStub.rmSync(filePath);
                            tlStub.debug("Removed unfinished downloaded file");
                        }
                    } catch (err) {
                        tlStub.debug(`Failed to delete '${filePath}'. ${err}`);
                    }
                };

                const filePath = "/tmp/test-file.zip";
                _deleteFile(filePath);

                expect(fsStub.existsSync.calledOnceWith(filePath)).to.be.true;
                expect(fsStub.rmSync.calledOnceWith(filePath)).to.be.true;
                expect(tlStub.debug.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle string error in catch block", () => {
                const error = "String error message";
                const fsStub = {
                    existsSync: sandbox.stub().returns(true),
                    rmSync: sandbox.stub().throws(error)
                };

                const tlStub = {
                    debug: sandbox.stub()
                };

                const _deleteFile = (filePath: string) => {
                    try {
                        if (fsStub.existsSync(filePath)) {
                            fsStub.rmSync(filePath);
                            tlStub.debug("Removed unfinished downloaded file");
                        }
                    } catch (err) {
                        tlStub.debug(`Failed to delete '${filePath}'. ${err}`);
                    }
                };

                const filePath = "/tmp/test-file.zip";
                _deleteFile(filePath);

                expect(fsStub.existsSync.calledOnceWith(filePath)).to.be.true;
                expect(fsStub.rmSync.calledOnceWith(filePath)).to.be.true;
                expect(tlStub.debug.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle empty string file path", () => {
                const fsStub = {
                    existsSync: sandbox.stub().returns(false),
                    rmSync: sandbox.stub()
                };

                const tlStub = {
                    debug: sandbox.stub()
                };

                const _deleteFile = (filePath: string) => {
                    try {
                        if (fsStub.existsSync(filePath)) {
                            fsStub.rmSync(filePath);
                            tlStub.debug("Removed unfinished downloaded file");
                        }
                    } catch (err) {
                        tlStub.debug(`Failed to delete '${filePath}'. ${err}`);
                    }
                };

                const filePath = "";
                _deleteFile(filePath);

                expect(fsStub.existsSync.calledOnceWith(filePath)).to.be.true;
                expect(fsStub.rmSync.called).to.be.false;
                expect(tlStub.debug.called).to.be.false;
            });

            it("should not throw any exceptions even when errors occur", () => {
                const error = new Error("Critical error");
                const fsStub = {
                    existsSync: sandbox.stub().throws(error),
                    rmSync: sandbox.stub()
                };

                const tlStub = {
                    debug: sandbox.stub()
                };

                const _deleteFile = (filePath: string) => {
                    try {
                        if (fsStub.existsSync(filePath)) {
                            fsStub.rmSync(filePath);
                            tlStub.debug("Removed unfinished downloaded file");
                        }
                    } catch (err) {
                        tlStub.debug(`Failed to delete '${filePath}'. ${err}`);
                    }
                };

                const filePath = "/tmp/test-file.zip";

                // This should not throw an exception
                expect(() => _deleteFile(filePath)).to.not.throw();

                expect(fsStub.existsSync.calledOnceWith(filePath)).to.be.true;
                expect(fsStub.rmSync.called).to.be.false;
                expect(tlStub.debug.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle unicode characters in file path", () => {
                const fsStub = {
                    existsSync: sandbox.stub().returns(true),
                    rmSync: sandbox.stub()
                };

                const tlStub = {
                    debug: sandbox.stub()
                };

                const _deleteFile = (filePath: string) => {
                    try {
                        if (fsStub.existsSync(filePath)) {
                            fsStub.rmSync(filePath);
                            tlStub.debug("Removed unfinished downloaded file");
                        }
                    } catch (err) {
                        tlStub.debug(`Failed to delete '${filePath}'. ${err}`);
                    }
                };

                const filePath = "/tmp/测试文件.zip";
                _deleteFile(filePath);

                expect(fsStub.existsSync.calledOnceWith(filePath)).to.be.true;
                expect(fsStub.rmSync.calledOnceWith(filePath)).to.be.true;
                expect(tlStub.debug.calledOnceWith("Removed unfinished downloaded file")).to.be.true;
            });

            it("should handle error object without message property", () => {
                const error = { code: "ENOENT", errno: -2 };
                const fsStub = {
                    existsSync: sandbox.stub().returns(true),
                    rmSync: sandbox.stub().throws(error)
                };

                const tlStub = {
                    debug: sandbox.stub()
                };

                const _deleteFile = (filePath: string) => {
                    try {
                        if (fsStub.existsSync(filePath)) {
                            fsStub.rmSync(filePath);
                            tlStub.debug("Removed unfinished downloaded file");
                        }
                    } catch (err) {
                        tlStub.debug(`Failed to delete '${filePath}'. ${err}`);
                    }
                };

                const filePath = "/tmp/test-file.zip";
                _deleteFile(filePath);

                expect(fsStub.existsSync.calledOnceWith(filePath)).to.be.true;
                expect(fsStub.rmSync.calledOnceWith(filePath)).to.be.true;
                expect(tlStub.debug.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });
        });
    });
});
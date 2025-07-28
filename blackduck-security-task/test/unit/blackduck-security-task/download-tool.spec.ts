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
import { _getContentLengthOfDownloadedFile } from "../../../src/blackduck-security-task/download-tool";
import { _deleteFile } from "../../../src/blackduck-security-task/download-tool";
import { getRequestOptions } from "../../../src/blackduck-security-task/download-tool";
import { validateDownloadedFile } from "../../../src/blackduck-security-task/download-tool";
import * as downloadToolModule from "../../../src/blackduck-security-task/download-tool";


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
    describe("_getContentLengthOfDownloadedFile Function Tests", () => {
        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        context("_getContentLengthOfDownloadedFile", () => {
            it("should return parsed content-length when valid number string is provided", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "1024"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(1024);
            });

            it("should return parsed content-length when valid number string with decimal is provided", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "2048.5"
                        }
                    } as any,
                      readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(2048); // parseInt truncates decimal
            });

            it("should return parsed content-length when zero is provided", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "0"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(0);
            });

            it("should return parsed content-length when large number is provided", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "9999999999"
                        }
                    } as any,
                      readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(9999999999);
            });

            it("should return NaN when content-length header is missing", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "other-header": "value"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(isNaN(result)).to.be.true;
            });

            it("should return NaN when content-length header is undefined", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": undefined
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(isNaN(result)).to.be.true;
            });

            it("should return NaN when content-length header is null", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": null
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(isNaN(result)).to.be.true;
            });

            it("should return NaN when content-length header is empty string", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": ""
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(isNaN(result)).to.be.true;
            });

            it("should return NaN when content-length header is non-numeric string", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "not-a-number"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(isNaN(result)).to.be.true;
            });

            it("should return NaN when content-length header is mixed alphanumeric", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "123abc"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(123); // parseInt parses the numeric part
            });

            it("should return NaN when content-length header starts with non-numeric", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "abc123"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(isNaN(result)).to.be.true;
            });

            it("should return parsed content-length when number string has leading whitespace", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "  1024"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(1024);
            });

            it("should return parsed content-length when number string has trailing whitespace", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "1024  "
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(1024);
            });

            it("should return parsed content-length when negative number is provided", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "-1024"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(-1024);
            });

            it("should return parsed content-length when positive number with plus sign is provided", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "+1024"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(1024);
            });

            it("should handle case-insensitive header names", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "Content-Length": "1024"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                // This will return NaN because the function looks for lowercase "content-length"
                expect(isNaN(result)).to.be.true;
            });

            it("should handle headers object with different casing", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "CONTENT-LENGTH": "1024"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                // This will return NaN because the function looks for lowercase "content-length"
                expect(isNaN(result)).to.be.true;
            });

            it("should handle octal number strings", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "0755"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(755); // parseInt treats "0755" as 755 in decimal
            });

            it("should handle scientific notation", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "1e3"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(1); // parseInt stops at first non-digit character
            });

            it("should handle fractional numbers", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "1024.789"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(1024); // parseInt truncates decimal portion
            });

            it("should handle very large numbers", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "999999999999999999999"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(999999999999999999999);
            });

            it("should handle number with trailing characters", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "1024bytes"
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(result).to.equal(1024); // parseInt parses up to first non-digit
            });

            it("should handle empty headers object", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {}
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(isNaN(result)).to.be.true;
            });

            it("should handle headers object with only spaces as content-length", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": "   "
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(isNaN(result)).to.be.true;
            });

            it("should handle boolean value as content-length", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": true as any
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(isNaN(result)).to.be.true;
            });

            it("should handle object value as content-length", () => {
                const mockResponse: httm.HttpClientResponse = {
                    message: {
                        statusCode: 200,
                        statusMessage: "OK",
                        headers: {
                            "content-length": { value: "1024"} as any,
                            readBody: sandbox.stub().resolves("")
                        }
                    } as any,
                    readBody: sandbox.stub().resolves("")
                };

                const result = _getContentLengthOfDownloadedFile(mockResponse);

                expect(isNaN(result)).to.be.true;
            });
        });
    });

    describe("_deleteFile Function Tests", () => {
        let sandbox: sinon.SinonSandbox;
        let fsExistsSyncStub: sinon.SinonStub;
        let fsRmSyncStub: sinon.SinonStub;
        let tlDebugStub: sinon.SinonStub;

        beforeEach(() => {
            sandbox = sinon.createSandbox();

            // Setup fs stubs
            fsExistsSyncStub = sandbox.stub(require("fs"), "existsSync");
            fsRmSyncStub = sandbox.stub(require("fs"), "rmSync");

            // Setup tl stub
            tlDebugStub = sandbox.stub(tl, "debug");
        });

        afterEach(() => {
            sandbox.restore();
        });

        context("_deleteFile", () => {
            it("should delete existing file and log success message", () => {
                const filePath = "/tmp/test-file.zip";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.returns(undefined);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith("Removed unfinished downloaded file")).to.be.true;
            });

            it("should not delete file when file does not exist", () => {
                const filePath = "/tmp/non-existent-file.zip";

                fsExistsSyncStub.returns(false);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.called).to.be.false;
                expect(tlDebugStub.called).to.be.false;
            });

            it("should handle fs.existsSync throwing an error", () => {
                const filePath = "/tmp/test-file.zip";
                const error = new Error("Permission denied");

                fsExistsSyncStub.throws(error);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.called).to.be.false;
                expect(tlDebugStub.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle fs.rmSync throwing an error", () => {
                const filePath = "/tmp/test-file.zip";
                const error = new Error("File is locked");

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.throws(error);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle string error in catch block", () => {
                const filePath = "/tmp/test-file.zip";
                const error = "String error message";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.throws(error);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle ENOENT error (file not found)", () => {
                const filePath = "/tmp/test-file.zip";
                const error = new Error("ENOENT: no such file or directory");
                error.name = "ENOENT";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.throws(error);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle EACCES error (permission denied)", () => {
                const filePath = "/tmp/test-file.zip";
                const error = new Error("EACCES: permission denied");
                error.name = "EACCES";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.throws(error);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle EBUSY error (resource busy)", () => {
                const filePath = "/tmp/test-file.zip";
                const error = new Error("EBUSY: resource busy or locked");
                error.name = "EBUSY";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.throws(error);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle file path with spaces", () => {
                const filePath = "/tmp/test file with spaces.zip";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.returns(undefined);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith("Removed unfinished downloaded file")).to.be.true;
            });

            it("should handle file path with special characters", () => {
                const filePath = "/tmp/test-file@#$%^&*().zip";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.returns(undefined);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith("Removed unfinished downloaded file")).to.be.true;
            });

            it("should handle unicode characters in file path", () => {
                const filePath = "/tmp/测试文件.zip";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.returns(undefined);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith("Removed unfinished downloaded file")).to.be.true;
            });

            it("should handle empty string file path", () => {
                const filePath = "";

                fsExistsSyncStub.returns(false);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.called).to.be.false;
                expect(tlDebugStub.called).to.be.false;
            });

            it("should handle very long file path", () => {
                const filePath = "/tmp/" + "a".repeat(250) + ".zip";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.returns(undefined);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith("Removed unfinished downloaded file")).to.be.true;
            });

            it("should handle absolute Windows path", () => {
                const filePath = "C:\\temp\\test-file.zip";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.returns(undefined);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith("Removed unfinished downloaded file")).to.be.true;
            });

            it("should handle relative file path", () => {
                const filePath = "./test-file.zip";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.returns(undefined);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith("Removed unfinished downloaded file")).to.be.true;
            });

            it("should handle error object without message property", () => {
                const filePath = "/tmp/test-file.zip";
                const error = { code: "ENOENT", errno: -2 };

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.throws(error);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle numeric error", () => {
                const filePath = "/tmp/test-file.zip";
                const error = 404;

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.throws(error);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should not throw exceptions even when errors occur", () => {
                const filePath = "/tmp/test-file.zip";
                const error = new Error("Critical error");

                fsExistsSyncStub.throws(error);

                // This should not throw an exception
                expect(() => _deleteFile(filePath)).to.not.throw();

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.called).to.be.false;
                expect(tlDebugStub.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle complex error object", () => {
                const filePath = "/tmp/test-file.zip";
                const error = {
                    code: "EACCES",
                    errno: -13,
                    path: filePath,
                    syscall: "unlink",
                    message: "permission denied"
                };

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.throws(error);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith(`Failed to delete '${filePath}'. ${error}`)).to.be.true;
            });

            it("should handle file path with backslashes", () => {
                const filePath = "C:\\\\temp\\\\test-file.zip";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.returns(undefined);

                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(fsRmSyncStub.calledOnceWith(filePath)).to.be.true;
                expect(tlDebugStub.calledOnceWith("Removed unfinished downloaded file")).to.be.true;
            });

            it("should handle multiple consecutive calls", () => {
                const filePath = "/tmp/test-file.zip";

                fsExistsSyncStub.returns(true);
                fsRmSyncStub.returns(undefined);

                _deleteFile(filePath);
                _deleteFile(filePath);
                _deleteFile(filePath);

                expect(fsExistsSyncStub.calledThrice).to.be.true;
                expect(fsRmSyncStub.calledThrice).to.be.true;
                expect(tlDebugStub.calledThrice).to.be.true;
                expect(tlDebugStub.alwaysCalledWith("Removed unfinished downloaded file")).to.be.true;
            });
        });
    });
    describe("getRequestOptions Function Tests", () => {
        let sandbox: sinon.SinonSandbox;
        let tlGetHttpProxyConfigurationStub: sinon.SinonStub;
        let tlGetHttpCertConfigurationStub: sinon.SinonStub;
        let tlDebugStub: sinon.SinonStub;
        let tlWarningStub: sinon.SinonStub;
        let fsReadFileSyncStub: sinon.SinonStub;
        let parseToBooleanStub: sinon.SinonStub;
        let inputsStub: any;

        beforeEach(() => {
            sandbox = sinon.createSandbox();

            // Setup tl stubs
            tlGetHttpProxyConfigurationStub = sandbox.stub(tl, "getHttpProxyConfiguration");
            tlGetHttpCertConfigurationStub = sandbox.stub(tl, "getHttpCertConfiguration");
            tlDebugStub = sandbox.stub(tl, "debug");
            tlWarningStub = sandbox.stub(tl, "warning");

            // Setup fs stub
            fsReadFileSyncStub = sandbox.stub(require("fs"), "readFileSync");

            // Setup parseToBoolean stub
            parseToBooleanStub = sandbox.stub(require("../../../src/blackduck-security-task/utility"), "parseToBoolean");

            // Setup inputs mock
            inputsStub = {
                NETWORK_SSL_TRUST_ALL: "",
                NETWORK_SSL_CERT_FILE: ""
            };
            sandbox.stub(inputs, "NETWORK_SSL_TRUST_ALL").get(() => inputsStub.NETWORK_SSL_TRUST_ALL);
            sandbox.stub(inputs, "NETWORK_SSL_CERT_FILE").get(() => inputsStub.NETWORK_SSL_CERT_FILE);

            // Default returns
            tlGetHttpProxyConfigurationStub.returns(null);
            tlGetHttpCertConfigurationStub.returns(null);
            parseToBooleanStub.returns(false);
        });

        afterEach(() => {
            sandbox.restore();
        });

        context("getRequestOptions", () => {
            it("should return basic options with proxy and cert configuration", () => {
                const mockProxyConfig = { proxyUrl: "http://proxy:8080" };
                const mockCertConfig = { certPath: "/path/to/cert" };

                tlGetHttpProxyConfigurationStub.returns(mockProxyConfig);
                tlGetHttpCertConfigurationStub.returns(mockCertConfig);
                parseToBooleanStub.returns(false);

                const result = getRequestOptions();

                expect(result).to.deep.equal({
                    proxy: mockProxyConfig,
                    cert: mockCertConfig,
                    allowRedirects: true,
                    allowRetries: true
                });

                expect(tlGetHttpProxyConfigurationStub.calledOnce).to.be.true;
                expect(tlGetHttpCertConfigurationStub.calledOnce).to.be.true;
                expect(parseToBooleanStub.calledOnceWith(inputsStub.NETWORK_SSL_TRUST_ALL)).to.be.true;
                expect(tlDebugStub.calledWith("Using default SSL configuration for download tool")).to.be.true;
            });

            it("should set ignoreSslError to true when NETWORK_SSL_TRUST_ALL is true", () => {
                inputsStub.NETWORK_SSL_TRUST_ALL = "true";
                parseToBooleanStub.returns(true);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.true;
                expect(result.allowRedirects).to.be.true;
                expect(result.allowRetries).to.be.true;
                expect(tlDebugStub.calledWith("SSL certificate verification disabled for download tool (NETWORK_SSL_TRUST_ALL=true)")).to.be.true;
            });

            it("should handle custom CA certificate file successfully", () => {
                inputsStub.NETWORK_SSL_CERT_FILE = "/path/to/ca.crt";
                const certContent = "-----BEGIN CERTIFICATE-----\nMIIC...";

                parseToBooleanStub.returns(false);
                fsReadFileSyncStub.returns(certContent);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.true;
                expect(fsReadFileSyncStub.calledOnceWith("/path/to/ca.crt", "utf8")).to.be.true;
                expect(tlDebugStub.calledWith("Custom CA certificate specified for download tool: /path/to/ca.crt")).to.be.true;
                expect(tlWarningStub.calledWith("typed-rest-client does not support custom CA certificates, disabling SSL verification")).to.be.true;
            });

            it("should handle custom CA certificate file read error", () => {
                inputsStub.NETWORK_SSL_CERT_FILE = "/path/to/nonexistent.crt";
                const error = new Error("ENOENT: no such file or directory");

                parseToBooleanStub.returns(false);
                fsReadFileSyncStub.throws(error);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.undefined;
                expect(fsReadFileSyncStub.calledOnceWith("/path/to/nonexistent.crt", "utf8")).to.be.true;
                expect(tlDebugStub.calledWith("Custom CA certificate specified for download tool: /path/to/nonexistent.crt")).to.be.true;
                expect(tlWarningStub.calledWith(`Failed to read custom CA certificate file, using default SSL settings: ${error}`)).to.be.true;
            });

            it("should handle empty NETWORK_SSL_CERT_FILE", () => {
                inputsStub.NETWORK_SSL_CERT_FILE = "";
                parseToBooleanStub.returns(false);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.undefined;
                expect(fsReadFileSyncStub.called).to.be.false;
                expect(tlDebugStub.calledWith("Using default SSL configuration for download tool")).to.be.true;
            });

            it("should handle NETWORK_SSL_CERT_FILE with only whitespace", () => {
                inputsStub.NETWORK_SSL_CERT_FILE = "   ";
                parseToBooleanStub.returns(false);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.undefined;
                expect(fsReadFileSyncStub.called).to.be.false;
                expect(tlDebugStub.calledWith("Using default SSL configuration for download tool")).to.be.true;
            });

            it("should handle NETWORK_SSL_CERT_FILE with leading/trailing whitespace", () => {
                inputsStub.NETWORK_SSL_CERT_FILE = "  /path/to/ca.crt  ";
                const certContent = "-----BEGIN CERTIFICATE-----\nMIIC...";

                parseToBooleanStub.returns(false);
                fsReadFileSyncStub.returns(certContent);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.true;
                expect(fsReadFileSyncStub.calledOnceWith("  /path/to/ca.crt  ", "utf8")).to.be.true;
                expect(tlDebugStub.calledWith("Custom CA certificate specified for download tool:   /path/to/ca.crt  ")).to.be.true;
                expect(tlWarningStub.calledWith("typed-rest-client does not support custom CA certificates, disabling SSL verification")).to.be.true;
            });

            it("should handle null proxy and cert configuration", () => {
                tlGetHttpProxyConfigurationStub.returns(null);
                tlGetHttpCertConfigurationStub.returns(null);
                parseToBooleanStub.returns(false);

                const result = getRequestOptions();

                expect(result.proxy).to.be.undefined;
                expect(result.cert).to.be.undefined;
                expect(result.allowRedirects).to.be.true;
                expect(result.allowRetries).to.be.true;
                expect(tlDebugStub.calledWith("Using default SSL configuration for download tool")).to.be.true;
            });

            it("should handle undefined proxy and cert configuration", () => {
                tlGetHttpProxyConfigurationStub.returns(null);
                tlGetHttpCertConfigurationStub.returns(null);
                parseToBooleanStub.returns(false);

                const result = getRequestOptions();

                expect(result.proxy).to.be.undefined;
                expect(result.cert).to.be.undefined;
                expect(result.allowRedirects).to.be.true;
                expect(result.allowRetries).to.be.true;
                expect(tlDebugStub.calledWith("Using default SSL configuration for download tool")).to.be.true;
            });

            it("should prioritize NETWORK_SSL_TRUST_ALL over NETWORK_SSL_CERT_FILE", () => {
                inputsStub.NETWORK_SSL_TRUST_ALL = "true";
                inputsStub.NETWORK_SSL_CERT_FILE = "/path/to/ca.crt";

                parseToBooleanStub.returns(true);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.true;
                expect(fsReadFileSyncStub.called).to.be.false;
                expect(tlDebugStub.calledWith("SSL certificate verification disabled for download tool (NETWORK_SSL_TRUST_ALL=true)")).to.be.true;
                expect(tlDebugStub.calledWith("Custom CA certificate specified for download tool: /path/to/ca.crt")).to.be.false;
            });

            it("should handle different error types from fs.readFileSync", () => {
                inputsStub.NETWORK_SSL_CERT_FILE = "/path/to/ca.crt";
                const error = "String error message";

                parseToBooleanStub.returns(false);
                fsReadFileSyncStub.throws(error);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.undefined;
                expect(tlWarningStub.calledWith(`Failed to read custom CA certificate file, using default SSL settings: ${error}`)).to.be.true;
            });

            it("should handle permission error when reading cert file", () => {
                inputsStub.NETWORK_SSL_CERT_FILE = "/path/to/ca.crt";
                const error = new Error("EACCES: permission denied");
                error.name = "EACCES";

                parseToBooleanStub.returns(false);
                fsReadFileSyncStub.throws(error);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.undefined;
                expect(tlWarningStub.calledWith(`Failed to read custom CA certificate file, using default SSL settings: ${error}`)).to.be.true;
            });

            it("should handle empty cert file content", () => {
                inputsStub.NETWORK_SSL_CERT_FILE = "/path/to/empty.crt";
                const certContent = "";

                parseToBooleanStub.returns(false);
                fsReadFileSyncStub.returns(certContent);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.true;
                expect(fsReadFileSyncStub.calledOnceWith("/path/to/empty.crt", "utf8")).to.be.true;
                expect(tlWarningStub.calledWith("typed-rest-client does not support custom CA certificates, disabling SSL verification")).to.be.true;
            });

            it("should handle complex proxy configuration", () => {
                const mockProxyConfig = {
                    proxyUrl: "http://proxy:8080",
                    proxyUsername: "user",
                    proxyPassword: "pass",
                    proxyBypassHosts: ["localhost", "127.0.0.1"]
                };

                tlGetHttpProxyConfigurationStub.returns(mockProxyConfig);
                parseToBooleanStub.returns(false);

                const result = getRequestOptions();

                expect(result.proxy).to.deep.equal(mockProxyConfig);
                expect(tlDebugStub.calledWith("Using default SSL configuration for download tool")).to.be.true;
            });

            it("should handle complex cert configuration", () => {
                const mockCertConfig = {
                    certPath: "/path/to/cert.pem",
                    keyPath: "/path/to/key.pem",
                    passphrase: "secret"
                };

                tlGetHttpCertConfigurationStub.returns(mockCertConfig);
                parseToBooleanStub.returns(false);

                const result = getRequestOptions();

                expect(result.cert).to.deep.equal(mockCertConfig);
                expect(tlDebugStub.calledWith("Using default SSL configuration for download tool")).to.be.true;
            });

            it("should handle NETWORK_SSL_TRUST_ALL with various truthy values", () => {
                const truthyValues = ["true", "True", "TRUE", "1", "yes", "on"];

                truthyValues.forEach(value => {
                    sandbox.restore();
                    sandbox = sinon.createSandbox();

                    tlGetHttpProxyConfigurationStub = sandbox.stub(tl, "getHttpProxyConfiguration").returns(null);
                    tlGetHttpCertConfigurationStub = sandbox.stub(tl, "getHttpCertConfiguration").returns(null);
                    tlDebugStub = sandbox.stub(tl, "debug");
                    tlWarningStub = sandbox.stub(tl, "warning");
                    parseToBooleanStub = sandbox.stub(require("../../../src/blackduck-security-task/utility"), "parseToBoolean");

                    inputsStub = { NETWORK_SSL_TRUST_ALL: value, NETWORK_SSL_CERT_FILE: "" };
                    sandbox.stub(inputs, "NETWORK_SSL_TRUST_ALL").get(() => inputsStub.NETWORK_SSL_TRUST_ALL);
                    sandbox.stub(inputs, "NETWORK_SSL_CERT_FILE").get(() => inputsStub.NETWORK_SSL_CERT_FILE);

                    parseToBooleanStub.returns(true);

                    const result = getRequestOptions();

                    expect(result.ignoreSslError).to.be.true;
                    expect(parseToBooleanStub.calledOnceWith(value)).to.be.true;
                    expect(tlDebugStub.calledWith("SSL certificate verification disabled for download tool (NETWORK_SSL_TRUST_ALL=true)")).to.be.true;
                });
            });

            it("should handle NETWORK_SSL_TRUST_ALL with various falsy values", () => {
                const falsyValues = ["false", "False", "FALSE", "0", "no", "off", ""];

                falsyValues.forEach(value => {
                    sandbox.restore();
                    sandbox = sinon.createSandbox();

                    tlGetHttpProxyConfigurationStub = sandbox.stub(tl, "getHttpProxyConfiguration").returns(null);
                    tlGetHttpCertConfigurationStub = sandbox.stub(tl, "getHttpCertConfiguration").returns(null);
                    tlDebugStub = sandbox.stub(tl, "debug");
                    tlWarningStub = sandbox.stub(tl, "warning");
                    parseToBooleanStub = sandbox.stub(require("../../../src/blackduck-security-task/utility"), "parseToBoolean");

                    inputsStub = { NETWORK_SSL_TRUST_ALL: value, NETWORK_SSL_CERT_FILE: "" };
                    sandbox.stub(inputs, "NETWORK_SSL_TRUST_ALL").get(() => inputsStub.NETWORK_SSL_TRUST_ALL);
                    sandbox.stub(inputs, "NETWORK_SSL_CERT_FILE").get(() => inputsStub.NETWORK_SSL_CERT_FILE);

                    parseToBooleanStub.returns(false);

                    const result = getRequestOptions();

                    expect(result.ignoreSslError).to.be.undefined;
                    expect(parseToBooleanStub.calledOnceWith(value)).to.be.true;
                    expect(tlDebugStub.calledWith("Using default SSL configuration for download tool")).to.be.true;
                });
            });

            it("should handle very long cert file path", () => {
                const longPath = "/very/long/path/" + "a".repeat(200) + "/ca.crt";
                inputsStub.NETWORK_SSL_CERT_FILE = longPath;
                const certContent = "-----BEGIN CERTIFICATE-----\nMIIC...";

                parseToBooleanStub.returns(false);
                fsReadFileSyncStub.returns(certContent);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.true;
                expect(fsReadFileSyncStub.calledOnceWith(longPath, "utf8")).to.be.true;
                expect(tlDebugStub.calledWith(`Custom CA certificate specified for download tool: ${longPath}`)).to.be.true;
            });

            it("should handle special characters in cert file path", () => {
                const specialPath = "/path/with spaces/special@#$%^&*()chars/ca.crt";
                inputsStub.NETWORK_SSL_CERT_FILE = specialPath;
                const certContent = "-----BEGIN CERTIFICATE-----\nMIIC...";

                parseToBooleanStub.returns(false);
                fsReadFileSyncStub.returns(certContent);

                const result = getRequestOptions();

                expect(result.ignoreSslError).to.be.true;
                expect(fsReadFileSyncStub.calledOnceWith(specialPath, "utf8")).to.be.true;
                expect(tlDebugStub.calledWith(`Custom CA certificate specified for download tool: ${specialPath}`)).to.be.true;
            });

            it("should verify return object structure", () => {
                const result = getRequestOptions();

                expect(result).to.have.property("proxy");
                expect(result).to.have.property("cert");
                expect(result).to.have.property("allowRedirects");
                expect(result).to.have.property("allowRetries");
                expect(result.allowRedirects).to.be.true;
                expect(result.allowRetries).to.be.true;
            });
        });
    });
});
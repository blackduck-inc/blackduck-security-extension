// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {assert, expect} from "chai";
import * as sinon from "sinon";
import {SinonStub} from "sinon";
import {Bridge} from "../../../src/blackduck-security-task/bridge";
import * as utility from "../../../src/blackduck-security-task/utility";
import {extractZipped} from "../../../src/blackduck-security-task/utility";
import {DownloadFileResponse} from "../../../src/blackduck-security-task/model/download-file-response";
import * as path from "path";
import * as inputs from "../../../src/blackduck-security-task/input";
import {BridgeToolsParameter} from "../../../src/blackduck-security-task/tools-parameter";
import * as validator from "../../../src/blackduck-security-task/validator";
import * as constants from "../../../src/blackduck-security-task/application-constant";
import fs from "fs";
import * as taskLib from "azure-pipelines-task-lib";
import * as httpc from "typed-rest-client/HttpClient";
import * as ifm from "typed-rest-client/Interfaces";
import {IncomingMessage} from "http";
import {Socket} from "net";
import os from "os";
import { ErrorCode } from "../../../src/blackduck-security-task/enum/ErrorCodes";

describe("Bridge CLI test", () => {
    Object.defineProperty(constants, "RETRY_COUNT", {value: 3});
    Object.defineProperty(constants, "RETRY_DELAY_IN_MILLISECONDS", {value: 100});
    Object.defineProperty(constants, "NON_RETRY_HTTP_CODES", {value: new Set([200,201,401,403,416]), configurable: true});
    context('Bridge command preparation', () => {
        let sandbox: sinon.SinonSandbox;
        let bridge: Bridge;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should run successfully for polaris command preparation', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() =>
                Promise.resolve("./bridge --stage polaris --state polaris_input.json"));
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await bridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage polaris --state polaris_input.json")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
        });

        it('should fail with no scan type provied error', async function () {
            sandbox.stub(validator, "validateScanTypes").returns(["bridge_polaris_serverUrl", "bridge_coverity_connect_url","bridge_blackduck_url","bridge_srm_url"]);

            bridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).includes("Requires at least one scan type");
            })
        });

        it('should fail with mandatory parameter missing fields for polaris', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});

            sandbox.stub(validator, "validatePolarisInputs").returns([`[bridge_polaris_accessToken,bridge_polaris_application_name,bridge_polaris_project_name,bridge_polaris_assessment_types] - required parameters for polaris is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`]);

            bridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).includes("required parameters for polaris is missing");
                expect(errorObje.message).includes(ErrorCode.MISSING_REQUIRED_PARAMETERS.toString());
            })

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""})
        });

        it('should fail with mandatory parameter missing fields for polaris', async function () {
            expect(true).to.be.true;
            // TODO: Implement me once other scanning tools are also implemented
        });

        it('should fail with invalid assessment type error', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() => {
                throw new Error("Invalid value for bridge_polaris_assessment_types".concat(constants.SPACE).concat(ErrorCode.INVALID_POLARIS_ASSESSMENT_TYPES.toString()))
            });
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            bridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).includes("Invalid value for bridge_polaris_assessment_types");
                expect(errorObje.message).includes(ErrorCode.INVALID_POLARIS_ASSESSMENT_TYPES.toString());
            })

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""})
        });

        it('should fail with invalid failureSeverities type error', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'});

            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES', {value: ''});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => {
                throw new Error("Invalid value for failureSeverities".concat(constants.SPACE).concat(ErrorCode.INVALID_BLACKDUCK_SCA_FAILURE_SEVERITIES.toString()))
            });
            sandbox.stub(validator, "validateBlackDuckInputs").returns([]);

            try {
                await bridge.prepareCommand("/temp");
            } catch (e) {
                const errorObject = e as Error;
                expect(errorObject.message).includes("Invalid value for failureSeverities");
                expect(errorObject.message).includes(ErrorCode.INVALID_BLACKDUCK_SCA_FAILURE_SEVERITIES.toString());
            }

            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'});
        });

        // coverity test cases
        it('should run successfully for coverity command preparation', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForCoverity").callsFake(() => Promise.resolve("./bridge --stage connect --state coverity_input.json"));
            sandbox.stub(validator, "validateCoverityInputs").returns([]);

            const preparedCommand = await bridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage connect --state coverity_input.json")

            Object.defineProperty(inputs, 'COVERITY_URL', {value: ""});
        });

        it('should fail with mandatory parameter missing fields for coverity', async function () {

            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});
            sandbox.stub(validator, "validateCoverityInputs").returns([`[bridge_coverity_connect_user_password,bridge_coverity_connect_project_name,bridge_coverity_connect_stream_name] - required parameters for coverity is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`]);
            bridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).equals(`[bridge_coverity_connect_user_password,bridge_coverity_connect_project_name,bridge_coverity_connect_stream_name] - required parameters for coverity is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`);            })
            Object.defineProperty(inputs, 'COVERITY_URL', {value: ""})
        });

        // SRM test cases
        it('should run successfully for SRM command preparation', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForSrm").callsFake(() =>
                Promise.resolve("./bridge --stage srm --state srm_input.json"));
            sandbox.stub(validator, "validateSrmInputs").returns([]);

            const preparedCommand = await bridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage srm --state srm_input.json")

            Object.defineProperty(inputs, 'SRM_URL', {value: ""});
        });

        it('should fail with mandatory parameter missing fields for SRM', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'});

            sandbox.stub(validator, "validateSrmInputs").returns([`[bridge_srm_apikey, bridge_srm_assessment_types] - required parameters for SRM is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`]);

            bridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).equals(`[bridge_srm_apikey, bridge_srm_assessment_types] - required parameters for SRM is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`);
                expect(errorObje.message).includes(ErrorCode.MISSING_REQUIRED_PARAMETERS.toString());
            })
            Object.defineProperty(inputs, 'SRM_URL', {value: ""})
        });

        it('should fail with invalid assessment type error', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForSrm").callsFake(() => {
                throw new Error("Invalid value for bridge_srm_assessment_types".concat(constants.SPACE).concat(ErrorCode.INVALID_SRM_ASSESSMENT_TYPES.toString()))
            });
            sandbox.stub(validator, "validateSrmInputs").returns([]);
            try {
                await bridge.prepareCommand("/temp");
            } catch (e) {
                const errorObject = e as Error;
                expect(errorObject.message).includes("Invalid value for bridge_srm_assessment_types");
                expect(errorObject.message).includes(ErrorCode.INVALID_SRM_ASSESSMENT_TYPES.toString());
            }
            Object.defineProperty(inputs, 'SRM_URL', {value: ""})
        });

        // Classic editor test cases
        it('should run successfully for polaris command preparation for classic editor', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: "polaris"});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() =>
                Promise.resolve("./bridge --stage polaris --state polaris_input.json"));
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await bridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage polaris --state polaris_input.json")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: ""});
        });

        it('should run successfully for coverity command preparation for classic editor', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: "coverity"});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForCoverity").callsFake(() => Promise.resolve("./bridge --stage connect --state coverity_input.json"));
            sandbox.stub(validator, "validateCoverityInputs").returns([]);

            const preparedCommand = await bridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage connect --state coverity_input.json")

            Object.defineProperty(inputs, 'COVERITY_URL', {value: ""});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: ""});
        });

        it('should run successfully for blackduck command preparation for classic editor', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: "blackduck"});
            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => Promise.resolve("./bridge --stage blackduck --state bd_input.json"));
            sandbox.stub(validator, "validateBlackDuckInputs").returns([]);

            const preparedCommand = await bridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage blackduck --state bd_input.json")

            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: ""});
        });

        it('should run successfully for SRM command preparation for classic editor', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: "srm"});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForSrm").callsFake(() =>
                Promise.resolve("./bridge --stage srm --state srm_input.json"));
            sandbox.stub(validator, "validateSrmInputs").returns([]);

            const preparedCommand = await bridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage srm --state srm_input.json")

            Object.defineProperty(inputs, 'SRM_URL', {value: ""});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: ""});
        });

    });


});

describe("Download Bridge", () => {
    let sandbox: sinon.SinonSandbox;
    let bridgeUrl: string
    const osName = process.platform
    const cpuInfo = os.cpus()
    const isIntel = cpuInfo[0].model.includes("Intel")
    let bridgeDefaultPath = "";
    if (osName === "linux") {
        bridgeDefaultPath = path.join(process.env["HOME"] as string, constants.BRIDGE_CLI_DEFAULT_PATH_LINUX);
        bridgeUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/0.1.244/bridge-cli-0.1.244-linux64.zip"
    } else if (osName === "win32") {
        bridgeDefaultPath = path.join(
            process.env["USERPROFILE"] as string, constants.BRIDGE_CLI_DEFAULT_PATH_WINDOWS)
        bridgeUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/0.1.244/bridge-cli-0.1.244-win64.zip"
    } else if (osName === "darwin") {
        bridgeDefaultPath = path.join(
            process.env["HOME"] as string, constants.BRIDGE_CLI_DEFAULT_PATH_MAC)
            if (isIntel) {
                bridgeUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/0.1.244/bridge-cli-0.1.244-macosx.zip"
            } else {
                bridgeUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/0.1.244/bridge-cli-0.1.244-macos_arm.zip"
            }
    }

    context("air mode is enabled, executeBridgeCommand", () => {
        let bridge: Bridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
        });

        afterEach(() => {
            sandbox.restore();
        });
        it("Execute Bridge Command - linux/mac success BRIDGECLI_INSTALL_DIRECTORY_KEY empty", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(bridge, "getBridgeDefaultPath").resolves('')
            sandbox.stub(bridge, "setBridgeExecutablePath").resolves('')

            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: ''});
            bridge.executeBridgeCommand(bridgeDefaultPath, bridgeDefaultPath, bridgeDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("Bridge CLI executable file could not be found at")
                expect(errorObj.message).includes(ErrorCode.BRIDGE_EXECUTABLE_NOT_FOUND.toString())
            })
        });

        it("Execute Bridge Command - linux/mac success BRIDGECLI_INSTALL_DIRECTORY_KEY empty: failure", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(taskLib, "exist").returns(false)
            sandbox.stub(bridge, "getBridgeDefaultPath").resolves('/tmp')
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: ''});
            const res = bridge.getBridgePath().catch(errorObj => {
                console.log(errorObj.message)
                expect(errorObj.message).includes("Bridge CLI default directory does not exist")
                expect(errorObj.message).includes(ErrorCode.DEFAULT_DIRECTORY_NOT_FOUND.toString())
            })
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});
        });

        it("Execute Bridge Command - linux/mac success getDefaultDirectory empty: failure", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(taskLib, "exist").returns(false)
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: ''});
            sandbox.stub(bridge, "getBridgeDefaultPath").resolves('')
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            const res = bridge.getBridgePath().catch(errorObj => {
                console.log(errorObj.message)
                expect(errorObj.message).includes("Bridge CLI default directory does not exist")
                expect(errorObj.message).includes(ErrorCode.DEFAULT_DIRECTORY_NOT_FOUND.toString())
            })
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});
        });

        it("Execute Bridge Command - linux/mac success getDefaultDirectory empty: success", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(taskLib, "exist").returns(true)
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: '/Users/test'});
            sandbox.stub(bridge, "getBridgeDefaultPath").resolves('')
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            const res = bridge.getBridgePath();
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});
        });

        it("Execute Bridge Command - linux/mac success BRIDGECLI_INSTALL_DIRECTORY_KEY not empty", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(bridge, "getBridgeDefaultPath").resolves('/tmp')
            sandbox.stub(bridge, "setBridgeExecutablePath").resolves('/tmp')

            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: '/tmp/'});
            bridge.executeBridgeCommand(bridgeDefaultPath, bridgeDefaultPath, bridgeDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("does not exist")
                expect(errorObj.message).includes(ErrorCode.BRIDGE_EXECUTABLE_NOT_FOUND.toString())
            })
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});

        });

        it("Execute Bridge Command - exception", async () => {
            sandbox.stub(taskLib, "exec").rejects()
            sandbox.stub(bridge, "getBridgeDefaultPath").resolves('/tmp')
            sandbox.stub(bridge, "setBridgeExecutablePath").resolves('/tmp')
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: '/tmp/'});
            bridge.executeBridgeCommand(bridgeDefaultPath, bridgeDefaultPath, bridgeDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("Error")
            })
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});

        });
    })
    context("extractBridge", () => {
        let bridge: Bridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("returns the value of BRIDGECLI_INSTALL_DIRECTORY_KEY when it is defined and valid - success", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: bridgeDefaultPath,
            });
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});
            sandbox.stub(fs, "existsSync").returns(true);
            sandbox.stub(taskLib, "rmRF");
            sandbox.stub(utility, "extractZipped").returns(Promise.resolve(true));
            const downloadFileResponse = {} as DownloadFileResponse
            downloadFileResponse.filePath = bridgeDefaultPath
            const result = await bridge.extractBridge(downloadFileResponse);
            assert.equal(result, bridgeDefaultPath);
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: "",
            });
        });


    })

    context("executeBridgeCommand", () => {
        let bridge: Bridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
        });

        afterEach(() => {
            sandbox.restore();
        });
        it("Execute Bridge Command - linux/mac success", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(taskLib, "exist").returns(true);
            const res = await bridge.executeBridgeCommand(bridgeDefaultPath, bridgeDefaultPath, bridgeDefaultPath)
            assert.equal(res, 0)
        });

        it("Execute Bridge Command - linux/mac failure", async () => {
            sandbox.stub(taskLib, "exec").resolves(9)
            await bridge.executeBridgeCommand(bridgeDefaultPath, bridgeDefaultPath, bridgeDefaultPath)
                .catch(errorObj => {
                    console.log(errorObj.message)
                    expect(errorObj.message).includes("Bridge CLI executable file could not be found at")
                    expect(errorObj.message).includes(ErrorCode.BRIDGE_EXECUTABLE_NOT_FOUND.toString())
                })
        });
    })
    context("getBridgeUrl", () => {
        let bridge: Bridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("returns the value of BRIDGECLI_DOWNLOAD_URL when it is defined and valid", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: bridgeUrl,
            });

            sandbox.stub(validator, "validateBridgeUrl").returns(true);
            sandbox.stub(bridge, "checkIfBridgeVersionExists").returns(Promise.resolve(false));

            const result = await bridge.getBridgeUrl();
            assert.equal(result, bridgeUrl);
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("getBridgePath if BRIDGECLI_INSTALL_DIRECTORY_KEY is not empty", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: '/Users/test/bridgePath',
            });
            sandbox.stub(taskLib, "exist").returns(true)
            const result = await bridge.getBridgePath();
            assert.equal(result, "/Users/test/bridgePath");
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("getBridgePath if BRIDGECLI_INSTALL_DIRECTORY_KEY is empty", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: '',
            });
            const result = await bridge.getBridgePath();
            expect(result).contains("bridge-cli");
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("returns the value of BRIDGECLI_DOWNLOAD_URL when it is defined, valid and version exists", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: bridgeUrl,
            });

            sandbox.stub(validator, "validateBridgeUrl").returns(true);
            sandbox.stub(bridge, "checkIfBridgeVersionExists").returns(Promise.resolve(true));

            const result = await bridge.getBridgeUrl();
            assert.equal(result, "");
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("throws an error when BRIDGECLI_DOWNLOAD_URL is defined but invalid", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "invalid-url",
            });
            bridge.getBridgeUrl().catch(errorObj => {
                expect(errorObj.message).includes("Invalid URL")
            })

            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("returns the URL for the specified version when BRIDGECLI_DOWNLOAD_VERSION is defined and valid", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "0.1.244",
            });
            sandbox.stub(bridge, "validateBridgeVersion").returns(Promise.resolve(true));
            sandbox.stub(bridge, "getVersionUrl").returns(bridgeUrl);
            sandbox.stub(bridge, "checkIfBridgeVersionExists").returns(Promise.resolve(true));
            const result = await bridge.getBridgeUrl();
            expect(result).equals("");
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it("returns empty url when BRIDGECLI_DOWNLOAD_VERSION is defined, valid and exists", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "0.1.244",
            });
            sandbox.stub(bridge, "validateBridgeVersion").returns(Promise.resolve(true));
            sandbox.stub(bridge, "checkIfBridgeVersionExists").returns(Promise.resolve(true));
            sandbox.stub(bridge, "getVersionUrl").returns(bridgeUrl);
            const result = await bridge.getBridgeUrl();
            expect(result).equals("");
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it('should fail with mandatory parameter missing fields for blackduck', async function () {

            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'});
            sandbox.stub(validator, "validateBlackDuckInputs").returns([`[bridge_blackduck_url,bridge_blackduck_token] - required parameters for coverity is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`]);
            bridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).equals(`[bridge_blackduck_url,bridge_blackduck_token] - required parameters for coverity is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`);            })
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''})
        });

        it('should run successfully for blackduck command preparation', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'});
            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => Promise.resolve("./bridge --stage blackduck --state bd_input.json"));
            sandbox.stub(validator, "validateBlackDuckInputs").returns([]);

            const preparedCommand = await bridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage blackduck --state bd_input.json")

            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''});
        });


        it('should run successfully for blackduck and polaris command preparation', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'});

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() =>
                Promise.resolve("./bridge --stage polaris --state polaris_input.json"));
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => Promise.resolve(" --stage blackduck --state bd_input.json"));
            sandbox.stub(validator, "validateBlackDuckInputs").returns([]);

            const preparedCommand = await bridge.prepareCommand("/temp");
            console.log("preparedCommand::::" + preparedCommand)
            expect(preparedCommand).contains("./bridge --stage polaris --state polaris_input.json --stage blackduck --state bd_input.json")

            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''});
        });

        it("throws an error when BRIDGECLI_DOWNLOAD_VERSION is defined but invalid", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "invalid-version",
            });
            sandbox.stub(bridge, "validateBridgeVersion").returns(Promise.resolve(false));
            bridge.getBridgeUrl().catch(errorObj => {
                expect(errorObj.message).includes("Provided Bridge CLI version not found in artifactory")
            })
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it("returns the URL for the latest version when neither BRIDGECLI_DOWNLOAD_URL nor BRIDGECLI_DOWNLOAD_VERSION are defined", async () => {
            const bridgeUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/latest/bridge-cli"
            sandbox.stub(bridge, "getBridgeVersionFromLatestURL").returns(Promise.resolve("0.1.244"));
            sandbox.stub(bridge, "getVersionUrl").returns(bridgeUrl);
            sandbox.stub(bridge, "checkIfBridgeVersionExists").returns(Promise.resolve(false));
            const result = await bridge.getBridgeUrl();
            expect(result).contains(bridgeUrl);
        });

        it("returns the URL for the latest version when getBridgeVersionFromLatestURL is empty", async () => {

            sandbox.stub(bridge, "getBridgeVersionFromLatestURL").returns(Promise.resolve("/latest"));
            sandbox.stub(bridge, "getVersionUrl").returns("bridge-cli/latest/bridge-cli");
            const result = await bridge.getBridgeUrl();
            expect(result).contains("/latest");
        });

        it("returns the URL for the latest version when getBridgeVersionFromLatestURL is empty: failure", async () => {
            sandbox.stub(bridge, "getLatestVersionUrl").returns("");
            sandbox.stub(bridge, "getBridgeVersionFromLatestURL").returns(Promise.resolve(""));
            sandbox.stub(bridge, "getVersionUrl").returns("bridge-cli/0.0.0/bridge-cli-macosx.zip");
            sandbox.stub(bridge, "checkIfBridgeVersionExists").returns(Promise.resolve(false));
            const result = await bridge.getBridgeUrl().catch(errorObj => {
                expect(errorObj.message).contains("Invalid artifactory latest url");
            })
        });
    });

    context("validateBridgeVersion", () => {
        let bridge: Bridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
        });

        afterEach(() => {
            sandbox.restore();
        });
        const versionArray: string[] = [];
        versionArray.push("0.1.244")

        it("When version is available", async () => {
            sandbox.stub(bridge, "getAllAvailableBridgeVersions").returns(Promise.resolve(versionArray));
            const result = await bridge.validateBridgeVersion("0.1.244")
            expect(result).equals(true);
        });

        it("When version is not available", async () => {
            sandbox.stub(bridge, "getAllAvailableBridgeVersions").returns(Promise.resolve(versionArray));
            const result = await bridge.validateBridgeVersion("0.1.245")
            expect(result).equals(false);
        });
    });

    context("downloadBridge", () => {
        let bridge: Bridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("BRIDGECLI_DOWNLOAD_VERSION is defined and valid", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {value: "0.1.244"});
            bridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(bridge,"getBridgeUrl").returns(Promise.resolve(""))
            sandbox.stub(bridge,"getBridgeVersionFromLatestURL").returns(Promise.resolve("0.1.244"))
            sandbox.stub(bridge, "checkIfBridgeVersionExists").returns(Promise.resolve(true));

            const result = await bridge.downloadAndExtractBridge("/");
            assert.equal(result, bridgeDefaultPath);

            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "",
            });
            bridge.bridgeExecutablePath = "";
        });

        it("BRIDGECLI_DOWNLOAD_VERSION is not defined, get Bridge url - success", async () => {
            bridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(bridge, "checkIfBridgeVersionExists").returns(Promise.resolve(false));
            sandbox.stub(bridge, "getBridgeUrl").returns(Promise.resolve(bridgeUrl))

            const downloadFileResponse = {} as DownloadFileResponse
            downloadFileResponse.filePath = bridgeDefaultPath
            sandbox.stub(utility, "getRemoteFile").returns(Promise.resolve(downloadFileResponse))
            sandbox.stub(bridge, "extractBridge").returns(Promise.resolve(bridgeDefaultPath))

            const result = await bridge.downloadAndExtractBridge("/")
            assert.equal(result, bridgeDefaultPath);
        });

        it("BRIDGECLI_DOWNLOAD_URL is defined and invalid for current os", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/0.2.57/bridge-cli-0.2.57-win64.zip",
            });
            sandbox.stub(bridge, "checkIfBridgeVersionExists").returns(Promise.resolve(false));
            sandbox.stub(bridge, "getBridgeUrl").returns(Promise.resolve(bridgeUrl))

            const downloadFileResponse = {} as DownloadFileResponse
            downloadFileResponse.filePath = bridgeDefaultPath
            sandbox.stub(utility, "getRemoteFile").returns(Promise.resolve(downloadFileResponse))
            sandbox.stub(bridge, "extractBridge").throws(new Error("invalid url"))

            await bridge.downloadAndExtractBridge("/").catch(errorObj => {
                expect(errorObj.message).includes("Provided Bridge CLI url is not valid for the configured");
            })

            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("BRIDGECLI_DOWNLOAD_VERSION is not defined, valid without Bridge url", async () => {
            bridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(bridge, "checkIfBridgeVersionExists").returns(Promise.resolve(false));
            sandbox.stub(bridge, "getBridgeUrl").returns(Promise.resolve(undefined));

            const result = await bridge.downloadAndExtractBridge("/");
            assert.equal(result, bridgeDefaultPath);

            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it("BRIDGECLI_DOWNLOAD_VERSION is not defined, throw exception", async () => {
            bridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(bridge, "checkIfBridgeVersionExists").returns(Promise.resolve(false));
            sandbox.stub(bridge, "getBridgeUrl").throws(new Error("empty"));

            await bridge.downloadAndExtractBridge("/").catch(errorObj => {
                expect(errorObj.message).includes("Provided Bridge CLI URL cannot be empty");
                expect(errorObj.message).includes(ErrorCode.BRIDGE_CLI_URL_CANNOT_BE_EMPTY.toString());
            })
        });

        // include diagnostics test case
        it('should run successfully for include diagnostics command preparation', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'true'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() =>
                Promise.resolve("./bridge --stage polaris --state polaris_input.json"));
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await bridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage polaris --state polaris_input.json --diagnostics")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
        });

        it('should not add --diagnostics with invalid value in bridge-cli command', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'false'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() =>
                Promise.resolve("./bridge --stage polaris --state polaris_input.json"));
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await bridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage polaris --state polaris_input.json")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
        });


    });

    context("checkIfBridgeVersionExists", () => {
        let bridge: Bridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("BRIDGECLI_INSTALL_DIRECTORY_KEY is defined and valid", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {value: bridgeDefaultPath});
            bridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(bridge, "checkIfVersionExists").returns(Promise.resolve(true));
            sandbox.stub(taskLib, "exist").returns(true);

            const result = await bridge.checkIfBridgeVersionExists("0.1.244");
            assert.equal(result, true);

            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: "",
            });
            bridge.bridgeExecutablePath = "";
        });

        it("BRIDGECLI_INSTALL_DIRECTORY_KEY is defined and valid: windows", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {value: bridgeDefaultPath});
            Object.defineProperty(process, 'platform', {value: 'win32'});
            sandbox.stub(taskLib, "exist").returns(true)
            sandbox.stub(bridge, "checkIfVersionExists").returns(Promise.resolve(true));

            const result = await bridge.checkIfBridgeVersionExists("0.1.244");
            assert.equal(result, true);

            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: "",
            });
            bridge.bridgeExecutablePath = "";
        });

        it("BRIDGECLI_INSTALL_DIRECTORY_KEY is defined and valid and version does not exists", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {value: "/path/path"});
            bridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(taskLib, "exist").returns(true)
            sandbox.stub(bridge, "checkIfVersionExists").returns(Promise.resolve(false));
            const result = await bridge.checkIfBridgeVersionExists("0.1.244");
            assert.equal(result, false);

            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: "",
            });
            bridge.bridgeExecutablePath = "";
        });

        it("BRIDGECLI_INSTALL_DIRECTORY_KEY is not defined", async () => {
            sandbox.stub(bridge, "checkIfVersionExists").returns(Promise.resolve(true));
            sandbox.stub(taskLib, "exist").returns(true);
            const result = await bridge.checkIfBridgeVersionExists("0.1.244");
            assert.equal(result, true);
        });
    })
    context("checkIfVersionExists", () => {
        let bridge: Bridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("Check If Version Exists - success", async () => {

            sandbox.stub(fs, "readFileSync").returns('Bridge CLI Package: 0.1.1');

            const result = await bridge.checkIfVersionExists('0.1.1', bridgeDefaultPath);
            assert.equal(result, true);
        });

        it("Check If Version Exists - failure", async () => {

            sandbox.stub(fs, "readFileSync").returns('0.1.1');

            const result = await bridge.checkIfVersionExists('0.1.1', bridgeDefaultPath);
            assert.equal(result, false);
        });

        it("Check If Version Exists - exception", async () => {
            sandbox.stub(fs, "readFileSync").throws(new Error("file not found"))
            await bridge.checkIfVersionExists('0.1.1', bridgeDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("file not found")
            })
        });
    })

    context("getBridgeVersionFromLatestURL", () => {

        let httpClientStub: SinonStub<any[], Promise<httpc.HttpClientResponse>>;
        let bridge: Bridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
            httpClientStub = sinon.stub()
        });

        afterEach(() => {
            sinon.restore();
        });

        it("Get Latest Version - success", async () => {

            sandbox.stub(bridge, "getBridgeVersionFromLatestURL").returns(Promise.resolve('0.2.1'));

            const result = await bridge.getBridgeVersionFromLatestURL("https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/latest/bridge-cli-macosx.zip");
            assert.equal(result, '0.2.1');
        });

        it("Bridle cli latest version test: windows", async () => {
            const result = await bridge.getLatestVersionUrl();
            expect(result).contains('/latest/bridge-cli');
        });

        it('Test getBridgeVersionFromLatestURL -status 200', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 200
            const responseBody = "Bridge CLI Package:0.2.35\nbridge-cli: 0.2.35"

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').returns({
                get: httpClientStub,
            } as any);
            const result = await bridge.getBridgeVersionFromLatestURL("https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/latest/bridge-cli-macosx.zip")
            expect(result).contains('0.2.35')

        })

        it('Test getBridgeVersionFromLatestURL exception', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 200
            const responseBody = "Bridge CLI Package:0.2.35\nbridge-cli: 0.2.35"

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').throws({
                get: httpClientStub,
            } as any);


            const result = await bridge.getBridgeVersionFromLatestURL("https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/latest/bridge-cli-macosx.zip")
            expect(result).contains('')
        })

        it('Test getBridgeVersionFromLatestURL -status 500', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 500
            const responseBody = "error"

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').returns({
                get: httpClientStub,
            } as any);

            const result = await bridge.getBridgeVersionFromLatestURL("https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/latest/bridge-cli-macosx.zip")
            expect(result).contains('')
        })
    })

    context("getAllAvailableBridgeVersions", () => {

        let httpClientStub: SinonStub<any[], Promise<httpc.HttpClientResponse>>;
        let bridge: Bridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
            httpClientStub = sinon.stub()
        });

        afterEach(() => {
            sinon.restore();
        });

        it('Test getAllAvailableBridgeVersions -status 200', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 200
            const responseBody = "<a href=\"0.1.168/\">0.1.168/</a>\n" +
                "<a href=\"0.1.198/\">0.1.198/</a>\n" +
                "<a href=\"0.1.200/\">0.1.200/</a>\n" +
                "<a href=\"0.1.202/\">0.1.202/</a>\n" +
                "<a href=\"0.1.204/\">0.1.204/</a>"

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').returns({
                get: httpClientStub,
            } as any);
            const result = await bridge.getAllAvailableBridgeVersions()
            expect(result).contains('0.1.198')

        })

        it('Test getAllAvailableBridgeVersions -status 500', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 500
            const responseBody = "error"

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').returns({
                get: httpClientStub,
            } as any);

            const result = await bridge.getAllAvailableBridgeVersions()
            expect(result).empty
        })
    })
});
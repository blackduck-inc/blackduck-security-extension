// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {assert, expect} from "chai";
import * as sinon from "sinon";
import {SinonStub} from "sinon";
import {BridgeCli} from "../../../src/blackduck-security-task/bridge-cli";
import * as utility from "../../../src/blackduck-security-task/utility";
import {extractZipped} from "../../../src/blackduck-security-task/utility";
import {DownloadFileResponse} from "../../../src/blackduck-security-task/model/download-file-response";
import * as path from "path";
import * as inputs from "../../../src/blackduck-security-task/input";
import {BridgeCliToolsParameter} from "../../../src/blackduck-security-task/tools-parameter";
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
        let bridgeCli: BridgeCli;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridgeCli = new BridgeCli();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should run successfully for polaris command preparation', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() =>
                Promise.resolve("./bridge-cli --stage polaris --state polaris_input.json"));
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await bridgeCli.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge-cli --stage polaris --state polaris_input.json")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
        });

        it('should fail with no scan type provied error', async function () {
            sandbox.stub(validator, "validateScanTypes").returns(["bridge_polaris_serverUrl", "bridge_coverity_connect_url","bridge_blackduck_url","bridge_srm_url"]);

            bridgeCli.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).includes("Requires at least one scan type");
            })
        });

        it('should fail with mandatory parameter missing fields for polaris', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});

            sandbox.stub(validator, "validatePolarisInputs").returns([`[bridge_polaris_accessToken,bridge_polaris_application_name,bridge_polaris_project_name,bridge_polaris_assessment_types] - required parameters for polaris is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`]);

            bridgeCli.prepareCommand("/temp").catch(errorObje => {
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
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() => {
                throw new Error("Invalid value for bridge_polaris_assessment_types".concat(constants.SPACE).concat(ErrorCode.INVALID_POLARIS_ASSESSMENT_TYPES.toString()))
            });
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            bridgeCli.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).includes("Invalid value for bridge_polaris_assessment_types");
                expect(errorObje.message).includes(ErrorCode.INVALID_POLARIS_ASSESSMENT_TYPES.toString());
            })

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""})
        });

        it('should fail with invalid failureSeverities type error', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'});

            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES', {value: ''});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => {
                throw new Error("Invalid value for failureSeverities".concat(constants.SPACE).concat(ErrorCode.INVALID_BLACKDUCKSCA_FAILURE_SEVERITIES.toString()))
            });
            sandbox.stub(validator, "validateBlackDuckSCAInputs").returns([]);

            try {
                await bridgeCli.prepareCommand("/temp");
            } catch (e) {
                const errorObject = e as Error;
                expect(errorObject.message).includes("Invalid value for failureSeverities");
                expect(errorObject.message).includes(ErrorCode.INVALID_BLACKDUCKSCA_FAILURE_SEVERITIES.toString());
            }

            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'});
        });

        // coverity test cases
        it('should run successfully for coverity command preparation', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForCoverity").callsFake(() => Promise.resolve("./bridge-cli --stage connect --state coverity_input.json"));
            sandbox.stub(validator, "validateCoverityInputs").returns([]);

            const preparedCommand = await bridgeCli.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge-cli --stage connect --state coverity_input.json")

            Object.defineProperty(inputs, 'COVERITY_URL', {value: ""});
        });

        it('should fail with mandatory parameter missing fields for coverity', async function () {

            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});
            sandbox.stub(validator, "validateCoverityInputs").returns([`[bridge_coverity_connect_user_password,bridge_coverity_connect_project_name,bridge_coverity_connect_stream_name] - required parameters for coverity is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`]);
            bridgeCli.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).equals(`[bridge_coverity_connect_user_password,bridge_coverity_connect_project_name,bridge_coverity_connect_stream_name] - required parameters for coverity is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`);            })
            Object.defineProperty(inputs, 'COVERITY_URL', {value: ""})
        });

        // SRM test cases
        it('should run successfully for SRM command preparation', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForSrm").callsFake(() =>
                Promise.resolve("./bridge-cli --stage srm --state srm_input.json"));
            sandbox.stub(validator, "validateSrmInputs").returns([]);

            const preparedCommand = await bridgeCli.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge-cli --stage srm --state srm_input.json")

            Object.defineProperty(inputs, 'SRM_URL', {value: ""});
        });

        it('should fail with mandatory parameter missing fields for SRM', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'});

            sandbox.stub(validator, "validateSrmInputs").returns([`[bridge_srm_apikey, bridge_srm_assessment_types] - required parameters for SRM is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`]);

            bridgeCli.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).equals(`[bridge_srm_apikey, bridge_srm_assessment_types] - required parameters for SRM is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`);
                expect(errorObje.message).includes(ErrorCode.MISSING_REQUIRED_PARAMETERS.toString());
            })
            Object.defineProperty(inputs, 'SRM_URL', {value: ""})
        });

        it('should fail with invalid assessment type error', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForSrm").callsFake(() => {
                throw new Error("Invalid value for bridge_srm_assessment_types".concat(constants.SPACE).concat(ErrorCode.INVALID_SRM_ASSESSMENT_TYPES.toString()))
            });
            sandbox.stub(validator, "validateSrmInputs").returns([]);
            try {
                await bridgeCli.prepareCommand("/temp");
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
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() =>
                Promise.resolve("./bridge-cli --stage polaris --state polaris_input.json"));
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await bridgeCli.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge-cli --stage polaris --state polaris_input.json")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: ""});
        });

        it('should run successfully for coverity command preparation for classic editor', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: "coverity"});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForCoverity").callsFake(() => Promise.resolve("./bridge-cli --stage connect --state coverity_input.json"));
            sandbox.stub(validator, "validateCoverityInputs").returns([]);

            const preparedCommand = await bridgeCli.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge-cli --stage connect --state coverity_input.json")

            Object.defineProperty(inputs, 'COVERITY_URL', {value: ""});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: ""});
        });

        it('should run successfully for blackduck command preparation for classic editor', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: "blackducksca"});
            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => Promise.resolve("./bridge-cli --stage blackduck --state bd_input.json"));
            sandbox.stub(validator, "validateBlackDuckSCAInputs").returns([]);

            const preparedCommand = await bridgeCli.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge-cli --stage blackduck --state bd_input.json")

            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: ""});
        });

        it('should run successfully for SRM command preparation for classic editor', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: "srm"});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForSrm").callsFake(() =>
                Promise.resolve("./bridge-cli --stage srm --state srm_input.json"));
            sandbox.stub(validator, "validateSrmInputs").returns([]);

            const preparedCommand = await bridgeCli.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge-cli --stage srm --state srm_input.json")

            Object.defineProperty(inputs, 'SRM_URL', {value: ""});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: ""});
        });

    });


});

describe("Download Bridge", () => {
    let sandbox: sinon.SinonSandbox;
    let bridgeCliUrl: string
    const osName = process.platform
    const cpuInfo = os.cpus()
    const isIntel = cpuInfo[0].model.includes("Intel")
    let bridgeCliDefaultPath = "";
    let bridgeCliExecutablePath = "";
    let bridgeCliSubDir = "";
    if (osName === constants.LINUX) {
        bridgeCliDefaultPath = path.join(
            process.env["HOME"] as string, constants.BRIDGE_CLI_DEFAULT_PATH_UNIX)
            if (isIntel) {
                bridgeCliExecutablePath = bridgeCliDefaultPath.concat("/bridge-cli-bundle-linux64")
                bridgeCliSubDir = "/bridge-cli-bundle-linux64";
                bridgeCliUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/2.9.2/bridge-cli-bundle-2.9.2-linux64.zip"
            } else {
                bridgeCliExecutablePath = bridgeCliDefaultPath.concat("/bridge-cli-bundle-linux_arm")
                bridgeCliSubDir = "/bridge-cli-bundle-linux_arm";
                bridgeCliUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/2.9.2/bridge-cli-bundle-2.9.2-linux_arm.zip"
            }
    } else if (osName === constants.WIN32) {
        bridgeCliDefaultPath = path.join(
            process.env["USERPROFILE"] as string, constants.BRIDGE_CLI_DEFAULT_PATH_WINDOWS)
        bridgeCliExecutablePath = bridgeCliDefaultPath.concat("/bridge-cli-bundle-win64")
        bridgeCliSubDir = "/bridge-cli-bundle-win64";
        bridgeCliUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/2.9.2/bridge-cli-bundle-2.9.2--win64.zip"
    } else if (osName === constants.DARWIN) {
        bridgeCliDefaultPath = path.join(
            process.env["HOME"] as string, constants.BRIDGE_CLI_DEFAULT_PATH_UNIX)
            if (isIntel) {
                bridgeCliExecutablePath = bridgeCliDefaultPath.concat("/bridge-cli-bundle-macosx")
                bridgeCliSubDir = "/bridge-cli-bundle-macosx";
                bridgeCliUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/2.9.2/bridge-cli-bundle-2.9.2-macosx.zip"
            } else {
                bridgeCliExecutablePath = bridgeCliDefaultPath.concat("/bridge-cli-bundle-macos_arm")
                bridgeCliSubDir = "/bridge-cli-bundle-macos_arm";
                bridgeCliUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/2.9.2/bridge-cli-bundle-2.9.2-macos_arm.zip"
            }
    }

    context("air mode is enabled, executeBridgeCommand", () => {
        let bridgeCli: BridgeCli;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridgeCli = new BridgeCli();
        });

        afterEach(() => {
            sandbox.restore();
        });
        it("Execute Bridge CLI Command - linux/mac success BRIDGECLI_INSTALL_DIRECTORY_KEY empty", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(bridgeCli, "getDefaultBridgeCliPath").resolves('')
            sandbox.stub(bridgeCli, "setBridgeCliExecutablePath").resolves('')

            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: ''});
            bridgeCli.executeBridgeCliCommand(bridgeCliDefaultPath, bridgeCliDefaultPath, bridgeCliDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("Bridge CLI executable file could not be found at")
                expect(errorObj.message).includes(ErrorCode.BRIDGE_EXECUTABLE_NOT_FOUND.toString())
            })
        });

        it("Execute Bridge CLI Command - linux/mac success BRIDGECLI_INSTALL_DIRECTORY_KEY empty: failure", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(taskLib, "exist").returns(false)
            sandbox.stub(bridgeCli, "getDefaultBridgeCliPath").resolves('/tmp')
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: ''});
            const res = bridgeCli.getBridgeCliPath().catch(errorObj => {
                console.log(errorObj.message)
                expect(errorObj.message).includes("Bridge CLI default directory does not exist")
                expect(errorObj.message).includes(ErrorCode.DEFAULT_DIRECTORY_NOT_FOUND.toString())
            })
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});
        });

        it("Execute Bridge CLI Command - linux/mac success getDefaultDirectory empty: failure", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(taskLib, "exist").returns(false)
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: ''});
            sandbox.stub(bridgeCli, "getDefaultBridgeCliPath").resolves('')
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            const res = bridgeCli.getBridgeCliPath().catch(errorObj => {
                console.log(errorObj.message)
                expect(errorObj.message).includes("Bridge CLI default directory does not exist")
                expect(errorObj.message).includes(ErrorCode.DEFAULT_DIRECTORY_NOT_FOUND.toString())
            })
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});
        });

        it("Execute Bridge CLi Command - linux/mac success getDefaultDirectory empty: success", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(taskLib, "exist").returns(true)
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: '/Users/test'});
            sandbox.stub(bridgeCli, "getDefaultBridgeCliPath").resolves('')
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            const res = bridgeCli.getBridgeCliPath();
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});
        });

        it("Execute Bridge CLI Command - linux/mac success BRIDGECLI_INSTALL_DIRECTORY_KEY not empty", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(bridgeCli, "getDefaultBridgeCliPath").resolves('/tmp')
            sandbox.stub(bridgeCli, "setBridgeCliExecutablePath").resolves('/tmp')

            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: '/tmp/'});
            bridgeCli.executeBridgeCliCommand(bridgeCliDefaultPath, bridgeCliDefaultPath, bridgeCliDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("does not exist")
                expect(errorObj.message).includes(ErrorCode.BRIDGE_EXECUTABLE_NOT_FOUND.toString())
            })
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});

        });

        it("Execute Bridge CLI Command - exception", async () => {
            sandbox.stub(taskLib, "exec").rejects()
            sandbox.stub(bridgeCli, "getDefaultBridgeCliPath").resolves('/tmp')
            sandbox.stub(bridgeCli, "setBridgeCliExecutablePath").resolves('/tmp')
            Object.defineProperty(inputs, 'BRIDGECLI_INSTALL_DIRECTORY_KEY', {value: '/tmp/'});
            bridgeCli.executeBridgeCliCommand(bridgeCliDefaultPath, bridgeCliDefaultPath, bridgeCliDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("Error")
            })
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});

        });
    })
    context("extractBridgeCli", () => {
        let bridgeCli: BridgeCli;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridgeCli = new BridgeCli();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("returns the value of BRIDGECLI_INSTALL_DIRECTORY_KEY when it is defined and valid - success", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: bridgeCliDefaultPath,
            });
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});
            sandbox.stub(fs, "existsSync").returns(true);
            sandbox.stub(taskLib, "rmRF");
            sandbox.stub(utility, "extractZipped").returns(Promise.resolve(true));
            sandbox.stub(bridgeCli, "getDefaultBridgeCliSubDirectory").returns(bridgeCliSubDir);
            const downloadFileResponse = {} as DownloadFileResponse
            downloadFileResponse.filePath = bridgeCliDefaultPath
            const result = await bridgeCli.extractBridgeCli(downloadFileResponse);
            assert.equal(result, bridgeCliExecutablePath);
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: "",
            });
        });


    })

    context("executeBridgeCliCommand", () => {
        let bridgeCli: BridgeCli;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridgeCli = new BridgeCli();
        });

        afterEach(() => {
            sandbox.restore();
        });
        it("Execute Bridge CLI Command - linux/mac success", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(taskLib, "exist").returns(true);
            const res = await bridgeCli.executeBridgeCliCommand(bridgeCliDefaultPath, bridgeCliDefaultPath, bridgeCliDefaultPath)
            assert.equal(res, 0)
        });

        it("Execute Bridge CLI Command - linux/mac failure", async () => {
            sandbox.stub(taskLib, "exec").resolves(9)
            await bridgeCli.executeBridgeCliCommand(bridgeCliDefaultPath, bridgeCliDefaultPath, bridgeCliDefaultPath)
                .catch(errorObj => {
                    console.log(errorObj.message)
                    expect(errorObj.message).includes("Bridge CLI executable file could not be found at")
                    expect(errorObj.message).includes(ErrorCode.BRIDGE_EXECUTABLE_NOT_FOUND.toString())
                })
        });
    })
    context("getBridgeCliUrl", () => {
        let bridgeCli: BridgeCli;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridgeCli = new BridgeCli();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("returns the value of BRIDGECLI_DOWNLOAD_URL when it is defined and valid", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: bridgeCliUrl,
            });

            sandbox.stub(validator, "validateBridgeUrl").returns(true);
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(false));

            const result = await bridgeCli.getBridgeCliUrl();
            assert.equal(result, bridgeCliUrl);
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("getBridgeCliPath if BRIDGECLI_INSTALL_DIRECTORY_KEY is not empty", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: '/Users/test/bridgePath',
            });
            sandbox.stub(taskLib, "exist").returns(true)
            sandbox.stub(bridgeCli, "getDefaultBridgeCliSubDirectory").returns(bridgeCliSubDir);
            const result = await bridgeCli.getBridgeCliPath();
            assert.equal(result, "/Users/test/bridgePath".concat(bridgeCliSubDir));
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("getBridgeCliPath if BRIDGECLI_INSTALL_DIRECTORY_KEY is empty", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: '',
            });
            const result = await bridgeCli.getBridgeCliPath();
            expect(result).contains("bridge-cli");
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("returns the value of BRIDGECLI_DOWNLOAD_URL when it is defined, valid and version exists", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: bridgeCliUrl,
            });

            sandbox.stub(validator, "validateBridgeUrl").returns(true);
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(true));

            const result = await bridgeCli.getBridgeCliUrl();
            assert.equal(result, "");
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("throws an error when BRIDGECLI_DOWNLOAD_URL is defined but invalid", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "invalid-url",
            });
            bridgeCli.getBridgeCliUrl().catch(errorObj => {
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
            sandbox.stub(bridgeCli, "validateBridgeVersion").returns(Promise.resolve(true));
            sandbox.stub(bridgeCli, "getVersionUrl").returns(bridgeCliUrl);
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(true));
            const result = await bridgeCli.getBridgeCliUrl();
            expect(result).equals("");
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it("returns empty url when BRIDGECLI_DOWNLOAD_VERSION is defined, valid and exists", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "0.1.244",
            });
            sandbox.stub(bridgeCli, "validateBridgeVersion").returns(Promise.resolve(true));
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(true));
            sandbox.stub(bridgeCli, "getVersionUrl").returns(bridgeCliUrl);
            const result = await bridgeCli.getBridgeCliUrl();
            expect(result).equals("");
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it('should fail with mandatory parameter missing fields for blackduck', async function () {

            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'});
            sandbox.stub(validator, "validateBlackDuckSCAInputs").returns([`[bridge_blackduck_url,bridge_blackduck_token] - required parameters for coverity is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`]);
            bridgeCli.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).equals(`[bridge_blackduck_url,bridge_blackduck_token] - required parameters for coverity is missing ${ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()}`);            })
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''})
        });

        it('should run successfully for blackduck command preparation', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'});
            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => Promise.resolve("./bridge-cli --stage blackduck --state bd_input.json"));
            sandbox.stub(validator, "validateBlackDuckSCAInputs").returns([]);

            const preparedCommand = await bridgeCli.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge-cli --stage blackduck --state bd_input.json")

            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''});
        });


        it('should run successfully for blackduck and polaris command preparation', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'});

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() =>
                Promise.resolve("./bridge-cli --stage polaris --state polaris_input.json"));
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => Promise.resolve(" --stage blackduck --state bd_input.json"));
            sandbox.stub(validator, "validateBlackDuckSCAInputs").returns([]);

            const preparedCommand = await bridgeCli.prepareCommand("/temp");
            console.log("preparedCommand::::" + preparedCommand)
            expect(preparedCommand).contains("./bridge-cli --stage polaris --state polaris_input.json --stage blackduck --state bd_input.json")

            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''});
        });

        it("throws an error when BRIDGECLI_DOWNLOAD_VERSION is defined but invalid", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "invalid-version",
            });
            sandbox.stub(bridgeCli, "validateBridgeVersion").returns(Promise.resolve(false));
            bridgeCli.getBridgeCliUrl().catch(errorObj => {
                expect(errorObj.message).includes("Provided Bridge CLI version not found in artifactory")
            })
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it("returns the URL for the latest version when neither BRIDGECLI_DOWNLOAD_URL nor BRIDGECLI_DOWNLOAD_VERSION are defined", async () => {
            const bridgeCliUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle"
            sandbox.stub(bridgeCli, "getBridgeCliVersionFromLatestURL").returns(Promise.resolve("2.9.2"));
            sandbox.stub(bridgeCli, "getVersionUrl").returns(bridgeCliUrl);
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(false));
            const result = await bridgeCli.getBridgeCliUrl();
            expect(result).contains(bridgeCliUrl);
        });

        it("returns the URL for the latest version when getBridgeCliVersionFromLatestURL is empty", async () => {

            sandbox.stub(bridgeCli, "getBridgeCliVersionFromLatestURL").returns(Promise.resolve("/latest"));
            sandbox.stub(bridgeCli, "getVersionUrl").returns("bridge-cli-bundle/latest/bridge-cli-bundle");
            const result = await bridgeCli.getBridgeCliUrl();
            expect(result).contains("/latest");
        });

        it("returns the URL for the latest version when getBridgeCliVersionFromLatestURL is empty: failure", async () => {
            sandbox.stub(bridgeCli, "getLatestVersionUrl").returns("");
            sandbox.stub(bridgeCli, "getBridgeCliVersionFromLatestURL").returns(Promise.resolve(""));
            sandbox.stub(bridgeCli, "getVersionUrl").returns("bridge-cli-bundle/0.0.0/bridge-cli-bundle-macosx.zip");
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(false));
            const result = await bridgeCli.getBridgeCliUrl().catch(errorObj => {
                expect(errorObj.message).contains("Invalid artifactory latest url");
            })
        });
    });

    context("validateBridgeCliVersion", () => {
        let bridgeCli: BridgeCli;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridgeCli = new BridgeCli();
        });

        afterEach(() => {
            sandbox.restore();
        });
        const versionArray: string[] = [];
        versionArray.push("0.1.244")

        it("When version is available", async () => {
            sandbox.stub(bridgeCli, "getAllAvailableBridgeCliVersions").returns(Promise.resolve(versionArray));
            const result = await bridgeCli.validateBridgeVersion("0.1.244")
            expect(result).equals(true);
        });

        it("When version is not available", async () => {
            sandbox.stub(bridgeCli, "getAllAvailableBridgeCliVersions").returns(Promise.resolve(versionArray));
            const result = await bridgeCli.validateBridgeVersion("0.1.245")
            expect(result).equals(false);
        });
    });

    context("downloadBridgeCli", () => {
        let bridgeCli: BridgeCli;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridgeCli = new BridgeCli();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("BRIDGECLI_DOWNLOAD_VERSION is defined and valid", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {value: "0.1.244"});
            bridgeCli.bridgeCliExecutablePath = bridgeCliDefaultPath
            sandbox.stub(bridgeCli,"getBridgeCliUrl").returns(Promise.resolve(""))
            sandbox.stub(bridgeCli,"getBridgeCliVersionFromLatestURL").returns(Promise.resolve("0.1.244"))
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(true));

            const result = await bridgeCli.downloadAndExtractBridgeCli("/");
            assert.equal(result, bridgeCliDefaultPath);

            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "",
            });
            bridgeCli.bridgeCliExecutablePath = "";
        });

        it("BRIDGECLI_DOWNLOAD_VERSION is not defined, get Bridge url - success", async () => {
            bridgeCli.bridgeCliExecutablePath = bridgeCliDefaultPath
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(false));
            sandbox.stub(bridgeCli, "getBridgeCliUrl").returns(Promise.resolve(bridgeCliUrl))

            const downloadFileResponse = {} as DownloadFileResponse
            downloadFileResponse.filePath = bridgeCliDefaultPath
            sandbox.stub(utility, "getRemoteFile").returns(Promise.resolve(downloadFileResponse))
            sandbox.stub(bridgeCli, "extractBridgeCli").returns(Promise.resolve(bridgeCliDefaultPath))

            const result = await bridgeCli.downloadAndExtractBridgeCli("/")
            assert.equal(result, bridgeCliDefaultPath);
        });

        it("BRIDGECLI_DOWNLOAD_URL is defined and invalid for current win64 os", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/2.9.2/bridge-cli-bundle-2.9.2-win64.zip",
            });
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(false));
            sandbox.stub(bridgeCli, "getBridgeCliUrl").returns(Promise.resolve(bridgeCliUrl))

            const downloadFileResponse = {} as DownloadFileResponse
            downloadFileResponse.filePath = bridgeCliDefaultPath
            sandbox.stub(utility, "getRemoteFile").returns(Promise.resolve(downloadFileResponse))
            sandbox.stub(bridgeCli, "extractBridgeCli").throws(new Error("invalid url"))

            await bridgeCli.downloadAndExtractBridgeCli("/").catch(errorObj => {
                expect(errorObj.message).includes("Provided Bridge CLI url is not valid for the configured");
            })

            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("BRIDGECLI_DOWNLOAD_URL is defined and invalid for current linux os", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/2.9.2/bridge-cli-bundle-2.9.2-linux64.zip",
            });
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(false));
            sandbox.stub(bridgeCli, "getBridgeCliUrl").returns(Promise.resolve(bridgeCliUrl))

            const downloadFileResponse = {} as DownloadFileResponse
            downloadFileResponse.filePath = bridgeCliDefaultPath
            sandbox.stub(utility, "getRemoteFile").returns(Promise.resolve(downloadFileResponse))
            sandbox.stub(bridgeCli, "extractBridgeCli").throws(new Error("invalid url"))

            await bridgeCli.downloadAndExtractBridgeCli("/").catch(errorObj => {
                expect(errorObj.message).includes("Provided Bridge CLI url is not valid for the configured");
            })

            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("BRIDGECLI_DOWNLOAD_URL is defined and invalid for current mac os", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/2.9.2/bridge-cli-bundle-2.9.2-macosx.zip",
            });
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(false));
            sandbox.stub(bridgeCli, "getBridgeCliUrl").returns(Promise.resolve(bridgeCliUrl))

            const downloadFileResponse = {} as DownloadFileResponse
            downloadFileResponse.filePath = bridgeCliDefaultPath
            sandbox.stub(utility, "getRemoteFile").returns(Promise.resolve(downloadFileResponse))
            sandbox.stub(bridgeCli, "extractBridgeCli").throws(new Error("invalid url"))

            await bridgeCli.downloadAndExtractBridgeCli("/").catch(errorObj => {
                expect(errorObj.message).includes("Provided Bridge CLI url is not valid for the configured");
            })

            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("BRIDGECLI_DOWNLOAD_VERSION is not defined, valid without Bridge url", async () => {
            bridgeCli.bridgeCliExecutablePath = bridgeCliDefaultPath
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(false));
            sandbox.stub(bridgeCli, "getBridgeCliUrl").returns(Promise.resolve(undefined));

            const result = await bridgeCli.downloadAndExtractBridgeCli("/");
            assert.equal(result, bridgeCliDefaultPath);

            Object.defineProperty(inputs, "BRIDGECLI_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it("BRIDGECLI_DOWNLOAD_VERSION is not defined, throw exception", async () => {
            bridgeCli.bridgeCliExecutablePath = bridgeCliDefaultPath
            sandbox.stub(bridgeCli, "checkIfBridgeCliVersionExists").returns(Promise.resolve(false));
            sandbox.stub(bridgeCli, "getBridgeCliUrl").throws(new Error("empty"));

            await bridgeCli.downloadAndExtractBridgeCli("/").catch(errorObj => {
                expect(errorObj.message).includes("Provided Bridge CLI URL cannot be empty");
                expect(errorObj.message).includes(ErrorCode.BRIDGE_CLI_URL_CANNOT_BE_EMPTY.toString());
            })
        });

        // include diagnostics test case
        it('should run successfully for include diagnostics command preparation', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'true'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() =>
                Promise.resolve("./bridge-cli --stage polaris --state polaris_input.json"));
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await bridgeCli.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge-cli --stage polaris --state polaris_input.json --diagnostics")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
        });

        it('should not add --diagnostics with invalid value in bridge-cli command', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'false'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(BridgeCliToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() =>
                Promise.resolve("./bridge-cli --stage polaris --state polaris_input.json"));
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await bridgeCli.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge-cli --stage polaris --state polaris_input.json")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
        });


    });

    context("checkIfBridgeCliVersionExists", () => {
        let bridgeCli: BridgeCli;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridgeCli = new BridgeCli();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("BRIDGECLI_INSTALL_DIRECTORY_KEY is defined and valid", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {value: bridgeCliDefaultPath});
            bridgeCli.bridgeCliExecutablePath = bridgeCliDefaultPath
            sandbox.stub(bridgeCli, "checkIfVersionExists").returns(Promise.resolve(true));
            sandbox.stub(taskLib, "exist").returns(true);

            const result = await bridgeCli.checkIfBridgeCliVersionExists("0.1.244");
            assert.equal(result, true);

            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: "",
            });
            bridgeCli.bridgeCliExecutablePath = "";
        });

        it("BRIDGECLI_INSTALL_DIRECTORY_KEY is defined and valid: windows", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {value: bridgeCliDefaultPath});
            Object.defineProperty(process, 'platform', {value: 'win32'});
            sandbox.stub(taskLib, "exist").returns(true)
            sandbox.stub(bridgeCli, "checkIfVersionExists").returns(Promise.resolve(true));

            const result = await bridgeCli.checkIfBridgeCliVersionExists("0.1.244");
            assert.equal(result, true);

            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: "",
            });
            bridgeCli.bridgeCliExecutablePath = "";
        });

        it("BRIDGECLI_INSTALL_DIRECTORY_KEY is defined and valid and version does not exists", async () => {
            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {value: "/path/path"});
            bridgeCli.bridgeCliExecutablePath = bridgeCliDefaultPath
            sandbox.stub(taskLib, "exist").returns(true)
            sandbox.stub(bridgeCli, "checkIfVersionExists").returns(Promise.resolve(false));
            const result = await bridgeCli.checkIfBridgeCliVersionExists("0.1.244");
            assert.equal(result, false);

            Object.defineProperty(inputs, "BRIDGECLI_INSTALL_DIRECTORY_KEY", {
                value: "",
            });
            bridgeCli.bridgeCliExecutablePath = "";
        });

        it("BRIDGECLI_INSTALL_DIRECTORY_KEY is not defined", async () => {
            sandbox.stub(bridgeCli, "checkIfVersionExists").returns(Promise.resolve(true));
            sandbox.stub(taskLib, "exist").returns(true);
            const result = await bridgeCli.checkIfBridgeCliVersionExists("0.1.244");
            assert.equal(result, true);
        });
    })
    context("checkIfVersionExists", () => {
        let bridgeCli: BridgeCli;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridgeCli = new BridgeCli();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("Check If Version Exists - success", async () => {

            sandbox.stub(fs, "readFileSync").returns('bridge-cli-bundle: 0.1.1');

            const result = await bridgeCli.checkIfVersionExists('0.1.1', bridgeCliDefaultPath);
            assert.equal(result, true);
        });

        it("Check If Version Exists - failure", async () => {

            sandbox.stub(fs, "readFileSync").returns('0.1.1');

            const result = await bridgeCli.checkIfVersionExists('0.1.1', bridgeCliDefaultPath);
            assert.equal(result, false);
        });

        it("Check If Version Exists - exception", async () => {
            sandbox.stub(fs, "readFileSync").throws(new Error("file not found"))
            await bridgeCli.checkIfVersionExists('0.1.1', bridgeCliDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("file not found")
            })
        });
    })

    context("getBridgeCliVersionFromLatestURL", () => {

        let httpClientStub: SinonStub<any[], Promise<httpc.HttpClientResponse>>;
        let bridgeCli: BridgeCli;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridgeCli = new BridgeCli();
            httpClientStub = sinon.stub()
        });

        afterEach(() => {
            sinon.restore();
        });

        it("Get Latest Version - success", async () => {

            sandbox.stub(bridgeCli, "getBridgeCliVersionFromLatestURL").returns(Promise.resolve('0.2.1'));

            const result = await bridgeCli.getBridgeCliVersionFromLatestURL("https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/latest/bridge-cli-bundle-macosx.zip");
            assert.equal(result, '0.2.1');
        });

        it("Bridle cli latest version test: windows", async () => {
            const result = await bridgeCli.getLatestVersionUrl();
            expect(result).contains('/latest/bridge-cli-bundle');
        });

        it('Test getBridgeCliVersionFromLatestURL -status 200', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 200
            const responseBody = "bridge-cli-bundle:0.2.35\nbridge-cli-bundle: 0.2.35"

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').returns({
                get: httpClientStub,
            } as any);
            const result = await bridgeCli.getBridgeCliVersionFromLatestURL("https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/latest/bridge-cli-bundle-macosx.zip")
            expect(result).contains('0.2.35')

        })

        it('Test getBridgeCliVersionFromLatestURL exception', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 200
            const responseBody = "bridge-cli-bundle: 0.2.35\nbridge-cli-bundle: 0.2.35"

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').throws({
                get: httpClientStub,
            } as any);


            const result = await bridgeCli.getBridgeCliVersionFromLatestURL("https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/latest/bridge-cli-bundle-macosx.zip")
            expect(result).contains('')
        })

        it('Test getBridgeCliVersionFromLatestURL -status 500', async () => {
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

            const result = await bridgeCli.getBridgeCliVersionFromLatestURL("https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle/latest/bridge-cli-bundle-macosx.zip")
            expect(result).contains('')
        })
    })

    context("getAllAvailableBridgeCliVersions", () => {

        let httpClientStub: SinonStub<any[], Promise<httpc.HttpClientResponse>>;
        let bridgeCli: BridgeCli;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            bridgeCli = new BridgeCli();
            httpClientStub = sinon.stub()
        });

        afterEach(() => {
            sinon.restore();
        });

        it('Test getAllAvailableBridgeCliVersions -status 200', async () => {
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
            const result = await bridgeCli.getAllAvailableBridgeCliVersions()
            expect(result).contains('0.1.198')

        })

        it('Test getAllAvailableBridgeCliVersions -status 500', async () => {
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

            const result = await bridgeCli.getAllAvailableBridgeCliVersions()
            expect(result).empty
        })
    })
});
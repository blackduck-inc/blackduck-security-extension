import {assert, expect} from "chai";
import * as sinon from "sinon";
import {SinonStub} from "sinon";
import {SynopsysBridge} from "../../../src/synopsys-task/synopsys-bridge";
import * as utility from "../../../src/synopsys-task/utility";
import {extractZipped} from "../../../src/synopsys-task/utility";
import {DownloadFileResponse} from "../../../src/synopsys-task/model/download-file-response";
import * as path from "path";
import * as inputs from "../../../src/synopsys-task/input";
import {SynopsysToolsParameter} from "../../../src/synopsys-task/tools-parameter";
import * as validator from "../../../src/synopsys-task/validator";
import * as constants from "../../../src/synopsys-task/application-constant";
import fs from "fs";
import * as taskLib from "azure-pipelines-task-lib";
import * as Q from "q";
import * as httpc from "typed-rest-client/HttpClient";
import * as ifm from "typed-rest-client/Interfaces";
import {IncomingMessage} from "http";
import {Socket} from "net";

describe("Synopsys Bridge test", () => {
    context('Bridge command preparation', () => {
        let sandbox: sinon.SinonSandbox;
        let synopsysBridge: SynopsysBridge;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should run successfully for polaris command preparation', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() => "./bridge --stage polaris --state polaris_input.json");
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await synopsysBridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage polaris --state polaris_input.json")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
        });

        it('should fail with no scan type provied error', async function () {
            sandbox.stub(validator, "validateScanTypes").returns(["bridge_polaris_serverUrl", "bridge_coverity_connect_url","bridge_blackduck_url"]);

            synopsysBridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).includes("Requires at least one scan type");
            })
        });

        it('should fail with mandatory parameter missing fields for polaris', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});

            sandbox.stub(validator, "validatePolarisInputs").returns(['[bridge_polaris_accessToken,bridge_polaris_application_name,bridge_polaris_project_name,bridge_polaris_assessment_types] - required parameters for polaris is missing']);

            synopsysBridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).includes("required parameters for polaris is missing");
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
            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() => {
                throw new Error("Invalid value for bridge_polaris_assessment_types")
            });
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            synopsysBridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).includes("Invalid value for bridge_polaris_assessment_types");
            })

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""})
        });

        it('should fail with invalid failureSeverities type error', async function () {
            Object.defineProperty(inputs, 'BLACKDUCK_URL', {value: 'https://test.com'});

            Object.defineProperty(inputs, 'BLACKDUCK_SCAN_FAILURE_SEVERITIES', {value: ''});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => {
                throw new Error("Invalid value for failureSeverities")
            });
            sandbox.stub(validator, "validateBlackDuckInputs").returns([]);

            synopsysBridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).includes("Invalid value for failureSeverities");
            })

            Object.defineProperty(inputs, 'BLACKDUCK_URL', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCK_API_TOKEN', {value: 'token'});
        });

        // coverity test cases
        it('should run successfully for coverity command preparation', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForCoverity").callsFake(() => "./bridge --stage connect --state coverity_input.json");
            sandbox.stub(validator, "validateCoverityInputs").returns([]);

            const preparedCommand = await synopsysBridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage connect --state coverity_input.json")

            Object.defineProperty(inputs, 'COVERITY_URL', {value: ""});
        });

        it('should fail with mandatory parameter missing fields for coverity', async function () {

            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});
            sandbox.stub(validator, "validateCoverityInputs").returns(['[bridge_coverity_connect_user_password,bridge_coverity_connect_project_name,bridge_coverity_connect_stream_name] - required parameters for coverity is missing']);
            synopsysBridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).equals('[bridge_coverity_connect_user_password,bridge_coverity_connect_project_name,bridge_coverity_connect_stream_name] - required parameters for coverity is missing');
            })
            Object.defineProperty(inputs, 'COVERITY_URL', {value: ""})
        });

        // Classic editor test cases
        it('should run successfully for polaris command preparation for classic editor', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: "polaris"});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() => "./bridge --stage polaris --state polaris_input.json");
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await synopsysBridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage polaris --state polaris_input.json")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: ""});
        });

        it('should run successfully for coverity command preparation for classic editor', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: "coverity"});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForCoverity").callsFake(() => "./bridge --stage connect --state coverity_input.json");
            sandbox.stub(validator, "validateCoverityInputs").returns([]);

            const preparedCommand = await synopsysBridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage connect --state coverity_input.json")

            Object.defineProperty(inputs, 'COVERITY_URL', {value: ""});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: ""});
        });

        it('should run successfully for blackduck command preparation for classic editor', async function () {
            Object.defineProperty(inputs, 'BLACKDUCK_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'BLACKDUCK_API_TOKEN', {value: 'token'});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: "blackduck"});
            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => "./bridge --stage blackduck --state bd_input.json");
            sandbox.stub(validator, "validateBlackDuckInputs").returns([]);

            const preparedCommand = await synopsysBridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage blackduck --state bd_input.json")

            Object.defineProperty(inputs, 'BLACKDUCK_URL', {value: ''});
            Object.defineProperty(inputs, 'SCAN_TYPE', {value: ""});
        });

    });

});

describe("Air mode", () => {
    let sandbox: sinon.SinonSandbox;
    let bridgeDefaultPath = "";
    context("air mode is enabled, executeBridgeCommand", () => {
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });
        it("Execute Bridge Command - linux/mac success SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY empty", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(synopsysBridge, "getBridgeDefaultPath").resolves('')
            sandbox.stub(synopsysBridge, "setBridgeExecutablePath").resolves('')

            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIR_GAP', {value: true});
            Object.defineProperty(inputs, 'SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY', {value: ''});
            synopsysBridge.executeBridgeCommand(bridgeDefaultPath, bridgeDefaultPath, bridgeDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("does not exist")
            })
        });

        it("Execute Bridge Command - linux/mac success SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY not empty", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(synopsysBridge, "getBridgeDefaultPath").resolves('/tmp/synopsys-bridge')

            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIR_GAP', {value: true});
            Object.defineProperty(inputs, 'SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY', {value: '/tmp/synopsys-bridge'});
            synopsysBridge.executeBridgeCommand(bridgeDefaultPath, bridgeDefaultPath, bridgeDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("does not exist")
            })
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIR_GAP', {value: false});

        });
    })
})


describe("Latest version", () => {
    let sandbox: sinon.SinonSandbox;
    let bridgeDefaultPath = "";
    context("get the Latest version from the url", () => {
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });
       
    })
})

describe("Download Bridge", () => {
    let sandbox: sinon.SinonSandbox;
    let bridgeUrl: string
    const osName = process.platform
    let bridgeDefaultPath = "";
    if (osName === "linux") {
        bridgeDefaultPath = path.join(process.env["HOME"] as string, constants.SYNOPSYS_BRIDGE_DEFAULT_PATH_LINUX);
        bridgeUrl = "https://sig-repo.synopsys.com/artifactory/bds-integrations-release/com/synopsys/integration/synopsys-bridge/0.1.244/synopsys-bridge-0.1.244-linux64.zip"
    } else if (osName === "win32") {
        bridgeDefaultPath = path.join(
            process.env["USERPROFILE"] as string, constants.SYNOPSYS_BRIDGE_DEFAULT_PATH_WINDOWS)
        bridgeUrl = "https://sig-repo.synopsys.com/artifactory/bds-integrations-release/com/synopsys/integration/synopsys-bridge/0.1.244/synopsys-bridge-0.1.244-win64.zip"
    } else if (osName === "darwin") {
        bridgeDefaultPath = path.join(
            process.env["HOME"] as string, constants.SYNOPSYS_BRIDGE_DEFAULT_PATH_MAC)
        bridgeUrl = "https://sig-repo.synopsys.com/artifactory/bds-integrations-release/com/synopsys/integration/synopsys-bridge/0.1.244/synopsys-bridge-0.1.244-macosx.zip"
    }

    context("air mode is enabled, executeBridgeCommand", () => {
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });
        it("Execute Bridge Command - linux/mac success SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY empty", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(synopsysBridge, "getBridgeDefaultPath").resolves('')
            sandbox.stub(synopsysBridge, "setBridgeExecutablePath").resolves('')

            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIR_GAP', {value: true});
            Object.defineProperty(inputs, 'SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY', {value: ''});
            synopsysBridge.executeBridgeCommand(bridgeDefaultPath, bridgeDefaultPath, bridgeDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("does not exist")
            })
        });

        it("Execute Bridge Command - linux/mac success SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY not empty", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            sandbox.stub(synopsysBridge, "getBridgeDefaultPath").resolves('/tmp')
            sandbox.stub(synopsysBridge, "setBridgeExecutablePath").resolves('/tmp')

            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIR_GAP', {value: true});
            Object.defineProperty(inputs, 'SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY', {value: '/tmp/'});
            synopsysBridge.executeBridgeCommand(bridgeDefaultPath, bridgeDefaultPath, bridgeDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("does not exist")
            })
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIR_GAP', {value: false});

        });
    })
    context("extractBridge", () => {
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("returns the value of SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY when it is defined and valid - success", async () => {
            Object.defineProperty(inputs, "SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY", {
                value: bridgeDefaultPath,
            });
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIR_GAP', {value: false});
            sandbox.stub(fs, "existsSync").returns(true);
            sandbox.stub(taskLib, "rmRF");
            sandbox.stub(utility, "extractZipped").returns(Promise.resolve(true));
            const downloadFileResponse = {} as DownloadFileResponse
            downloadFileResponse.filePath = bridgeDefaultPath
            const result = await synopsysBridge.extractBridge(downloadFileResponse);
            assert.equal(result, bridgeDefaultPath);
            Object.defineProperty(inputs, "SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY", {
                value: "",
            });
        });


    })

    context("executeBridgeCommand", () => {
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });
        it("Execute Bridge Command - linux/mac success", async () => {
            sandbox.stub(taskLib, "exec").resolves(0)
            const res = await synopsysBridge.executeBridgeCommand(bridgeDefaultPath, bridgeDefaultPath, bridgeDefaultPath)
            assert.equal(res, 0)
        });

        it("Execute Bridge Command - linux/mac failure", async () => {
            sandbox.stub(taskLib, "exec").resolves(9)
            await synopsysBridge.executeBridgeCommand(bridgeDefaultPath, bridgeDefaultPath, bridgeDefaultPath)
                .catch(errorObj => {
                    console.log(errorObj.message)
                    expect(errorObj.message).includes("failed with exit code 9")
                })
        });
    })

    context("getBridgeUrl", () => {
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("returns the value of BRIDGE_DOWNLOAD_URL when it is defined and valid", async () => {
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_URL", {
                value: bridgeUrl,
            });

            sandbox.stub(validator, "validateBridgeUrl").returns(true);
            sandbox.stub(synopsysBridge, "checkIfSynopsysBridgeVersionExists").returns(Promise.resolve(false));

            const result = await synopsysBridge.getBridgeUrl();
            assert.equal(result, bridgeUrl);
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("getSynopsysBridgePath if SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY is not empty", async () => {
            Object.defineProperty(inputs, "SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY", {
                value: '/Users/test/bridgePath',
            });

            const result = await synopsysBridge.getSynopsysBridgePath();
            assert.equal(result, "/Users/test/bridgePath");
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("getSynopsysBridgePath if SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY is  empty", async () => {
            Object.defineProperty(inputs, "SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY", {
                value: '',
            });
            const result = await synopsysBridge.getSynopsysBridgePath();
            expect(result).contains("synopsys-bridge");
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("returns the value of BRIDGE_DOWNLOAD_URL when it is defined, valid and version exists", async () => {
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_URL", {
                value: bridgeUrl,
            });

            sandbox.stub(validator, "validateBridgeUrl").returns(true);
            sandbox.stub(synopsysBridge, "checkIfSynopsysBridgeVersionExists").returns(Promise.resolve(true));

            const result = await synopsysBridge.getBridgeUrl();
            assert.equal(result, "");
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("throws an error when BRIDGE_DOWNLOAD_URL is defined but invalid", async () => {
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_URL", {
                value: "invalid-url",
            });
            synopsysBridge.getBridgeUrl().catch(errorObj => {
                expect(errorObj.message).includes("Invalid URL")
            })

            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("returns the URL for the specified version when BRIDGE_DOWNLOAD_VERSION is defined and valid", async () => {
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_VERSION", {
                value: "0.1.244",
            });
            sandbox.stub(synopsysBridge, "validateBridgeVersion").returns(Promise.resolve(true));
            sandbox.stub(synopsysBridge, "getVersionUrl").returns(bridgeUrl);
            sandbox.stub(synopsysBridge, "checkIfSynopsysBridgeVersionExists").returns(Promise.resolve(true));
            const result = await synopsysBridge.getBridgeUrl();
            expect(result).equals("");
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it("returns empty url when BRIDGE_DOWNLOAD_VERSION is defined, valid and exists", async () => {
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_VERSION", {
                value: "0.1.244",
            });
            sandbox.stub(synopsysBridge, "validateBridgeVersion").returns(Promise.resolve(true));
            sandbox.stub(synopsysBridge, "checkIfSynopsysBridgeVersionExists").returns(Promise.resolve(true));
            sandbox.stub(synopsysBridge, "getVersionUrl").returns(bridgeUrl);
            const result = await synopsysBridge.getBridgeUrl();
            expect(result).equals("");
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it('should fail with mandatory parameter missing fields for blackduck', async function () {

            Object.defineProperty(inputs, 'BLACKDUCK_URL', {value: 'https://test.com'});
            sandbox.stub(validator, "validateBlackDuckInputs").returns(['[bridge_blackduck_url,bridge_blackduck_token] - required parameters for coverity is missing']);
            synopsysBridge.prepareCommand("/temp").catch(errorObje => {
                expect(errorObje.message).equals('[bridge_blackduck_url,bridge_blackduck_token] - required parameters for coverity is missing');
            })
            Object.defineProperty(inputs, 'BLACKDUCK_URL', {value: ''})
        });

        it('should run successfully for blackduck command preparation', async function () {
            Object.defineProperty(inputs, 'BLACKDUCK_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'BLACKDUCK_API_TOKEN', {value: 'token'});
            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => "./bridge --stage blackduck --state bd_input.json");
            sandbox.stub(validator, "validateBlackDuckInputs").returns([]);

            const preparedCommand = await synopsysBridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage blackduck --state bd_input.json")

            Object.defineProperty(inputs, 'BLACKDUCK_URL', {value: ''});
        });


        it('should run successfully for blackduck and polaris command preparation', async function () {
            Object.defineProperty(inputs, 'BLACKDUCK_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'BLACKDUCK_API_TOKEN', {value: 'token'});

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() => "./bridge --stage polaris --state polaris_input.json");
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForBlackduck").callsFake(() => " --stage blackduck --state bd_input.json");
            sandbox.stub(validator, "validateBlackDuckInputs").returns([]);

            const preparedCommand = await synopsysBridge.prepareCommand("/temp");
            console.log("preparedCommand::::" + preparedCommand)
            expect(preparedCommand).contains("./bridge --stage polaris --state polaris_input.json --stage blackduck --state bd_input.json")

            Object.defineProperty(inputs, 'BLACKDUCK_URL', {value: ''});
        });

        it("throws an error when BRIDGE_DOWNLOAD_VERSION is defined but invalid", async () => {
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_VERSION", {
                value: "invalid-version",
            });
            sandbox.stub(synopsysBridge, "validateBridgeVersion").returns(Promise.resolve(false));
            synopsysBridge.getBridgeUrl().catch(errorObj => {
                expect(errorObj.message).includes("Provided bridge version not found in artifactory")
            })
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it("returns the URL for the latest version when neither BRIDGE_DOWNLOAD_URL nor BRIDGE_DOWNLOAD_VERSION are defined", async () => {

            sandbox.stub(synopsysBridge, "getVersionFromLatestURL").returns(Promise.resolve("0.1.244"));
            sandbox.stub(synopsysBridge, "getVersionUrl").returns(bridgeUrl);
            sandbox.stub(synopsysBridge, "checkIfSynopsysBridgeVersionExists").returns(Promise.resolve(false));
            const result = await synopsysBridge.getBridgeUrl();
            expect(result).equals(bridgeUrl);
        });
    });

    context("validateBridgeVersion", () => {
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        let versions: string;
        versions = "0.1.244"
        it("When version is available", async () => {
            sandbox.stub(synopsysBridge, "getVersionFromLatestURL").returns(Promise.resolve(versions));
            const result = await synopsysBridge.validateBridgeVersion("0.1.244")
            expect(result).equals(true);
        });

        it("When version is not available", async () => {
            sandbox.stub(synopsysBridge, "getVersionFromLatestURL").returns(Promise.resolve(versions));
            const result = await synopsysBridge.validateBridgeVersion("0.1.245")
            expect(result).equals(false);
        });


    });

    context("downloadBridge", () => {
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("BRIDGE_DOWNLOAD_VERSION is defined and valid", async () => {
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_VERSION", {value: "0.1.244"});
            synopsysBridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(synopsysBridge,"getVersionFromLatestURL").returns(Promise.resolve("0.1.244"))
            sandbox.stub(synopsysBridge, "checkIfSynopsysBridgeVersionExists").returns(Promise.resolve(true));

            const result = await synopsysBridge.downloadAndExtractBridge("/");
            assert.equal(result, bridgeDefaultPath);

            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_VERSION", {
                value: "",
            });
            synopsysBridge.bridgeExecutablePath = "";
        });

        it("BRIDGE_DOWNLOAD_VERSION is not defined, get Bridge url - success", async () => {
            synopsysBridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(synopsysBridge, "checkIfSynopsysBridgeVersionExists").returns(Promise.resolve(false));
            sandbox.stub(synopsysBridge, "getBridgeUrl").returns(Promise.resolve(bridgeUrl))

            const downloadFileResponse = {} as DownloadFileResponse
            downloadFileResponse.filePath = bridgeDefaultPath
            sandbox.stub(utility, "getRemoteFile").returns(Promise.resolve(downloadFileResponse))
            sandbox.stub(synopsysBridge, "extractBridge").returns(Promise.resolve(bridgeDefaultPath))

            const result = await synopsysBridge.downloadAndExtractBridge("/")
            assert.equal(result, bridgeDefaultPath);
        });

        it("BRIDGE_DOWNLOAD_URL is defined and invalid for current os", async () => {
            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_URL", {
                value: "https://artifactory.internal.synopsys.com/artifactory/clops-local/clops.sig.synopsys.com/synopsys-bridge/0.2.57/synopsys-bridge-0.2.57-win64.zip",
            });
            sandbox.stub(synopsysBridge, "checkIfSynopsysBridgeVersionExists").returns(Promise.resolve(false));
            sandbox.stub(synopsysBridge, "getBridgeUrl").returns(Promise.resolve(bridgeUrl))

            const downloadFileResponse = {} as DownloadFileResponse
            downloadFileResponse.filePath = bridgeDefaultPath
            sandbox.stub(utility, "getRemoteFile").returns(Promise.resolve(downloadFileResponse))
            sandbox.stub(synopsysBridge, "extractBridge").throws(new Error("invalid url"))

            await synopsysBridge.downloadAndExtractBridge("/").catch(errorObj => {
                expect(errorObj.message).includes("Provided Bridge url is not valid for the configured");
            })

            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_URL", {
                value: "",
            });
        });

        it("BRIDGE_DOWNLOAD_VERSION is not defined, valid without Bridge url", async () => {
            synopsysBridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(synopsysBridge, "checkIfSynopsysBridgeVersionExists").returns(Promise.resolve(false));
            sandbox.stub(synopsysBridge, "getBridgeUrl").returns(Promise.resolve(undefined));

            const result = await synopsysBridge.downloadAndExtractBridge("/");
            assert.equal(result, bridgeDefaultPath);

            Object.defineProperty(inputs, "BRIDGE_DOWNLOAD_VERSION", {
                value: "",
            });
        });

        it("BRIDGE_DOWNLOAD_VERSION is not defined, throw exception", async () => {
            synopsysBridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(synopsysBridge, "checkIfSynopsysBridgeVersionExists").returns(Promise.resolve(false));
            sandbox.stub(synopsysBridge, "getBridgeUrl").throws(new Error("empty"));

            await synopsysBridge.downloadAndExtractBridge("/").catch(errorObj => {
                expect(errorObj.message).includes("Provided Bridge URL cannot be empty");
            })
        });

        // include diagnostics test case
        it('should run successfully for include diagnostics command preparation', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'true'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() => "./bridge --stage polaris --state polaris_input.json");
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await synopsysBridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage polaris --state polaris_input.json --diagnostics")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
        });

        it('should not add --diagnostics with invalid value in synopsys-bridge command', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'false'});

            sandbox.stub(validator, "validateScanTypes").returns([]);
            sandbox.stub(SynopsysToolsParameter.prototype, "getFormattedCommandForPolaris").callsFake(() => "./bridge --stage polaris --state polaris_input.json");
            sandbox.stub(validator, "validatePolarisInputs").returns([]);

            const preparedCommand = await synopsysBridge.prepareCommand("/temp");
            expect(preparedCommand).contains("./bridge --stage polaris --state polaris_input.json")

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ""});
        });


    });

    context("checkIfSynopsysBridgeVersionExists", () => {
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY is defined and valid", async () => {
            Object.defineProperty(inputs, "SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY", {value: bridgeDefaultPath});
            synopsysBridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(synopsysBridge, "checkIfVersionExists").returns(Promise.resolve(true));
            sandbox.stub(taskLib, "exist").returns(true);

            const result = await synopsysBridge.checkIfSynopsysBridgeVersionExists("0.1.244");
            assert.equal(result, true);

            Object.defineProperty(inputs, "SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY", {
                value: "",
            });
            synopsysBridge.bridgeExecutablePath = "";
        });

        it("SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY is defined and valid and version does not exists", async () => {
            Object.defineProperty(inputs, "SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY", {value: "/path/path"});
            synopsysBridge.bridgeExecutablePath = bridgeDefaultPath
            sandbox.stub(synopsysBridge, "checkIfVersionExists").returns(Promise.resolve(false));
            const result = await synopsysBridge.checkIfSynopsysBridgeVersionExists("0.1.244");
            assert.equal(result, false);

            Object.defineProperty(inputs, "SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY", {
                value: "",
            });
            synopsysBridge.bridgeExecutablePath = "";
        });

        it("SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY is not defined", async () => {
            sandbox.stub(synopsysBridge, "checkIfVersionExists").returns(Promise.resolve(true));
            sandbox.stub(taskLib, "exist").returns(true);
            const result = await synopsysBridge.checkIfSynopsysBridgeVersionExists("0.1.244");
            assert.equal(result, true);
        });
    })

    context("getVersionFromLatestURL", () => {
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("Get Latest Version - success", async () => {

            sandbox.stub(synopsysBridge, "getVersionFromLatestURL").returns(Promise.resolve('0.2.1'));

            const result = await synopsysBridge.getVersionFromLatestURL();
            assert.equal(result, '0.2.1');
        });
    })

    context("checkIfVersionExists", () => {
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            synopsysBridge = new SynopsysBridge();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("Check If Version Exists - success", async () => {

            sandbox.stub(fs, "readFileSync").returns('Synopsys Bridge Package: 0.1.1');

            const result = await synopsysBridge.checkIfVersionExists('0.1.1', bridgeDefaultPath);
            assert.equal(result, true);
        });

        it("Check If Version Exists - failure", async () => {

            sandbox.stub(fs, "readFileSync").returns('0.1.1');

            const result = await synopsysBridge.checkIfVersionExists('0.1.1', bridgeDefaultPath);
            assert.equal(result, false);
        });

        it("Check If Version Exists - exception", async () => {
            sandbox.stub(fs, "readFileSync").throws(new Error("file not found"))
            await synopsysBridge.checkIfVersionExists('0.1.1', bridgeDefaultPath).catch(errorObj => {
                expect(errorObj.message).includes("file not found")
            })
        });
    })

    context("getVersionFromLatestURL", () => {

        let httpClientStub: SinonStub<any[], Promise<httpc.HttpClientResponse>>;
        let synopsysBridge: SynopsysBridge;
        beforeEach(() => {
            synopsysBridge = new SynopsysBridge();
            httpClientStub = sinon.stub()
        });

        afterEach(() => {
            sinon.restore();
        });

        it('Test getVersionFromLatestURL -status 200', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 200
            const responseBody = "Synopsys Bridge Package:0.2.35\nsynopsys-bridge: 0.2.35"

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').returns({
                get: httpClientStub,
            } as any);

            const result = await synopsysBridge.getVersionFromLatestURL()
            expect(result).contains('0.2.35')

        })

        it('Test getVersionFromLatestURL exception', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 200
            const responseBody = "Synopsys Bridge Package:0.2.35\nsynopsys-bridge: 0.2.35"

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').throws({
                get: httpClientStub,
            } as any);

            const result = await synopsysBridge.getVersionFromLatestURL()
            expect(result).contains('')
        })

        it('Test getVersionFromLatestURL -status 500', async () => {
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

            const result = await synopsysBridge.getVersionFromLatestURL()
            expect(result).contains('')

        })
    })
});
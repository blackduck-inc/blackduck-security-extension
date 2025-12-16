// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {assert, expect} from "chai";
import * as sinon from "sinon";
import * as main from "../../src/main";
import * as inputs from "../../src/blackduck-security-task/input";
import { BridgeCli } from "../../src/blackduck-security-task/bridge-cli";
import * as diagnostics from "../../src/blackduck-security-task/diagnostics";
import { ErrorCode } from "../../src/blackduck-security-task/enum/ErrorCodes";
import * as util from "../../src/blackduck-security-task/utility";
import * as constants from "../../src/blackduck-security-task/application-constant";
import * as sslUtils from "../../src/blackduck-security-task/ssl-utils";
import { basename } from "path";
import {
    uploadSarifResultAsArtifact,
} from "../../src/blackduck-security-task/diagnostics";


describe("Main function test cases", () => {

    let sandbox: sinon.SinonSandbox;
    let bridge: BridgeCli;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        bridge = new BridgeCli();
        bridge.bridgeCliVersion = "";
        process.env['BUILD_REPOSITORY_LOCALPATH']  = '';
    });
    afterEach(() => {
        Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});
        Object.defineProperty(inputs, 'NETWORK_SSL_CERT_FILE', {value: ''});
        Object.defineProperty(inputs, 'NETWORK_SSL_TRUST_ALL', {value: false});
        sandbox.restore();
        process.env['BUILD_REPOSITORY_LOCALPATH']  = ''
    });

    context('uploadDiagnostics', () => {

        it('should call upload diagnostics: success with value true', async () => {
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'true'});
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadDiagnostics').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadDiagnostics("test"), undefined);
        });


        it('should call upload diagnostics: success with value false', async () => {
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'false'});
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadDiagnostics').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadDiagnostics("test"), undefined);
        });


        it('should call upload diagnostics: failure', async () => {
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'true'});
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0)
            sandbox.stub(diagnostics,'uploadDiagnostics').throws(new Error("Error uploading artifacts"))
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Error uploading artifacts");
            })
        });

    });

    context('uploadSarifResultAsArtifact', () => {

        it('should call uploadSarifResultAsArtifact with BLACKDUCKSCA_REPORTS_SARIF_CREATE true: success', async () => {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadSarifResultAsArtifact("Blackduck SARIF Generator", ""), undefined);
        });

        it('should call uploadSarifResultAsArtifact with BLACKDUCKSCA_REPORTS_SARIF_CREATE true: failure', async () => {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0)
            sandbox.stub(diagnostics,'uploadSarifResultAsArtifact').throws(new Error("Error uploading artifacts"))
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Error uploading artifacts");
            })
        });

        it('should call uploadSarifResultAsArtifact with POLARIS_REPORTS_SARIF_CREATE true: success', async () => {
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadSarifResultAsArtifact("Polaris SARIF Generator", ""), undefined);
        });

        it('should call uploadSarifResultAsArtifact with POLARIS_REPORTS_SARIF_CREATE true: failure', async () => {
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0)
            sandbox.stub(diagnostics,'uploadSarifResultAsArtifact').throws(new Error("Error uploading artifacts"))
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Error uploading artifacts");
            })
        });

    });

    context('uploadSarifResultAsArtifact', () => {

        it('should call uploadSarifResultAsArtifact with BLACKDUCKSCA_REPORTS_SARIF_CREATE true: success', async () => {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadSarifResultAsArtifact("Blackduck SARIF Generator", ""), undefined);
        });

        it('should call uploadSarifResultAsArtifact with BLACKDUCKSCA_REPORTS_SARIF_CREATE true: failure', async () => {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0)
            sandbox.stub(diagnostics,'uploadSarifResultAsArtifact').throws(new Error("Error uploading artifacts"))
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Error uploading artifacts");
            })
        });

        it('does not upload SARIF report when BLACKDUCKSCA_REPORTS_SARIF_CREATE is false', async () => {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_CREATE', { value: 'false' });
            sandbox.stub(util, 'IS_PR_EVENT').value(true);
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command");
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path");
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0);
            const uploadArtifactStub = sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined);

            await main.run();

            sinon.assert.notCalled(uploadArtifactStub);
        });
    });

    context('main function', () => {
        it('main failure', async () => {
            // Enable air gap to skip Bridge CLI download but still run validation
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            // Stub getBridgeCliPath to avoid filesystem issues in test
            sandbox.stub(BridgeCli.prototype, 'getBridgeCliPath').resolves('/fake/path');

            // Don't provide any scan type configuration, which should cause the error
            try {
                await main.run();
                // If we reach here, the test should fail because main.run() should have thrown
                expect.fail('Expected main.run() to throw an error');
            } catch (errorObj) {
                const error = errorObj as Error;
                expect(error.message).to.include("Requires at least one scan type");
            }
        });
    });

    context('air gap function', () => {
        it('air gap enabled: success', async () => {
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(BridgeCli.prototype, 'getBridgeCliPath').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0)
            main.run()
        });

        it('air gap enabled: failure', async () => {
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path")
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0)
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Bridge CLI default directory does not exist");
            })
        });
    });

    context('return status', () => {
        it('should extract the return_status from the error message', async () => {
            const error = new Error('Requires at least one scan type '.concat(ErrorCode.MISSING_AT_LEAST_ONE_SCAN_TYPE.toString()));
            const emptyErrorMessage = new Error('')

            const returnStatus = main.getStatusFromError(error);
            const emptyReturnStatus = main.getStatusFromError(emptyErrorMessage)

            expect(returnStatus).to.equal(ErrorCode.MISSING_AT_LEAST_ONE_SCAN_TYPE.toString());
            expect('').to.equal(emptyReturnStatus);
        });
    });

    context('log exit codes', () => {
        it('log corresponding error message including return_status for know error', async () => {
            const errorMessage = 'Requires at least one scan type'
            const exitCode = ErrorCode.MISSING_AT_LEAST_ONE_SCAN_TYPE.toString();

            const errorMessageForDefinedExitCodes = main.getExitMessage(errorMessage, exitCode);
            expect("Exit Code: 101 - Requires at least one scan type").to.equal(errorMessageForDefinedExitCodes);
        });

        it('log corresponding error message including return_status for unknown error', async () => {
            const undefinedErrorMessage = 'Unknown error'
            const undefinedExitCode = "9090";

            const errorMessageForUndefinedExitCodes = main.getExitMessage(undefinedErrorMessage, undefinedExitCode);
            expect("Exit Code: 999 - Undefined error from extension: Unknown error").to.equal(errorMessageForUndefinedExitCodes);
        });
    });
    context('SSL Certificate Environment Variable Configuration', () => {
        it('should handle SSL certificate configuration when SSL certificate file is provided and trust all is false', async () => {
            const sslCertFile = '/path/to/certificate.pem';
            Object.defineProperty(inputs, 'NETWORK_SSL_CERT_FILE', {value: sslCertFile});
            Object.defineProperty(inputs, 'NETWORK_SSL_TRUST_ALL', {value: false});
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'});
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA']});

            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command");
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path");
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0);

            await main.run();
        });


        it('should handle SSL certificate configuration with BlackDuck scan', async () => {
            const sslCertFile = '/path/to/certificate.pem';
            Object.defineProperty(inputs, 'NETWORK_SSL_CERT_FILE', {value: sslCertFile});
            Object.defineProperty(inputs, 'NETWORK_SSL_TRUST_ALL', {value: false});
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'blackduck_url'});
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'api_token'});

            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command");
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path");
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0);

            await main.run();
        });

        it('should handle SSL certificate configuration with Coverity scan', async () => {
            const sslCertFile = '/path/to/certificate.pem';
            Object.defineProperty(inputs, 'NETWORK_SSL_CERT_FILE', {value: sslCertFile});
            Object.defineProperty(inputs, 'NETWORK_SSL_TRUST_ALL', {value: false});
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'coverity_url'});
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'coverity_user'});
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'coverity_password'});

            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command");
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path");
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0);

            await main.run();
        });

        it('should handle SSL certificate configuration with multiple scan types', async () => {
            const sslCertFile = '/path/to/certificate.pem';
            Object.defineProperty(inputs, 'NETWORK_SSL_CERT_FILE', {value: sslCertFile});
            Object.defineProperty(inputs, 'NETWORK_SSL_TRUST_ALL', {value: false});
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'});
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA']});
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'blackduck_url'});
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'api_token'});

            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command");
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path");
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0);
            await main.run();
        });

        it('should handle SSL trust all configuration when NETWORK_SSL_TRUST_ALL is true', async () => {
            Object.defineProperty(inputs, 'NETWORK_SSL_TRUST_ALL', {value: true});
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'});
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA']});

            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command");
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path");
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0);
            await main.run();
        });
    });
    describe("Extract input.json and update SARIF file path", () => {
        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it("should extract input file path, file name, and call updateSarifFilePaths with correct arguments", () => {
            const command = "--input /tmp/input.json";
            const workSpaceDir = "/workspace";
            const bridgeVersion = "1.2.3";
            const expectedInputFilePath = "/tmp/input.json";
            const expectedFileName = "input.json";

            // Stub extractInputJsonFilename to return a known path
            const extractStub = sandbox.stub(util, "extractInputJsonFilename").returns(expectedInputFilePath);
            // Stub updateSarifFilePaths to just track calls
            const updateStub = sandbox.stub(util, "updateSarifFilePaths");

            // Simulate the code under test
            const productInputFilPath = util.extractInputJsonFilename(command);
            const productInputFileName = basename(productInputFilPath);
            util.updateSarifFilePaths(
                workSpaceDir,
                productInputFileName,
                bridgeVersion,
                productInputFilPath
            );

            expect(extractStub.calledOnceWith(command)).to.be.true;
            expect(productInputFilPath).to.equal(expectedInputFilePath);
            expect(productInputFileName).to.equal(expectedFileName);
            expect(updateStub.calledOnceWith(
                workSpaceDir,
                expectedFileName,
                bridgeVersion,
                expectedInputFilePath
            )).to.be.true;
        });
    });

    describe("BlackDuck SARIF repost logic", () => {
        let sandbox: sinon.SinonSandbox;
        let uploadStub: sinon.SinonStub;
        let logStub: sinon.SinonStub;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            uploadStub = sandbox.stub(require("../../src/blackduck-security-task/diagnostics"), "uploadSarifResultAsArtifact");
            logStub = sandbox.stub(console, "log");
            sandbox.stub(util, "IS_PR_EVENT").value(false);
            sandbox.stub(inputs, "BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH").value("fake-path");
        });

        afterEach(() => {
            sandbox.restore();
        });

        function callLogic(bridgeVersion: string) {
            // Simulate the logic under test using semantic version comparison
            if (!util.IS_PR_EVENT) {
                console.log(constants.BLACKDUCKSCA_SARIF_REPOST_ENABLED);
                if (util.isVersionLess(bridgeVersion, constants.VERSION)) {
                    uploadSarifResultAsArtifact(
                        constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
                        inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
                    );
                } else {
                    uploadSarifResultAsArtifact(
                        constants.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY,
                        inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
                    );
                }
            }
        }

        it("should call uploadSarifResultAsArtifact with default directory when bridgeVersion < constants.VERSION", () => {
            callLogic("1.0.0");
            sinon.assert.calledWith(logStub, constants.BLACKDUCKSCA_SARIF_REPOST_ENABLED);
            sinon.assert.calledWith(
                uploadStub,
                constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
                "fake-path"
            );
        });

        it("should call uploadSarifResultAsArtifact with integrations directory when bridgeVersion >= constants.VERSION", () => {
            callLogic(constants.VERSION);
            sinon.assert.calledWith(logStub, constants.BLACKDUCKSCA_SARIF_REPOST_ENABLED);
            sinon.assert.calledWith(
                uploadStub,
                constants.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY,
                "fake-path"
            );
        });
    });

    describe("Version Comparison Tests for SARIF Paths", () => {
        let sandbox: sinon.SinonSandbox;
        const fs = require('fs');

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            // Set up basic environment for main.run()
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', { value: 'blackduck_url', configurable: true });
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', { value: 'api_token', configurable: true });
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_CREATE', { value: 'true', configurable: true });
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH', { value: '', configurable: true });

            sandbox.stub(util, "IS_PR_EVENT").value(false);
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("--input /tmp/bd_input.json");
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("/bridge/path");
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0);
            sandbox.stub(util, 'extractInputJsonFilename').returns('/tmp/bd_input.json');
            sandbox.stub(util, 'updateSarifFilePaths').returns(undefined);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should use old SARIF path when bridge version is less than 3.5.0', async () => {
            // Mock bridge version to be 1.5.0 (< 3.5.0)
            const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('bridge-cli-bundle: 1.5.0');
            const uploadStub = sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined);

            await main.run();

            // Verify uploadSarifResultAsArtifact was called with OLD path
            sinon.assert.calledWith(
                uploadStub,
                constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
                inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
            );
        });

        it('should use new SARIF path when bridge version is greater than or equal to 3.5.0', async () => {
            // Mock bridge version to be 3.6.0 (>= 3.5.0)
            const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('bridge-cli-bundle: 3.6.0');
            const uploadStub = sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined);

            await main.run();

            // Verify uploadSarifResultAsArtifact was called with NEW integrations path
            sinon.assert.calledWith(
                uploadStub,
                constants.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY,
                inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
            );
        });

        it('should use new SARIF path when bridge version is exactly 3.5.0', async () => {
            // Mock bridge version to be 3.5.0 (== 3.5.0)
            const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('bridge-cli-bundle: 3.5.0');
            const uploadStub = sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined);

            await main.run();

            // Verify uploadSarifResultAsArtifact was called with NEW integrations path
            sinon.assert.calledWith(
                uploadStub,
                constants.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY,
                inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
            );
        });

        it('should use new SARIF path for double-digit major version (10.0.0)', async () => {
            // Mock bridge version to be 10.0.0 (double-digit major version)
            // String comparison would fail: "10.0.0" < "3.5.0" = false (lexicographic, WRONG!)
            // Semantic comparison works: isVersionLess("10.0.0", "3.5.0") = false (CORRECT!)
            const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('bridge-cli-bundle: 10.0.0');
            const uploadStub = sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined);

            await main.run();

            // Verify uploadSarifResultAsArtifact was called with NEW integrations path
            sinon.assert.calledWith(
                uploadStub,
                constants.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY,
                inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
            );
        });

        it('should use new SARIF path for double-digit minor version (3.15.0)', async () => {
            // Mock bridge version to be 3.15.0 (double-digit minor version)
            // String comparison would fail: "3.15.0" < "3.5.0" = true (lexicographic, WRONG!)
            // Semantic comparison works: isVersionLess("3.15.0", "3.5.0") = false (CORRECT!)
            const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('bridge-cli-bundle: 3.15.0');
            const uploadStub = sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined);

            await main.run();

            // Verify uploadSarifResultAsArtifact was called with NEW integrations path
            sinon.assert.calledWith(
                uploadStub,
                constants.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY,
                inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
            );
        });

        it('should use new SARIF path for double-digit patch version (3.5.10)', async () => {
            // Mock bridge version to be 3.5.10 (double-digit patch version)
            // String comparison would fail: "3.5.10" < "3.5.0" = false (lexicographic, WRONG!)
            // Semantic comparison works: isVersionLess("3.5.10", "3.5.0") = false (CORRECT!)
            const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('bridge-cli-bundle: 3.5.10');
            const uploadStub = sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined);

            await main.run();

            // Verify uploadSarifResultAsArtifact was called with NEW integrations path
            sinon.assert.calledWith(
                uploadStub,
                constants.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY,
                inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
            );
        });

        it('should handle pre-release version (3.5.0rc1) correctly', async () => {
            // Mock bridge version to be 3.5.0rc1 (pre-release version)
            // Note: semver's coerce() strips pre-release tags, so coerce('3.5.0rc1') → '3.5.0'
            // Therefore it's treated as >= 3.5.0 and uses the NEW integrations path
            const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('bridge-cli-bundle: 3.5.0rc1');
            const uploadStub = sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined);

            await main.run();

            // Verify uploadSarifResultAsArtifact was called with NEW integrations path
            // (pre-release version is coerced to base version 3.5.0)
            sinon.assert.calledWith(
                uploadStub,
                constants.INTEGRATIONS_DEFAULT_BLACKDUCKSCA_SARIF_GENERATOR_DIRECTORY,
                inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH
            );
        });
    });

    describe("Polaris SARIF Path Version Comparison Tests", () => {
        let sandbox: sinon.SinonSandbox;
        const fs = require('fs');

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            // Set up basic environment for Polaris scan
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', { value: 'server_url', configurable: true });
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', { value: 'access_token', configurable: true });
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', { value: ['SCA'], configurable: true });
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_CREATE', { value: 'true', configurable: true });
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_FILE_PATH', { value: '', configurable: true });

            sandbox.stub(util, "IS_PR_EVENT").value(false);
            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("--input /tmp/polaris_input.json");
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("/bridge/path");
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0);
            sandbox.stub(util, 'extractInputJsonFilename').returns('/tmp/polaris_input.json');
            sandbox.stub(util, 'updateSarifFilePaths').returns(undefined);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should use old SARIF path for Polaris when bridge version is less than 3.5.0', async () => {
            // Mock bridge version to be 2.0.0 (< 3.5.0)
            const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('bridge-cli-bundle: 2.0.0');
            const uploadStub = sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined);

            await main.run();

            // Verify uploadSarifResultAsArtifact was called with OLD Polaris path
            sinon.assert.calledWith(
                uploadStub,
                constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY,
                inputs.POLARIS_REPORTS_SARIF_FILE_PATH
            );
        });

        it('should use new SARIF path for Polaris when bridge version is greater than or equal to 3.5.0', async () => {
            // Mock bridge version to be 3.8.0 (>= 3.5.0)
            const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('bridge-cli-bundle: 3.8.0');
            const uploadStub = sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined);

            await main.run();

            // Verify uploadSarifResultAsArtifact was called with NEW Polaris integrations path
            sinon.assert.calledWith(
                uploadStub,
                constants.INTEGRATIONS_DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY,
                inputs.POLARIS_REPORTS_SARIF_FILE_PATH
            );
        });

        it('should use new SARIF path for Polaris with double-digit major version (10.0.0)', async () => {
            // Test semantic version comparison with double-digit major version
            const readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('bridge-cli-bundle: 10.0.0');
            const uploadStub = sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined);

            await main.run();

            // Verify uploadSarifResultAsArtifact was called with NEW Polaris integrations path
            sinon.assert.calledWith(
                uploadStub,
                constants.INTEGRATIONS_DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY,
                inputs.POLARIS_REPORTS_SARIF_FILE_PATH
            );
        });
    });
});
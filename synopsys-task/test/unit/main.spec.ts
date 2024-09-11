// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {assert, expect} from "chai";
import * as sinon from "sinon";
import * as main from "../../src/main";
import * as inputs from "../../src/synopsys-task/input";
import { Bridge } from "../../src/synopsys-task/bridge";
import * as diagnostics from "../../src/synopsys-task/diagnostics";
import { ErrorCode } from "../../src/synopsys-task/enum/ErrorCodes";

describe("Main function test cases", () => {

    let sandbox: sinon.SinonSandbox;
    let synopsysBridge: Bridge;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        synopsysBridge = new Bridge();
        process.env['BUILD_REPOSITORY_LOCALPATH']  = '/tmp'
    });
    afterEach(() => {
        Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});
        sandbox.restore();
        process.env['BUILD_REPOSITORY_LOCALPATH']  = ''
    });

    context('uploadDiagnostics', () => {

        it('should call upload diagnostics: success with value true', async () => {
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'true'});
            sandbox.stub(Bridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(Bridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(Bridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadDiagnostics').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadDiagnostics("test"), undefined);
        });


        it('should call upload diagnostics: success with value false', async () => {
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'false'});
            sandbox.stub(Bridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(Bridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(Bridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadDiagnostics').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadDiagnostics("test"), undefined);
        });


        it('should call upload diagnostics: failure', async () => {
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', {value: 'true'});
            sandbox.stub(Bridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(Bridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(Bridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics,'uploadDiagnostics').throws(new Error("Error uploading artifacts"))
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Error uploading artifacts");
            })
        });

    });

    context('uploadSarifResultAsArtifact', () => {

        it('should call uploadSarifResultAsArtifact with BLACKDUCK_SCA_REPORTS_SARIF_CREATE true: success', async () => {
            Object.defineProperty(inputs, 'BLACKDUCK_SCA_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(Bridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(Bridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(Bridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadSarifResultAsArtifact("Blackduck SARIF Generator", ""), undefined);
        });

        it('should call uploadSarifResultAsArtifact with BLACKDUCK_SCA_REPORTS_SARIF_CREATE true: failure', async () => {
            Object.defineProperty(inputs, 'BLACKDUCK_SCA_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(Bridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(Bridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(Bridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics,'uploadSarifResultAsArtifact').throws(new Error("Error uploading artifacts"))
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Error uploading artifacts");
            })
        });

        it('should call uploadSarifResultAsArtifact with POLARIS_REPORTS_SARIF_CREATE true: success', async () => {
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(Bridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(Bridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(Bridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadSarifResultAsArtifact("Polaris SARIF Generator", ""), undefined);
        });

        it('should call uploadSarifResultAsArtifact with POLARIS_REPORTS_SARIF_CREATE true: failure', async () => {
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(Bridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(Bridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(Bridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics,'uploadSarifResultAsArtifact').throws(new Error("Error uploading artifacts"))
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Error uploading artifacts");
            })
        });

    });

    context('uploadSarifResultAsArtifact', () => {

        it('should call uploadSarifResultAsArtifact with BLACKDUCK_SCA_REPORTS_SARIF_CREATE true: success', async () => {
            Object.defineProperty(inputs, 'BLACKDUCK_SCA_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(Bridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(Bridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(Bridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadSarifResultAsArtifact("Blackduck SARIF Generator", ""), undefined);
        });

        it('should call uploadSarifResultAsArtifact with BLACKDUCK_SCA_REPORTS_SARIF_CREATE true: failure', async () => {
            Object.defineProperty(inputs, 'BLACKDUCK_SCA_REPORTS_SARIF_CREATE', {value: 'true'});
            sandbox.stub(Bridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(Bridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(Bridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics,'uploadSarifResultAsArtifact').throws(new Error("Error uploading artifacts"))
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Error uploading artifacts");
            })
        });

    });

    context('main function', () => {
        it('main failure', async () => {
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Requires at least one scan type");
            })
        });
    });

    context('air gap function', () => {
        it('air gap enabled: success', async () => {
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            sandbox.stub(Bridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(Bridge.prototype, 'getBridgePath').resolves("test command")
            sandbox.stub(Bridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(Bridge.prototype, 'executeBridgeCommand').resolves(0)
            main.run()
        });

        it('air gap enabled: failure', async () => {
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: true});
            sandbox.stub(Bridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(Bridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(Bridge.prototype, 'executeBridgeCommand').resolves(0)
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Default Bridge CLI path does not exist");
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
});
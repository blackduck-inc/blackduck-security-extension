import { assert, expect } from "chai";
import * as sinon from "sinon";
import * as main from "../../src/main";
import * as inputs from "../../src/synopsys-task/input";
import { SynopsysBridge } from "../../src/synopsys-task/synopsys-bridge";
import * as diagnostics from "../../src/synopsys-task/diagnostics";
import { ErrorCode } from "../../src/synopsys-task/enum/ErrorCodes";

describe("Main function test cases", () => {

    let sandbox: sinon.SinonSandbox;
    let synopsysBridge: SynopsysBridge;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        synopsysBridge = new SynopsysBridge();
        process.env['BUILD_REPOSITORY_LOCALPATH'] = '/tmp'
    });
    afterEach(() => {
        Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', { value: false });
        sandbox.restore();
        process.env['BUILD_REPOSITORY_LOCALPATH'] = ''
    });

    context('uploadDiagnostics', () => {

        it('should call upload diagnostics: success with value true', async () => {
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', { value: 'true' });
            sandbox.stub(SynopsysBridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(SynopsysBridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadDiagnostics').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadDiagnostics("test"), undefined);
        });


        it('should call upload diagnostics: success with value false', async () => {
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', { value: 'false' });
            sandbox.stub(SynopsysBridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(SynopsysBridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadDiagnostics').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadDiagnostics("test"), undefined);
        });


        it('should call upload diagnostics: failure', async () => {
            Object.defineProperty(inputs, 'INCLUDE_DIAGNOSTICS', { value: 'true' });
            sandbox.stub(SynopsysBridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(SynopsysBridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadDiagnostics').throws(new Error("Error uploading artifacts"))
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Error uploading artifacts");
            })
        });

    });

    context('uploadSarifResultAsArtifact', () => {

        it('should call uploadSarifResultAsArtifact with BLACKDUCK_REPORTS_SARIF_CREATE true: success', async () => {
            Object.defineProperty(inputs, 'BLACKDUCK_REPORTS_SARIF_CREATE', { value: 'true' });
            sandbox.stub(SynopsysBridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(SynopsysBridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadSarifResultAsArtifact("Blackduck SARIF Generator", ""), undefined);
        });

        it('should call uploadSarifResultAsArtifact with BLACKDUCK_REPORTS_SARIF_CREATE true: failure', async () => {
            Object.defineProperty(inputs, 'BLACKDUCK_REPORTS_SARIF_CREATE', { value: 'true' });
            sandbox.stub(SynopsysBridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(SynopsysBridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').throws(new Error("Error uploading artifacts"))
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Error uploading artifacts");
            })
        });

        it('should call uploadSarifResultAsArtifact with POLARIS_REPORTS_SARIF_CREATE true: success', async () => {
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_CREATE', { value: 'true' });
            sandbox.stub(SynopsysBridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(SynopsysBridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadSarifResultAsArtifact("Polaris SARIF Generator", ""), undefined);
        });

        it('should call uploadSarifResultAsArtifact with POLARIS_REPORTS_SARIF_CREATE true: failure', async () => {
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_CREATE', { value: 'true' });
            sandbox.stub(SynopsysBridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(SynopsysBridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').throws(new Error("Error uploading artifacts"))
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Error uploading artifacts");
            })
        });

    });

    context('uploadSarifResultAsArtifact', () => {

        it('should call uploadSarifResultAsArtifact with BLACKDUCK_REPORTS_SARIF_CREATE true: success', async () => {
            Object.defineProperty(inputs, 'BLACKDUCK_REPORTS_SARIF_CREATE', { value: 'true' });
            sandbox.stub(SynopsysBridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(SynopsysBridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').returns(undefined)
            main.run()
            assert.strictEqual(diagnostics.uploadSarifResultAsArtifact("Blackduck SARIF Generator", ""), undefined);
        });

        it('should call uploadSarifResultAsArtifact with BLACKDUCK_REPORTS_SARIF_CREATE true: failure', async () => {
            Object.defineProperty(inputs, 'BLACKDUCK_REPORTS_SARIF_CREATE', { value: 'true' });
            sandbox.stub(SynopsysBridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(SynopsysBridge.prototype, 'executeBridgeCommand').resolves(0)
            sandbox.stub(diagnostics, 'uploadSarifResultAsArtifact').throws(new Error("Error uploading artifacts"))
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
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', { value: true });
            sandbox.stub(SynopsysBridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'getSynopsysBridgePath').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(SynopsysBridge.prototype, 'executeBridgeCommand').resolves(0)
            main.run()
        });

        it('air gap enabled: failure', async () => {
            Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', { value: true });
            sandbox.stub(SynopsysBridge.prototype, 'prepareCommand').resolves("test command")
            sandbox.stub(SynopsysBridge.prototype, 'downloadAndExtractBridge').resolves("test-path")
            sandbox.stub(SynopsysBridge.prototype, 'executeBridgeCommand').resolves(0)
            main.run().catch(errorObj => {
                expect(errorObj.message).includes("Synopsys Default Bridge path does not exist");
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
        it('log corresponding error message including return_status', async () => {
            const errorMessage = 'Requires at least one scan type'
            const exitCode = ErrorCode.MISSING_AT_LEAST_ONE_SCAN_TYPE.toString();

            const undefinedErrorMessage = 'Unknown error'
            const undefinedExitCode = "9090";


            const erroMessageForDefinedExitCodes = main.logExitCodes(errorMessage, exitCode);
            const erroMessageForUndefinedExitCodes = main.logExitCodes(undefinedErrorMessage, undefinedExitCode);
            expect("Exit Code: 101 Requires at least one scan type").to.equal(erroMessageForDefinedExitCodes);
            expect("Undefined error from extension: Unknown error 999").to.equal(erroMessageForUndefinedExitCodes);
        });
    });
});
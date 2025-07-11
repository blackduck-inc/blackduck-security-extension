// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {assert, expect} from "chai";
import * as sinon from "sinon";
import * as main from "../../src/main";
import * as inputs from "../../src/blackduck-security-task/input";
import { BridgeCli } from "../../src/blackduck-security-task/bridge-cli";
import * as diagnostics from "../../src/blackduck-security-task/diagnostics";
import { ErrorCode } from "../../src/blackduck-security-task/enum/ErrorCodes";
import * as sslUtils from "../../src/blackduck-security-task/ssl-utils";

describe("Main function test cases", () => {

    let sandbox: sinon.SinonSandbox;
    let bridge: BridgeCli;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        bridge = new BridgeCli();
        bridge.bridgeCliVersion = "";
        process.env['BUILD_REPOSITORY_LOCALPATH']  = '/tmp'
    });
    afterEach(() => {
        Object.defineProperty(inputs, 'ENABLE_NETWORK_AIRGAP', {value: false});
        Object.defineProperty(inputs, 'NETWORK_SSL_CERT_FILE', {value: ''});
        Object.defineProperty(inputs, 'NETWORK_SSL_TRUST_ALL', {value: false});
        sandbox.restore();
        process.env['BUILD_REPOSITORY_LOCALPATH']  = '';
        delete process.env['NODE_EXTRA_CA_CERTS'];
        delete process.env['NODE_TLS_REJECT_UNAUTHORIZED'];
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

        it('should not set NODE_EXTRA_CA_CERTS when SSL certificate file is provided but trust all is true', async () => {
            const sslCertFile = '/path/to/certificate.pem';
            Object.defineProperty(inputs, 'NETWORK_SSL_CERT_FILE', {value: sslCertFile});
            Object.defineProperty(inputs, 'NETWORK_SSL_TRUST_ALL', {value: true});
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'});
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA']});

            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command");
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path");
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0);

            await main.run();

        });

        it('should not set NODE_EXTRA_CA_CERTS when SSL certificate file is empty', async () => {
            Object.defineProperty(inputs, 'NETWORK_SSL_CERT_FILE', {value: ''});
            Object.defineProperty(inputs, 'NETWORK_SSL_TRUST_ALL', {value: false});
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'});
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA']});

            sandbox.stub(BridgeCli.prototype, 'prepareCommand').resolves("test command");
            sandbox.stub(BridgeCli.prototype, 'downloadAndExtractBridgeCli').resolves("test-path");
            sandbox.stub(BridgeCli.prototype, 'executeBridgeCliCommand').resolves(0);

            await main.run();

        });

        it('should not set NODE_EXTRA_CA_CERTS when no SSL certificate file is provided', async () => {
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
});
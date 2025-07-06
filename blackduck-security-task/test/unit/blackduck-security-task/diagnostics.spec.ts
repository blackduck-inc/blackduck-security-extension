// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {assert, expect} from "chai";
import * as sinon from "sinon";
import * as diagnostics from "../../../src/blackduck-security-task/diagnostics";
import * as taskLib from "azure-pipelines-task-lib";
import * as inputs from "../../../src/blackduck-security-task/input";
import * as constants from "../../../src/blackduck-security-task/application-constant";
import {getArbitraryInputs} from "../../../src/blackduck-security-task/input";
import * as utility from "../../../src/blackduck-security-task/utility";

describe("Bridge CLI upload diagnostics test", () => {
    
    let sandbox: sinon.SinonSandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => {
        sandbox.restore();
    });

    context('uploadDiagnostics', () => {

        it('should success with valid directory and void/undefined type return', async function () {
            sandbox.stub(taskLib, "exist").returns(true);
            const uploadArtifactStub = sandbox.stub(taskLib, 'uploadArtifact').returns(undefined);
            assert.strictEqual(diagnostics.uploadDiagnostics("test"), undefined);
            expect(uploadArtifactStub.returned(undefined)).to.be.true;
            
        });

        it('upload diagnostics with invalid directory', async function () {
            sandbox.stub(taskLib, "exist").returns(false);
            diagnostics.uploadDiagnostics("test");
        });

    });

    context('uploadSarifResultAsArtifact', () => {

        it('should success with blackduck sarif file path and void/undefined type return', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH', {value: 'test-dir/test-path.json'})
            sandbox.stub(taskLib, "exist").returns(true);
            const uploadArtifactStub = sandbox.stub(taskLib, 'uploadArtifact').returns(undefined);
            assert.strictEqual(
              diagnostics.uploadSarifResultAsArtifact(
                  constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
                "test"
              ),
              undefined
            );
            expect(uploadArtifactStub.returned(undefined)).to.be.true;
        });


        it('should success with default blackduck sarif file path and void/undefined type return', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH',
                {value: './bridge/'.concat(constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY).concat('/test-path.json')})
            sandbox.stub(taskLib, "exist").returns(true);
            const uploadArtifactStub = sandbox.stub(taskLib, 'uploadArtifact').returns(undefined);
            assert.strictEqual(diagnostics.uploadSarifResultAsArtifact("","test"), undefined);
            expect(uploadArtifactStub.returned(undefined)).to.be.true;
        });

        it('upload diagnostics with invalid directory', async function () {
            sandbox.stub(taskLib, "exist").returns(false);
            diagnostics.uploadSarifResultAsArtifact(
                constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
              "test"
            );
        });

        it('should success with polaris sarif file path and void/undefined type return', async function () {
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_FILE_PATH', {value: 'test-dir/test-path.json'})
            sandbox.stub(taskLib, "exist").returns(true);
            const uploadArtifactStub = sandbox.stub(taskLib, 'uploadArtifact').returns(undefined);
            assert.strictEqual(
                diagnostics.uploadSarifResultAsArtifact(
                    constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY,
                    "test"
                ),
                undefined
            );
            expect(uploadArtifactStub.returned(undefined)).to.be.true;
        });

        it('should success with default polaris sarif file path and void/undefined type return', async function () {
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_FILE_PATH',
                {value: './bridge/'.concat(constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY).concat('/test-path.json')})
            sandbox.stub(taskLib, "exist").returns(true);
            const uploadArtifactStub = sandbox.stub(taskLib, 'uploadArtifact').returns(undefined);
            assert.strictEqual(diagnostics.uploadSarifResultAsArtifact("","test"), undefined);
            expect(uploadArtifactStub.returned(undefined)).to.be.true;
        });
        it('uploads SARIF report successfully when file path exists for Blackduck', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH', {value: 'test-dir/test-path.json'});
            sandbox.stub(taskLib, "exist").withArgs('test-dir/test-path.json').returns(true);
            const uploadArtifactStub = sandbox.stub(taskLib, 'uploadArtifact').returns(undefined);

            diagnostics.uploadSarifResultAsArtifact(constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY, 'test-dir/test-path.json');

            expect(uploadArtifactStub.calledOnceWith(
                constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME,
                'test-dir/test-path.json',
                constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME
            )).to.be.true;
        });

        it('logs failure when SARIF file path does not exist for Blackduck', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH', {value: 'test-dir/test-path.json'});
            sandbox.stub(taskLib, "exist").withArgs('test-dir/test-path.json').returns(false);
            const consoleLogStub = sandbox.stub(console, 'log');

            diagnostics.uploadSarifResultAsArtifact(constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY, 'test-dir/test-path.json');

            expect(consoleLogStub.calledWith(
                `Uploading SARIF report as artifact failed as file path not found at: test-dir/test-path.json`
            )).to.be.true;
        });

        it('uploads SARIF report successfully when file path exists for Polaris', async function () {
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_FILE_PATH', {value: 'test-dir/test-path.json'});
            sandbox.stub(taskLib, "exist").withArgs('test-dir/test-path.json').returns(true);
            const uploadArtifactStub = sandbox.stub(taskLib, 'uploadArtifact').returns(undefined);

            diagnostics.uploadSarifResultAsArtifact(constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY, 'test-dir/test-path.json');

            expect(uploadArtifactStub.calledOnceWith(
                constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME,
                'test-dir/test-path.json',
                constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME
            )).to.be.true;
        });

        it('logs failure when SARIF file path does not exist for Polaris', async function () {
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_FILE_PATH', {value: 'test-dir/test-path.json'});
            sandbox.stub(taskLib, "exist").withArgs('test-dir/test-path.json').returns(false);
            const consoleLogStub = sandbox.stub(console, 'log');

            diagnostics.uploadSarifResultAsArtifact(constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY, 'test-dir/test-path.json');

            expect(consoleLogStub.calledWith(
                `Uploading SARIF report as artifact failed as file path not found at: test-dir/test-path.json`
            )).to.be.true;
        });

        it('uploads SARIF report successfully with default integration path when file exists', async function () {
            sandbox.stub(taskLib, "exist").withArgs('default-dir/test-path.json').returns(true);
            const uploadArtifactStub = sandbox.stub(taskLib, 'uploadArtifact').returns(undefined);
            sandbox.stub(utility, 'getIntegrationDefaultSarifReportPath').returns('default-dir/test-path.json');

            diagnostics.uploadSarifResultAsArtifact('custom-dir', '');

            expect(uploadArtifactStub.calledOnceWith(
                constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME,
                'default-dir/test-path.json',
                constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME
            )).to.be.true;
        });

        it('logs failure when default integration SARIF file path does not exist', async function () {
            sandbox.stub(taskLib, "exist").withArgs('default-dir/test-path.json').returns(false);
            const consoleLogStub = sandbox.stub(console, 'log');
            sandbox.stub(utility, 'getIntegrationDefaultSarifReportPath').returns('default-dir/test-path.json');

            diagnostics.uploadSarifResultAsArtifact('custom-dir', '');

            expect(consoleLogStub.calledWith(
                `Uploading SARIF report as artifact failed as file path not found at: default-dir/test-path.json`
            )).to.be.true;
        });
    });

    context('uploadSarifResultAsArtifact', () => {
        let uploadArtifactStub: sinon.SinonStub;
        let existStub: sinon.SinonStub;
        let consoleLogStub: sinon.SinonStub;
        let getDefaultPathStub: sinon.SinonStub;
        let getIntegrationPathStub: sinon.SinonStub;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            uploadArtifactStub = sandbox.stub(taskLib, 'uploadArtifact').returns(undefined);
            existStub = sandbox.stub(taskLib, 'exist');
            consoleLogStub = sandbox.stub(console, 'log');
            getDefaultPathStub = sandbox.stub(utility, 'getDefaultSarifReportPath');
            getIntegrationPathStub = sandbox.stub(utility, 'getIntegrationDefaultSarifReportPath');
        });

        afterEach(() => {
            sandbox.restore();
        });

        describe('Default Blackduck SARIF Generator', () => {
            it('uploads user-provided file path when it exists', async () => {
                existStub.returns(true);
                const userPath = 'user/provided/path.sarif';

                diagnostics.uploadSarifResultAsArtifact(
                    constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
                    userPath
                );

                sinon.assert.calledWith(uploadArtifactStub,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME,
                    userPath,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME
                );
                sinon.assert.calledWith(consoleLogStub, `Uploading SARIF report as artifact from: ${userPath}`);
            });

            it('uses default path when no user path is provided', async () => {
                const defaultPath = 'default/path.sarif';
                existStub.returns(true);
                getDefaultPathStub.returns(defaultPath);

                diagnostics.uploadSarifResultAsArtifact(
                    constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
                    ''
                );

                sinon.assert.calledWith(uploadArtifactStub,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME,
                    defaultPath,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME
                );
            });

            it('logs error when file does not exist', async () => {
                existStub.returns(false);
                const userPath = 'non/existent/path.sarif';

                diagnostics.uploadSarifResultAsArtifact(
                    constants.DEFAULT_BLACKDUCK_SARIF_GENERATOR_DIRECTORY,
                    userPath
                );

                sinon.assert.notCalled(uploadArtifactStub);
                sinon.assert.calledWith(consoleLogStub,
                    `Uploading SARIF report as artifact failed as file path not found at: ${userPath}`
                );
            });
        });

        describe('Default Polaris SARIF Generator', () => {
            it('uploads user-provided file path when it exists', async () => {
                existStub.returns(true);
                const userPath = 'user/provided/path.sarif';

                diagnostics.uploadSarifResultAsArtifact(
                    constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY,
                    userPath
                );

                sinon.assert.calledWith(uploadArtifactStub,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME,
                    userPath,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME
                );
            });

            it('uses default path when no user path is provided', async () => {
                const defaultPath = 'default/polaris/path.sarif';
                existStub.returns(true);
                getDefaultPathStub.returns(defaultPath);

                diagnostics.uploadSarifResultAsArtifact(
                    constants.DEFAULT_POLARIS_SARIF_GENERATOR_DIRECTORY,
                    ''
                );

                sinon.assert.calledWith(uploadArtifactStub,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME,
                    defaultPath,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME
                );
            });
        });

        describe('Integration SARIF Generator', () => {
            it('uploads user-provided file path when it exists', async () => {
                existStub.returns(true);
                const userPath = 'user/provided/path.sarif';

                diagnostics.uploadSarifResultAsArtifact(
                    'custom-directory',
                    userPath
                );

                sinon.assert.calledWith(uploadArtifactStub,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME,
                    userPath,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME
                );
            });

            it('uses integration path when no user path is provided', async () => {
                const integrationPath = 'integration/path.sarif';
                existStub.returns(true);
                getIntegrationPathStub.returns(integrationPath);

                diagnostics.uploadSarifResultAsArtifact(
                    'custom-directory',
                    ''
                );

                sinon.assert.calledWith(uploadArtifactStub,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME,
                    integrationPath,
                    constants.SARIF_UPLOAD_FOLDER_ARTIFACT_NAME
                );
            });

            it('logs error when integration file does not exist', async () => {
                existStub.returns(false);
                const integrationPath = 'non/existent/integration.sarif';
                getIntegrationPathStub.returns(integrationPath);

                diagnostics.uploadSarifResultAsArtifact(
                    'custom-directory',
                    ''
                );

                sinon.assert.notCalled(uploadArtifactStub);
                sinon.assert.calledWith(consoleLogStub,
                    `Uploading SARIF report as artifact failed as file path not found at: ${integrationPath}`
                );
            });
        });
    });

});
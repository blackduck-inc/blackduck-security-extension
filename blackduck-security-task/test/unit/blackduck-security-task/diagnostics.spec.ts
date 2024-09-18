// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {assert, expect} from "chai";
import * as sinon from "sinon";
import * as diagnostics from "../../../src/blackduck-security-task/diagnostics";
import * as taskLib from "azure-pipelines-task-lib";
import * as inputs from "../../../src/blackduck-security-task/input";
import * as constants from "../../../src/blackduck-security-task/application-constant";
import {getArbitraryInputs} from "../../../src/blackduck-security-task/input";

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
    });

});
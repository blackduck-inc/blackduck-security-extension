// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {expect} from "chai";
import * as sinon from "sinon";
import {BridgeToolsParameter} from "../../../src/blackduck-security-task/tools-parameter";
import * as process from "process";
import * as path from "path";
import * as taskLib from "azure-pipelines-task-lib/task";
import * as inputs from "../../../src/blackduck-security-task/input";
import * as constants from "../../../src/blackduck-security-task/application-constant";
import * as fs from 'fs';
import * as validator from "../../../src/blackduck-security-task/validator";
import {AzureService} from "../../../src/blackduck-security-task/azure-service-client";
import {
    AZURE_BUILD_REASON, AZURE_ENVIRONMENT_VARIABLES,
} from "../../../src/blackduck-security-task/model/azure";
import * as utility from "../../../src/blackduck-security-task/utility";
import { ErrorCode } from "../../../src/blackduck-security-task/enum/ErrorCodes";

describe("Bridge CLI Tools Parameter test", () => {
    context('Polaris command preparation', () => {
        let sandbox: sinon.SinonSandbox;
        let bridgeToolsParameter: BridgeToolsParameter;
        let polarisStateFile: string;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            const tempDir = process.cwd();
            polarisStateFile = path.join(tempDir, "polaris_input.json");
            bridgeToolsParameter = new BridgeToolsParameter(tempDir);
        });

        afterEach(() => {
            taskLib.rmRF(polarisStateFile);
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_NAME', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_BRANCH_PARENT_NAME', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA','sast']})
            Object.defineProperty(inputs, 'POLARIS_TRIAGE', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_TEST_SCA_TYPE', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_BUILD_COMMAND', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_CLEAN_COMMAND', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_CONFIG_PATH', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_ARGS', {value: ''})
            sandbox.restore();
        });

        it('should success for polaris command formation', async function () {

            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: 'POLARIS_APPLICATION_NAME'})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_NAME', {value: 'POLARIS_PROJECT_NAME'})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA','sast']});
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: 'feature1'})
            Object.defineProperty(inputs, 'POLARIS_TEST_SCA_TYPE', {value: 'SCA-SIGNATURE'})
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();
            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.serverUrl).to.be.contains('server_url');
            expect(jsonData.data.polaris.accesstoken).to.be.contains('access_token');
            expect(jsonData.data.polaris.application.name).to.be.contains('POLARIS_APPLICATION_NAME');
            expect(jsonData.data.polaris.project.name).to.be.contains('POLARIS_PROJECT_NAME');
            expect(jsonData.data.polaris.branch.name).to.be.contains('feature1');
            expect(jsonData.data.polaris.test.sca.type).to.be.contains('SCA-SIGNATURE');
            expect(formattedCommand).contains('--stage polaris');
            polarisStateFile = '"'.concat(polarisStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(polarisStateFile));
        });

        it('should fail for invalid assessment type', async function () {
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA','sast123']})

            try {
                const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();
            } catch (e) {
                const errorObj = e as Error;
                expect(errorObj.message).contains('Invalid value for '.concat(constants.POLARIS_ASSESSMENT_TYPES_KEY))
                expect(errorObj.message).contains(ErrorCode.INVALID_POLARIS_ASSESSMENT_TYPES.toString())
            }
        });

        it('should success for polaris command formation with default values', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: 'POLARIS_BRANCH_NAME'})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA','sast']});
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: 'feature1'})

            const getStubVariable = sandbox.stub(taskLib, "getVariable");

            getStubVariable.withArgs(AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY).returns("testRepo");


            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();

            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.serverUrl).to.be.contains('server_url');
            expect(jsonData.data.polaris.accesstoken).to.be.contains('access_token');
            expect(jsonData.data.polaris.application.name).to.be.contains('testRepo');
            expect(jsonData.data.polaris.project.name).to.be.contains('testRepo');
            expect(jsonData.data.polaris.branch.name).to.be.contains('feature1');

            expect(formattedCommand).contains('--stage polaris');

            polarisStateFile = '"'.concat(polarisStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(polarisStateFile));
        });

        it('should success for polaris command formation with Arbitrary arguments', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: 'POLARIS_BRANCH_NAME'})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA','sast']});
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: 'feature1'})

            Object.defineProperty(inputs, 'DETECT_SEARCH_DEPTH', {value: '2'})
            Object.defineProperty(inputs, 'DETECT_CONFIG_PATH', {value: 'DETECT_CONFIG_PATH'})
            Object.defineProperty(inputs, 'DETECT_ARGS', {value: 'DETECT_ARGS'})

            Object.defineProperty(inputs, 'COVERITY_BUILD_COMMAND', {value: 'COVERITY_BUILD_COMMAND'})
            Object.defineProperty(inputs, 'COVERITY_CLEAN_COMMAND', {value: 'COVERITY_CLEAN_COMMAND'})
            Object.defineProperty(inputs, 'COVERITY_CONFIG_PATH', {value: 'COVERITY_CONFIG_PATH'})
            Object.defineProperty(inputs, 'COVERITY_ARGS', {value: 'COVERITY_ARGS'})

            const getStubVariable = sandbox.stub(taskLib, "getVariable");

            getStubVariable.withArgs(AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY).returns("testRepo");
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();

            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.serverUrl).to.be.contains('server_url');
            expect(jsonData.data.polaris.accesstoken).to.be.contains('access_token');
            expect(jsonData.data.polaris.application.name).to.be.contains('testRepo');
            expect(jsonData.data.polaris.project.name).to.be.contains('testRepo');
            expect(jsonData.data.polaris.branch.name).to.be.contains('feature1');

            expect(jsonData.data.detect.search.depth).to.be.equals(2)
            expect(jsonData.data.detect.config.path).to.be.equals('DETECT_CONFIG_PATH')
            expect(jsonData.data.detect.args).to.be.equals('DETECT_ARGS')

            expect(jsonData.data.coverity.build.command).to.be.equals('COVERITY_BUILD_COMMAND')
            expect(jsonData.data.coverity.clean.command).to.be.equals('COVERITY_CLEAN_COMMAND')
            expect(jsonData.data.coverity.config.path).to.be.equals('COVERITY_CONFIG_PATH')
            expect(jsonData.data.coverity.args).to.be.equals('COVERITY_ARGS')

            expect(formattedCommand).contains('--stage polaris');

            polarisStateFile = '"'.concat(polarisStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(polarisStateFile));
        });

        it('should success for polaris command formation with PR comment in PR context',  async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: 'POLARIS_APPLICATION_NAME'})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_NAME', {value: 'POLARIS_PROJECT_NAME'})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA','sast']});
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: 'feature1'})
            Object.defineProperty(inputs, 'POLARIS_PR_COMMENT_ENABLED', {value: true})
            Object.defineProperty(inputs, 'POLARIS_TRIAGE', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_PR_COMMENT_SEVERITIES', {value: []})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(utility, 'isPullRequestEvent').returns(true);

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();

            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.prcomment.enabled).to.be.true;
        });

        it('should success for polaris command formation with PR comment in non-PR context',  async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: 'POLARIS_APPLICATION_NAME'})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_NAME', {value: 'POLARIS_PROJECT_NAME'})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA','sast']});
            Object.defineProperty(inputs, 'POLARIS_PR_COMMENT_ENABLED', {value: true})
            Object.defineProperty(inputs, 'POLARIS_PR_COMMENT_SEVERITIES', {value: []})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();

            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.prcomment).to.be.undefined;
        });

        it('should success for polaris command formation for polaris branch parent name in PR context',  async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: 'POLARIS_APPLICATION_NAME'})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_NAME', {value: 'POLARIS_PROJECT_NAME'})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA','sast']});
            Object.defineProperty(inputs, 'POLARIS_BRANCH_PARENT_NAME', {value: 'main'})
            Object.defineProperty(inputs, 'POLARIS_PR_COMMENT_ENABLED', {value: true})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(utility, 'isPullRequestEvent').returns(true);

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();

            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.prcomment.enabled).to.be.true;
            expect(jsonData.data.polaris.branch.parent.name).to.be.equals('main')
        });

        it('should success for polaris command formation for polaris branch parent name in non-PR context',  async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: 'POLARIS_APPLICATION_NAME'})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_NAME', {value: 'POLARIS_PROJECT_NAME'})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA','sast']});
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: 'feature1'})
            Object.defineProperty(inputs, 'POLARIS_BRANCH_PARENT_NAME', {value: 'main'})
            Object.defineProperty(inputs, 'POLARIS_PR_COMMENT_ENABLED', {value: true})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();

            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.prcomment).to.be.undefined;
            expect(jsonData.data.polaris.branch.parent).to.be.undefined
        });

        it('should success for polaris command formation with sarif report create for non-PR context', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_NAME', {value: 'POLARIS_PROJECT_NAME'})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: 'POLARIS_APPLICATION_NAME'})
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_CREATE', {value: true})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();

            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.serverUrl).to.be.contains('server_url');
            expect(jsonData.data.polaris.accesstoken).to.be.contains('access_token');
            expect(jsonData.data.polaris.application.name).to.be.contains('POLARIS_APPLICATION_NAME');
            expect(jsonData.data.polaris.project.name).to.be.contains('POLARIS_PROJECT_NAME');
            expect(jsonData.data.polaris.reports.sarif.create).to.be.equals(true);

            expect(formattedCommand).contains('--stage polaris');

            polarisStateFile = '"'.concat(polarisStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(polarisStateFile));
        });

        it('should success for polaris command formation with sarif report create for PR context', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_NAME', {value: 'POLARIS_PROJECT_NAME'})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: 'POLARIS_APPLICATION_NAME'})
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_CREATE', {value: true})

            sandbox.stub(utility, 'isPullRequestEvent').returns(true);

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();

            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.serverUrl).to.be.contains('server_url');
            expect(jsonData.data.polaris.accesstoken).to.be.contains('access_token');
            expect(jsonData.data.polaris.application.name).to.be.contains('POLARIS_APPLICATION_NAME');
            expect(jsonData.data.polaris.project.name).to.be.contains('POLARIS_PROJECT_NAME');
            expect(jsonData.data.polaris.reports).to.be.undefined;

            expect(formattedCommand).contains('--stage polaris');

            polarisStateFile = '"'.concat(polarisStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(polarisStateFile));
        });

        it('should success for polaris command formation with sarif report parameters', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: 'POLARIS_APPLICATION_NAME'})
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: 'feature1'})
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_CREATE', {value: true})
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_SEVERITIES', {value: ['CRITICAL','HIGH']})
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_FILE_PATH', {value: 'test-path'})
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES', {value: true})
            Object.defineProperty(inputs, 'POLARIS_REPORTS_SARIF_ISSUE_TYPES', {value: ['SAST', 'SCA']})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();

            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.serverUrl).to.be.contains('server_url');
            expect(jsonData.data.polaris.accesstoken).to.be.contains('access_token');
            expect(jsonData.data.polaris.application.name).to.be.contains('POLARIS_APPLICATION_NAME');
            expect(jsonData.data.polaris.branch.name).to.be.contains('feature1');
            expect(jsonData.data.polaris.reports.sarif.create).to.be.equals(true);
            expect(jsonData.data.polaris.reports.sarif.file.path).to.be.equals('test-path');
            expect(jsonData.data.polaris.reports.sarif.severities).to.be.contains('CRITICAL');
            expect(jsonData.data.polaris.reports.sarif.groupSCAIssues).to.be.equals(true);
            expect(jsonData.data.polaris.reports.sarif.issue.types).to.be.contains('SAST');

            expect(formattedCommand).contains('--stage polaris');

            polarisStateFile = '"'.concat(polarisStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(polarisStateFile))
        });

        it('should success for polaris command formation with polaris wait for scan param', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA','sast']})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: 'POLARIS_APPLICATION_NAME'})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_NAME', {value: 'POLARIS_PROJECT_NAME'})
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: 'feature1'})
            Object.defineProperty(inputs, 'POLARIS_WAITFORSCAN', {value: true})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();

            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.serverUrl).to.be.contains('server_url');
            expect(jsonData.data.polaris.accesstoken).to.be.contains('access_token');
            expect(jsonData.data.polaris.assessment.types).to.be.contains('SCA','sast');
            expect(jsonData.data.polaris.application.name).to.be.contains('POLARIS_APPLICATION_NAME');
            expect(jsonData.data.polaris.project.name).to.be.contains('POLARIS_PROJECT_NAME');
            expect(jsonData.data.polaris.branch.name).to.be.contains('feature1');
            expect(jsonData.data.polaris.waitForScan).to.be.equals(true);

            expect(formattedCommand).contains('--stage polaris');

            polarisStateFile = '"'.concat(polarisStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(polarisStateFile))
        });

        it('should success for polaris command formation with assessment mode and project directory parameters', async function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: 'POLARIS_APPLICATION_NAME'})
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: 'feature1'})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_MODE', {value: 'assessment_mode'})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_DIRECTORY', {value: 'polaris_project_directory'})
            Object.defineProperty(inputs, 'PROJECT_SOURCE_ARCHIVE', {value: 'source_archive'})
            Object.defineProperty(inputs, 'PROJECT_SOURCE_PRESERVE_SYM_LINKS', {value: true})
            Object.defineProperty(inputs, 'PROJECT_SOURCE_EXCLUDES', {value: ['source_exclude1','source_exclude2']})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForPolaris();

            const jsonString = fs.readFileSync(polarisStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.polaris.serverUrl).to.be.contains('server_url');
            expect(jsonData.data.polaris.accesstoken).to.be.contains('access_token');
            expect(jsonData.data.polaris.application.name).to.be.contains('POLARIS_APPLICATION_NAME');
            expect(jsonData.data.polaris.branch.name).to.be.contains('feature1');
            expect(jsonData.data.polaris.assessment.mode).to.be.contains('assessment_mode');
            expect(jsonData.data.project.directory).to.be.contains('polaris_project_directory');
            expect(jsonData.data.project.source.archive).to.be.contains('source_archive');
            expect(jsonData.data.project.source.preserveSymLinks).to.be.equals(true);
            expect(jsonData.data.project.source.excludes).to.be.contains('source_exclude1');

            expect(formattedCommand).contains('--stage polaris');

            polarisStateFile = '"'.concat(polarisStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(polarisStateFile))
        });
    });

    context('Coverity command preparation', () => {
        let sandbox: sinon.SinonSandbox;
        let bridgeToolsParameter: BridgeToolsParameter;
        let coverityStateFile: string;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            const tempDir = process.cwd();
            coverityStateFile = path.join(tempDir, "coverity_input.json");
            bridgeToolsParameter = new BridgeToolsParameter(tempDir);
        });

        afterEach(() => {
            taskLib.rmRF(coverityStateFile);
            Object.defineProperty(inputs, 'COVERITY_URL', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_INSTALL_DIRECTORY', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_POLICY_VIEW', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_LOCAL', {value: false})
            Object.defineProperty(inputs, 'COVERITY_VERSION', {value: ''})
            sandbox.restore();
        });

        it('should success for coverity command formation with mandatory and optional parameters', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_INSTALL_DIRECTORY', {value: process.cwd()})
            Object.defineProperty(inputs, 'COVERITY_POLICY_VIEW', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_LOCAL', {value: true})
            Object.defineProperty(inputs, 'COVERITY_VERSION', {value: '2022.12.0'})

            sandbox.stub(validator, "validateCoverityInstallDirectoryParam").returns(true);
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();

            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.connect.policy.view).to.be.equals('test');
            expect(jsonData.data.coverity.connect.stream.name).to.be.equals('test');
            expect(jsonData.data.coverity.connect.project.name).to.be.equals('test');
            expect(jsonData.data.coverity.install.directory).to.be.equals(process.cwd());        
            expect(jsonData.data.coverity.local).to.be.equals(true);
            expect(jsonData.data.coverity.version).to.be.equals('2022.12.0');
            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('should success for coverity command formation with mandatory parameters', function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: 'test'})

            const formattedCommand = bridgeToolsParameter.getFormattedCommandForCoverity();
            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.connect.stream.name).to.be.equals('test');
            expect(jsonData.data.coverity.connect.project.name).to.be.equals('test');   
            expect(formattedCommand).contains(Promise.resolve('--stage connect'));

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains(Promise.resolve('--input '.concat(coverityStateFile)));
        });

        it('should success for coverity command formation with default values for non-PR context', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'});
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'});

            const getStubVariable = sandbox.stub(taskLib, "getVariable");

            getStubVariable.withArgs(AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY).returns("testRepo");
            getStubVariable.withArgs(AZURE_ENVIRONMENT_VARIABLES.AZURE_SOURCE_BRANCH).returns("feature");

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();
            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.connect.project.name).to.be.equals('testRepo');
            expect(jsonData.data.coverity.connect.stream.name).to.be.equals('testRepo-feature');
            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('should success for coverity command formation with default values for PR context', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'});
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'});

            const getStubVariable = sandbox.stub(taskLib, "getVariable");

            getStubVariable.withArgs(AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY).returns("testRepo");
            getStubVariable.withArgs(AZURE_ENVIRONMENT_VARIABLES.AZURE_PULL_REQUEST_TARGET_BRANCH).returns("main");
            getStubVariable.withArgs(AZURE_ENVIRONMENT_VARIABLES.AZURE_BUILD_REASON).returns(AZURE_BUILD_REASON.PULL_REQUEST);

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();
            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.connect.project.name).to.be.equals('testRepo');
            expect(jsonData.data.coverity.connect.stream.name).to.be.equals('testRepo-main');
            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('should fail for coverity stream name for Manual trigger', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'});
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'});
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'});

            const getStubVariable = sandbox.stub(taskLib, "getVariable");

            getStubVariable.withArgs(AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY).returns("testRepo");
            getStubVariable.withArgs(AZURE_ENVIRONMENT_VARIABLES.AZURE_BUILD_REASON).returns(AZURE_BUILD_REASON.MANUAL);

            try {
                const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();
            } catch (e) {
                const errorObj = e as Error;
                expect(errorObj.message).contains("COVERITY_STREAM_NAME is mandatory for azure manual trigger")
                expect(errorObj.message).contains(ErrorCode.REQUIRED_COVERITY_STREAM_NAME_FOR_MANUAL_TRIGGER.toString());
            }
        });


        it('should success for coverity command formation with PR comment in PR context',  async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_AUTOMATION_PRCOMMENT', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})
            sandbox.stub(validator, "validateCoverityInstallDirectoryParam").returns(true);
            sandbox.stub(taskLib, "getVariable").returns(AZURE_BUILD_REASON.PULL_REQUEST);

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();
            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.automation.prcomment).to.be.equals(true)

            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('should success for coverity command formation with PR comment in non-PR context',  async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_AUTOMATION_PRCOMMENT', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})
            sandbox.stub(validator, "validateCoverityInstallDirectoryParam").returns(true);

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();
            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.automation).to.be.undefined

            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('should success for coverity command formation with invalid coverity install directory', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_INSTALL_DIRECTORY', {value: 'test-dir'})

            sandbox.stub(validator, "validateCoverityInstallDirectoryParam").returns(false);
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();

            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.connect.stream.name).to.be.equals('test');
            expect(jsonData.data.coverity.connect.project.name).to.be.equals('test');
            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('PR Context(yml): Coverity command formation with pr comment and azure legacy visual studio url', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_AUTOMATION_PRCOMMENT', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateCoverityInstallDirectoryParam").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://bdorg.visualstudio.com/")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.Reason").returns("PullRequest")
            getStubVariable.withArgs("Build.SourceBranch").returns("refs/pull/95/merge")
            getStubVariable.withArgs("System.PullRequest.PullRequestId").returns("95")
            getStubVariable.withArgs("System.PullRequest.SourceBranch").returns("refs/heads/feature/test-branch")

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();
            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);

            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.connect.stream.name).to.be.equals('test');
            expect(jsonData.data.coverity.connect.project.name).to.be.equals('test');
            expect(jsonData.data.coverity.automation.prcomment).to.be.equals(true);
            expect(jsonData.data.azure.api.url).to.be.equals('https://dev.azure.com');
            expect(jsonData.data.azure.organization.name).to.be.equals('bdorg');
            expect(jsonData.data.azure.project.name).to.be.equals('test-project');
            expect(jsonData.data.azure.repository.name).to.be.equals('test-repo');
            expect(jsonData.data.azure.repository.branch.name).to.be.equals('refs/heads/feature/test-branch');
            expect(jsonData.data.azure.repository.pull.number).to.be.equals(95);
            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('PR Context(yml): Coverity command formation with pr comment', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_AUTOMATION_PRCOMMENT', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateCoverityInstallDirectoryParam").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://dev.azure.com/bdorg")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.Reason").returns("PullRequest")
            getStubVariable.withArgs("Build.SourceBranch").returns("refs/pull/95/merge")
            getStubVariable.withArgs("System.PullRequest.PullRequestId").returns("95")
            getStubVariable.withArgs("System.PullRequest.SourceBranch").returns("refs/heads/feature/test-branch")

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();
            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);

            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.connect.stream.name).to.be.equals('test');
            expect(jsonData.data.coverity.connect.project.name).to.be.equals('test');
            expect(jsonData.data.coverity.automation.prcomment).to.be.equals(true);
            expect(jsonData.data.azure.api.url).to.be.equals('https://dev.azure.com');
            expect(jsonData.data.azure.organization.name).to.be.equals('bdorg');
            expect(jsonData.data.azure.project.name).to.be.equals('test-project');
            expect(jsonData.data.azure.repository.name).to.be.equals('test-repo');
            expect(jsonData.data.azure.repository.branch.name).to.be.equals('refs/heads/feature/test-branch');
            expect(jsonData.data.azure.repository.pull.number).to.be.equals(95);
            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('PR Context(Classic editor): Coverity command formation with pr comment', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_AUTOMATION_PRCOMMENT', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateCoverityInstallDirectoryParam").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://dev.azure.com/bdorg")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.Reason").returns("IndividualCI")
            getStubVariable.withArgs("Build.SourceBranch").returns("refs/heads/feature/test-branch")
            getStubVariable.withArgs("System.PullRequest.PullRequestId").returns("")

            sandbox.stub(utility, 'isPullRequestEvent').returns(true);

            const getPullRequestIdForClassicEditorFlowStub = sandbox.stub(AzureService.prototype, 'getAzurePrResponseForManualTriggerFlow');
            getPullRequestIdForClassicEditorFlowStub.returns(Promise.resolve({pullRequestId: 95, targetRefName: 'refs/heads/main'}));

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();
            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);

            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.connect.stream.name).to.be.equals('test');
            expect(jsonData.data.coverity.connect.project.name).to.be.equals('test');
            expect(jsonData.data.coverity.automation.prcomment).to.be.equals(true);
            expect(jsonData.data.azure.api.url).to.be.equals('https://dev.azure.com');
            expect(jsonData.data.azure.organization.name).to.be.equals('bdorg');
            expect(jsonData.data.azure.project.name).to.be.equals('test-project');
            expect(jsonData.data.azure.repository.name).to.be.equals('test-repo');
            expect(jsonData.data.azure.repository.branch.name).to.be.equals('refs/heads/feature/test-branch');
            expect(jsonData.data.azure.repository.pull.number).to.be.equals(95);
            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('PR Context(Classic editor): Coverity command formation with pr comment and azure legacy visual studio url', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_AUTOMATION_PRCOMMENT', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateCoverityInstallDirectoryParam").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://bdorg.visualstudio.com/")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.Reason").returns("IndividualCI")
            getStubVariable.withArgs("Build.SourceBranch").returns("refs/heads/feature/test-branch")
            getStubVariable.withArgs("System.PullRequest.PullRequestId").returns("")

            sandbox.stub(utility, 'isPullRequestEvent').returns(true);

            const getPullRequestIdForClassicEditorFlowStub = sandbox.stub(AzureService.prototype, 'getAzurePrResponseForManualTriggerFlow');
            getPullRequestIdForClassicEditorFlowStub.returns(Promise.resolve({pullRequestId: 95, targetRefName: 'refs/heads/main'}));

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();
            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);

            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.connect.stream.name).to.be.equals('test');
            expect(jsonData.data.coverity.connect.project.name).to.be.equals('test');
            expect(jsonData.data.coverity.automation.prcomment).to.be.equals(true);
            expect(jsonData.data.azure.api.url).to.be.equals('https://dev.azure.com');
            expect(jsonData.data.azure.organization.name).to.be.equals('bdorg');
            expect(jsonData.data.azure.project.name).to.be.equals('test-project');
            expect(jsonData.data.azure.repository.name).to.be.equals('test-repo');
            expect(jsonData.data.azure.repository.branch.name).to.be.equals('refs/heads/feature/test-branch');
            expect(jsonData.data.azure.repository.pull.number).to.be.equals(95);
            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('should success for coverity command formation with coverity wait for scan param', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_WAITFORSCAN', {value: true})

            sandbox.stub(validator, "validateCoverityInstallDirectoryParam").returns(false);
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();

            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.connect.stream.name).to.be.equals('test');
            expect(jsonData.data.coverity.connect.project.name).to.be.equals('test');
            expect(jsonData.data.coverity.waitForScan).to.be.equals(true);
            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('should success for coverity command formation with coverity project directory', async function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_DIRECTORY', {value: 'coverity_project_directory'})

            sandbox.stub(validator, "validateCoverityInstallDirectoryParam").returns(false);
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();

            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.coverity.connect.url).to.be.equals('https://test.com');
            expect(jsonData.data.coverity.connect.user.name).to.be.equals('test-user');
            expect(jsonData.data.coverity.connect.user.password).to.be.equals('password');
            expect(jsonData.data.coverity.connect.stream.name).to.be.equals('test');
            expect(jsonData.data.coverity.connect.project.name).to.be.equals('test');
            expect(jsonData.data.project.directory).to.be.contains('coverity_project_directory');
            expect(formattedCommand).contains('--stage connect');

            coverityStateFile = '"'.concat(coverityStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(coverityStateFile));
        });

        it('should pass coverity arbitrary fields to bridge', async () => {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'COVERITY_URL'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'COVERITY_USER'})
            Object.defineProperty(inputs, 'COVERITY_PASSPHRASE', {value: 'COVERITY_PASSPHRASE'})
            Object.defineProperty(inputs, 'COVERITY_BUILD_COMMAND', {value: 'COVERITY_BUILD_COMMAND'})
            Object.defineProperty(inputs, 'COVERITY_CLEAN_COMMAND', {value: 'COVERITY_CLEAN_COMMAND'})
            Object.defineProperty(inputs, 'COVERITY_CONFIG_PATH', {value: 'COVERITY_CONFIG_PATH'})
            Object.defineProperty(inputs, 'COVERITY_ARGS', {value: 'COVERITY_ARGS'})

            sandbox.stub(validator, "validateCoverityInstallDirectoryParam").returns(false);
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForCoverity();

            const jsonString = fs.readFileSync(coverityStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(formattedCommand).contains('--stage connect')
            expect(jsonData.data.coverity.build.command).to.be.equals('COVERITY_BUILD_COMMAND')
            expect(jsonData.data.coverity.clean.command).to.be.equals('COVERITY_CLEAN_COMMAND')
            expect(jsonData.data.coverity.config.path).to.be.equals('COVERITY_CONFIG_PATH')
            expect(jsonData.data.coverity.args).to.be.equals('COVERITY_ARGS')
        })
    });

    context('Black Duck command preparation', () => {
        let sandbox: sinon.SinonSandbox;
        let bridgeToolsParameter: BridgeToolsParameter;
        let blackduckStateFile: string;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            const tempDir = process.cwd();
            blackduckStateFile = path.join(tempDir, "bd_input.json");
            bridgeToolsParameter = new BridgeToolsParameter(tempDir);
        });

        afterEach(() => {
            taskLib.rmRF(blackduckStateFile);
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: ''})
            Object.defineProperty(inputs, 'DETECT_INSTALL_DIRECTORY', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FULL', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_ENABLED', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_MAXCOUNT', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_LONG_TERM_GUIDANCE', {value: ''})
            sandbox.restore();
        });

         it('should success for blackduck command formation with mandatory and some optional parameters', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'DETECT_INSTALL_DIRECTORY', {value: 'test'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FULL', {value: 'true'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES', {value : ["BLOCKER","CRITICAL","TRIVIAL"]})
            
             sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
             const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
             const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
             const jsonData = JSON.parse(jsonString);
             expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
             expect(jsonData.data.blackducksca.token).to.be.equals('token');
             expect(formattedCommand).contains('--stage blackduck');

             blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
             expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
         });

         it('should success for blackduck command formation with PR Comment in PR context', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
             Object.defineProperty(inputs, 'BLACKDUCKSCA_PRCOMMENT_ENABLED', {value: 'true'})
             Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})
             sandbox.stub(taskLib, "getVariable").returns(AZURE_BUILD_REASON.PULL_REQUEST);

             sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
             const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
             const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
             const jsonData = JSON.parse(jsonString);
             expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
             expect(jsonData.data.blackducksca.token).to.be.equals('token');
             expect(jsonData.data.blackducksca.automation.prcomment).to.be.equals(true);
             expect(formattedCommand).contains('--stage blackduck');

             blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
             expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
         });

        it('should success for blackduck command formation with PR Comment in non-PR context', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCK_AUTOMATION_PRCOMMENT', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.automation).to.be.undefined;
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

         it('should fail for invalid blackduck_scan_failure_severities', function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES', {value: ['SCA','sast123']})

            bridgeToolsParameter.getFormattedCommandForBlackduck().catch(errorObj =>{
                expect(errorObj.message).contains('Invalid value for '.concat(constants.BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY))
                expect(errorObj.message).contains(ErrorCode.INVALID_BLACKDUCKSCA_FAILURE_SEVERITIES.toString())
            })
        });

        it('PR Context(yml): Black Duck command formation with pr comment and azure legacy visual studio url', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_PRCOMMENT_ENABLED', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://bdorg.visualstudio.com/")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.Reason").returns("PullRequest")
            getStubVariable.withArgs("Build.SourceBranch").returns("refs/pull/95/merge")
            getStubVariable.withArgs("System.PullRequest.PullRequestId").returns("95")
            getStubVariable.withArgs("System.PullRequest.SourceBranch").returns("refs/heads/feature/test-branch")

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);

            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.automation.prcomment).to.be.equals(true)
            expect(jsonData.data.azure.api.url).to.be.equals('https://dev.azure.com');
            expect(jsonData.data.azure.organization.name).to.be.equals('bdorg');
            expect(jsonData.data.azure.project.name).to.be.equals('test-project');
            expect(jsonData.data.azure.repository.name).to.be.equals('test-repo');
            expect(jsonData.data.azure.repository.branch.name).to.be.equals('refs/heads/feature/test-branch');
            expect(jsonData.data.azure.repository.pull.number).to.be.equals(95);
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('PR Context(yml): Black Duck command formation with pr comment', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_PRCOMMENT_ENABLED', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://dev.azure.com/bdorg")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.Reason").returns("PullRequest")
            getStubVariable.withArgs("Build.SourceBranch").returns("refs/pull/95/merge")
            getStubVariable.withArgs("System.PullRequest.PullRequestId").returns("95")
            getStubVariable.withArgs("System.PullRequest.SourceBranch").returns("refs/heads/feature/test-branch")

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);

            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.automation.prcomment).to.be.equals(true)
            expect(jsonData.data.azure.api.url).to.be.equals('https://dev.azure.com');
            expect(jsonData.data.azure.organization.name).to.be.equals('bdorg');
            expect(jsonData.data.azure.project.name).to.be.equals('test-project');
            expect(jsonData.data.azure.repository.name).to.be.equals('test-repo');
            expect(jsonData.data.azure.repository.branch.name).to.be.equals('refs/heads/feature/test-branch');
            expect(jsonData.data.azure.repository.pull.number).to.be.equals(95);
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('PR Context(Classic editor): Black Duck command formation with pr comment', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_PRCOMMENT_ENABLED', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://dev.azure.com/bdorg")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.Reason").returns("IndividualCI")
            getStubVariable.withArgs("Build.SourceBranch").returns("refs/heads/feature/test-branch")
            getStubVariable.withArgs("System.PullRequest.PullRequestId").returns("")

            sandbox.stub(utility, 'isPullRequestEvent').returns(true);

            const getPullRequestIdForClassicEditorFlowStub = sandbox.stub(AzureService.prototype, 'getAzurePrResponseForManualTriggerFlow');
            getPullRequestIdForClassicEditorFlowStub.returns(Promise.resolve({pullRequestId: 95, targetRefName: 'refs/heads/main'}));

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);

            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.automation.prcomment).to.be.equals(true)
            expect(jsonData.data.azure.api.url).to.be.equals('https://dev.azure.com');
            expect(jsonData.data.azure.organization.name).to.be.equals('bdorg');
            expect(jsonData.data.azure.project.name).to.be.equals('test-project');
            expect(jsonData.data.azure.repository.name).to.be.equals('test-repo');
            expect(jsonData.data.azure.repository.branch.name).to.be.equals('refs/heads/feature/test-branch');
            expect(jsonData.data.azure.repository.pull.number).to.be.equals(95);
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('PR Context(Classic editor): Black Duck command formation with pr comment and azure legacy visual studio url', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_PRCOMMENT_ENABLED', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://bdorg.visualstudio.com/")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.Reason").returns("IndividualCI")
            getStubVariable.withArgs("Build.SourceBranch").returns("refs/heads/feature/test-branch")
            getStubVariable.withArgs("System.PullRequest.PullRequestId").returns("")

            sandbox.stub(utility, 'isPullRequestEvent').returns(true);

            const getPullRequestIdForClassicEditorFlowStub = sandbox.stub(AzureService.prototype, 'getAzurePrResponseForManualTriggerFlow');
            getPullRequestIdForClassicEditorFlowStub.returns(Promise.resolve({pullRequestId: 95, targetRefName: 'refs/heads/main'}));

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);

            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.automation.prcomment).to.be.equals(true)
            expect(jsonData.data.azure.api.url).to.be.equals('https://dev.azure.com');
            expect(jsonData.data.azure.organization.name).to.be.equals('bdorg');
            expect(jsonData.data.azure.project.name).to.be.equals('test-project');
            expect(jsonData.data.azure.repository.name).to.be.equals('test-repo');
            expect(jsonData.data.azure.repository.branch.name).to.be.equals('refs/heads/feature/test-branch');
            expect(jsonData.data.azure.repository.pull.number).to.be.equals(95);
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('Black Duck command formation with fix pr and azure legacy visual studio url', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_ENABLED', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://bdorg.visualstudio.com/")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.Reason").returns("Manual")
            getStubVariable.withArgs("Build.SourceBranch").returns("test-branch")

             const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
             const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
             const jsonData = JSON.parse(jsonString);

             expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
             expect(jsonData.data.blackducksca.token).to.be.equals('token');
             expect(jsonData.data.azure.api.url).to.be.equals('https://dev.azure.com');
             expect(jsonData.data.azure.organization.name).to.be.equals('bdorg');
             expect(jsonData.data.azure.project.name).to.be.equals('test-project');
             expect(jsonData.data.azure.repository.name).to.be.equals('test-repo');
             expect(jsonData.data.azure.repository.branch.name).to.be.equals('test-branch');
             expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
             expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
         });

        it('should success for blackduck command formation with fix pr true', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_ENABLED', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://dev.azure.com/test-org/")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.SourceBranch").returns("test-branch")

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.fixpr.enabled).to.be.equals(true);
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('should success for blackduck command formation with fix pr true in PR context', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_ENABLED', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://dev.azure.com/test-org/")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.SourceBranchName").returns("test-branch")
            getStubVariable.withArgs("Build.Reason").returns(AZURE_BUILD_REASON.PULL_REQUEST)

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.fixpr).to.be.undefined;
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('should success for blackduck command formation with fix pr true and fix pr optional params', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_ENABLED', {value: true})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_MAXCOUNT', {value: 1})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR', {value: 'false'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES', {value: ['CRITICAL', 'HIGH']})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE', {value: ['LONG_TERM']})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("System.TeamFoundationCollectionUri").returns("https://dev.azure.com/test-org/")
            getStubVariable.withArgs("System.TeamProject").returns("test-project")
            getStubVariable.withArgs("Build.Repository.Name").returns("test-repo")
            getStubVariable.withArgs("Build.SourceBranch").returns("test-branch")

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.fixpr.enabled).to.be.equals(true);
            expect(jsonData.data.blackducksca.fixpr.maxCount).to.be.equals(1);
            expect(jsonData.data.blackducksca.fixpr.createSinglePR).to.be.equals(false);
            expect(jsonData.data.blackducksca.fixpr.useUpgradeGuidance).to.be.contains('LONG_TERM');
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('should fail for black duck fix pr true,max count and create single pr true', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_ENABLED', {value: 'true'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_MAX_COUNT', {value: 1})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            try {
                const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            } catch (e) {
                const errorObj = e as Error;
                expect(errorObj.message).contains(constants.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY
                    .concat(' is not applicable with ').concat(constants.BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY));
                expect(errorObj.message).contains(ErrorCode.BLACKDUCKSCA_FIXPR_MAXCOUNT_NOT_APPLICABLE.toString());
            }
        });

        it('should fail for invalid value of blackduck fix pr max count', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_ENABLED', {value: 'true'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_MAXCOUNT', {value: 'invalid-value'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            try {
                const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            } catch (e) {
                const errorObj = e as Error;
                expect(errorObj.message).contains('Invalid value for '.concat(constants.BLACKDUCKSCA_FIXPR_MAXCOUNT_KEY));
                expect(errorObj.message).contains(ErrorCode.INVALID_BLACKDUCKSCA_FIXPR_MAXCOUNT.toString());
            }
        });

        it('should fail for invalid azure token value with fix pr true', function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIX_PR_ENABLED', {value: 'true'})
            const getStubVariable = sandbox.stub(taskLib, "getVariable")
            getStubVariable.withArgs("System.AccessToken").returns("")
            try {
                const formattedCommand = bridgeToolsParameter.getFormattedCommandForBlackduck();
            } catch (e) {
                const errorObj = e as Error;
                console.log("errorObj",errorObj)
                expect(errorObj.message).includes('bridge-cli');
                expect(errorObj.message).includes(ErrorCode.MISSING_AZURE_TOKEN.toString());
            }
        });

        it('should form blackduck command but with undefined azure values', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_FIXPR_ENABLED', {value: 'true'})
            Object.defineProperty(inputs, 'AZURE_TOKEN', {value: 'token'})

            const getStubVariable = sandbox.stub(taskLib, "getVariable")

            getStubVariable.withArgs("Build.SourceBranch").returns("")

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
             const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
             const jsonData = JSON.parse(jsonString);
             expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
             expect(jsonData.data.blackducksca.token).to.be.equals('token');
             expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
             expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('should success for blackduck command formation with mandatory parameters', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
           
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('should success for blackduck command formation with invalid detect install directory', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'DETECT_INSTALL_DIRECTORY', {value: '/test'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FULL', {value: 'false'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES', {value : ["BLOCKER","CRITICAL","TRIVIAL"]})
            
            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(false);
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();

            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.detect.install.directory).to.be.equals('/test');
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('should success for blackduck command formation with sarif report create for non-PR context', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_CREATE', {value: true})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.reports.sarif.create).to.be.equals(true);
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('should success for blackduck command formation with sarif report create for PR context', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_CREATE', {value: true})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);
            sandbox.stub(taskLib, "getVariable").returns(AZURE_BUILD_REASON.PULL_REQUEST);

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.reports).to.be.undefined;
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('should success for blackduck command formation with sarif report parameters', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_CREATE', {value: true})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES', {value: ['CRITICAL','HIGH']})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH', {value: 'test-path'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES', {value: false})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(true);

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();
            console.log(formattedCommand)
            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.reports.sarif.create).to.be.equals(true);
            expect(jsonData.data.blackducksca.reports.sarif.file.path).to.be.equals('test-path');
            expect(jsonData.data.blackducksca.reports.sarif.severities).to.be.contains('CRITICAL');
            expect(jsonData.data.blackducksca.reports.sarif.groupSCAIssues).to.be.equals(false);
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('should success for blackduck command formation with blackduck wait for scan param', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_WAITFORSCAN', {value: true})
            
            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(false);
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();

            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.blackducksca.waitForScan).to.be.equals(true);
            
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('should success for blackduck command formation with blackduck project directory', async function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'token'})
            Object.defineProperty(inputs, 'BLACKDUCK_INSTALL_DIRECTORY', {value: 'test'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_PROJECT_DIRECTORY', {value: 'blackduck_project_directory'})
            
            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(false);
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();

            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.blackducksca.url).to.be.equals('https://test.com');
            expect(jsonData.data.blackducksca.token).to.be.equals('token');
            expect(jsonData.data.project.directory).to.be.contains('blackduck_project_directory');
            expect(formattedCommand).contains('--stage blackduck');

            blackduckStateFile = '"'.concat(blackduckStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(blackduckStateFile));
        });

        it('should pass blackduck arbitrary fields to bridge', async () => {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'BLACKDUCKSCA_URL'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'BLACKDUCKSCA_API_TOKEN'})
            Object.defineProperty(inputs, 'DETECT_SEARCH_DEPTH', {value: '2'})
            Object.defineProperty(inputs, 'DETECT_CONFIG_PATH', {value: 'DETECT_CONFIG_PATH'})
            Object.defineProperty(inputs, 'DETECT_ARGS', {value: 'DETECT_ARGS'})

            sandbox.stub(validator, "validateBlackduckFailureSeverities").returns(false);
            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForBlackduck();

            const jsonString = fs.readFileSync(blackduckStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(formattedCommand).contains('--stage blackduck')
            expect(jsonData.data.blackducksca.url).to.be.equals('BLACKDUCKSCA_URL')
            expect(jsonData.data.blackducksca.token).to.be.equals('BLACKDUCKSCA_API_TOKEN')
            expect(jsonData.data.detect.search.depth).to.be.equals(2)
            expect(jsonData.data.detect.config.path).to.be.equals('DETECT_CONFIG_PATH')
            expect(jsonData.data.detect.args).to.be.equals('DETECT_ARGS')
        })
    });

    context('SRM command preparation',()=>{
        let sandbox: sinon.SinonSandbox;
        let bridgeToolsParameter: BridgeToolsParameter;
        let srmStateFile: string;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            const tempDir = process.cwd();
            srmStateFile = path.join(tempDir, "srm_input.json");
            bridgeToolsParameter = new BridgeToolsParameter(tempDir);
        });
        afterEach(()=>{
            taskLib.rmRF(srmStateFile);
            Object.defineProperty(inputs, 'SRM_URL', {value: ''})
            Object.defineProperty(inputs, 'SRM_APIKEY', {value: ''})
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ''})
            Object.defineProperty(inputs, 'SRM_PROJECT_NAME', {value: ''})
            Object.defineProperty(inputs, 'SRM_BRANCH_NAME', {value: ''})
            Object.defineProperty(inputs, 'SRM_PROJECT_ID',{value: ''})
            Object.defineProperty(inputs, 'SRM_BRANCH_PARENT', {value: ''})
            Object.defineProperty(inputs, 'SRM_PROJECT_DIRECTORY', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_EXECUTION_PATH', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_BUILD_COMMAND', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_CLEAN_COMMAND', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_CONFIG_PATH', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_ARGS', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCK_EXECUTION_PATH', {value: ''})
            Object.defineProperty(inputs, 'DETECT_SEARCH_DEPTH', {value: ''})
            Object.defineProperty(inputs, 'DETECT_CONFIG_PATH', {value: ''})
            Object.defineProperty(inputs, 'DETECT_ARGS', {value: ''})
            sandbox.restore();
        })

        it('should fail for invalid assessment type', async function () {
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ['SCA123','SAST123']})

            try {
                const formattedCommand = await bridgeToolsParameter.getFormattedCommandForSrm();
            } catch (e) {
                const errorObj = e as Error;
                expect(errorObj.message).contains('Invalid value for '.concat(constants.SRM_ASSESSMENT_TYPES_KEY))
                expect(errorObj.message).contains(ErrorCode.INVALID_SRM_ASSESSMENT_TYPES.toString())
            }
        });

        it('should success for SRM command formation with mandatory parameters', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'})
            Object.defineProperty(inputs, 'SRM_APIKEY', {value: 'srm_apikey'})
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ['SCA','SAST']})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForSrm();

            const jsonString = fs.readFileSync(srmStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.srm.url).to.be.contains('srm_url');
            expect(jsonData.data.srm.apikey).to.be.contains('srm_apikey');
            expect(jsonData.data.srm.assessment.types).to.be.contains('SCA','SAST');
            expect(formattedCommand).contains('--stage srm');

            srmStateFile = '"'.concat(srmStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(srmStateFile));
        });

        it('should success for SRM command formation with empty project name & project id', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'})
            Object.defineProperty(inputs, 'SRM_APIKEY', {value: 'srm_apikey'})
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ['SCA','SAST']})

            const getStubVariable = sandbox.stub(taskLib, "getVariable");
            getStubVariable.withArgs(AZURE_ENVIRONMENT_VARIABLES.AZURE_REPOSITORY).returns("testRepo");

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForSrm();

            const jsonString = fs.readFileSync(srmStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.srm.url).to.be.contains('srm_url');
            expect(jsonData.data.srm.apikey).to.be.contains('srm_apikey');
            expect(jsonData.data.srm.assessment.types).to.be.contains('SCA','SAST');
            expect(jsonData.data.srm.project.name).to.be.contains('testRepo');
            expect(formattedCommand).contains('--stage srm');

            srmStateFile = '"'.concat(srmStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(srmStateFile));
        });

        it('should success for SRM command formation with srm project name', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'})
            Object.defineProperty(inputs, 'SRM_APIKEY', {value: 'srm_apikey'})
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ['SCA','SAST']})
            Object.defineProperty(inputs, 'SRM_PROJECT_NAME', {value: 'SRM_PROJECT_NAME'})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForSrm();

            const jsonString = fs.readFileSync(srmStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.srm.url).to.be.contains('srm_url');
            expect(jsonData.data.srm.apikey).to.be.contains('srm_apikey');
            expect(jsonData.data.srm.assessment.types).to.be.contains('SCA','SAST');
            expect(jsonData.data.srm.project.name).to.be.contains('SRM_PROJECT_NAME');
            expect(formattedCommand).contains('--stage srm');

            srmStateFile = '"'.concat(srmStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(srmStateFile));
        });

        it('should success for SRM command formation with srm project id ', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'})
            Object.defineProperty(inputs, 'SRM_APIKEY', {value: 'srm_apikey'})
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ['SCA','SAST']})
            Object.defineProperty(inputs, 'SRM_PROJECT_ID', {value: '12'})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForSrm();

            const jsonString = fs.readFileSync(srmStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.srm.url).to.be.contains('srm_url');
            expect(jsonData.data.srm.apikey).to.be.contains('srm_apikey');
            expect(jsonData.data.srm.assessment.types).to.be.contains('SCA','SAST');
            expect(jsonData.data.srm.project.id).to.be.equals('12');
            expect(formattedCommand).contains('--stage srm');

            srmStateFile = '"'.concat(srmStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(srmStateFile));
        });

        it('should success for SRM command formation with Optional parameters ', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'})
            Object.defineProperty(inputs, 'SRM_APIKEY', {value: 'srm_apikey'})
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ['SCA','SAST']})
            Object.defineProperty(inputs, 'SRM_PROJECT_NAME', {value: 'SRM_PROJECT_NAME'})
            Object.defineProperty(inputs, 'SRM_BRANCH_NAME', {value: 'SRM_BRANCH_NAME'})
            Object.defineProperty(inputs, 'SRM_BRANCH_PARENT', {value: 'SRM_BRANCH_PARENT'})
            Object.defineProperty(inputs, 'COVERITY_EXECUTION_PATH', {value: '/COVERITY_EXECUTION_PATH'})
            Object.defineProperty(inputs, 'DETECT_EXECUTION_PATH', {value: '/DETECT_EXECUTION_PATH'})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForSrm();

            const jsonString = fs.readFileSync(srmStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.srm.url).to.be.contains('srm_url');
            expect(jsonData.data.srm.apikey).to.be.contains('srm_apikey');
            expect(jsonData.data.srm.assessment.types).to.be.contains('SCA','SAST');
            expect(jsonData.data.srm.project.name).to.be.contains('SRM_PROJECT_NAME');
            expect(jsonData.data.srm.branch.name).to.be.contains('SRM_BRANCH_NAME');
            expect(jsonData.data.coverity.execution.path).to.be.contains('/COVERITY_EXECUTION_PATH')
            expect(jsonData.data.detect.execution.path).to.be.contains('/DETECT_EXECUTION_PATH')

            expect(formattedCommand).contains('--stage srm');

            srmStateFile = '"'.concat(srmStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(srmStateFile));
        });

        it('should success for SRM command formation with SRM wait for scan param', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'})
            Object.defineProperty(inputs, 'SRM_APIKEY', {value: 'srm_apikey'})
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ['SCA','SAST']})
            Object.defineProperty(inputs, 'SRM_PROJECT_NAME', {value: 'SRM_PROJECT_NAME'})
            Object.defineProperty(inputs, 'SRM_WAITFORSCAN', {value: true})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForSrm();

            const jsonString = fs.readFileSync(srmStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);

            expect(jsonData.data.srm.url).to.be.contains('srm_url');
            expect(jsonData.data.srm.apikey).to.be.contains('srm_apikey');
            expect(jsonData.data.srm.assessment.types).to.be.contains('SCA','SAST');
            expect(jsonData.data.srm.project.name).to.be.contains('SRM_PROJECT_NAME');
            expect(jsonData.data.srm.waitForScan).to.be.equal(true);

            expect(formattedCommand).contains('--stage srm');

            srmStateFile = '"'.concat(srmStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(srmStateFile))
        });

        it('should success for SRM command formation with  project directory parameters', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'})
            Object.defineProperty(inputs, 'SRM_APIKEY', {value: 'srm_apikey'})
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ['SCA','SAST']})
            Object.defineProperty(inputs, 'SRM_PROJECT_NAME', {value: 'SRM_PROJECT_NAME'})
            Object.defineProperty(inputs, 'SRM_BRANCH_NAME', {value: 'SRM_BRANCH_NAME'})
            Object.defineProperty(inputs, 'SRM_BRANCH_PARENT', {value: 'SRM_BRANCH_PARENT'})
            Object.defineProperty(inputs, 'SRM_PROJECT_DIRECTORY', {value: 'srm_project_directory'})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForSrm();

            const jsonString = fs.readFileSync(srmStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);

            expect(jsonData.data.srm.url).to.be.contains('srm_url');
            expect(jsonData.data.srm.apikey).to.be.contains('srm_apikey');
            expect(jsonData.data.srm.assessment.types).to.be.contains('SCA','SAST');
            expect(jsonData.data.srm.project.name).to.be.contains('SRM_PROJECT_NAME');
            expect(jsonData.data.srm.branch.name).to.be.contains('SRM_BRANCH_NAME');
            expect(jsonData.data.srm.branch.parent).to.be.contains('SRM_BRANCH_PARENT');
            expect(jsonData.data.project.directory).to.be.contains('srm_project_directory');

            expect(formattedCommand).contains('--stage srm');

            srmStateFile = '"'.concat(srmStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(srmStateFile))
        });

        it('should success for SRM command formation with Arbitrary Parameters', async function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'})
            Object.defineProperty(inputs, 'SRM_APIKEY', {value: 'srm_apikey'})
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ['SCA','SAST']})

            Object.defineProperty(inputs, 'DETECT_SEARCH_DEPTH', {value: '2'})
            Object.defineProperty(inputs, 'DETECT_CONFIG_PATH', {value: 'DETECT_CONFIG_PATH'})
            Object.defineProperty(inputs, 'DETECT_ARGS', {value: 'DETECT_ARGS'})

            Object.defineProperty(inputs, 'COVERITY_BUILD_COMMAND', {value: 'COVERITY_BUILD_COMMAND'})
            Object.defineProperty(inputs, 'COVERITY_CLEAN_COMMAND', {value: 'COVERITY_CLEAN_COMMAND'})
            Object.defineProperty(inputs, 'COVERITY_CONFIG_PATH', {value: 'COVERITY_CONFIG_PATH'})
            Object.defineProperty(inputs, 'COVERITY_ARGS', {value: 'COVERITY_ARGS'})

            const formattedCommand = await bridgeToolsParameter.getFormattedCommandForSrm();

            const jsonString = fs.readFileSync(srmStateFile, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            expect(jsonData.data.srm.url).to.be.contains('srm_url');
            expect(jsonData.data.srm.apikey).to.be.contains('srm_apikey');
            expect(jsonData.data.srm.assessment.types).to.be.contains('SCA','SAST');

            expect(jsonData.data.detect.search.depth).to.be.equals(2)
            expect(jsonData.data.detect.config.path).to.be.equals('DETECT_CONFIG_PATH')
            expect(jsonData.data.detect.args).to.be.equals('DETECT_ARGS')

            expect(jsonData.data.coverity.build.command).to.be.equals('COVERITY_BUILD_COMMAND')
            expect(jsonData.data.coverity.clean.command).to.be.equals('COVERITY_CLEAN_COMMAND')
            expect(jsonData.data.coverity.config.path).to.be.equals('COVERITY_CONFIG_PATH')
            expect(jsonData.data.coverity.args).to.be.equals('COVERITY_ARGS')
            expect(formattedCommand).contains('--stage srm');

            srmStateFile = '"'.concat(srmStateFile).concat('"');
            expect(formattedCommand).contains('--input '.concat(srmStateFile));
        });

    })
});
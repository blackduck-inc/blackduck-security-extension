// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import * as inputs from '../../../src/blackduck-security-task/input';
import * as constants from '../../../src/blackduck-security-task/application-constant';
import * as validator from '../../../src/blackduck-security-task/validator';
import { expect } from 'chai';
import * as mocha from 'mocha';
import {ErrorCode} from "../../../src/blackduck-security-task/enum/ErrorCodes";
import {BLACKDUCKSCA_URL_KEY} from "../../../src/blackduck-security-task/application-constant";

describe("Validator test", () => {
    context('validator context',() => {
        afterEach(() => {
            Object.defineProperty(process, 'platform', {
                value: ''
              });
        });

        it('should return boolean validateBridgeUrl mac ', function () {
            Object.defineProperty(process, 'platform', {
                value: 'darwin'
              });
          
            const isValidURL = validator.validateBridgeUrl("https://test.com/test.zip")
            expect(isValidURL).equals(false);
        });

        it('should return boolean validateBridgeUrl wins32 ', function () {
          
            Object.defineProperty(process, 'platform', {
              value: 'win32'
            });
        
            const isValidURL = validator.validateBridgeUrl("https://test.com/test.zip")
            expect(isValidURL).equals(false);
        });

        it('should return boolean validateBridgeUrl linux ', function () {
         
            Object.defineProperty(process, 'platform', {
              value: 'linux'
            });
        
            const isValidURL = validator.validateBridgeUrl("https://test.com/test.zip")
            expect(isValidURL).equals(false);
        });

        it('should return boolean validateBridgeUrl linux ', function () {
          
            // redefine process.platform
            Object.defineProperty(process, 'platform', {
              value: ''
            });
        
            const isValidURL = validator.validateBridgeUrl("https:\\test.com\.zip")
            expect(isValidURL).equals(false);
        });




    });

    context('Polaris validation', () => {
        afterEach(() => {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_NAME', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: ''})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: []})

            Object.defineProperty(inputs, 'COVERITY_URL', {value: ''})
            Object.defineProperty(inputs, 'SRM_URL', {value: ''})
        });

        it('should return empty array for validateScanType', function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'});
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'COVERITY_URL'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'BLACKDUCKSCA_URL'})
            Object.defineProperty(inputs, 'SRM_URL', {value: 'SRM_URL'})
            const validationsErrors = validator.validateScanTypes();
            expect(validationsErrors.length).equals(0);
        });

        it('should have error for no scan type provided', function () {
            const validationsErrors = validator.validateScanTypes();
            expect(validationsErrors.length).greaterThan(0);
            expect(validationsErrors[0]).contains(constants.POLARIS_SERVER_URL_KEY);
        });

        it('should return empty array for validatePolarisInputs', function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'POLARIS_ACCESS_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'POLARIS_APPLICATION_NAME', {value: 'POLARIS_APPLICATION_NAME'})
            Object.defineProperty(inputs, 'POLARIS_PROJECT_NAME', {value: 'POLARIS_PROJECT_NAME'})
            Object.defineProperty(inputs, 'POLARIS_BRANCH_NAME', {value: 'POLARIS_BRANCH_NAME'})
            Object.defineProperty(inputs, 'POLARIS_ASSESSMENT_TYPES', {value: ['SCA','sast']});

            const polarisValidationErrors = validator.validatePolarisInputs();
            expect(polarisValidationErrors.length).equals(0);
        });

        it('should return mandatory fields missing error for validatePolarisInputs', function () {
            Object.defineProperty(inputs, 'POLARIS_SERVER_URL', {value: 'server_url'})

            const polarisValidationErrors = validator.validatePolarisInputs();
            expect(polarisValidationErrors.length).greaterThan(0);
            expect(polarisValidationErrors[0]).contains("["
                .concat(constants.POLARIS_ACCESS_TOKEN_KEY).concat(",")
                .concat(constants.POLARIS_ASSESSMENT_TYPES_KEY)
                .concat("] - required parameters for polaris is missing"))
        });
    });

    context('Coverity validation', () => {
        afterEach(() => {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_USER_NAME', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_INSTALL_DIRECTORY', {value: ''})
            Object.defineProperty(inputs, 'COVERITY_POLICY_VIEW', {value: ''})
        });

        it('should return empty array for validateCoverityInputs', function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            Object.defineProperty(inputs, 'COVERITY_USER', {value: 'test-user'})
            Object.defineProperty(inputs, 'COVERITY_USER_PASSWORD', {value: 'password'})
            Object.defineProperty(inputs, 'COVERITY_PROJECT_NAME', {value: 'test'})
            Object.defineProperty(inputs, 'COVERITY_STREAM_NAME', {value: 'test'})

            const polarisValidationErrors = validator.validateCoverityInputs();
            expect(polarisValidationErrors.length).equals(0);
        });

        it('should return mandatory fields missing error for validateCoverityInputs', function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})

            const coverityValidationErrors = validator.validateCoverityInputs();
            expect(coverityValidationErrors.length).greaterThan(0);
            expect(coverityValidationErrors[0]).contains("["
                .concat(constants.COVERITY_PASSPHRASE_KEY)
                .concat("] - required parameters for coverity is missing"))
        });

        it('should return false for invalid coverity install directory', function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            const validInstallDirectory = validator.validateCoverityInstallDirectoryParam("test-drectory");
            expect(validInstallDirectory).equals(false)
        });

        it('should return true for valid coverity install directory', function () {
            Object.defineProperty(inputs, 'COVERITY_URL', {value: 'https://test.com'})
            const validInstallDirectory = validator.validateCoverityInstallDirectoryParam(process.cwd());
            expect(validInstallDirectory).equals(true)
        });

    });

    context('Blackduck validation', () => {
        afterEach(() => {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: ''})
            Object.defineProperty(inputs, 'DETECT_INSTALL_DIRECTORY', {value: ''})
            Object.defineProperty(inputs, 'DETECT_SCAN_FULL', {value: true})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES', {value: []})

            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: ''})
        });

        it('should return empty array for validateScanType', function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'BLACKDUCKSCA_URL'})
            const validationsErrors = validator.validateScanTypes();
            expect(validationsErrors.length).equals(3);
        });

        it('should have error for no scan type provided', function () {
            const validationsErrors = validator.validateScanTypes();
            expect(validationsErrors.length).greaterThan(0);
            expect(validationsErrors[1]).contains(constants.BLACKDUCKSCA_URL_KEY);
        });

        it('should return empty array for validateBlackduckInputs', function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'DETECT_SCAN_FULL', {value: true})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES', {value: ["BLOCKER","CRITICAL","TRIVIAL"]});

            const bdValidationErrors = validator.validateBlackDuckInputs();
            expect(bdValidationErrors.length).equals(0);
        });

        it('should return boolean for invalid Blackduck Failure Severities', function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'server_url'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_API_TOKEN', {value: 'access_token'})
            Object.defineProperty(inputs, 'BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES', {value: []});

            const isValid = validator.validateBlackduckFailureSeverities([]);
            expect(isValid).equals(false);
        });

        it('should return mandatory fields missing error for validateBlackDuckInputs', function () {
            Object.defineProperty(inputs, 'BLACKDUCKSCA_URL', {value: 'server_url'})

            const bdValidationErrors = validator.validateBlackDuckInputs();
            expect(bdValidationErrors.length).greaterThan(0);
            expect(bdValidationErrors[0]).contains('['.concat(constants.BLACKDUCK_TOKEN_KEY).concat('] - required parameters for blackduck is missing'))
        });
    });
    context('SRM validation',()=>{
            afterEach(() => {
                Object.defineProperty(inputs, 'SRM_URL', {value: ''})
                Object.defineProperty(inputs, 'SRM_APIKEY', {value: ''})
                Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ''})
                Object.defineProperty(inputs, 'SRM_PROJECT_NAME', {value: ''})
                Object.defineProperty(inputs, 'SRM_BRANCH_NAME', {value: ''})
                Object.defineProperty(inputs, 'SRM_BRANCH_PARENT', {value: ''})
                Object.defineProperty(inputs, 'COVERITY_EXECUTION_PATH', {value: ''})
                Object.defineProperty(inputs, 'BLACKDUCK_EXECUTION_PATH', {value: ''})
            });

        it('should return empty array for validateScanType', function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'SRM_URL'})
            const validationsErrors = validator.validateScanTypes();
            expect(validationsErrors.length).equals(3);
        });

        it('should have error for no scan type provided', function () {
            const validationsErrors = validator.validateScanTypes();
            expect(validationsErrors.length).greaterThan(0);
            expect(validationsErrors[3]).contains(constants.SRM_URL_KEY);
        });
        it('should return empty array for validateSrmInputs', function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'})
            Object.defineProperty(inputs, 'SRM_APIKEY', {value: 'srm_apikey'})
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ['SCA','SAST']})

            const validationErrors = validator.validateSrmInputs();
            expect(validationErrors.length).equals(0);
        });

        it('should failed with messing SRM parameters', function () {
            Object.defineProperty(inputs, 'SRM_URL', {value: 'srm_url'})
            Object.defineProperty(inputs, 'SRM_APIKEY', {value: ''})
            Object.defineProperty(inputs, 'SRM_ASSESSMENT_TYPES', {value: ''})

            const validationErrors = validator.validateSrmInputs();
            expect(validationErrors.length).greaterThan(0);
            expect(validationErrors[0]).contains('[srm_apikey,srm_assessment_types] - required parameters for srm is missing '.concat(ErrorCode.MISSING_REQUIRED_PARAMETERS.toString()));
        });
    })
});
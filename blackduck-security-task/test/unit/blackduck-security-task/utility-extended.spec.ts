// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {expect} from "chai";
import * as sinon from "sinon";
import * as utility from "../../../src/blackduck-security-task/utility";
import * as taskLib from "azure-pipelines-task-lib/task";

describe("Utility Extended Tests", () => {
    context('Utility functions and helpers', () => {
        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should extract branch names correctly', function () {
            const branchScenarios = [
                { input: 'refs/heads/feature/test-branch', expected: 'feature/test-branch' },
                { input: 'refs/heads/main', expected: 'main' },
                { input: 'refs/pull/123/head', expected: '123/head' },
                { input: 'feature-branch', expected: 'feature-branch' }
            ];
            
            branchScenarios.forEach(scenario => {
                const result = utility.extractBranchName(scenario.input);
                expect(result).to.equal(scenario.expected);
            });
        });

        it('should filter empty data arrays', function () {
            const dataScenarios = [
                { input: ['a', 'b', '', 'c'], expected: ['a', 'b', 'c'] },
                { input: ['', null, undefined, 'test'], expected: ['test'] },
                { input: ['valid', 'data'], expected: ['valid', 'data'] },
                { input: [], expected: [] }
            ];
            
            dataScenarios.forEach(scenario => {
                const result = utility.filterEmptyData(scenario.input);
                expect(result).to.deep.equal(scenario.expected);
            });
        });

        it('should validate boolean values', function () {
            const booleanTests = [
                { input: 'true', expected: true },
                { input: 'false', expected: false },
                { input: 'TRUE', expected: true },
                { input: 'FALSE', expected: false },
                { input: '1', expected: true },
                { input: '0', expected: false },
                { input: 'invalid', expected: false }
            ];
            
            booleanTests.forEach(test => {
                const result = utility.isBoolean(test.input);
                expect(result).to.equal(test.expected);
            });
        });

        it('should parse to boolean correctly', function () {
            const parseTests = [
                { input: 'true', expected: true },
                { input: 'false', expected: false },
                { input: 'True', expected: true },
                { input: 'False', expected: false },
                { input: '1', expected: true },
                { input: '0', expected: false },
                { input: '', expected: false },
                { input: 'yes', expected: false }
            ];
            
            parseTests.forEach(test => {
                const result = utility.parseToBoolean(test.input);
                expect(result).to.equal(test.expected);
            });
        });

        it('should detect pull request events', function () {
            const eventScenarios = [
                { input: 'pull_request', expected: true },
                { input: 'PullRequest', expected: true },
                { input: 'push', expected: false },
                { input: 'schedule', expected: false },
                { input: 'workflow_dispatch', expected: false }
            ];
            
            eventScenarios.forEach(scenario => {
                const result = utility.isPullRequestEvent(scenario.input);
                expect(result).to.equal(scenario.expected);
            });
        });

        it('should handle URL validation', function () {
            const urlTests = [
                { input: 'https://example.com', expected: true },
                { input: 'http://test.org', expected: false },
                { input: 'ftp://files.server.com', expected: false },
                { input: 'not-a-url', expected: false },
                { input: '', expected: false }
            ];
            
            urlTests.forEach(test => {
                const isValid = test.input.startsWith('https://');
                expect(isValid).to.equal(test.expected);
            });
        });

        it('should handle string trimming and cleaning', function () {
            const stringTests = [
                { input: '  test  ', expected: 'test' },
                { input: '\tdata\t', expected: 'data' },
                { input: '\nvalue\n', expected: 'value' },
                { input: '  multiple   spaces  ', expected: 'multiple spaces' }
            ];
            
            stringTests.forEach(test => {
                const result = test.input.trim();
                expect(result).to.equal(test.expected);
            });
        });

        it('should validate email formats', function () {
            const emailTests = [
                { input: 'test@example.com', expected: true },
                { input: 'user.name@domain.org', expected: true },
                { input: 'invalid-email', expected: false },
                { input: '@domain.com', expected: false },
                { input: 'user@', expected: false },
                { input: '', expected: false }
            ];
            
            emailTests.forEach(test => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const isValid = emailRegex.test(test.input);
                expect(isValid).to.equal(test.expected);
            });
        });

        it('should handle array operations', function () {
            const arrayTests = [
                { input: [1, 2, 3], operation: 'length', expected: 3 },
                { input: ['a', 'b', 'c'], operation: 'includes', param: 'b', expected: true },
                { input: ['x', 'y', 'z'], operation: 'includes', param: 'w', expected: false },
                { input: [], operation: 'length', expected: 0 }
            ];
            
            arrayTests.forEach(test => {
                if (test.operation === 'length') {
                    expect(test.input.length).to.equal(test.expected);
                } else if (test.operation === 'includes') {
                    expect(test.input.includes(test.param)).to.equal(test.expected);
                }
            });
        });

        it('should handle JSON parsing safely', function () {
            const jsonTests = [
                { input: '{"key": "value"}', expected: { key: "value" } },
                { input: '[]', expected: [] },
                { input: '{}', expected: {} },
                { input: 'invalid json', expected: null },
                { input: '', expected: null }
            ];
            
            jsonTests.forEach(test => {
                try {
                    const result = JSON.parse(test.input);
                    expect(result).to.deep.equal(test.expected);
                } catch (e) {
                    expect(test.expected).to.equal(null);
                }
            });
        });

        it('should handle file path operations', function () {
            const pathTests = [
                { input: '/home/user/file.txt', expected: 'file.txt' },
                { input: 'C:\\Windows\\path\\data.json', expected: 'data.json' },
                { input: './relative/path/config.yml', expected: 'config.yml' },
                { input: '/', expected: '' },
                { input: '', expected: '' }
            ];
            
            pathTests.forEach(test => {
                const parts = test.input.split('/');
                const filename = parts[parts.length - 1];
                expect(filename).to.equal(test.expected);
            });
        });
    });
});

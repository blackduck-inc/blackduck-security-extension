// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as https from 'https';
import * as sslUtils from '../../../src/blackduck-security-task/ssl-utils';
import * as taskLib from 'azure-pipelines-task-lib/task';

describe('SSL Utils Unit Tests', () => {
    let sandbox: sinon.SinonSandbox;
    let taskLibDebugStub: sinon.SinonStub;
    let taskLibWarningStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        taskLibDebugStub = sandbox.stub(taskLib, 'debug');
        taskLibWarningStub = sandbox.stub(taskLib, 'warning');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('parseToBoolean', () => {
        it('should return true for string "true"', () => {
            expect(sslUtils.parseToBoolean('true')).to.be.true;
        });

        it('should return true for boolean true', () => {
            expect(sslUtils.parseToBoolean(true)).to.be.true;
        });

        it('should return true for "True" (case insensitive)', () => {
            expect(sslUtils.parseToBoolean('True')).to.be.true;
        });

        it('should return true for "TRUE"', () => {
            expect(sslUtils.parseToBoolean('TRUE')).to.be.true;
        });

        it('should return false for string "false"', () => {
            expect(sslUtils.parseToBoolean('false')).to.be.false;
        });

        it('should return false for boolean false', () => {
            expect(sslUtils.parseToBoolean(false)).to.be.false;
        });

        it('should return false for undefined', () => {
            expect(sslUtils.parseToBoolean(undefined)).to.be.false;
        });

        it('should return false for empty string', () => {
            expect(sslUtils.parseToBoolean('')).to.be.false;
        });

        it('should return false for null', () => {
            expect(sslUtils.parseToBoolean(null as any)).to.be.false;
        });

        it('should return false for random string', () => {
            expect(sslUtils.parseToBoolean('random')).to.be.false;
        });

        it('should return false for "0"', () => {
            expect(sslUtils.parseToBoolean('0')).to.be.false;
        });

        it('should return false for "1"', () => {
            expect(sslUtils.parseToBoolean('1')).to.be.false;
        });
    });

    describe('getSSLConfig', () => {
        it('should return minimal config in test environment', () => {
            // npm_lifecycle_event is automatically set to "test" by npm test
            const result = sslUtils.getSSLConfig();

            expect(result).to.deep.equal({ trustAllCerts: false });
            expect(taskLibDebugStub.calledWith('Running in test environment - using minimal SSL config to preserve mocks')).to.be.true;
        });

        describe('production environment tests', () => {
            let fsReadFileSyncStub: sinon.SinonStub;
            let inputsStub: any;

            beforeEach(() => {
                // Enable production mode by setting SSL_CONFIG_TEST_MODE
                process.env.SSL_CONFIG_TEST_MODE = 'production';

                // Stub fs.readFileSync using require() pattern
                fsReadFileSyncStub = sandbox.stub(require('fs'), 'readFileSync');

                // Stub inputs module
                inputsStub = {
                    NETWORK_SSL_TRUST_ALL: '',
                    NETWORK_SSL_CERT_FILE: ''
                };
                sandbox.stub(require('../../../src/blackduck-security-task/input'), 'NETWORK_SSL_TRUST_ALL').get(() => inputsStub.NETWORK_SSL_TRUST_ALL);
                sandbox.stub(require('../../../src/blackduck-security-task/input'), 'NETWORK_SSL_CERT_FILE').get(() => inputsStub.NETWORK_SSL_CERT_FILE);
            });

            afterEach(() => {
                delete process.env.SSL_CONFIG_TEST_MODE;
            });

            it('should return trustAllCerts=true when NETWORK_SSL_TRUST_ALL is true', () => {
                inputsStub.NETWORK_SSL_TRUST_ALL = 'true';

                const result = sslUtils.getSSLConfig();

                expect(result).to.deep.equal({ trustAllCerts: true });
                expect(taskLibDebugStub.calledWith('SSL certificate verification disabled (NETWORK_SSL_TRUST_ALL=true)')).to.be.true;
            });

            it('should load custom CA certificate and combine with system CAs', () => {
                inputsStub.NETWORK_SSL_CERT_FILE = '/path/to/ca.crt';
                const certContent = '-----BEGIN CERTIFICATE-----\nMIIC...';
                fsReadFileSyncStub.returns(certContent);

                const result = sslUtils.getSSLConfig();

                expect(fsReadFileSyncStub.calledOnceWith('/path/to/ca.crt', 'utf8')).to.be.true;
                expect(result.trustAllCerts).to.be.false;
                expect(result.customCA).to.equal(certContent);
                expect(result.combinedCAs).to.be.an('array');
                expect(result.combinedCAs![0]).to.equal(certContent);
                expect(taskLibDebugStub.calledWith('Custom CA certificate loaded successfully')).to.be.true;
                expect(taskLibDebugStub.calledWith(sinon.match(/Using custom CA certificate with .* system CAs/))).to.be.true;
            });

            it('should handle whitespace in cert file path', () => {
                inputsStub.NETWORK_SSL_CERT_FILE = '  /path/to/ca.crt  ';
                const certContent = '-----BEGIN CERTIFICATE-----\nMIIC...';
                fsReadFileSyncStub.returns(certContent);

                const result = sslUtils.getSSLConfig();

                expect(fsReadFileSyncStub.calledOnceWith('  /path/to/ca.crt  ', 'utf8')).to.be.true;
                expect(result.customCA).to.equal(certContent);
            });

            it('should handle file read error and return default config', () => {
                inputsStub.NETWORK_SSL_CERT_FILE = '/path/to/nonexistent.crt';
                const error = new Error('ENOENT: no such file or directory');
                fsReadFileSyncStub.throws(error);

                const result = sslUtils.getSSLConfig();

                expect(result).to.deep.equal({ trustAllCerts: false });
                expect(taskLibWarningStub.calledWith(sinon.match(/Failed to read custom CA certificate file/))).to.be.true;
            });

            it('should return default config when no SSL options are set', () => {
                inputsStub.NETWORK_SSL_TRUST_ALL = '';
                inputsStub.NETWORK_SSL_CERT_FILE = '';

                const result = sslUtils.getSSLConfig();

                expect(result).to.deep.equal({ trustAllCerts: false });
            });

            it('should handle empty cert file path', () => {
                inputsStub.NETWORK_SSL_CERT_FILE = '';

                const result = sslUtils.getSSLConfig();

                expect(result).to.deep.equal({ trustAllCerts: false });
                expect(fsReadFileSyncStub.called).to.be.false;
            });

            it('should handle whitespace-only cert file path', () => {
                inputsStub.NETWORK_SSL_CERT_FILE = '   ';

                const result = sslUtils.getSSLConfig();

                expect(result).to.deep.equal({ trustAllCerts: false });
                expect(fsReadFileSyncStub.called).to.be.false;
            });

            it('should handle empty certificate content', () => {
                inputsStub.NETWORK_SSL_CERT_FILE = '/path/to/empty.crt';
                fsReadFileSyncStub.returns('');

                const result = sslUtils.getSSLConfig();

                expect(result.customCA).to.equal('');
                expect(result.combinedCAs).to.be.an('array');
            });

            it('should prioritize trustAllCerts over custom CA', () => {
                inputsStub.NETWORK_SSL_TRUST_ALL = 'true';
                inputsStub.NETWORK_SSL_CERT_FILE = '/path/to/ca.crt';

                const result = sslUtils.getSSLConfig();

                expect(result).to.deep.equal({ trustAllCerts: true });
                expect(fsReadFileSyncStub.called).to.be.false;
            });

            it('should handle permission error when reading cert file', () => {
                inputsStub.NETWORK_SSL_CERT_FILE = '/path/to/ca.crt';
                const error = new Error('EACCES: permission denied');
                error.name = 'EACCES';
                fsReadFileSyncStub.throws(error);

                const result = sslUtils.getSSLConfig();

                expect(result).to.deep.equal({ trustAllCerts: false });
                expect(taskLibWarningStub.calledWith(sinon.match(/Failed to read custom CA certificate file/))).to.be.true;
            });

            it('should place custom CA first in combinedCAs array', () => {
                inputsStub.NETWORK_SSL_CERT_FILE = '/path/to/ca.crt';
                const certContent = '-----BEGIN CERTIFICATE-----\nCUSTOM CA';
                fsReadFileSyncStub.returns(certContent);

                const result = sslUtils.getSSLConfig();

                expect(result.combinedCAs![0]).to.equal(certContent);
                // System CAs follow the custom CA
                expect(result.combinedCAs!.length).to.be.greaterThan(1);
            });
        });
    });

    describe('createHTTPSAgent', () => {
        it('should create agent with rejectUnauthorized=false when trustAllCerts is true', () => {
            const sslConfig = { trustAllCerts: true };

            const result = sslUtils.createHTTPSAgent(sslConfig);

            expect(result).to.be.instanceOf(https.Agent);
            expect(result.options.rejectUnauthorized).to.equal(false);
            expect(taskLibDebugStub.calledWith('Creating HTTPS agent with SSL verification disabled')).to.be.true;
        });

        it('should create agent with combinedCAs when provided', () => {
            const sslConfig = {
                trustAllCerts: false,
                combinedCAs: ['ca1', 'ca2', 'ca3']
            };

            const result = sslUtils.createHTTPSAgent(sslConfig);

            expect(result).to.be.instanceOf(https.Agent);
            expect(result.options.ca).to.deep.equal(['ca1', 'ca2', 'ca3']);
            expect(result.options.rejectUnauthorized).to.equal(true);
            expect(taskLibDebugStub.calledWith('Creating HTTPS agent with combined CA certificates')).to.be.true;
        });

        it('should create default agent when no special config', () => {
            const sslConfig = { trustAllCerts: false };

            const result = sslUtils.createHTTPSAgent(sslConfig);

            expect(result).to.be.instanceOf(https.Agent);
            expect(taskLibDebugStub.calledWith('Creating default HTTPS agent')).to.be.true;
        });

        it('should create agent with both trustAllCerts and combinedCAs (trustAllCerts takes precedence)', () => {
            const sslConfig = {
                trustAllCerts: true,
                combinedCAs: ['ca1', 'ca2']
            };

            const result = sslUtils.createHTTPSAgent(sslConfig);

            expect(result).to.be.instanceOf(https.Agent);
            expect(result.options.rejectUnauthorized).to.equal(false);
            // When trustAllCerts is true, combinedCAs are not used (returns early)
            expect(result.options.ca).to.be.undefined;
        });
    });

    describe('createHTTPSRequestOptions', () => {
        it('should create basic request options with default values', () => {
            const parsedUrl = new URL('https://example.com/path?query=value');
            const sslConfig = { trustAllCerts: false };

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.hostname).to.equal('example.com');
            expect(result.port).to.equal(443);
            expect(result.path).to.equal('/path?query=value');
            expect(result.method).to.equal('GET');
            expect(result.headers).to.include({
                'User-Agent': 'BlackDuckSecurityTask'
            });
        });

        it('should use custom port when provided in URL', () => {
            const parsedUrl = new URL('https://example.com:8443/path');
            const sslConfig = { trustAllCerts: false };

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.port).to.equal('8443');
        });

        it('should merge custom headers with default headers', () => {
            const parsedUrl = new URL('https://example.com/path');
            const sslConfig = { trustAllCerts: false };
            const customHeaders = {
                'Authorization': 'Bearer token',
                'Content-Type': 'application/json'
            };

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig, customHeaders);

            expect(result.headers).to.include({
                'User-Agent': 'BlackDuckSecurityTask',
                'Authorization': 'Bearer token',
                'Content-Type': 'application/json'
            });
        });

        it('should set rejectUnauthorized=false when trustAllCerts is true', () => {
            const parsedUrl = new URL('https://example.com/path');
            const sslConfig = { trustAllCerts: true };

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.rejectUnauthorized).to.equal(false);
            expect(taskLibDebugStub.calledWith('SSL certificate verification disabled for this request')).to.be.true;
        });

        it('should set ca when combinedCAs is provided', () => {
            const parsedUrl = new URL('https://example.com/path');
            const sslConfig = {
                trustAllCerts: false,
                combinedCAs: ['ca1', 'ca2']
            };

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.ca).to.deep.equal(['ca1', 'ca2']);
            expect(taskLibDebugStub.calledWith('Using combined CA certificates for SSL verification')).to.be.true;
        });

        it('should handle URL with no path (defaults to /)', () => {
            const parsedUrl = new URL('https://example.com');
            const sslConfig = { trustAllCerts: false };

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.path).to.equal('/');
        });

        it('should handle URL with empty search params', () => {
            const parsedUrl = new URL('https://example.com/path');
            const sslConfig = { trustAllCerts: false };

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.path).to.equal('/path');
        });

        it('should combine trustAllCerts and combinedCAs (trustAllCerts takes precedence)', () => {
            const parsedUrl = new URL('https://example.com/path');
            const sslConfig = {
                trustAllCerts: true,
                combinedCAs: ['ca1', 'ca2']
            };

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.rejectUnauthorized).to.equal(false);
            // When trustAllCerts is true, the else-if for combinedCAs is not executed
            expect(result.ca).to.be.undefined;
        });

        it('should handle complex URL with path, query, and custom port', () => {
            const parsedUrl = new URL('https://api.example.com:9443/v1/resource?id=123&filter=active');
            const sslConfig = { trustAllCerts: false };

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.hostname).to.equal('api.example.com');
            expect(result.port).to.equal('9443');
            expect(result.path).to.equal('/v1/resource?id=123&filter=active');
        });
    });

    describe('getSSLConfigHash', () => {
        it('should generate hash based on inputs configuration', () => {
            // The hash function reads inputs directly
            const result = sslUtils.getSSLConfigHash();

            expect(result).to.be.a('string');
            expect(result).to.match(/^trustAll:(true|false)\|certFile:.*$/);
        });

        it('should generate consistent hash for same configuration', () => {
            const result1 = sslUtils.getSSLConfigHash();
            const result2 = sslUtils.getSSLConfigHash();

            expect(result1).to.equal(result2);
        });

        it('should return hash in correct format with trustAll and certFile components', () => {
            const result = sslUtils.getSSLConfigHash();

            expect(result).to.include('trustAll:');
            expect(result).to.include('|certFile:');
        });

        it('should generate hash string that can be used for caching', () => {
            const result = sslUtils.getSSLConfigHash();

            // Should be a simple string suitable for cache key
            expect(result).to.be.a('string');
            expect(result.length).to.be.greaterThan(10);
        });
    });
});

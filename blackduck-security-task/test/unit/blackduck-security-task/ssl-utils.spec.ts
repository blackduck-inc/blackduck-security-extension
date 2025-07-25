import {assert, expect} from "chai";
import * as sinon from "sinon";
import * as https from "https";
import {after, before} from "mocha";

describe('SSL Utils Unit Tests', () => {
    let sslUtils: any;
    let mockInputs: any;
    let mockFs: any;
    let mockTls: any;
    let mockTaskLib: any;
    let sandbox: sinon.SinonSandbox;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        // Create fresh mocks for each test
        mockInputs = {
            NETWORK_SSL_TRUST_ALL: false,
            NETWORK_SSL_CERT_FILE: ''
        };

        mockFs = {
            readFileSync: sandbox.stub(),
            writeFileSync: sandbox.stub(),
            existsSync: sandbox.stub().returns(true),
            mkdirSync: sandbox.stub()
        };

        mockTls = {
            rootCertificates: ['system-ca-1', 'system-ca-2']
        };

        mockTaskLib = {
            debug: sandbox.stub(),
            warning: sandbox.stub()
        };

        // Clear module cache
        const sslUtilsPath = '../../../src/blackduck-security-task/ssl-utils';
        delete require.cache[require.resolve(sslUtilsPath)];
        delete require.cache[require.resolve('fs')];
        delete require.cache[require.resolve('tls')];
        delete require.cache[require.resolve('../../../src/blackduck-security-task/input')];
        delete require.cache[require.resolve('azure-pipelines-task-lib')];

        // Mock the modules before requiring ssl-utils
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Module = require('module');
        const originalRequire = Module.prototype.require;
        Module.prototype.require = function(id: string, ...args: any[]) {
            if (id === 'fs') return mockFs;
            if (id === 'tls') return mockTls;
            if (id === './input') return mockInputs;
            if (id === 'azure-pipelines-task-lib') return mockTaskLib;
            return originalRequire.apply(this, [id, ...args]);
        };

        // Import after mocking
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        sslUtils = require(sslUtilsPath);

        // Restore require
        Module.prototype.require = originalRequire;
    });

    after(() => {
        sandbox.restore();
    });

    describe('getSSLConfig', () => {

        it('returns trustAllCerts=true when NETWORK_SSL_TRUST_ALL is "true" string', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = 'true';

            const result = sslUtils.getSSLConfig();

            expect(result).to.deep.equal({trustAllCerts: true});
        });

        it('returns trustAllCerts=true when NETWORK_SSL_TRUST_ALL is "TRUE" string', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = 'TRUE';

            const result = sslUtils.getSSLConfig();

            expect(result).to.deep.equal({trustAllCerts: true});
        });

        it('returns trustAllCerts=false when NETWORK_SSL_TRUST_ALL is false', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = false;

            const result = sslUtils.getSSLConfig();

            expect(result).to.deep.equal({trustAllCerts: false});
        });

        it('returns trustAllCerts=false when NETWORK_SSL_TRUST_ALL is "false" string', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = 'false';

            const result = sslUtils.getSSLConfig();

            expect(result).to.deep.equal({trustAllCerts: false});
        });

        it('returns trustAllCerts=false when NETWORK_SSL_TRUST_ALL is empty string', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = '';

            const result = sslUtils.getSSLConfig();

            expect(result).to.deep.equal({trustAllCerts: false});
        });

        it('returns trustAllCerts=false when NETWORK_SSL_TRUST_ALL is null', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = null;

            const result = sslUtils.getSSLConfig();

            expect(result).to.deep.equal({trustAllCerts: false});
        });

        it('loads custom CA certificate when NETWORK_SSL_CERT_FILE is provided', () => {
            mockInputs.NETWORK_SSL_CERT_FILE = '/path/to/cert.pem';
            const mockCertContent = '-----BEGIN CERTIFICATE-----\ntest-cert\n-----END CERTIFICATE-----';
            mockFs.readFileSync.returns(mockCertContent);

            const result = sslUtils.getSSLConfig();

            expect(result).to.deep.equal({
                trustAllCerts: false,
                customCA: mockCertContent,
                combinedCAs: [mockCertContent, 'system-ca-1', 'system-ca-2']
            });
        });

        it('handles file read error and returns default config', () => {
            mockInputs.NETWORK_SSL_CERT_FILE = '/path/to/nonexistent.pem';
            const mockError = new Error('File not found');
            mockFs.readFileSync.throws(mockError);

            const result = sslUtils.getSSLConfig();

            expect(result).to.deep.equal({trustAllCerts: false});
        });

        it('handles empty rootCertificates array', () => {
            mockInputs.NETWORK_SSL_CERT_FILE = '/path/to/cert.pem';
            const mockCertContent = '-----BEGIN CERTIFICATE-----\ntest-cert\n-----END CERTIFICATE-----';
            mockFs.readFileSync.returns(mockCertContent);
            mockTls.rootCertificates = [];

            const result = sslUtils.getSSLConfig();

            expect(result).to.deep.equal({
                trustAllCerts: false,
                customCA: mockCertContent,
                combinedCAs: [mockCertContent]
            });
        });

        it('handles undefined rootCertificates', () => {
            mockInputs.NETWORK_SSL_CERT_FILE = '/path/to/cert.pem';
            const mockCertContent = '-----BEGIN CERTIFICATE-----\ntest-cert\n-----END CERTIFICATE-----';
            mockFs.readFileSync.returns(mockCertContent);
            mockTls.rootCertificates = undefined;

            const result = sslUtils.getSSLConfig();

            expect(result).to.deep.equal({
                trustAllCerts: false,
                customCA: mockCertContent,
                combinedCAs: [mockCertContent]
            });
        });
    });

    describe('createHTTPSAgent', () => {
        it('creates agent with rejectUnauthorized=false when trustAllCerts is true', () => {
            const sslConfig = {trustAllCerts: true};

            const result = sslUtils.createHTTPSAgent(sslConfig);

            assert.instanceOf(result, https.Agent);
            expect(result.options.rejectUnauthorized).to.equal(false);
        });

        it('creates agent with combinedCAs when provided', () => {
            const sslConfig = {
                trustAllCerts: false,
                combinedCAs: ['ca1', 'ca2', 'ca3']
            };

            const result = sslUtils.createHTTPSAgent(sslConfig);

            assert.instanceOf(result, https.Agent);
            expect(result.options.ca).to.deep.equal(['ca1', 'ca2', 'ca3']);
            expect(result.options.rejectUnauthorized).to.equal(true);
        });

        it('creates default agent when no special config', () => {
            const sslConfig = {trustAllCerts: false};

            const result = sslUtils.createHTTPSAgent(sslConfig);

            assert.instanceOf(result, https.Agent);
        });
    });

    describe('createHTTPSRequestOptions', () => {
        it('creates basic request options with default values', () => {
            const parsedUrl = new URL('https://example.com/path?query=value');
            const sslConfig = {trustAllCerts: false};

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.hostname).to.equal('example.com');
            expect(result.port).to.equal(443);
            expect(result.path).to.equal('/path?query=value');
            expect(result.method).to.equal('GET');
            expect(result.headers).to.include({
                'User-Agent': 'BlackDuckSecurityTask'
            });
        });

        it('uses custom port when provided in URL', () => {
            const parsedUrl = new URL('https://example.com:8443/path');
            const sslConfig = {trustAllCerts: false};

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.port).to.equal('8443');
        });

        it('merges custom headers with default headers', () => {
            const parsedUrl = new URL('https://example.com/path');
            const sslConfig = {trustAllCerts: false};
            const customHeaders = {
                Authorization: 'Bearer token',
                'Content-Type': 'application/json'
            };

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig, customHeaders);

            expect(result.headers).to.include({
                'User-Agent': 'BlackDuckSecurityTask',
                Authorization: 'Bearer token',
                'Content-Type': 'application/json'
            });
        });

        it('sets rejectUnauthorized=false when trustAllCerts is true', () => {
            const parsedUrl = new URL('https://example.com/path');
            const sslConfig = {trustAllCerts: true};

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.rejectUnauthorized).to.equal(false);
        });

        it('sets ca when combinedCAs is provided', () => {
            const parsedUrl = new URL('https://example.com/path');
            const sslConfig = {
                trustAllCerts: false,
                combinedCAs: ['ca1', 'ca2']
            };

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.ca).to.deep.equal(['ca1', 'ca2']);
        });

        it('handles URL with no path', () => {
            const parsedUrl = new URL('https://example.com');
            const sslConfig = {trustAllCerts: false};

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.path).to.equal('/');
        });

        it('handles URL with empty search params', () => {
            const parsedUrl = new URL('https://example.com/path');
            const sslConfig = {trustAllCerts: false};

            const result = sslUtils.createHTTPSRequestOptions(parsedUrl, sslConfig);

            expect(result.path).to.equal('/path');
        });
    });

    describe('getSSLConfigHash', () => {
        it('generates hash with trustAll=false and empty certFile', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = false;
            mockInputs.NETWORK_SSL_CERT_FILE = '';

            const result = sslUtils.getSSLConfigHash();

            expect(result).to.equal('trustAll:false|certFile:');
        });

        it('generates hash with trustAll=true and empty certFile', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = true;
            mockInputs.NETWORK_SSL_CERT_FILE = '';

            const result = sslUtils.getSSLConfigHash();

            expect(result).to.equal('trustAll:true|certFile:');
        });

        it('generates hash with trustAll=false and certFile path', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = false;
            mockInputs.NETWORK_SSL_CERT_FILE = '/path/to/cert.pem';

            const result = sslUtils.getSSLConfigHash();

            expect(result).to.equal('trustAll:false|certFile:/path/to/cert.pem');
        });

        it('generates hash with trustAll=true and certFile path', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = 'true';
            mockInputs.NETWORK_SSL_CERT_FILE = '/path/to/cert.pem';

            const result = sslUtils.getSSLConfigHash();

            expect(result).to.equal('trustAll:true|certFile:/path/to/cert.pem');
        });

        it('trims whitespace from cert file path', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = false;
            mockInputs.NETWORK_SSL_CERT_FILE = '  /path/to/cert.pem  ';

            const result = sslUtils.getSSLConfigHash();

            expect(result).to.equal('trustAll:false|certFile:/path/to/cert.pem');
        });

        it('handles undefined cert file', () => {
            mockInputs.NETWORK_SSL_TRUST_ALL = false;
            mockInputs.NETWORK_SSL_CERT_FILE = undefined;

            const result = sslUtils.getSSLConfigHash();

            expect(result).to.equal('trustAll:false|certFile:');
        });
    });
});
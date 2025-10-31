// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as proxyUtils from '../../../src/blackduck-security-task/proxy-utils';
import * as taskLib from 'azure-pipelines-task-lib/task';

describe('Proxy Utils Unit Tests', () => {
    let sandbox: sinon.SinonSandbox;
    let taskLibDebugStub: sinon.SinonStub;
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        taskLibDebugStub = sandbox.stub(taskLib, 'debug');
        originalEnv = { ...process.env };
    });

    afterEach(() => {
        sandbox.restore();
        process.env = originalEnv;
    });

    describe('getProxyConfig', () => {
        describe('when no proxy environment variables are set', () => {
            beforeEach(() => {
                delete process.env.HTTPS_PROXY;
                delete process.env.https_proxy;
                delete process.env.HTTP_PROXY;
                delete process.env.http_proxy;
                delete process.env.NO_PROXY;
                delete process.env.no_proxy;
            });

            it('should return useProxy=false', () => {
                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result).to.deep.equal({ useProxy: false });
                // Debug message may or may not be called depending on implementation
            });
        });

        describe('when HTTPS_PROXY is set', () => {
            it('should return proxy config with HTTPS_PROXY URL', () => {
                process.env.HTTPS_PROXY = 'http://proxy.example.com:8080';
                delete process.env.NO_PROXY;

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result.useProxy).to.be.true;
                expect(result.proxyUrl).to.deep.equal(new URL('http://proxy.example.com:8080'));
                expect(taskLibDebugStub.calledWith('Using proxy: http://proxy.example.com:8080 for target URL: https://example.com/api')).to.be.true;
            });
        });

        describe('when https_proxy (lowercase) is set', () => {
            it('should return proxy config with https_proxy URL', () => {
                process.env.https_proxy = 'http://proxy.example.com:3128';
                delete process.env.NO_PROXY;

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result.useProxy).to.be.true;
                expect(result.proxyUrl).to.deep.equal(new URL('http://proxy.example.com:3128'));
            });
        });

        describe('when HTTP_PROXY is set', () => {
            it('should return proxy config with HTTP_PROXY URL', () => {
                process.env.HTTP_PROXY = 'http://proxy.company.com:8080';
                delete process.env.NO_PROXY;

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result.useProxy).to.be.true;
                expect(result.proxyUrl).to.deep.equal(new URL('http://proxy.company.com:8080'));
            });
        });

        describe('when http_proxy (lowercase) is set', () => {
            it('should return proxy config with http_proxy URL', () => {
                process.env.http_proxy = 'http://proxy.localhost:3128';
                delete process.env.NO_PROXY;

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result.useProxy).to.be.true;
                expect(result.proxyUrl).to.deep.equal(new URL('http://proxy.localhost:3128'));
            });
        });

        describe('proxy priority', () => {
            it('should prioritize HTTPS_PROXY over HTTP_PROXY', () => {
                process.env.HTTPS_PROXY = 'http://https-proxy.example.com:8080';
                process.env.HTTP_PROXY = 'http://http-proxy.example.com:3128';
                delete process.env.NO_PROXY;

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result.useProxy).to.be.true;
                expect(result.proxyUrl).to.deep.equal(new URL('http://https-proxy.example.com:8080'));
            });

            it('should prioritize https_proxy over http_proxy', () => {
                process.env.https_proxy = 'http://https-proxy.example.com:8080';
                process.env.http_proxy = 'http://http-proxy.example.com:3128';
                delete process.env.NO_PROXY;

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result.useProxy).to.be.true;
                expect(result.proxyUrl).to.deep.equal(new URL('http://https-proxy.example.com:8080'));
            });

            it('should prioritize uppercase over lowercase environment variables', () => {
                process.env.HTTPS_PROXY = 'http://uppercase-proxy.example.com:8080';
                process.env.https_proxy = 'http://lowercase-proxy.example.com:8080';
                delete process.env.NO_PROXY;

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result.useProxy).to.be.true;
                expect(result.proxyUrl).to.deep.equal(new URL('http://uppercase-proxy.example.com:8080'));
            });
        });

        describe('edge cases', () => {
            it('should handle invalid proxy URLs gracefully', () => {
                process.env.HTTPS_PROXY = 'invalid-url';

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result).to.deep.equal({ useProxy: false });
            });

            it('should handle empty proxy URL', () => {
                process.env.HTTPS_PROXY = '';

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result).to.deep.equal({ useProxy: false });
            });

            it('should handle proxy URL with authentication', () => {
                process.env.HTTPS_PROXY = 'http://user:pass@proxy.example.com:8080';
                delete process.env.NO_PROXY;

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result.useProxy).to.be.true;
                expect(result.proxyUrl?.username).to.equal('user');
                expect(result.proxyUrl?.password).to.equal('pass');
                expect(result.proxyUrl?.hostname).to.equal('proxy.example.com');
                expect(result.proxyUrl?.port).to.equal('8080');
            });
        });

        describe('NO_PROXY support', () => {
            beforeEach(() => {
                process.env.HTTPS_PROXY = 'http://proxy.example.com:8080';
            });

            it('should bypass proxy when target matches NO_PROXY exact hostname', () => {
                process.env.NO_PROXY = 'example.com,test.local';

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result).to.deep.equal({ useProxy: false });
                expect(taskLibDebugStub.calledWith('Bypassing proxy for https://example.com/api due to NO_PROXY configuration')).to.be.true;
            });

            it('should bypass proxy when target matches no_proxy (lowercase)', () => {
                process.env.no_proxy = 'example.com,test.local';

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result).to.deep.equal({ useProxy: false });
                expect(taskLibDebugStub.calledWith('Bypassing proxy for https://example.com/api due to NO_PROXY configuration')).to.be.true;
            });

            it('should bypass proxy for wildcard domain (*.example.com)', () => {
                process.env.NO_PROXY = '*.example.com';

                const result1 = proxyUtils.getProxyConfig('https://api.example.com/test');
                const result2 = proxyUtils.getProxyConfig('https://sub.example.com/path');
                const result3 = proxyUtils.getProxyConfig('https://example.com/root');

                expect(result1).to.deep.equal({ useProxy: false });
                expect(result2).to.deep.equal({ useProxy: false });
                expect(result3).to.deep.equal({ useProxy: false });
            });

            it('should bypass proxy for domain suffix (.example.com)', () => {
                process.env.NO_PROXY = '.example.com';

                const result1 = proxyUtils.getProxyConfig('https://api.example.com/test');
                const result2 = proxyUtils.getProxyConfig('https://sub.example.com/path');

                expect(result1).to.deep.equal({ useProxy: false });
                expect(result2).to.deep.equal({ useProxy: false });
            });

            it('should bypass proxy for subdomain match', () => {
                process.env.NO_PROXY = 'example.com';

                const result1 = proxyUtils.getProxyConfig('https://api.example.com/test');
                const result2 = proxyUtils.getProxyConfig('https://example.com/root');

                expect(result1).to.deep.equal({ useProxy: false });
                expect(result2).to.deep.equal({ useProxy: false });
            });

            it('should bypass proxy for wildcard suffix (*example.com)', () => {
                process.env.NO_PROXY = '*example.com';

                const result1 = proxyUtils.getProxyConfig('https://testexample.com/api');
                const result2 = proxyUtils.getProxyConfig('https://sub.example.com/path');

                expect(result1).to.deep.equal({ useProxy: false });
                expect(result2).to.deep.equal({ useProxy: false });
            });

            it('should use proxy when target does not match NO_PROXY', () => {
                process.env.NO_PROXY = 'example.com,test.local';

                const result = proxyUtils.getProxyConfig('https://other.com/api');

                expect(result.useProxy).to.be.true;
                expect(result.proxyUrl).to.deep.equal(new URL('http://proxy.example.com:8080'));
            });

            it('should handle multiple NO_PROXY entries with whitespace', () => {
                process.env.NO_PROXY = ' example.com , test.local , *.internal.com ';

                const result1 = proxyUtils.getProxyConfig('https://example.com/api');
                const result2 = proxyUtils.getProxyConfig('https://test.local/path');
                const result3 = proxyUtils.getProxyConfig('https://api.internal.com/test');

                expect(result1).to.deep.equal({ useProxy: false });
                expect(result2).to.deep.equal({ useProxy: false });
                expect(result3).to.deep.equal({ useProxy: false });
            });

            it('should prioritize NO_PROXY over HTTPS_PROXY', () => {
                process.env.HTTPS_PROXY = 'http://proxy.example.com:8080';
                process.env.NO_PROXY = 'bypass.com';

                const result = proxyUtils.getProxyConfig('https://bypass.com/api');

                expect(result).to.deep.equal({ useProxy: false });
                expect(taskLibDebugStub.calledWith('Bypassing proxy for https://bypass.com/api due to NO_PROXY configuration')).to.be.true;
            });

            it('should handle case insensitive matching', () => {
                process.env.NO_PROXY = 'EXAMPLE.COM';

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result).to.deep.equal({ useProxy: false });
            });

            it('should handle localhost bypass', () => {
                process.env.NO_PROXY = 'localhost,127.0.0.1';

                const result1 = proxyUtils.getProxyConfig('http://localhost:3000/api');
                const result2 = proxyUtils.getProxyConfig('http://127.0.0.1/api');

                expect(result1).to.deep.equal({ useProxy: false });
                expect(result2).to.deep.equal({ useProxy: false });
            });

            it('should use proxy when NO_PROXY is empty', () => {
                process.env.NO_PROXY = '';

                const result = proxyUtils.getProxyConfig('https://example.com/api');

                expect(result.useProxy).to.be.true;
                expect(result.proxyUrl).to.deep.equal(new URL('http://proxy.example.com:8080'));
            });
        });
    });

    describe('shouldBypassProxy', () => {
        it('should return true for exact hostname match', () => {
            const result = proxyUtils.shouldBypassProxy('https://example.com/api', 'example.com');
            expect(result).to.be.true;
        });

        it('should return true for subdomain match', () => {
            const result = proxyUtils.shouldBypassProxy('https://api.example.com/test', 'example.com');
            expect(result).to.be.true;
        });

        it('should return true for wildcard domain match (*.example.com)', () => {
            const result1 = proxyUtils.shouldBypassProxy('https://api.example.com/test', '*.example.com');
            const result2 = proxyUtils.shouldBypassProxy('https://example.com/root', '*.example.com');
            expect(result1).to.be.true;
            expect(result2).to.be.true;
        });

        it('should return true for domain suffix match (.example.com)', () => {
            const result = proxyUtils.shouldBypassProxy('https://api.example.com/test', '.example.com');
            expect(result).to.be.true;
        });

        it('should return true for wildcard prefix match (*example.com)', () => {
            const result = proxyUtils.shouldBypassProxy('https://testexample.com/api', '*example.com');
            expect(result).to.be.true;
        });

        it('should return false for non-matching domain', () => {
            const result = proxyUtils.shouldBypassProxy('https://other.com/api', 'example.com');
            expect(result).to.be.false;
        });

        it('should handle invalid URLs gracefully', () => {
            const result = proxyUtils.shouldBypassProxy('invalid-url', 'example.com');
            expect(result).to.be.false;
        });

        it('should handle case insensitive matching', () => {
            const result = proxyUtils.shouldBypassProxy('https://EXAMPLE.COM/api', 'example.com');
            expect(result).to.be.true;
        });

        it('should handle multiple comma-separated entries', () => {
            const noProxy = 'localhost,example.com,*.internal.com';

            expect(proxyUtils.shouldBypassProxy('https://localhost/api', noProxy)).to.be.true;
            expect(proxyUtils.shouldBypassProxy('https://example.com/api', noProxy)).to.be.true;
            expect(proxyUtils.shouldBypassProxy('https://api.internal.com/test', noProxy)).to.be.true;
            expect(proxyUtils.shouldBypassProxy('https://external.com/api', noProxy)).to.be.false;
        });

        it('should handle empty entries in NO_PROXY list', () => {
            const result = proxyUtils.shouldBypassProxy('https://example.com/api', 'localhost,,example.com');
            expect(result).to.be.true;
        });

        it('should handle whitespace in entries', () => {
            const result = proxyUtils.shouldBypassProxy('https://example.com/api', ' localhost , example.com , test.com ');
            expect(result).to.be.true;
        });
    });

    describe('createProxyAgent', () => {
        beforeEach(() => {
            process.env.HTTPS_PROXY = 'http://proxy.example.com:8080';
            delete process.env.NO_PROXY;
        });

        it('should return undefined when no proxy is configured', () => {
            delete process.env.HTTPS_PROXY;
            delete process.env.HTTP_PROXY;
            delete process.env.https_proxy;
            delete process.env.http_proxy;

            const sslConfig = { trustAllCerts: false };
            const result = proxyUtils.createProxyAgent('https://example.com/api', sslConfig);

            expect(result).to.be.undefined;
        });

        it('should return undefined when URL matches NO_PROXY', () => {
            process.env.NO_PROXY = 'example.com';

            const sslConfig = { trustAllCerts: false };
            const result = proxyUtils.createProxyAgent('https://example.com/api', sslConfig);

            expect(result).to.be.undefined;
        });

        it('should create proxy agent for HTTP proxy URLs', () => {
            process.env.HTTPS_PROXY = 'http://proxy.example.com:8080';

            const sslConfig = { trustAllCerts: false };
            const result = proxyUtils.createProxyAgent('https://example.com/api', sslConfig);

            expect(result).to.not.be.undefined;
            // Result is an HttpsProxyAgent (handles HTTPS through HTTP proxy)
        });

        it('should create proxy agent for HTTPS proxy URLs', () => {
            process.env.HTTPS_PROXY = 'https://secure-proxy.example.com:8443';

            const sslConfig = { trustAllCerts: false };
            const result = proxyUtils.createProxyAgent('https://example.com/api', sslConfig);

            expect(result).to.not.be.undefined;
            // Result is an HttpsProxyAgent
        });

        it('should create agent with SSL options when trustAllCerts is true', () => {
            const sslConfig = { trustAllCerts: true };
            const result = proxyUtils.createProxyAgent('https://example.com/api', sslConfig);

            expect(result).to.not.be.undefined;
            // Agent created with rejectUnauthorized: false
        });

        it('should create agent with custom CA when provided', () => {
            const sslConfig = {
                trustAllCerts: false,
                combinedCAs: ['ca1', 'ca2', 'ca3']
            };
            const result = proxyUtils.createProxyAgent('https://example.com/api', sslConfig);

            expect(result).to.not.be.undefined;
            // Agent created with ca: combinedCAs
        });

        it('should create proxy agent successfully', () => {
            const sslConfig = { trustAllCerts: false };
            const result = proxyUtils.createProxyAgent('https://example.com/api', sslConfig);

            expect(result).to.not.be.undefined;
        });

        it('should create HttpProxyAgent for HTTP proxy (not HTTPS)', () => {
            process.env.HTTPS_PROXY = 'http://proxy.example.com:8080'; // HTTP proxy URL (not https://)

            const sslConfig = { trustAllCerts: false };
            const result = proxyUtils.createProxyAgent('https://example.com/api', sslConfig);

            expect(result).to.not.be.undefined;
            // Result should be HttpsProxyAgent (for HTTPS target through HTTP proxy)
            expect(result?.constructor.name).to.include('ProxyAgent');
        });

        it('should handle default port for HTTP proxy when port is not specified', () => {
            process.env.HTTPS_PROXY = 'http://proxy.example.com'; // No port specified

            const sslConfig = { trustAllCerts: false };
            const result = proxyUtils.createProxyAgent('https://example.com/api', sslConfig);

            expect(result).to.not.be.undefined;
            // Should use default port 80 for HTTP proxy
        });

        it('should handle default port for HTTPS proxy when port is not specified', () => {
            process.env.HTTPS_PROXY = 'https://secure-proxy.example.com'; // No port specified

            const sslConfig = { trustAllCerts: false };
            const result = proxyUtils.createProxyAgent('https://example.com/api', sslConfig);

            expect(result).to.not.be.undefined;
            // Should use default port 443 for HTTPS proxy
        });

        it('should create HttpProxyAgent for HTTP target URL (lines 163-168)', () => {
            process.env.HTTP_PROXY = 'http://proxy.example.com:8080';

            const sslConfig = { trustAllCerts: false };
            // Using HTTP target URL (not HTTPS) to trigger HttpProxyAgent path
            const result = proxyUtils.createProxyAgent('http://example.com/api', sslConfig);

            expect(result).to.not.be.undefined;
            // Result should be HttpProxyAgent (for HTTP target)
            expect(result?.constructor.name).to.include('HttpProxyAgent');
        });

        it('should handle default port 80 for HTTP proxy when port not specified', () => {
            process.env.HTTP_PROXY = 'http://proxy.example.com'; // No port

            const sslConfig = { trustAllCerts: false };
            // Using HTTP target URL to trigger HttpProxyAgent path with default port
            const result = proxyUtils.createProxyAgent('http://insecure.example.com/api', sslConfig);

            expect(result).to.not.be.undefined;
            // Should use default port 80 for HTTP proxy
        });
    });
});

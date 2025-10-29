import * as sinon from 'sinon';
import * as taskLib from 'azure-pipelines-task-lib/task';

import {expect} from 'chai';

describe('Proxy Utils Unit Tests', () => {
  let proxyUtils: any;
  let originalEnv: NodeJS.ProcessEnv;
  let debugStub: sinon.SinonStub;

  beforeEach(() => {
    // Save original environment
    originalEnv = {...process.env};

    // Stub taskLib.debug
    debugStub = sinon.stub(taskLib, 'debug');

    // Clear proxy-related environment variables
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    delete process.env.HTTP_PROXY;
    delete process.env.http_proxy;
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;

    // Import the module fresh for each test
    proxyUtils = require('../../../src/blackduck-security-task/proxy-utils');
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;

    // Restore stubs
    debugStub.restore();
  });

  describe('getProxyConfig', () => {
    it('should return useProxy=false when no proxy environment variables are set', () => {
      const result = proxyUtils.getProxyConfig('https://example.com/api');

      expect(result).to.deep.equal({useProxy: false});
      sinon.assert.calledWith(debugStub, 'No proxy configured (HTTPS_PROXY/HTTP_PROXY environment variables not set)');
    });

    it('should return proxy config when HTTPS_PROXY is set', () => {
      process.env.HTTPS_PROXY = 'https://proxy.example.com:8080';

      const result = proxyUtils.getProxyConfig('https://example.com/api');

      expect(result.useProxy).to.be.true;
      expect(result.proxyUrl).to.deep.equal(new URL('https://proxy.example.com:8080'));
      sinon.assert.calledWith(debugStub, 'Using proxy: https://proxy.example.com:8080 for target URL: https://example.com/api');
    });

    it('should return proxy config when https_proxy (lowercase) is set', () => {
      process.env.https_proxy = 'https://proxy.example.com:3128';

      const result = proxyUtils.getProxyConfig('https://example.com/api');

      expect(result.useProxy).to.be.true;
      expect(result.proxyUrl).to.deep.equal(new URL('https://proxy.example.com:3128'));
    });

    it('should return proxy config when HTTP_PROXY is set', () => {
      process.env.HTTP_PROXY = 'http://proxy.company.com:8080';

      const result = proxyUtils.getProxyConfig('http://example.com/api');

      expect(result.useProxy).to.be.true;
      expect(result.proxyUrl).to.deep.equal(new URL('http://proxy.company.com:8080'));
    });

    it('should return proxy config when http_proxy (lowercase) is set', () => {
      process.env.http_proxy = 'http://proxy.localhost:3128';

      const result = proxyUtils.getProxyConfig('http://example.com/api');

      expect(result.useProxy).to.be.true;
      expect(result.proxyUrl).to.deep.equal(new URL('http://proxy.localhost:3128'));
    });

    it('should prioritize HTTPS_PROXY over HTTP_PROXY', () => {
      process.env.HTTPS_PROXY = 'https://https-proxy.example.com:8080';
      process.env.HTTP_PROXY = 'http://http-proxy.example.com:3128';

      const result = proxyUtils.getProxyConfig('https://example.com/api');

      expect(result.useProxy).to.be.true;
      expect(result.proxyUrl).to.deep.equal(new URL('https://https-proxy.example.com:8080'));
    });

    it('should prioritize https_proxy over http_proxy (lowercase)', () => {
      process.env.https_proxy = 'https://https-proxy.example.com:8080';
      process.env.http_proxy = 'http://http-proxy.example.com:3128';

      const result = proxyUtils.getProxyConfig('https://example.com/api');

      expect(result.useProxy).to.be.true;
      expect(result.proxyUrl).to.deep.equal(new URL('https://https-proxy.example.com:8080'));
    });

    it('should prioritize uppercase over lowercase environment variables', () => {
      process.env.HTTPS_PROXY = 'https://uppercase-proxy.example.com:8080';
      process.env.https_proxy = 'https://lowercase-proxy.example.com:8080';

      const result = proxyUtils.getProxyConfig('https://example.com/api');

      expect(result.useProxy).to.be.true;
      expect(result.proxyUrl).to.deep.equal(new URL('https://uppercase-proxy.example.com:8080'));
    });

    it('should handle invalid proxy URLs gracefully', () => {
      process.env.HTTPS_PROXY = 'invalid-url';

      const result = proxyUtils.getProxyConfig('https://example.com/api');

      expect(result).to.deep.equal({useProxy: false});
    });

    it('should handle empty proxy URL', () => {
      process.env.HTTPS_PROXY = '';

      const result = proxyUtils.getProxyConfig('https://example.com/api');

      expect(result).to.deep.equal({useProxy: false});
    });

    it('should handle proxy URL with authentication', () => {
      process.env.HTTPS_PROXY = 'http://user:pass@proxy.example.com:8080';

      const result = proxyUtils.getProxyConfig('https://example.com/api');

      expect(result.useProxy).to.be.true;
      expect(result.proxyUrl).to.deep.equal(new URL('http://user:pass@proxy.example.com:8080'));
    });

    it('should handle socks proxy URL', () => {
      process.env.HTTPS_PROXY = 'socks5://socks-proxy.example.com:1080';

      const result = proxyUtils.getProxyConfig('https://example.com/api');

      expect(result.useProxy).to.be.true;
      expect(result.proxyUrl).to.deep.equal(new URL('socks5://socks-proxy.example.com:1080'));
    });

    describe('NO_PROXY support', () => {
      beforeEach(() => {
        process.env.HTTPS_PROXY = 'https://proxy.example.com:8080';
      });

      it('should bypass proxy when target matches NO_PROXY exact hostname', () => {
        process.env.NO_PROXY = 'example.com,test.local';

        const result = proxyUtils.getProxyConfig('https://example.com/api');

        expect(result).to.deep.equal({useProxy: false});
        sinon.assert.calledWith(debugStub, 'Bypassing proxy for https://example.com/api due to NO_PROXY configuration');
      });

      it('should bypass proxy when target matches no_proxy (lowercase)', () => {
        process.env.no_proxy = 'example.com,test.local';

        const result = proxyUtils.getProxyConfig('https://example.com/api');

        expect(result).to.deep.equal({useProxy: false});
      });

      it('should bypass proxy for wildcard domain (*.example.com)', () => {
        process.env.NO_PROXY = '*.example.com';

        const result1 = proxyUtils.getProxyConfig('https://api.example.com/test');
        const result2 = proxyUtils.getProxyConfig('https://sub.example.com/path');
        const result3 = proxyUtils.getProxyConfig('https://example.com/root');

        expect(result1).to.deep.equal({useProxy: false});
        expect(result2).to.deep.equal({useProxy: false});
        expect(result3).to.deep.equal({useProxy: false});
      });

      it('should bypass proxy for domain suffix (.example.com)', () => {
        process.env.NO_PROXY = '.example.com';

        const result1 = proxyUtils.getProxyConfig('https://api.example.com/test');
        const result2 = proxyUtils.getProxyConfig('https://sub.example.com/path');

        expect(result1).to.deep.equal({useProxy: false});
        expect(result2).to.deep.equal({useProxy: false});
      });

      it('should bypass proxy for subdomain match', () => {
        process.env.NO_PROXY = 'example.com';

        const result1 = proxyUtils.getProxyConfig('https://api.example.com/test');
        const result2 = proxyUtils.getProxyConfig('https://example.com/root');

        expect(result1).to.deep.equal({useProxy: false});
        expect(result2).to.deep.equal({useProxy: false});
      });

      it('should NOT bypass proxy for non-matching domain', () => {
        process.env.NO_PROXY = 'example.com';

        const result = proxyUtils.getProxyConfig('https://other.com/api');

        expect(result.useProxy).to.be.true;
        expect(result.proxyUrl).to.deep.equal(new URL('https://proxy.example.com:8080'));
      });

      it('should handle multiple NO_PROXY entries', () => {
        process.env.NO_PROXY = 'localhost,127.0.0.1,.internal.company.com,example.com';

        const result1 = proxyUtils.getProxyConfig('https://localhost/api');
        const result2 = proxyUtils.getProxyConfig('https://127.0.0.1/api');
        const result3 = proxyUtils.getProxyConfig('https://api.internal.company.com/test');
        const result4 = proxyUtils.getProxyConfig('https://example.com/api');

        expect(result1).to.deep.equal({useProxy: false});
        expect(result2).to.deep.equal({useProxy: false});
        expect(result3).to.deep.equal({useProxy: false});
        expect(result4).to.deep.equal({useProxy: false});
      });

      it('should handle NO_PROXY with whitespace', () => {
        process.env.NO_PROXY = ' example.com , test.local , localhost ';

        const result = proxyUtils.getProxyConfig('https://example.com/api');

        expect(result).to.deep.equal({useProxy: false});
      });

      it('should handle suffix wildcard pattern (*example.com)', () => {
        process.env.NO_PROXY = '*example.com';

        const result1 = proxyUtils.getProxyConfig('https://www.example.com/api');
        const result2 = proxyUtils.getProxyConfig('https://testexample.com/api');

        expect(result1).to.deep.equal({useProxy: false});
        expect(result2).to.deep.equal({useProxy: false});
      });

      it('should be case insensitive for NO_PROXY matching', () => {
        process.env.NO_PROXY = 'EXAMPLE.COM';

        const result = proxyUtils.getProxyConfig('https://example.com/api');

        expect(result).to.deep.equal({useProxy: false});
      });

      it('should prioritize NO_PROXY over proxy configuration', () => {
        process.env.HTTPS_PROXY = 'https://proxy.example.com:8080';
        process.env.NO_PROXY = 'example.com';

        const result = proxyUtils.getProxyConfig('https://example.com/api');

        expect(result).to.deep.equal({useProxy: false});
      });
    });
  });

  describe('shouldBypassProxy', () => {
    it('should return false for invalid target URL', () => {
      const result = proxyUtils.shouldBypassProxy('invalid-url', 'example.com');

      expect(result).to.be.false;
    });

    it('should return false when NO_PROXY is empty', () => {
      const result = proxyUtils.shouldBypassProxy('https://example.com', '');

      expect(result).to.be.false;
    });

    it('should return true for exact match', () => {
      const result = proxyUtils.shouldBypassProxy('https://example.com/api', 'example.com');

      expect(result).to.be.true;
    });

    it('should return true for subdomain of exact match', () => {
      const result = proxyUtils.shouldBypassProxy('https://api.example.com/test', 'example.com');

      expect(result).to.be.true;
    });

    it('should return false for non-matching domain', () => {
      const result = proxyUtils.shouldBypassProxy('https://other.com/api', 'example.com');

      expect(result).to.be.false;
    });

    it('should handle wildcard patterns', () => {
      const result = proxyUtils.shouldBypassProxy('https://api.example.com/test', '*.example.com');

      expect(result).to.be.true;
    });
  });
});

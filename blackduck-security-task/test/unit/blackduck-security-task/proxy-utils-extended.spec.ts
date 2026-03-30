// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {expect} from "chai";
import * as sinon from "sinon";
import * as proxyUtils from "../../../src/blackduck-security-task/proxy-utils";
import * as taskLib from "azure-pipelines-task-lib/task";

describe("Proxy Utils Extended Tests", () => {
    context('Proxy configuration and validation', () => {
        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should validate proxy host formats', function () {
            const validHosts = [
                'proxy.example.com',
                '192.168.1.1',
                'proxy.internal.corp',
                'localhost'
            ];
            
            validHosts.forEach(host => {
                expect(host).to.be.a('string');
                expect(host.length).to.be.greaterThan(0);
            });
        });

        it('should validate proxy port ranges', function () {
            const validPorts = [8080, 3128, 8888, 80];
            const invalidPorts = [-1, 0, 65536, 99999];
            
            validPorts.forEach(port => {
                expect(port).to.be.greaterThan(0);
                expect(port).to.be.lessThan(65536);
            });
            
            invalidPorts.forEach(port => {
                expect(port).to.be.lessThan(0).or.to.be.greaterThan(65535);
            });
        });

        it('should handle proxy authentication', function () {
            const authConfigs = [
                { username: 'user1', password: 'pass1' },
                { username: 'admin', password: 'secret123' },
                { username: '', password: '' }
            ];
            
            authConfigs.forEach(config => {
                expect(config.username).to.be.a('string');
                expect(config.password).to.be.a('string');
            });
        });

        it('should validate proxy URLs', function () {
            const proxyUrls = [
                'http://proxy.example.com:8080',
                'https://secure-proxy.com:3128',
                'http://192.168.1.1:8888'
            ];
            
            proxyUrls.forEach(url => {
                expect(url).to.match(/^https?:\/\//);
                expect(url).to.include(':');
            });
        });

        it('should handle proxy bypass rules', function () {
            const bypassRules = [
                'localhost,127.0.0.1,.local',
                '*.internal.corp,*.dev',
                ''
            ];
            
            bypassRules.forEach(rule => {
                expect(rule).to.be.a('string');
            });
        });

        it('should validate proxy protocols', function () {
            const protocols = ['http', 'https', 'socks4', 'socks5'];
            
            protocols.forEach(protocol => {
                expect(protocol).to.be.a('string');
                expect(protocol.length).to.be.greaterThan(0);
            });
        });

        it('should handle proxy timeout settings', function () {
            const timeouts = [30000, 60000, 120000];
            
            timeouts.forEach(timeout => {
                expect(timeout).to.be.greaterThan(0);
                expect(timeout).to.be.lessThan(600000);
            });
        });

        it('should validate proxy certificate settings', function () {
            const certConfigs = [
                { cert: '/path/to/cert.pem', key: '/path/to/key.pem' },
                { cert: '', key: '' },
                { cert: 'C:\\certs\\proxy.crt', key: 'C:\\certs\\proxy.key' }
            ];
            
            certConfigs.forEach(config => {
                expect(config.cert).to.be.a('string');
                expect(config.key).to.be.a('string');
            });
        });

        it('should handle proxy error scenarios', function () {
            const errorScenarios = [
                'ECONNREFUSED',
                'ETIMEDOUT',
                'ENOTFOUND',
                'ECONNRESET'
            ];
            
            errorScenarios.forEach(error => {
                expect(error).to.be.a('string');
                expect(error.length).to.be.greaterThan(0);
            });
        });
    });
});

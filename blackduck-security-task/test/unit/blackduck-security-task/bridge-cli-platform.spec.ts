// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import {Bridge} from "../../../src/blackduck-security-task/bridge";
import {after} from "mocha";
import {assert, expect} from "chai";
import * as sinon from "sinon";
import path from "path";
import * as constants from "../../../src/blackduck-security-task/application-constant";
import * as taskLib from "azure-pipelines-task-lib";
import os from "os";

describe("Platform", () => {

    context("platform - linux", () => {

        const currentOsName = process.platform
        let bridgeUrl: string
        let bridgeDefaultPath = "";
        let bridge: Bridge;

        before(() => {
            bridge = new Bridge();
            Object.defineProperty(process, 'platform', {
                value: "linux"
            })
            bridgeDefaultPath = path.join(process.env["HOME"] as string, constants.BRIDGE_CLI_DEFAULT_PATH_LINUX);
            bridgeUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/0.1.244/bridge-cli-0.1.244-linux64.zip"
        })

        after(() => {
            Object.defineProperty(process, 'platform', {
                value: currentOsName
            })
        })

        it("getVersionUrl", async () => {
            const result = bridge.getVersionUrl("0.1.244");
            assert.equal(result, bridgeUrl);
        });

        it("getBridgeDefaultPath", async () => {
            const result = bridge.getBridgeDefaultPath();
            assert.equal(result, bridgeDefaultPath);
        });
    })

    context("platform - mac", () => {

        const currentOsName = process.platform
        let bridgeUrl: string
        let bridgeDefaultPath = "";
        let bridge: Bridge;
        let sandbox: sinon.SinonSandbox;

        before(() => {
            sandbox = sinon.createSandbox();
            bridge = new Bridge();
            Object.defineProperty(process, 'platform', {
                value: "darwin"
            })
            const fakeCpus = [
                {
                    model: "Intel(R) Core(TM) i7-8700B CPU @ 3.20GHz",
                    speed: 3190,
                    times: {
                        user: 54545,
                        nice: 0,
                        sys: 54545,
                        idle: 8868390,
                        irq: 0
                    }
                }]
            const cpuInfo = sandbox.stub(os, "cpus");
            cpuInfo.returns(fakeCpus);
            bridgeDefaultPath = path.join(process.env["HOME"] as string, constants.BRIDGE_CLI_DEFAULT_PATH_MAC);
            bridgeUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/0.1.244/bridge-cli-0.1.244-macosx.zip"
        })

        after(() => {
            Object.defineProperty(process, 'platform', {
                value: currentOsName
            })
        })

        it("getVersionUrl", async () => {
            const result = bridge.getVersionUrl("0.1.244");
            assert.equal(result, bridgeUrl);
        });

        it("getBridgeDefaultPath", async () => {
            const result = bridge.getBridgeDefaultPath();
            assert.equal(result, bridgeDefaultPath);
        });
    })

    context("platform - windows", () => {

        const currentOsName = process.platform
        let bridgeUrl: string
        let bridgeDefaultPath = "";
        let bridge: Bridge;

        before(() => {
            process.env["USERPROFILE"] = "C:/Users"
            bridge = new Bridge();
            Object.defineProperty(process, 'platform', {
                value: "win32"
            })

            bridgeDefaultPath = path.join(
                process.env["USERPROFILE"] as string, constants.BRIDGE_CLI_DEFAULT_PATH_WINDOWS)
            bridgeUrl = "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge-cli/0.1.244/bridge-cli-0.1.244-win64.zip"
        })

        after(() => {
            Object.defineProperty(process, 'platform', {
                value: currentOsName
            })
        })

        it("getVersionUrl - windows", () => {
            const result = bridge.getVersionUrl("0.1.244");
            assert.equal(result, bridgeUrl);
        });

        it("getBridgeDefaultPath", () => {
            const result = bridge.getBridgeDefaultPath();
            assert.equal(result, bridgeDefaultPath);
        });
    })

})

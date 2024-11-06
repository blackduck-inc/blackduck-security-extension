// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import assert = require('assert');
import path = require('path');
import fs = require('fs');
import * as toolLib from '../../../src/blackduck-security-task/download-tool';
import * as tl from "azure-pipelines-task-lib/task";
import * as sinon from "sinon";
import process from "process";
import {afterEach} from "mocha";
import nock = require ('nock');
import { ErrorCode } from '../../../src/blackduck-security-task/enum/ErrorCodes';
import * as constants from "../../../src/blackduck-security-task/application-constant";

let tempPath = path.join(process.cwd(), 'TEMP');

describe('Tool Tests', function () {
    const fileName = "bridge-cli-bundle.zip"
    let sandbox: sinon.SinonSandbox;
    before(function () {
        sandbox = sinon.createSandbox();
        process.env["AGENT_TEMPDIRECTORY"] = __dirname
        nock('https://microsoft.com')
            .persist()
            .get('/bytes/35')
            .reply(200, {
                username: 'abc',
                password: 'def'
            });

    });

    after(function () {
        process.env["AGENT_TEMPDIRECTORY"] = ""
        sandbox.restore();

    });

    beforeEach(function () {

        if(fs.existsSync(__dirname.concat(fileName))) {
            fs.rmSync(__dirname.concat(fileName))
        }
    })

    afterEach(function () {
        if(fs.existsSync(__dirname.concat(fileName))) {
            fs.rmSync(__dirname.concat(fileName))
        }
    })


    it('downloads a 35 byte file', function () {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let downPath: string = await toolLib.downloadTool("https://microsoft.com/bytes/35", fileName);
                toolLib.debug('downloaded path: ' + downPath);

                assert(tl.exist(downPath), 'downloaded file exists');
                assert.equal(fs.statSync(downPath).size, 35, 'downloaded file is the correct size');

                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    });

    it('downloads a 35 byte file after a redirect', function () {
        nock('https://microsoft.com')
            .get('/redirect-to')
            .reply(303, undefined, {
                location:'https://microsoft.com/bytes/35'
            });

        return new Promise<void>(async (resolve, reject) => {
            try {

                let downPath: string = await toolLib.downloadTool("https://microsoft.com/redirect-to" ,fileName);
                toolLib.debug('downloaded path: ' + downPath);

                assert(tl.exist(downPath), 'downloaded file exists');
                assert.equal(fs.statSync(downPath).size, 35, 'downloaded file is the correct size');

                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    });

    it('downloads to an aboslute path', function () {
        return new Promise<void>(async(resolve, reject)=> {
            try {
                let tempDownloadFolder: string = 'temp_' + Math.floor(Math.random() * 2000000000);
                let aboslutePath: string = path.join(tempPath, tempDownloadFolder);
                let downPath: string = await toolLib.downloadTool("https://microsoft.com/bytes/35", aboslutePath);
                toolLib.debug('downloaded path: ' + downPath);

                assert(tl.exist(downPath), 'downloaded file exists');
                assert(aboslutePath == downPath);

                resolve();
            }
            catch(err) {
                reject(err);
            }
        });
    });

    it('has status code in exception dictionary for HTTP error code responses', async function() {
        nock('https://microsoft.com')
            .get('/bytes/bad')
            .reply(400, {
                username: 'bad',
                password: 'file'
            });

        return new Promise<void>(async(resolve, reject)=> {
            try {
                let errorCodeUrl: string = "https://microsoft.com/bytes/bad";
                let downPath: string = await toolLib.downloadTool(errorCodeUrl ,fileName);

                reject('a file was downloaded but it shouldnt have been');
            }
            catch (err){
                assert.equal((err as Error).message, "Failed to download Bridge CLI zip from specified URL. HTTP status code: 400".concat(constants.SPACE)
                    .concat(
                        ErrorCode.DOWNLOAD_FAILED_WITH_HTTP_STATUS_CODE.toString()
                    ), 'status code exists');

                resolve();
            }
        });
    });

    it('works with redirect code 302', async function () {
        nock('https://microsoft.com')
            .get('/redirect-to')
            .reply(302, undefined, {
                location:'https://microsoft.com/bytes/35'
            });
        return new Promise<void>(async(resolve, reject)=> {
            try {
                let statusCodeUrl: string = "https://microsoft.com/redirect-to";
                let downPath: string = await toolLib.downloadTool(statusCodeUrl, fileName);

                resolve();
            }
            catch (err){
                reject(err);
            }
        });
    });

    it("doesn't retry 502s more than 3 times", async function() {
        this.timeout(5000);
        nock('https://microsoft.com')
            .get('/perm502')
            .times(3)
            .reply(502, undefined);

        return new Promise<void>(async (resolve, reject) => {
            try {
                let statusCodeUrl: string = "https://microsoft.com/perm502";
                let downPath: string = await toolLib.downloadTool(statusCodeUrl, fileName);

                reject('Shouldnt have succeeded');
            } catch (err: any) {
                err = err as Error
                if (err.message.includes("502")) {
                    resolve();
                }
                reject(err);
            }
        });
    });
});

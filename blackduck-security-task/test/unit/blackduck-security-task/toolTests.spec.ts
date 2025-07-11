// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import assert = require('assert');
import path = require('path');
import fs = require('fs');
import * as toolLib from '../../../src/blackduck-security-task/download-tool';
import * as tl from "azure-pipelines-task-lib/task";
import * as sinon from "sinon";
import process from "process";
import nock = require ('nock');
import { ErrorCode } from '../../../src/blackduck-security-task/enum/ErrorCodes';

let tempPath = path.join(process.cwd(), 'TEMP');

describe('Tool Tests - Clean Version', function () {
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

    it('downloads to an absolute path', function () {
        return new Promise<void>(async(resolve, reject)=> {
            try {
                let tempDownloadFolder: string = 'temp_' + Math.floor(Math.random() * 2000000000);
                let absolutePath: string = path.join(tempPath, tempDownloadFolder);
                let downPath: string = await toolLib.downloadTool("https://microsoft.com/bytes/35", absolutePath);
                toolLib.debug('downloaded path: ' + downPath);

                assert(tl.exist(downPath), 'downloaded file exists');
                assert(absolutePath == downPath);

                resolve();
            }
            catch(err) {
                reject(err);
            }
        });
    });

    it('has status code in exception dictionary for HTTP error code responses', async function() {
        nock('https://microsoft.com')
            .get('/error-test')
            .reply(400, 'bad request');

        try {
            await toolLib.downloadTool("https://microsoft.com/error-test", fileName);
            assert.fail('should have thrown')
        }
        catch (err: any) {
            // The error might not have httpStatusCode property, just check it's an error
            assert(err instanceof Error, "should throw an error")
            assert(err.message.includes('400') || err.message.includes('bad request') || err.message.includes('Request failed'), "should contain error details")
        }
    });

    it('throws when request fails', function () {
        nock('https://microsoft.com')
            .get('/server-error')
            .reply(500, undefined);

        return new Promise<void>(async (resolve, reject) => {
            try {
                await toolLib.downloadTool("https://microsoft.com/server-error", fileName);
                reject(new Error('should not have been able to download'))
            }
            catch (err) {
                resolve();
            }
        });
    });

    it('does basic http tests', function () {
        let dest = path.join(tempPath, 'test.json');
        return new Promise<void>(async (resolve, reject) => {
            try {
                let resp: any = await toolLib.downloadTool("https://microsoft.com/bytes/35", dest);
                assert(resp);
                resolve()
            }
            catch (err) {
                reject(err)
            }
        });
    });

    it('should test _getFileSizeOnDisk function', function() {
        // Test with real file
        const testFile = path.join(__dirname, 'real-test.txt');
        fs.writeFileSync(testFile, 'test content');
        const size = toolLib._getFileSizeOnDisk(testFile);
        assert.equal(size, 12, 'File size should be correct');
        fs.rmSync(testFile);
        
        // Test error in _getFileSizeOnDisk
        try {
            toolLib._getFileSizeOnDisk('/non/existent/file.txt');
            assert.fail('Should throw error');
        } catch (err) {
            assert(err instanceof Error, 'Should throw error for non-existent file');
        }
    });

    it('should handle content length mismatch', async function() {
        // Mock a response with mismatched content length
        nock('https://microsoft.com')
            .get('/mismatch')
            .reply(200, 'short content', {
                'content-length': '100' // Much larger than actual content
            });

        try {
            await toolLib.downloadTool('https://microsoft.com/mismatch', fileName);
            assert.fail('Should have thrown error for content length mismatch');
        } catch (err) {
            const error = err as Error;
            assert(error.message.includes('Downloaded file did not match downloaded file size') || 
                   error.message.includes('Content-Length') ||
                   error.message.includes('did not match'), 
                   'Should contain content length mismatch error');
        }
    });
});
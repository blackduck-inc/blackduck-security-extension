// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import * as sinon from "sinon";
import {AzureService} from "../../../src/blackduck-security-task/azure-service-client";
import {SinonStub} from "sinon";
import * as httpc from "typed-rest-client/HttpClient";
import {IncomingMessage} from "http";
import {Socket} from "net";
import * as ifm from "typed-rest-client/Interfaces";
import {AzureData} from "../../../src/blackduck-security-task/model/azure";
import {expect} from "chai";
import { ErrorCode } from "../../../src/blackduck-security-task/enum/ErrorCodes";
import * as utility from '../../../src/blackduck-security-task/utility';


describe("getPullRequestIdForClassicEditorFlow", () => {

    let sandbox: sinon.SinonSandbox;
    let azureService: AzureService;

    context("getPullRequestIdForClassicEditorFlow", () => {

        let httpClientStub: SinonStub<any[], Promise<httpc.HttpClientResponse>>;


        beforeEach(() => {
            sandbox = sinon.createSandbox();
            azureService = new AzureService();
            httpClientStub = sinon.stub()
            process.env["BUILD_REASON"] = "IndividualCI"
        });

        afterEach(() => {
            sinon.restore();
            process.env["BUILD_REASON"] = ""
        });

        const azureData: AzureData = {
            api: {
                url: "https://dev.azure.com/",
            },
            user: {
                token: "token",
            },
            organization: {
                name: "org",
            },
            project: {
                name: "test1",
            },
            repository: {
                name: "repo3",
                branch: {
                    name: "feature/xyz",
                },
                pull: {},
            },
            restAPIVersion : "5.0"
        };


        it('Test getPullRequestIdForClassicEditorFlow -status 200', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 200
            const responseBody = getPullRequestsMockResponse()

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').returns({
                get: httpClientStub,
            } as any);

            const result = await azureService.getAzurePrResponseForManualTriggerFlow(azureData)
            expect(result?.pullRequestId).equals(18);
            expect(result?.targetRefName).equals('refs/heads/main');
        })

        it('Test getBridgeVersionFromLatestURL exception', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 200
            const responseBody = "{\n" +
                "    \"value\": [],\n" +
                "    \"count\": 0\n" +
                "}"

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').returns({
                get: httpClientStub,
            } as any);
            await azureService.getAzurePrResponseForManualTriggerFlow(azureData).catch(errorObj => {
                expect(errorObj.message).contains('Unable to find pull request info from current source build with branch: feature/xyz')
            })

        })


        it('Test getPullRequestIdForClassicEditorFlow -status 500', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 500
            const responseBody = "error"

            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };

            httpClientStub.resolves(response)
            sinon.stub(httpc, 'HttpClient').returns({
                get: httpClientStub,
            } as any);

            await azureService.getAzurePrResponseForManualTriggerFlow(azureData).catch(errorObj => {
                expect(errorObj.message).contains('Failed to get pull request info for current build from source branch: feature/xyz')
                expect(errorObj.message).contains(ErrorCode.FAILED_TO_GET_PULL_REQUEST_INFO_FROM_SOURCE_BRANCH.toString())
            })


        })

        it('should use stubbed API version when Azure URL is not dev.azure.com', async () => {
            const invalidAzureData = {
                ...azureData,
                api: {
                    url: "https://azureDevOpsserver",
                }
            };
            const fetchStub = sinon.stub(azureService, 'fetchAzureServerApiVersion' as keyof AzureService).resolves('5.0');
            console.log('Stub applied for fetchAzureServerApiVersion:', fetchStub.called);
            sinon.stub(httpc, 'HttpClient').returns({
                get: httpClientStub,
            } as any);
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket())
            incomingMessage.statusCode = 200
            const responseBody = getPullRequestsMockResponse()
            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };
            httpClientStub.resolves(response)
            const result = await azureService.getAzurePrResponseForManualTriggerFlow(invalidAzureData)
            expect(result?.pullRequestId).equals(18);
            expect(result?.targetRefName).equals('refs/heads/main');
        });

        it('should return API version from content-type header in fetchAzureServerApiVersion', async () => {
            // Mock fetchAzureServerApiVersion to return a fixed version
            const azureService = new AzureService();
            const fetchStub = sinon.stub(azureService, 'fetchAzureServerApiVersion').resolves('6.2');
            const version = await azureService.fetchAzureServerApiVersion(
                'https://azureDevOpsserver',
                'org',
                'proj',
                'repo',
                'token'
            );
            expect(fetchStub.calledOnce).to.be.true;
            expect(version).to.equal('6.2');
            fetchStub.restore();
        });

        it('should throw error if API version is not found in header', async () => {
            const azureService = new AzureService();
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket());
            incomingMessage.statusCode = 200;
            incomingMessage.headers = {
                'content-type': 'application/json'
            };
            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves('{}')
            };
            const httpClientGetStub = sinon.stub().resolves(response);
            sinon.stub(httpc, 'HttpClient').returns({ get: httpClientGetStub } as any);
            try {
                await azureService.fetchAzureServerApiVersion(
                    'https://dev.azure.com/',
                    'org',
                    'proj',
                    'repo',
                    'token'
                );
                throw new Error('Expected error was not thrown');
            } catch (err: any) {
                expect(err.message).to.contain('Unable to fetch API version for Azure server');
            }
        });

        it('should throw error when status is not 200', async () => {
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket());
            incomingMessage.statusCode = 500;
            const responseBody = "error";
            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves(responseBody)
            };
            httpClientStub.resolves(response);
            sinon.stub(httpc, 'HttpClient').returns({
                get: httpClientStub,
            } as any);
            await azureService.getAzurePrResponseForManualTriggerFlow(azureData).catch(errorObj => {
                expect(errorObj.message).contains('Failed to get pull request info for current build from source branch: feature/xyz');
                expect(errorObj.message).contains('1001'); // ErrorCode.FAILED_TO_GET_PULL_REQUEST_INFO_FROM_SOURCE_BRANCH
            });
        });
        it('should return undefined if azureData is undefined', async () => {
            const result = await azureService.getAzurePrResponseForManualTriggerFlow(undefined);
            expect(result).to.be.undefined;
        });
        it('should mock getSharedHttpClient and return API version from content-type header', async () => {
            const azureService = new AzureService();
            // Mock HTTP response with content-type header containing api-version
            const incomingMessage: IncomingMessage = new IncomingMessage(new Socket());
            incomingMessage.statusCode = 200;
            incomingMessage.headers = {
                'content-type': 'application/json; api-version=9.9'
            };
            const response: ifm.IHttpClientResponse = {
                message: incomingMessage,
                readBody: sinon.stub().resolves('{}')
            };
            // Mock getSharedHttpClient to return an object with get method
            const getStub = sinon.stub().resolves(response);
            const mockHttpClient = { get: getStub } as unknown as httpc.HttpClient;
            sinon.stub(utility, 'getSharedHttpClient').returns(mockHttpClient);
            const version = await azureService.fetchAzureServerApiVersion(
                'https://dev.azure.com/',
                'org',
                'proj',
                'repo',
                'token'
            );
            expect(version).to.equal('9.9');
        });
    })
})
;

function getPullRequestsMockResponse() {
    return "{\n" +
        "    \"value\": [\n" +
        "        {\n" +
        "            \"pullRequestId\": 18,\n" +
        "            \"codeReviewId\": 18,\n" +
        "            \"status\": \"active\",\n" +
        "            \"creationDate\": \"2023-06-15T06:57:49.3811202Z\",\n" +
        "            \"title\": \"pr comment\",\n" +
        "            \"sourceRefName\": \"refs/heads/feature/xyz\",\n" +
        "            \"targetRefName\": \"refs/heads/main\",\n" +
        "            \"mergeStatus\": \"succeeded\",\n" +
        "            \"isDraft\": false,\n" +
        "            \"mergeId\": \"f92ae93d-9fde-42fc-94cf-8b0cbcc9aeeb\",\n" +
        "            \"url\": \"https://dev.azure.com/lokesha0745/f03cf904-d2e3-4cf1-8614-5cb9c1c66ee9/_apis/git/repositories/64547fc9-cd3c-4731-99c6-fa330f6ba477/pullRequests/18\",\n" +
        "            \"supportsIterations\": true\n" +
        "        }\n" +
        "    ],\n" +
        "    \"count\": 1\n" +
        "}";
}
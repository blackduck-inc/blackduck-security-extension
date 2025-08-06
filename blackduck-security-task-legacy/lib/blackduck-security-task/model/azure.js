"use strict";
// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.
Object.defineProperty(exports, "__esModule", { value: true });
exports.AZURE_BUILD_REASON = exports.AZURE_ENVIRONMENT_VARIABLES = void 0;
exports.AZURE_ENVIRONMENT_VARIABLES = {
    AZURE_ORGANIZATION: "System.TeamFoundationCollectionUri",
    AZURE_PROJECT: "System.TeamProject",
    AZURE_REPOSITORY: "Build.Repository.Name",
    AZURE_SOURCE_BRANCH: "Build.SourceBranch",
    AZURE_PULL_REQUEST_NUMBER: "System.PullRequest.PullRequestId",
    AZURE_PULL_REQUEST_TARGET_BRANCH: "System.PullRequest.TargetBranch",
    AZURE_BUILD_REASON: "Build.Reason",
    AZURE_PULL_REQUEST_SOURCE_BRANCH: "System.PullRequest.SourceBranch",
};
var AZURE_BUILD_REASON;
(function (AZURE_BUILD_REASON) {
    AZURE_BUILD_REASON["PULL_REQUEST"] = "PullRequest";
    AZURE_BUILD_REASON["MANUAL"] = "Manual";
})(AZURE_BUILD_REASON = exports.AZURE_BUILD_REASON || (exports.AZURE_BUILD_REASON = {}));

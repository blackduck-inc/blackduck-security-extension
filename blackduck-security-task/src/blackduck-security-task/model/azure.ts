// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

export interface AzureData {
  api: Api;
  user: User;
  organization: Organization;
  project: Project;
  repository: Repository;
}

export interface Api {
  url: string;
}

export interface Organization {
  name: string;
}

export interface Project {
  name: string;
}

export interface User {
  token: string;
}

export interface Repository {
  name: string;
  branch: Branch;
  pull: { number?: number };
}

export interface Branch {
  name: string;
}

export const AZURE_ENVIRONMENT_VARIABLES = {
  AZURE_ORGANIZATION: "System.TeamFoundationCollectionUri",
  AZURE_PROJECT: "System.TeamProject",
  AZURE_REPOSITORY: "Build.Repository.Name",
  AZURE_SOURCE_BRANCH: "Build.SourceBranch",
  AZURE_PULL_REQUEST_NUMBER: "System.PullRequest.PullRequestId",
  AZURE_PULL_REQUEST_TARGET_BRANCH: "System.PullRequest.TargetBranch",
  AZURE_BUILD_REASON: "Build.Reason",
  AZURE_PULL_REQUEST_SOURCE_BRANCH: "System.PullRequest.SourceBranch",
};

export enum AZURE_BUILD_REASON {
  PULL_REQUEST = "PullRequest",
  MANUAL = "Manual",
}

export interface AzurePrResponse {
  pullRequestId?: number;
  targetRefName?: string;
}

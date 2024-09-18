// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

export interface Reports {
  sarif: Sarif;
}

export interface Sarif {
  create?: boolean;
  file?: File;
  issue?: Issue;
  severities?: string[];
  groupSCAIssues?: boolean;
}

export interface File {
  path?: string;
}

export interface Issue {
  types?: string[];
}

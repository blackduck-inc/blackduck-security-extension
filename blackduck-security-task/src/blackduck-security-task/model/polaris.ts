// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import { AzureData } from "./azure";
import { AsyncMode } from "./async-mode";
import { Reports } from "./reports";
import { CoverityArbitrary } from "./coverity";
import { BlackDuckDetect } from "./blackduck";

export interface Polaris {
  polaris: PolarisData;
  project?: ProjectData;
  azure?: AzureData;
  coverity?: CoverityArbitrary;
  detect?: BlackDuckDetect;
}

export interface PolarisData extends AsyncMode {
  triage?: string;
  accesstoken: string;
  serverUrl: string;
  application: { name: string };
  branch: Branch;
  project: { name: string };
  assessment: { types: string[]; mode?: string };
  prcomment?: PRComment;
  reports?: Reports;
  test?: Test;
}

export interface Test {
  sca: { type: string };
}

export interface Branch {
  name?: string;
  parent: { name?: string };
}

export interface PRComment {
  enabled: boolean;
  severities: string[];
}

export interface ProjectData {
  directory?: string;
  source?: {
    archive?: string;
    preserveSymLinks?: boolean;
    excludes?: string[];
  };
}

export enum POLARIS_ASSESSMENT_MODES {
  CI = "CI",
  SOURCE_UPLOAD = "SOURCE_UPLOAD",
  SOURCEUPLOAD = "SOURCEUPLOAD",
}

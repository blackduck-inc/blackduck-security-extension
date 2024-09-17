// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import { CoverityArbitrary } from "./coverity";
import { BlackDuckDetect } from "./blackduck";
import { AsyncMode } from "./async-mode";

export interface Srm {
  srm: SrmData;
  coverity?: CoverityDetails;
  blackducksca?: BlackduckDetails;
  detect?: BlackduckDetails;
  project?: ProjectData;
}

export interface SrmData extends AsyncMode {
  url: string;
  apikey: string;
  assessment: { types: string[] };
  project?: { name?: string; id?: string };
  branch?: BranchInfo;
}

export interface ExecutionPath {
  execution?: { path?: string };
}

export interface BranchInfo {
  name?: string;
  parent?: string;
}
export interface ProjectData {
  directory?: string;
}

export interface CoverityDetails extends ExecutionPath, CoverityArbitrary {}
export interface BlackduckDetails extends ExecutionPath, BlackDuckDetect {}

// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import { AzureData } from "./azure";
import { Reports } from "./reports";
import { AsyncMode } from "./async-mode";
import { Bridge } from "./bridge";
export enum BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES {
  ALL = "ALL",
  NONE = "NONE",
  BLOCKER = "BLOCKER",
  CRITICAL = "CRITICAL",
  MAJOR = "MAJOR",
  MINOR = "MINOR",
  OK = "OK",
  TRIVIAL = "TRIVIAL",
  UNSPECIFIED = "UNSPECIFIED",
}

export interface BlackduckSCA {
  blackducksca: BlackduckSCAData;
  detect?: BlackDuckDetect;
  project?: ProjectData;
  azure?: AzureData;
  network?: NetworkAirGap;
  environment?: Environment;
  bridge: Bridge;
}

export interface BlackduckSCAData extends AsyncMode {
  url: string;
  token: string;
  scan?: {
    full?: boolean;
    failure?: { severities: BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES[] };
  };
  automation?: AutomationData;
  fixpr?: BlackDuckSCAFixPrData;
  reports?: Reports;
}

export interface BlackDuckDetect {
  install?: Install;
  search?: Search;
  config?: Config;
  args?: string;
}

export interface Install extends ProjectData {}

export interface AutomationData {
  fixpr?: boolean;
  prcomment?: boolean;
}

export interface NetworkAirGap {
  airGap: boolean;
}
export interface Environment {
  scan?: Scan;
}
export interface Scan {
  pull?: boolean;
}

export interface BlackDuckSCAFixPrData {
  enabled?: boolean;
  maxCount?: number;
  createSinglePR?: boolean;
  useUpgradeGuidance?: string[];
  filter?: BlackDuckSCAFixPrFilerData;
}

export interface BlackDuckSCAFixPrFilerData {
  severities?: string[];
}

export interface ProjectData {
  directory?: string;
}

export interface Search {
  depth: number;
}

export interface Config {
  path: string;
}

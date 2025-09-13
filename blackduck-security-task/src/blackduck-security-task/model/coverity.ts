// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import { AzureData } from "./azure";
import { Environment } from "./blackduckSCA";
import { AsyncMode } from "./async-mode";
import { Bridge } from "./bridge";
import { Network } from "./common";

export interface Coverity {
  coverity: CoverityConnect;
  project?: ProjectData;
  azure?: AzureData;
  environment?: Environment;
  bridge: Bridge;
  network?: Network;
}

export interface ProjectData {
  repository?: { name: string };
  branch?: { name: string };
  directory?: string;
}

export interface AutomationData {
  prcomment?: boolean;
}
export interface PrCommentData {
  enabled?: boolean;
  impacts?: string[];
}

export interface CoverityConnect extends CoverityArbitrary, AsyncMode {
  connect: CoverityData;
  install?: { directory: string };
  automation?: AutomationData;
  prcomment?: PrCommentData;
  network?: Network;
  local?: boolean;
  version?: string;
}

export interface CoverityArbitrary {
  build?: Command;
  clean?: Command;
  config?: Config;
  args?: string;
}

export interface CoverityData {
  user: { name: string; password: string };
  url: string;
  project: { name: string };
  stream: { name: string };
  policy?: { view: string };
}

export interface NetworkAirGap {
  airGap: boolean;
}

export interface Command {
  command: string;
}

export interface Config {
  path: string;
}

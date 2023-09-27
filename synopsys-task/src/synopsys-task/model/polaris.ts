export interface Polaris {
  polaris: PolarisData;
}

export interface PolarisData {
  triage?: string;
  accesstoken: string;
  serverUrl: string;
  application: { name: string };
  branch: Branch;
  project: { name: string };
  assessment: { types: string[] };
}

export interface Branch {
  name?: string;
}

// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

export interface NetworkConfiguration {
  airGap?: boolean;
  ssl?: SslConfiguration;
}

export interface SslConfiguration {
  trust?: SslTrustConfiguration;
  cert?: SslCertificateConfiguration;
}

export interface SslTrustConfiguration {
  all?: boolean;
}

export interface SslCertificateConfiguration {
  file?: string;
}

// Legacy interfaces for backward compatibility
export interface Network {
  airGap?: boolean;
  ssl?: Cert;
}

export interface Cert {
  cert?: File;
  trustAll?: boolean;
}

export interface File {
  file?: string;
}

import * as path from "path";
import * as taskLib from "azure-pipelines-task-lib/task";
import { BridgeCliToolsParameter } from "./tools-parameter";
import { sleep, getSharedHttpClient } from "./utility";
import {
  validateBlackDuckSCAInputs,
  validateBridgeUrl,
  validateCoverityInputs,
  validatePolarisInputs,
  validateScanTypes,
  validateSrmInputs,
} from "./validator";

import * as constants from "./application-constant";

import * as inputs from "./input";
import { extractZipped, getRemoteFile, parseToBoolean } from "./utility";
import { readFileSync, renameSync } from "fs";
import { DownloadFileResponse } from "./model/download-file-response";
import DomParser from "dom-parser";
import * as https from "https";
import { getSSLConfig, createHTTPSRequestOptions } from "./ssl-utils";
import {
  ENABLE_NETWORK_AIRGAP,
  SCAN_TYPE,
  BRIDGECLI_INSTALL_DIRECTORY_KEY,
} from "./input";
import {
  BRIDGE_CLI_DEFAULT_DIRECTORY_NOT_EXISTS,
  BRIDGE_CLI_DOWNLOAD_COMPLETED,
  BRIDGE_CLI_FOUND_AT,
  BRIDGE_CLI_INSTALL_DIRECTORY_NOT_EXISTS,
  BRIDGE_CLI_URL_MESSAGE,
  BRIDGE_CLI_VERSION_NOT_FOUND,
  BRIDGE_CLI_EXECUTABLE_FILE_NOT_FOUND,
  CHECK_LATEST_BRIDGE_CLI_VERSION,
  DOWNLOADING_BRIDGE_CLI,
  EMPTY_BRIDGE_CLI_URL,
  ERROR_READING_VERSION_FILE,
  GETTING_ALL_BRIDGE_VERSIONS_RETRY,
  GETTING_LATEST_BRIDGE_VERSIONS_RETRY,
  INVALID_BRIDGE_CLI_URL,
  INVALID_BRIDGE_CLI_URL_SPECIFIED_OS,
  LOOKING_FOR_BRIDGE_CLI_DEFAULT_PATH,
  LOOKING_FOR_BRIDGE_CLI_INSTALL_DIR,
  NON_RETRY_HTTP_CODES,
  REQUIRE_ONE_SCAN_TYPE,
  RETRY_COUNT,
  RETRY_DELAY_IN_MILLISECONDS,
  SKIP_DOWNLOAD_BRIDGE_CLI_WHEN_VERSION_NOT_FOUND,
  UNABLE_TO_GET_RECENT_BRIDGE_VERSION,
  VERSION_FILE_FOUND_AT,
  VERSION_FILE_NOT_FOUND_AT,
  BRIDGECLI_VERSION,
  BRIDGE_CLI_ARM_VERSION_FALLBACK_MESSAGE,
} from "./application-constant";
import os from "os";
import semver from "semver";
import { ErrorCode } from "./enum/ErrorCodes";

export class BridgeCli {
  bridgeCliExecutablePath: string;
  bridgeCliVersion: string;
  bridgeCliArtifactoryURL: string;
  bridgeCliUrlPattern: string;
  bridgeCliUrlLatestPattern: string;

  constructor() {
    this.bridgeCliExecutablePath = "";
    this.bridgeCliVersion = "";
    this.bridgeCliArtifactoryURL =
      "https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-bundle";
    this.bridgeCliUrlPattern = this.bridgeCliArtifactoryURL.concat(
      "/$version/bridge-cli-bundle-$version-$platform.zip"
    );
    this.bridgeCliUrlLatestPattern = this.bridgeCliArtifactoryURL.concat(
      "/latest/bridge-cli-bundle-$platform.zip"
    );
  }

  async extractBridgeCli(fileInfo: DownloadFileResponse): Promise<string> {
    const bridgeCliInstallDirectory: string =
      inputs.BRIDGECLI_INSTALL_DIRECTORY_KEY || this.getDefaultBridgeCliPath();

    const bridgeCliFullPath = path.join(
      String(bridgeCliInstallDirectory),
      String(this.getDefaultBridgeCliSubDirectory())
    );
    taskLib.debug("bridgeCliFullPath: " + bridgeCliFullPath);

    // Clear the existing bridge, if available
    if (taskLib.exist(bridgeCliFullPath)) {
      await taskLib.rmRF(bridgeCliFullPath);
    }

    await extractZipped(fileInfo.filePath, bridgeCliInstallDirectory);

    if (this.bridgeCliVersion != "") {
      const bridgeCliPathWithVersion = path.join(
        String(bridgeCliInstallDirectory),
        String(this.getBridgeCliSubDirectoryWithVersion())
      );
      taskLib.debug("bridgeCliPathWithVersion: " + bridgeCliPathWithVersion);
      if (taskLib.exist(bridgeCliPathWithVersion)) {
        taskLib.debug(
          "Renaming bridge versioned path to default bridge-cli path"
        );
        renameSync(bridgeCliPathWithVersion, bridgeCliFullPath);
      }
    }
    taskLib.debug("Bridge Executable Path: " + bridgeCliFullPath);
    return Promise.resolve(bridgeCliFullPath);
  }

  async executeBridgeCliCommand(
    executablePath: string,
    workspace: string,
    command: string
  ): Promise<number> {
    taskLib.debug("extractedPath: ".concat(executablePath));

    const executableBridgeCliPath = await this.setBridgeCliExecutablePath(
      executablePath
    );
    if (!taskLib.exist(executableBridgeCliPath)) {
      throw new Error(
        BRIDGE_CLI_EXECUTABLE_FILE_NOT_FOUND.concat(executableBridgeCliPath)
          .concat(constants.SPACE)
          .concat(ErrorCode.BRIDGE_EXECUTABLE_NOT_FOUND.toString())
      );
    }
    try {
      return await taskLib.exec(executableBridgeCliPath, command, {
        cwd: workspace,
      });
    } catch (errorObject) {
      taskLib.debug("errorObject:" + errorObject);
      throw errorObject;
    }
  }

  async prepareCommand(tempDir: string): Promise<string> {
    try {
      let formattedCommand = "";

      // Validate both Network ssl cert file and network trust all certs are given the input resource
      if (
        inputs.NETWORK_SSL_CERT_FILE &&
        inputs.NETWORK_SSL_TRUST_ALL === true
      ) {
        return Promise.reject(
          new Error(constants.NETWORK_SSL_VALIDATION_ERROR_MESSAGE)
        );
      }

      const invalidParams: string[] = validateScanTypes();

      if (invalidParams.length === 4) {
        return Promise.reject(
          new Error(
            REQUIRE_ONE_SCAN_TYPE.concat(constants.POLARIS_SERVER_URL_KEY)
              .concat(",")
              .concat(constants.COVERITY_URL_KEY)
              .concat(",")
              .concat(constants.BLACKDUCKSCA_URL_KEY)
              .concat(",")
              .concat(constants.SRM_URL_KEY)
              .concat(")")
              .concat(constants.SPACE)
              .concat(ErrorCode.MISSING_AT_LEAST_ONE_SCAN_TYPE.toString())
          )
        );
      }

      let classicEditorErrors: string[] = [];
      let polarisErrors: string[] = [];
      let coverityErrors: string[] = [];
      let blackduckErrors: string[] = [];
      let srmErrors: string[] = [];

      if (SCAN_TYPE.length > 0) {
        // To support single scan using Classic Editor
        [formattedCommand, classicEditorErrors] =
          await this.formatCommandForClassicEditor(formattedCommand, tempDir);
      } else {
        // To support multi-scan using YAML
        [formattedCommand, polarisErrors] = await this.preparePolarisCommand(
          formattedCommand,
          tempDir
        );
        [formattedCommand, coverityErrors] = await this.prepareBlackduckCommand(
          formattedCommand,
          tempDir
        );
        [formattedCommand, blackduckErrors] = await this.prepareCoverityCommand(
          formattedCommand,
          tempDir
        );
        [formattedCommand, srmErrors] = await this.prepareSrmCommand(
          formattedCommand,
          tempDir
        );
      }

      let validationErrors: string[] = [];
      validationErrors = validationErrors.concat(
        polarisErrors,
        coverityErrors,
        blackduckErrors,
        srmErrors,
        classicEditorErrors
      );

      if (formattedCommand.length === 0) {
        return Promise.reject(new Error(validationErrors.join(",")));
      }

      if (validationErrors.length > 0) {
        console.log(new Error(validationErrors.join(",")));
      }

      if (parseToBoolean(inputs.INCLUDE_DIAGNOSTICS)) {
        formattedCommand = formattedCommand
          .concat(BridgeCliToolsParameter.SPACE)
          .concat(BridgeCliToolsParameter.DIAGNOSTICS_OPTION);
      }

      console.log("Formatted command is - ".concat(formattedCommand));
      return Promise.resolve(formattedCommand);
    } catch (e) {
      const errorObject = e as Error;
      taskLib.debug(
        errorObject.stack === undefined ? "" : errorObject.stack.toString()
      );
      return Promise.reject(errorObject);
    }
  }

  private async formatCommandForClassicEditor(
    formattedCommand: string,
    tempDir: string
  ): Promise<[string, string[]]> {
    let errors: string[] = [];
    if (SCAN_TYPE == "polaris") {
      [formattedCommand, errors] = await this.preparePolarisCommand(
        formattedCommand,
        tempDir
      );
    } else if (SCAN_TYPE == "blackducksca") {
      [formattedCommand, errors] = await this.prepareBlackduckCommand(
        formattedCommand,
        tempDir
      );
    } else if (SCAN_TYPE == "coverity") {
      [formattedCommand, errors] = await this.prepareCoverityCommand(
        formattedCommand,
        tempDir
      );
    } else if (SCAN_TYPE == "srm") {
      [formattedCommand, errors] = await this.prepareSrmCommand(
        formattedCommand,
        tempDir
      );
    }
    return [formattedCommand, errors];
  }

  private async prepareSrmCommand(
    formattedCommand: string,
    tempDir: string
  ): Promise<[string, string[]]> {
    const srmErrors: string[] = validateSrmInputs();
    if (srmErrors.length === 0 && inputs.SRM_URL) {
      const commandFormatter = new BridgeCliToolsParameter(tempDir);
      formattedCommand = formattedCommand.concat(
        await commandFormatter.getFormattedCommandForSrm()
      );
    }
    return [formattedCommand, srmErrors];
  }

  private async preparePolarisCommand(
    formattedCommand: string,
    tempDir: string
  ): Promise<[string, string[]]> {
    // validating and preparing command for polaris
    const polarisErrors: string[] = validatePolarisInputs();
    const commandFormatter = new BridgeCliToolsParameter(tempDir);
    if (polarisErrors.length === 0 && inputs.POLARIS_SERVER_URL) {
      formattedCommand = formattedCommand.concat(
        await commandFormatter.getFormattedCommandForPolaris()
      );
    }
    return [formattedCommand, polarisErrors];
  }

  private async prepareCoverityCommand(
    formattedCommand: string,
    tempDir: string
  ): Promise<[string, string[]]> {
    // validating and preparing command for coverity
    const coverityErrors: string[] = validateCoverityInputs();
    if (coverityErrors.length === 0 && inputs.COVERITY_URL) {
      const coverityCommandFormatter = new BridgeCliToolsParameter(tempDir);
      formattedCommand = formattedCommand.concat(
        await coverityCommandFormatter.getFormattedCommandForCoverity()
      );
    }
    return [formattedCommand, coverityErrors];
  }

  private async prepareBlackduckCommand(
    formattedCommand: string,
    tempDir: string
  ): Promise<[string, string[]]> {
    const blackduckErrors: string[] = validateBlackDuckSCAInputs();
    if (blackduckErrors.length === 0 && inputs.BLACKDUCKSCA_URL) {
      const blackDuckCommandFormatter = new BridgeCliToolsParameter(tempDir);
      formattedCommand = formattedCommand.concat(
        await blackDuckCommandFormatter.getFormattedCommandForBlackduck()
      );
    }
    return [formattedCommand, blackduckErrors];
  }

  async validateBridgeVersion(version: string): Promise<boolean> {
    const versions = await this.getAllAvailableBridgeCliVersions();
    return Promise.resolve(versions.indexOf(version.trim()) !== -1);
  }

  async downloadAndExtractBridgeCli(tempDir: string): Promise<string> {
    try {
      const bridgeUrl = await this.getBridgeCliUrl();

      if (bridgeUrl != "" && bridgeUrl != null) {
        const downloadBridge: DownloadFileResponse = await getRemoteFile(
          tempDir,
          bridgeUrl
        );
        console.info(BRIDGE_CLI_DOWNLOAD_COMPLETED);
        // Extracting bridge
        return await this.extractBridgeCli(downloadBridge);
      }
      if (
        inputs.BRIDGECLI_DOWNLOAD_VERSION &&
        (await this.checkIfBridgeCliVersionExists(
          inputs.BRIDGECLI_DOWNLOAD_VERSION
        ))
      ) {
        return Promise.resolve(this.bridgeCliExecutablePath);
      }
      return this.bridgeCliExecutablePath;
    } catch (e) {
      const errorObject = (e as Error).message;
      if (
        errorObject.includes("404") ||
        errorObject.toLowerCase().includes("invalid url")
      ) {
        return Promise.reject(
          new Error(
            INVALID_BRIDGE_CLI_URL_SPECIFIED_OS.concat(
              process.platform,
              " runner"
            )
              .concat(constants.SPACE)
              .concat(ErrorCode.INVALID_BRIDGE_CLI_URL.toString())
          )
        );
      } else if (errorObject.toLowerCase().includes("empty")) {
        return Promise.reject(
          new Error(
            EMPTY_BRIDGE_CLI_URL.concat(constants.SPACE).concat(
              ErrorCode.BRIDGE_CLI_URL_CANNOT_BE_EMPTY.toString()
            )
          )
        );
      } else {
        return Promise.reject(new Error(errorObject));
      }
    }
  }

  async getBridgeCliUrl(): Promise<string | undefined> {
    let bridgeUrl: string;
    let version = "";
    if (inputs.BRIDGECLI_DOWNLOAD_URL) {
      bridgeUrl = inputs.BRIDGECLI_DOWNLOAD_URL;

      if (!validateBridgeUrl(inputs.BRIDGECLI_DOWNLOAD_URL)) {
        return Promise.reject(
          new Error(
            INVALID_BRIDGE_CLI_URL.concat(constants.SPACE).concat(
              ErrorCode.INVALID_URL.toString()
            )
          )
        );
      }
      // To check whether bridge already exists with same version mentioned in bridge url
      const versionsArray = bridgeUrl.match(".*bridge-cli-bundle-([0-9.]*).*");
      if (versionsArray) {
        version = versionsArray[1];
        if (!version) {
          const regex =
            /\w*(bridge-cli-bundle-(win64|linux64|linux_arm|macosx|macos_arm).zip)/;
          version = await this.getBridgeCliVersionFromLatestURL(
            bridgeUrl.replace(regex, "versions.txt")
          );
        }
      }
    } else if (inputs.BRIDGECLI_DOWNLOAD_VERSION) {
      if (await this.validateBridgeVersion(inputs.BRIDGECLI_DOWNLOAD_VERSION)) {
        bridgeUrl = this.getVersionUrl(
          inputs.BRIDGECLI_DOWNLOAD_VERSION.trim()
        ).trim();
        version = inputs.BRIDGECLI_DOWNLOAD_VERSION;
      } else {
        return Promise.reject(
          new Error(
            BRIDGE_CLI_VERSION_NOT_FOUND.concat(constants.SPACE).concat(
              ErrorCode.BRIDGE_CLI_VERSION_NOT_FOUND.toString()
            )
          )
        );
      }
    } else {
      taskLib.debug(CHECK_LATEST_BRIDGE_CLI_VERSION);
      version = await this.getBridgeCliVersionFromLatestURL(
        this.bridgeCliArtifactoryURL.concat("/latest/versions.txt")
      );
      bridgeUrl = this.getLatestVersionUrl();
    }

    if (version != "") {
      if (await this.checkIfBridgeCliVersionExists(version)) {
        console.info(BRIDGECLI_VERSION, version);
        console.log(SKIP_DOWNLOAD_BRIDGE_CLI_WHEN_VERSION_NOT_FOUND);
        return Promise.resolve("");
      }
    }

    this.bridgeCliVersion = version;
    console.info(BRIDGECLI_VERSION, version);
    console.info(DOWNLOADING_BRIDGE_CLI);
    console.info(BRIDGE_CLI_URL_MESSAGE.concat(bridgeUrl));
    return bridgeUrl;
  }

  async checkIfBridgeCliVersionExists(bridgeVersion: string): Promise<boolean> {
    this.bridgeCliExecutablePath = await this.getBridgeCliPath();
    const osName = process.platform;
    let versionFilePath: string;

    if (osName === constants.WIN32) {
      versionFilePath = this.bridgeCliExecutablePath.concat("\\versions.txt");
    } else {
      versionFilePath = this.bridgeCliExecutablePath.concat("/versions.txt");
    }
    if (taskLib.exist(versionFilePath) && this.bridgeCliExecutablePath) {
      taskLib.debug(BRIDGE_CLI_FOUND_AT.concat(this.bridgeCliExecutablePath));
      taskLib.debug(VERSION_FILE_FOUND_AT.concat(this.bridgeCliExecutablePath));
      if (await this.checkIfVersionExists(bridgeVersion, versionFilePath)) {
        return Promise.resolve(true);
      }
    } else {
      taskLib.debug(
        VERSION_FILE_NOT_FOUND_AT.concat(this.bridgeCliExecutablePath)
      );
    }
    return Promise.resolve(false);
  }

  /**
   * Fetch content using direct HTTPS with enhanced SSL support.
   * Falls back to typed-rest-client if direct HTTPS fails.
   */
  private async fetchWithDirectHTTPS(
    fetchUrl: string,
    headers: Record<string, string> = {}
  ): Promise<string> {
    const sslConfig = getSSLConfig();
    const shouldUseDirectHTTPS =
      sslConfig.trustAllCerts || (sslConfig.customCA && sslConfig.combinedCAs);

    if (shouldUseDirectHTTPS) {
      try {
        taskLib.debug(
          "Using direct HTTPS for Bridge CLI metadata fetch with enhanced SSL support"
        );
        return await new Promise<string>((resolve, reject) => {
          const parsedUrl = new URL(fetchUrl);
          const requestOptions = createHTTPSRequestOptions(
            parsedUrl,
            sslConfig,
            headers
          );

          const request = https.request(requestOptions, (response) => {
            const statusCode = response.statusCode || 0;

            if (statusCode !== 200) {
              reject(
                new Error(`HTTP ${statusCode}: ${response.statusMessage}`)
              );
              return;
            }

            let data = "";
            response.on("data", (chunk) => {
              data += chunk;
            });

            response.on("end", () => {
              resolve(data);
            });
          });

          request.on("error", (err) => {
            reject(err);
          });

          request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error("Request timeout"));
          });

          request.end();
        });
      } catch (error) {
        taskLib.debug(
          `Direct HTTPS fetch failed, falling back to typed-rest-client: ${error}`
        );
        // Fall through to typed-rest-client approach
      }
    }

    // Fallback to typed-rest-client
    taskLib.debug("Using typed-rest-client for Bridge CLI metadata fetch");
    const httpClient = getSharedHttpClient();
    const response = await httpClient.get(fetchUrl, headers);

    if (response.message.statusCode !== 200) {
      throw new Error(
        `HTTP ${response.message.statusCode}: ${response.message.statusMessage}`
      );
    }

    return await response.readBody();
  }

  async getAllAvailableBridgeCliVersions(): Promise<string[]> {
    let retryCountLocal = RETRY_COUNT;
    let retryDelay = RETRY_DELAY_IN_MILLISECONDS;
    const versionArray: string[] = [];

    do {
      try {
        const htmlResponse = await this.fetchWithDirectHTTPS(
          this.bridgeCliArtifactoryURL,
          {
            Accept: "text/html",
          }
        );

        const domParser = new DomParser();
        const doms = domParser.parseFromString(htmlResponse);
        const elems = doms.getElementsByTagName("a");

        if (elems != null) {
          for (const el of elems) {
            const content = el.textContent;
            if (content != null) {
              const v = content.match("^[0-9]+.[0-9]+.[0-9]+");

              if (v != null && v.length === 1) {
                versionArray.push(v[0]);
              }
            }
          }
        }

        // Success - break out of retry loop
        break;
      } catch (error) {
        const err = error as Error;
        const statusCode = err.message.match(/HTTP (\d+):/)?.[1];

        if (!statusCode || !NON_RETRY_HTTP_CODES.has(Number(statusCode))) {
          retryDelay = await this.retrySleepHelper(
            GETTING_ALL_BRIDGE_VERSIONS_RETRY,
            retryCountLocal,
            retryDelay
          );
          retryCountLocal--;
        } else {
          retryCountLocal = 0;
        }
      }

      if (retryCountLocal === 0 && !(versionArray.length > 0)) {
        taskLib.warning(UNABLE_TO_GET_RECENT_BRIDGE_VERSION);
      }
    } while (retryCountLocal > 0);
    return versionArray;
  }

  async checkIfVersionExists(
    bridgeVersion: string,
    bridgeVersionFilePath: string
  ): Promise<boolean> {
    try {
      const contents = readFileSync(bridgeVersionFilePath, "utf-8");
      return contents.includes("bridge-cli-bundle: ".concat(bridgeVersion));
    } catch (e) {
      console.info(ERROR_READING_VERSION_FILE.concat((e as Error).message));
    }
    return false;
  }

  async getBridgeCliVersionFromLatestURL(
    latestVersionsUrl: string
  ): Promise<string> {
    try {
      let retryCountLocal = RETRY_COUNT;
      let retryDelay = RETRY_DELAY_IN_MILLISECONDS;

      do {
        try {
          const htmlResponse = await this.fetchWithDirectHTTPS(
            latestVersionsUrl,
            {
              Accept: "text/html",
            }
          );
          const lines = htmlResponse.trim().split("\n");
          for (const line of lines) {
            if (line.includes("bridge-cli-bundle")) {
              return line.split(":")[1].trim();
            }
          }

          // Success but no version found - break out of retry loop
          break;
        } catch (error) {
          const err = error as Error;
          const statusCode = err.message.match(/HTTP (\d+):/)?.[1];

          if (!statusCode || !NON_RETRY_HTTP_CODES.has(Number(statusCode))) {
            retryDelay = await this.retrySleepHelper(
              GETTING_LATEST_BRIDGE_VERSIONS_RETRY,
              retryCountLocal,
              retryDelay
            );
            retryCountLocal--;
          } else {
            retryCountLocal = 0;
          }
        }

        if (retryCountLocal == 0) {
          taskLib.warning(UNABLE_TO_GET_RECENT_BRIDGE_VERSION);
        }
      } while (retryCountLocal > 0);
    } catch (e) {
      taskLib.debug(ERROR_READING_VERSION_FILE.concat((e as Error).message));
    }
    return "";
  }

  getDefaultBridgeCliPath(): string {
    let bridgeDefaultPath = "";
    const osName = process.platform;

    if (osName === constants.DARWIN || osName === constants.LINUX) {
      bridgeDefaultPath = path.join(
        process.env["HOME"] as string,
        constants.BRIDGE_CLI_DEFAULT_PATH_UNIX
      );
    } else if (osName === constants.WIN32) {
      bridgeDefaultPath = path.join(
        process.env["USERPROFILE"] as string,
        constants.BRIDGE_CLI_DEFAULT_PATH_WINDOWS
      );
    }
    taskLib.debug("bridgeDefaultPath:" + bridgeDefaultPath);
    return bridgeDefaultPath;
  }

  getDefaultBridgeCliSubDirectory(): string {
    let bridgeSubDirectory = "";
    const osName = process.platform;

    if (osName === constants.DARWIN || osName === constants.LINUX) {
      const osPlatform =
        osName === constants.DARWIN
          ? this.getMacOsSuffix()
          : this.getLinuxOsSuffix();
      bridgeSubDirectory =
        constants.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_UNIX.concat("-").concat(
          osPlatform
        );
    } else if (osName === constants.WIN32) {
      bridgeSubDirectory =
        constants.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_WINDOWS.concat(
          "-"
        ).concat(constants.WINDOWS_PLATFORM);
    }
    taskLib.debug("bridgeSubDirectory:" + bridgeSubDirectory);
    return bridgeSubDirectory;
  }

  getBridgeCliSubDirectoryWithVersion(): string {
    let bridgeSubDirectoryWithVersion = "";
    const osName = process.platform;
    const version =
      this.bridgeCliVersion != "" ? "-".concat(this.bridgeCliVersion) : "";

    if (osName === constants.DARWIN || osName === constants.LINUX) {
      const osPlatform =
        osName === constants.DARWIN
          ? this.getMacOsSuffix()
          : this.getLinuxOsSuffix();
      bridgeSubDirectoryWithVersion =
        constants.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_UNIX.concat(version)
          .concat("-")
          .concat(osPlatform);
    } else if (osName === constants.WIN32) {
      bridgeSubDirectoryWithVersion =
        constants.BRIDGE_CLI_DEFAULT_SUBDIRECTORY_PATH_WINDOWS.concat(version)
          .concat("-")
          .concat(constants.WINDOWS_PLATFORM);
    }
    taskLib.debug(
      "bridgeSubDirectoryWithVersion:" + bridgeSubDirectoryWithVersion
    );
    return bridgeSubDirectoryWithVersion;
  }

  // Get bridge version url
  getVersionUrl(version: string): string {
    const osName = process.platform;
    let bridgeDownloadUrl = this.bridgeCliUrlPattern.replace(
      "$version",
      version
    );
    bridgeDownloadUrl = bridgeDownloadUrl.replace("$version", version);

    // Helper function to determine the appropriate platform suffix based on CPU architecture.
    const getOsSuffix = (
      osName: string,
      isValidVersion: boolean,
      minVersion: string,
      intelSuffix: string,
      armSuffix: string
    ): string => {
      if (!isValidVersion) {
        console.log(
          BRIDGE_CLI_ARM_VERSION_FALLBACK_MESSAGE.replace("{version}", version)
            .replace("{minVersion}", minVersion)
            .replace("{intelSuffix}", intelSuffix)
        );
        return intelSuffix;
      }
      let isIntel = true;
      const cpuInfo = os.cpus();
      taskLib.debug(`cpuInfo :: ${JSON.stringify(cpuInfo)}`);
      if (osName === constants.DARWIN) {
        isIntel = cpuInfo[0].model.includes("Intel");
      } else if (osName === constants.LINUX) {
        isIntel = !/^(arm.*|aarch.*)$/.test(process.arch);
      }
      return isIntel ? intelSuffix : armSuffix;
    };

    if (osName === constants.DARWIN) {
      const isValidVersionForARM = semver.gte(
        version,
        constants.MIN_SUPPORTED_BRIDGE_CLI_MAC_ARM_VERSION
      );
      const osSuffix = getOsSuffix(
        osName,
        isValidVersionForARM,
        constants.MIN_SUPPORTED_BRIDGE_CLI_MAC_ARM_VERSION,
        constants.MAC_INTEL_PLATFORM,
        constants.MAC_ARM_PLATFORM
      );
      bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", osSuffix);
    } else if (osName === constants.LINUX) {
      const isValidVersionForARM = semver.gte(
        version,
        constants.MIN_SUPPORTED_BRIDGE_CLI_LINUX_ARM_VERSION
      );
      const osSuffix = getOsSuffix(
        osName,
        isValidVersionForARM,
        constants.MIN_SUPPORTED_BRIDGE_CLI_LINUX_ARM_VERSION,
        constants.LINUX_PLATFORM,
        constants.LINUX_ARM_PLATFORM
      );
      bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", osSuffix);
    } else if (osName === constants.WIN32) {
      bridgeDownloadUrl = bridgeDownloadUrl.replace(
        "$platform",
        constants.WINDOWS_PLATFORM
      );
    }
    return bridgeDownloadUrl;
  }

  getLatestVersionUrl(): string {
    const osName = process.platform;
    let bridgeDownloadUrl = this.bridgeCliUrlLatestPattern;
    if (osName === constants.DARWIN) {
      const osSuffix = this.getMacOsSuffix();
      bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", osSuffix);
    } else if (osName === constants.LINUX) {
      const osSuffix = this.getLinuxOsSuffix();
      bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", osSuffix);
    } else if (osName === constants.WIN32) {
      bridgeDownloadUrl = bridgeDownloadUrl.replace(
        "$platform",
        constants.WINDOWS_PLATFORM
      );
    }

    return bridgeDownloadUrl;
  }

  getMacOsSuffix(): string {
    const cpuInfo = os.cpus();
    taskLib.debug(`cpuInfo :: ${JSON.stringify(cpuInfo)}`);
    const isIntel = cpuInfo[0].model.includes("Intel");
    return isIntel ? constants.MAC_INTEL_PLATFORM : constants.MAC_ARM_PLATFORM;
  }

  // Helper function to determine the appropriate linux platform suffix based on CPU architecture.
  getLinuxOsSuffix(): string {
    const cpuInfo = os.cpus();
    taskLib.debug(`cpuInfo :: ${JSON.stringify(cpuInfo)}`);
    const isIntel = !/^(arm.*|aarch.*)$/.test(process.arch);
    return isIntel ? constants.LINUX_PLATFORM : constants.LINUX_ARM_PLATFORM;
  }

  async setBridgeCliExecutablePath(filePath: string): Promise<string> {
    if (process.platform === constants.WIN32) {
      this.bridgeCliExecutablePath = path.join(
        filePath,
        constants.BRIDGE_CLI_EXECUTABLE_WINDOWS
      );
    } else if (
      process.platform === constants.DARWIN ||
      process.platform === constants.LINUX
    ) {
      this.bridgeCliExecutablePath = path.join(
        filePath,
        constants.BRIDGE_CLI_EXECUTABLE_MAC_LINUX
      );
    }
    return this.bridgeCliExecutablePath;
  }

  //contains executable path with extension file
  async getBridgeCliPath(): Promise<string> {
    let bridgeDirectoryPath = path.join(
      String(this.getDefaultBridgeCliPath()),
      String(this.getDefaultBridgeCliSubDirectory())
    );
    if (BRIDGECLI_INSTALL_DIRECTORY_KEY) {
      bridgeDirectoryPath = path.join(
        String(BRIDGECLI_INSTALL_DIRECTORY_KEY),
        String(this.getDefaultBridgeCliSubDirectory())
      );
      console.info(LOOKING_FOR_BRIDGE_CLI_INSTALL_DIR);
      if (!taskLib.exist(BRIDGECLI_INSTALL_DIRECTORY_KEY)) {
        throw new Error(
          BRIDGE_CLI_INSTALL_DIRECTORY_NOT_EXISTS.concat(
            constants.SPACE
          ).concat(ErrorCode.BRIDGE_INSTALL_DIRECTORY_NOT_EXIST.toString())
        );
      }
    } else {
      console.info(LOOKING_FOR_BRIDGE_CLI_DEFAULT_PATH);
      if (ENABLE_NETWORK_AIRGAP && bridgeDirectoryPath) {
        if (!taskLib.exist(bridgeDirectoryPath)) {
          throw new Error(
            BRIDGE_CLI_DEFAULT_DIRECTORY_NOT_EXISTS.concat(
              constants.SPACE
            ).concat(ErrorCode.DEFAULT_DIRECTORY_NOT_FOUND.toString())
          );
        }
      }
    }
    return bridgeDirectoryPath;
  }

  private async retrySleepHelper(
    message: string,
    retryCountLocal: number,
    retryDelay: number
  ): Promise<number> {
    console.info(
      message
        .concat(String(retryCountLocal))
        .concat(", Waiting: ")
        .concat(String(retryDelay / 1000))
        .concat(" Seconds")
    );
    await sleep(retryDelay);
    // Delayed exponentially starting from 15 seconds
    retryDelay = retryDelay * 2;
    return retryDelay;
  }
}

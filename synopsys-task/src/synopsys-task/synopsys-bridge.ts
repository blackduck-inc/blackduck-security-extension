import * as path from "path";
import * as taskLib from "azure-pipelines-task-lib/task";
import { HttpClient } from "typed-rest-client/HttpClient";
import { SynopsysToolsParameter } from "./tools-parameter";
import { sleep } from "./utility";
import {
  validateBlackDuckInputs,
  validateBridgeUrl,
  validateCoverityInputs,
  validatePolarisInputs,
  validateScanTypes,
  validateSrmInputs,
} from "./validator";

import * as constants from "./application-constant";

import * as inputs from "./input";
import { extractZipped, getRemoteFile, parseToBoolean } from "./utility";
import { readFileSync } from "fs";
import { DownloadFileResponse } from "./model/download-file-response";
import DomParser from "dom-parser";
import {
  ENABLE_NETWORK_AIRGAP,
  SCAN_TYPE,
  SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY,
} from "./input";
import {
  NON_RETRY_HTTP_CODES,
  RETRY_COUNT,
  RETRY_DELAY_IN_MILLISECONDS,
} from "./application-constant";
import os from "os";
import semver from "semver";
import { ErrorCode } from "./enum/ErrorCodes";

export class SynopsysBridge {
  bridgeExecutablePath: string;
  bridgeArtifactoryURL: string;
  bridgeUrlPattern: string;
  bridgeUrlLatestPattern: string;

  constructor() {
    this.bridgeExecutablePath = "";
    this.bridgeArtifactoryURL =
      "https://sig-repo.synopsys.com/artifactory/bds-integrations-release/com/synopsys/integration/synopsys-bridge";
    this.bridgeUrlPattern = this.bridgeArtifactoryURL.concat(
      "/$version/synopsys-bridge-$version-$platform.zip"
    );
    this.bridgeUrlLatestPattern = this.bridgeArtifactoryURL.concat(
      "/latest/synopsys-bridge-$platform.zip"
    );
  }

  async extractBridge(fileInfo: DownloadFileResponse): Promise<string> {
    const extractZippedFilePath: string =
      inputs.SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY ||
      this.getBridgeDefaultPath();

    // Clear the existing bridge, if available
    if (taskLib.exist(extractZippedFilePath)) {
      await taskLib.rmRF(extractZippedFilePath);
    }

    await extractZipped(fileInfo.filePath, extractZippedFilePath);

    return Promise.resolve(extractZippedFilePath);
  }

  async executeBridgeCommand(
    executablePath: string,
    workspace: string,
    command: string
  ): Promise<number> {
    taskLib.debug("extractedPath: ".concat(executablePath));

    const executableBridgePath = await this.setBridgeExecutablePath(
      executablePath
    );
    if (!taskLib.exist(executableBridgePath)) {
      throw new Error(
        "Synopsys Bridge executable file could not be found at "
          .concat(executableBridgePath)
          .concat(constants.SPACE)
          .concat(ErrorCode.BRIDGE_EXECUTABLE_NOT_FOUND.toString())
      );
    }
    try {
      return await taskLib.exec(executableBridgePath, command, {
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
      const invalidParams: string[] = validateScanTypes();

      if (invalidParams.length === 4) {
        return Promise.reject(
          new Error(
            "Requires at least one scan type: ("
              .concat(constants.POLARIS_SERVER_URL_KEY)
              .concat(",")
              .concat(constants.COVERITY_URL_KEY)
              .concat(",")
              .concat(constants.BLACKDUCK_URL_KEY)
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
          .concat(SynopsysToolsParameter.SPACE)
          .concat(SynopsysToolsParameter.DIAGNOSTICS_OPTION);
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
    } else if (SCAN_TYPE == "blackduck") {
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
      const commandFormatter = new SynopsysToolsParameter(tempDir);
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
    const commandFormatter = new SynopsysToolsParameter(tempDir);
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
      const coverityCommandFormatter = new SynopsysToolsParameter(tempDir);
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
    const blackduckErrors: string[] = validateBlackDuckInputs();
    if (blackduckErrors.length === 0 && inputs.BLACKDUCK_URL) {
      const blackDuckCommandFormatter = new SynopsysToolsParameter(tempDir);
      formattedCommand = formattedCommand.concat(
        await blackDuckCommandFormatter.getFormattedCommandForBlackduck()
      );
    }
    return [formattedCommand, blackduckErrors];
  }

  async validateBridgeVersion(version: string): Promise<boolean> {
    const versions = await this.getAllAvailableBridgeVersions();
    return Promise.resolve(versions.indexOf(version.trim()) !== -1);
  }

  async downloadAndExtractBridge(tempDir: string): Promise<string> {
    try {
      const bridgeUrl = await this.getBridgeUrl();

      if (bridgeUrl != "" && bridgeUrl != null) {
        const downloadBridge: DownloadFileResponse = await getRemoteFile(
          tempDir,
          bridgeUrl
        );
        console.info("Download of Synopsys Bridge completed");
        // Extracting bridge
        return await this.extractBridge(downloadBridge);
      }
      if (
        inputs.BRIDGE_DOWNLOAD_VERSION &&
        (await this.checkIfSynopsysBridgeVersionExists(
          inputs.BRIDGE_DOWNLOAD_VERSION
        ))
      ) {
        return Promise.resolve(this.bridgeExecutablePath);
      }
      return this.bridgeExecutablePath;
    } catch (e) {
      const errorObject = (e as Error).message;
      if (
        errorObject.includes("404") ||
        errorObject.toLowerCase().includes("invalid url")
      ) {
        return Promise.reject(
          new Error(
            "Provided Synopsys Bridge url is not valid for the configured "
              .concat(process.platform, " runner")
              .concat(constants.SPACE)
              .concat(ErrorCode.INVALID_SYNOPSYS_BRIDGE_URL.toString())
          )
        );
      } else if (errorObject.toLowerCase().includes("empty")) {
        return Promise.reject(
          new Error(
            "Provided Synopsys Bridge URL cannot be empty"
              .concat(constants.SPACE)
              .concat(ErrorCode.SYNOPSYS_BRIDGE_URL_CANNOT_BE_EMPTY.toString())
          )
        );
      } else {
        return Promise.reject(new Error(errorObject));
      }
    }
  }

  async getBridgeUrl(): Promise<string | undefined> {
    let bridgeUrl: string;
    let version = "";
    if (inputs.BRIDGE_DOWNLOAD_URL) {
      bridgeUrl = inputs.BRIDGE_DOWNLOAD_URL;

      if (!validateBridgeUrl(inputs.BRIDGE_DOWNLOAD_URL)) {
        return Promise.reject(
          new Error(
            "Invalid URL"
              .concat(constants.SPACE)
              .concat(ErrorCode.INVALID_URL.toString())
          )
        );
      }
      // To check whether bridge already exists with same version mentioned in bridge url
      const versionsArray = bridgeUrl.match(".*synopsys-bridge-([0-9.]*).*");
      if (versionsArray) {
        version = versionsArray[1];
        if (!version) {
          const regex =
            /\w*(synopsys-bridge-(win64|linux64|macosx|macos_arm).zip)/;
          version = await this.getSynopsysBridgeVersionFromLatestURL(
            bridgeUrl.replace(regex, "versions.txt")
          );
        }
      }
    } else if (inputs.BRIDGE_DOWNLOAD_VERSION) {
      if (await this.validateBridgeVersion(inputs.BRIDGE_DOWNLOAD_VERSION)) {
        bridgeUrl = this.getVersionUrl(
          inputs.BRIDGE_DOWNLOAD_VERSION.trim()
        ).trim();
        version = inputs.BRIDGE_DOWNLOAD_VERSION;
      } else {
        return Promise.reject(
          new Error(
            "Provided Synopsys Bridge version not found in artifactory"
              .concat(constants.SPACE)
              .concat(ErrorCode.SYNOPSYS_BRIDGE_VERSION_NOT_FOUND.toString())
          )
        );
      }
    } else {
      taskLib.debug(
        "Checking for latest version of Synopsys Bridge to download and configure"
      );
      version = await this.getSynopsysBridgeVersionFromLatestURL(
        this.bridgeArtifactoryURL.concat("/latest/versions.txt")
      );
      bridgeUrl = this.getLatestVersionUrl();
    }

    if (version != "") {
      if (await this.checkIfSynopsysBridgeVersionExists(version)) {
        console.log("Skipping download as same Synopsys Bridge version found");
        return Promise.resolve("");
      }
    }

    console.info("Downloading and configuring Synopsys Bridge");
    console.info("Synopsys Bridge URL is - ".concat(bridgeUrl));
    return bridgeUrl;
  }

  async checkIfSynopsysBridgeVersionExists(
    bridgeVersion: string
  ): Promise<boolean> {
    this.bridgeExecutablePath = await this.getSynopsysBridgePath();
    const osName = process.platform;
    let versionFilePath: string;

    if (osName === "win32") {
      versionFilePath = this.bridgeExecutablePath.concat("\\versions.txt");
    } else {
      versionFilePath = this.bridgeExecutablePath.concat("/versions.txt");
    }
    if (taskLib.exist(versionFilePath) && this.bridgeExecutablePath) {
      taskLib.debug(
        "Synopsys Bridge executable found at ".concat(this.bridgeExecutablePath)
      );
      taskLib.debug("Version file found at ".concat(this.bridgeExecutablePath));
      if (await this.checkIfVersionExists(bridgeVersion, versionFilePath)) {
        return Promise.resolve(true);
      }
    } else {
      taskLib.debug(
        "Synopsys Bridge version file could not be found at ".concat(
          this.bridgeExecutablePath
        )
      );
    }
    return Promise.resolve(false);
  }

  async getAllAvailableBridgeVersions(): Promise<string[]> {
    let htmlResponse = "";
    const httpClient = new HttpClient("synopsys-task");

    let retryCountLocal = RETRY_COUNT;
    let httpResponse;
    let retryDelay = RETRY_DELAY_IN_MILLISECONDS;
    const versionArray: string[] = [];
    do {
      httpResponse = await httpClient.get(this.bridgeArtifactoryURL, {
        Accept: "text/html",
      });

      if (!NON_RETRY_HTTP_CODES.has(Number(httpResponse.message.statusCode))) {
        retryDelay = await this.retrySleepHelper(
          "Getting all available bridge versions has been failed, Retries left: ",
          retryCountLocal,
          retryDelay
        );
        retryCountLocal--;
      } else {
        retryCountLocal = 0;
        htmlResponse = await httpResponse.readBody();

        const domParser = new DomParser();
        const doms = domParser.parseFromString(htmlResponse);
        const elems = doms.getElementsByTagName("a"); //querySelectorAll('a')

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
      }

      if (retryCountLocal === 0 && !(versionArray.length > 0)) {
        taskLib.warning(
          "Unable to retrieve the Synopsys Bridge Versions from Artifactory"
        );
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
      return contents.includes(
        "Synopsys Bridge Package: ".concat(bridgeVersion)
      );
    } catch (e) {
      console.info(
        "Error reading version file content: ".concat((e as Error).message)
      );
    }
    return false;
  }

  async getSynopsysBridgeVersionFromLatestURL(
    latestVersionsUrl: string
  ): Promise<string> {
    try {
      const httpClient = new HttpClient("");

      let retryCountLocal = RETRY_COUNT;
      let retryDelay = RETRY_DELAY_IN_MILLISECONDS;
      let httpResponse;
      do {
        httpResponse = await httpClient.get(latestVersionsUrl, {
          Accept: "text/html",
        });

        if (
          !NON_RETRY_HTTP_CODES.has(Number(httpResponse.message.statusCode))
        ) {
          retryDelay = await this.retrySleepHelper(
            "Getting latest Synopsys Bridge versions has been failed, Retries left: ",
            retryCountLocal,
            retryDelay
          );
          retryCountLocal--;
        } else if (httpResponse.message.statusCode === 200) {
          retryCountLocal = 0;
          const htmlResponse = (await httpResponse.readBody()).trim();
          const lines = htmlResponse.split("\n");
          for (const line of lines) {
            if (line.includes("Synopsys Bridge Package")) {
              return line.split(":")[1].trim();
            }
          }
        }

        if (retryCountLocal == 0) {
          taskLib.warning(
            "Unable to retrieve the most recent version from Artifactory URL"
          );
        }
      } while (retryCountLocal > 0);
    } catch (e) {
      taskLib.debug(
        "Error reading version file content: ".concat((e as Error).message)
      );
    }
    return "";
  }

  getBridgeDefaultPath(): string {
    let bridgeDefaultPath = "";
    const osName = process.platform;

    if (osName === "darwin") {
      bridgeDefaultPath = path.join(
        process.env["HOME"] as string,
        constants.SYNOPSYS_BRIDGE_DEFAULT_PATH_MAC
      );
    } else if (osName === "linux") {
      bridgeDefaultPath = path.join(
        (process.env.hasOwnProperty("AGENT_HOMEDIRECTORY") ? process.env["AGENT_HOMEDIRECTORY"] : process.env["HOME"]) as string,
        constants.SYNOPSYS_BRIDGE_DEFAULT_PATH_LINUX
      );
    } else if (osName === "win32") {
      bridgeDefaultPath = path.join(
        process.env["USERPROFILE"] as string,
        constants.SYNOPSYS_BRIDGE_DEFAULT_PATH_WINDOWS
      );
    }
    taskLib.debug("bridgeDefaultPath:" + bridgeDefaultPath);
    return bridgeDefaultPath;
  }

  // Get bridge version url
  getVersionUrl(version: string): string {
    const osName = process.platform;
    let bridgeDownloadUrl = this.bridgeUrlPattern.replace("$version", version);
    bridgeDownloadUrl = bridgeDownloadUrl.replace("$version", version);
    if (osName === "darwin") {
      const isValidVersionForARM = semver.gte(
        version,
        constants.MIN_SUPPORTED_SYNOPSYS_BRIDGE_MAC_ARM_VERSION
      );
      let osSuffix = constants.MAC_INTEL_PLATFORM;
      if (isValidVersionForARM) {
        const cpuInfo = os.cpus();
        taskLib.debug(`cpuInfo :: ${JSON.stringify(cpuInfo)}`);
        const isIntel = cpuInfo[0].model.includes("Intel");
        osSuffix = isIntel
          ? constants.MAC_INTEL_PLATFORM
          : constants.MAC_ARM_PLATFORM;
      }
      bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", osSuffix);
    } else if (osName === "linux") {
      bridgeDownloadUrl = bridgeDownloadUrl.replace(
        "$platform",
        constants.LINUX_PLATFORM
      );
    } else if (osName === "win32") {
      bridgeDownloadUrl = bridgeDownloadUrl.replace(
        "$platform",
        constants.WINDOWS_PLATFORM
      );
    }
    return bridgeDownloadUrl;
  }

  getLatestVersionUrl(): string {
    const osName = process.platform;
    let bridgeDownloadUrl = this.bridgeUrlLatestPattern;
    if (osName === "darwin") {
      const cpuInfo = os.cpus();
      taskLib.debug(`cpuInfo :: ${JSON.stringify(cpuInfo)}`);
      const isIntel = cpuInfo[0].model.includes("Intel");
      const osSuffix = isIntel
        ? constants.MAC_INTEL_PLATFORM
        : constants.MAC_ARM_PLATFORM;
      bridgeDownloadUrl = bridgeDownloadUrl.replace("$platform", osSuffix);
    } else if (osName === "linux") {
      bridgeDownloadUrl = bridgeDownloadUrl.replace(
        "$platform",
        constants.LINUX_PLATFORM
      );
    } else if (osName === "win32") {
      bridgeDownloadUrl = bridgeDownloadUrl.replace(
        "$platform",
        constants.WINDOWS_PLATFORM
      );
    }

    return bridgeDownloadUrl;
  }

  async setBridgeExecutablePath(filePath: string): Promise<string> {
    if (process.platform === "win32") {
      this.bridgeExecutablePath = path.join(
        filePath,
        constants.SYNOPSYS_BRIDGE_EXECUTABLE_WINDOWS
      );
    } else if (process.platform === "darwin" || process.platform === "linux") {
      this.bridgeExecutablePath = path.join(
        filePath,
        constants.SYNOPSYS_BRIDGE_EXECUTABLE_MAC_LINUX
      );
    }
    return this.bridgeExecutablePath;
  }

  //contains executable path with extension file
  async getSynopsysBridgePath(): Promise<string> {
    let synopsysBridgeDirectoryPath = this.getBridgeDefaultPath();
    if (SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY) {
      synopsysBridgeDirectoryPath = SYNOPSYS_BRIDGE_INSTALL_DIRECTORY_KEY;
      console.info(
        "Looking for synopsys bridge in Synopsys Bridge Install Directory"
      );
      if (!taskLib.exist(synopsysBridgeDirectoryPath)) {
        throw new Error(
          "Synopsys Bridge Install Directory does not exist"
            .concat(constants.SPACE)
            .concat(ErrorCode.BRIDGE_INSTALL_DIRECTORY_NOT_EXIST.toString())
        );
      }
    } else {
      console.info("Looking for synopsys bridge in default path");
      if (ENABLE_NETWORK_AIRGAP && this.getBridgeDefaultPath()) {
        if (!taskLib.exist(this.getBridgeDefaultPath())) {
          throw new Error(
            "Synopsys Bridge default directory does not exist"
              .concat(constants.SPACE)
              .concat(ErrorCode.DEFAULT_DIRECTORY_NOT_FOUND.toString())
          );
        }
      }
    }
    return synopsysBridgeDirectoryPath;
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

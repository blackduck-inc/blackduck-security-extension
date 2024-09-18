// Copyright (c) 2024 Black Duck Software Inc. All rights reserved worldwide.

import * as httpm from "typed-rest-client/HttpClient";
import * as ifm from "typed-rest-client/Interfaces";
import * as path from "path";
import * as fs from "fs";
import * as tl from "azure-pipelines-task-lib/task";
import * as constants from "./application-constant";
import { ErrorCode } from "./enum/ErrorCodes";

const userAgent = "BlackDuckSecurityScan";
const requestOptions = {
  // ignoreSslError: true,
  proxy: tl.getHttpProxyConfiguration(),
  cert: tl.getHttpCertConfiguration(),
  allowRedirects: true,
  allowRetries: true,
} as ifm.IRequestOptions;

export function debug(message: string): void {
  tl.debug(message);
}

/**
 * Download a tool from an url and stream it into a file
 *
 * @param url                url of tool to download
 * @param fileName           optional fileName.  Should typically not use (will be a guid for reliability). Can pass fileName with an absolute path.
 * @param handlers           optional handlers array.  Auth handlers to pass to the HttpClient for the tool download.
 * @param additionalHeaders  optional custom HTTP headers.  This is passed to the REST client that downloads the tool.
 */
export async function downloadTool(
  url: string,
  fileName: string,
  handlers?: ifm.IRequestHandler[],
  additionalHeaders?: ifm.IHeaders
): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    // check if it's an absolute path already
    let destPath: string;
    if (path.isAbsolute(fileName)) {
      destPath = fileName;
    } else {
      destPath = path.join(_getAgentTemp(), fileName);
    }

    try {
      const http: httpm.HttpClient = new httpm.HttpClient(
        userAgent,
        handlers,
        requestOptions
      );
      tl.debug(fileName);
      // make sure that the folder exists
      tl.mkdirP(path.dirname(destPath));

      tl.debug(tl.loc("TOOL_LIB_Downloading", url));
      tl.debug("destination " + destPath);

      if (fs.existsSync(destPath)) {
        tl.debug("Destination file path already exists");
        _deleteFile(destPath);
      }

      const response: httpm.HttpClientResponse = await http.get(
        url,
        additionalHeaders
      );

      if (response.message.statusCode != 200) {
        tl.debug(
          `Failed to download "${fileName}" from "${url}". Code(${response.message.statusCode}) Message(${response.message.statusMessage})`
        );
        reject(
          new Error(
            "Failed to download Bridge CLI zip from specified URL. HTTP status code: "
              .concat(String(response.message.statusCode))
              .concat(constants.SPACE)
              .concat(
                ErrorCode.DOWNLOAD_FAILED_WITH_HTTP_STATUS_CODE.toString()
              )
          )
        );
      }

      const downloadedContentLength =
        _getContentLengthOfDownloadedFile(response);
      if (!isNaN(downloadedContentLength)) {
        tl.debug(
          `Content-Length of downloaded file: ${downloadedContentLength}`
        );
      } else {
        tl.debug(`Content-Length header missing`);
      }

      tl.debug("creating stream");
      const file: NodeJS.WritableStream = fs.createWriteStream(destPath);
      file
        .on("open", async () => {
          try {
            response.message
              .on("error", (err) => {
                file.end();
                reject(err);
              })
              .pipe(file);
          } catch (err) {
            reject(err);
          }
        })
        .on("error", (err) => {
          file.end();
          reject(err);
        })
        .on("close", () => {
          let fileSizeInBytes: number;
          try {
            fileSizeInBytes = _getFileSizeOnDisk(destPath);
          } catch (err) {
            const error = err as Error;
            fileSizeInBytes = NaN;
            tl.warning(
              `Unable to check file size of ${destPath} due to error: ${error.message}`
            );
          }

          if (!isNaN(fileSizeInBytes)) {
            tl.debug(`Downloaded file size: ${fileSizeInBytes} bytes`);
          } else {
            tl.debug(`File size on disk was not found`);
          }

          if (
            !isNaN(downloadedContentLength) &&
            !isNaN(fileSizeInBytes) &&
            fileSizeInBytes !== downloadedContentLength
          ) {
            const errMsg = `Content-Length (${downloadedContentLength} bytes) did not match downloaded file size (${fileSizeInBytes} bytes).`;
            tl.warning(errMsg);
            reject(
              errMsg
                .concat(constants.SPACE)
                .concat(ErrorCode.CONTENT_LENGTH_MISMATCH.toString())
            );
          }
          resolve(destPath);
        });
    } catch (error) {
      _deleteFile(destPath);
      throw error;
    }
  });
}

/**
 * Gets size of downloaded file from "Content-Length" header
 *
 * @param response    response for request to get the file
 * @returns number if the 'content-length' is not empty, otherwise NaN
 */
function _getContentLengthOfDownloadedFile(
  response: httpm.HttpClientResponse
): number {
  const contentLengthHeader = response.message.headers["content-length"];
  return parseInt(<string>contentLengthHeader);
}

/**
 * Gets size of file saved to disk
 *
 * @param filePath    the path to the file, saved to the disk
 * @returns size of file saved to disk
 */
export function _getFileSizeOnDisk(filePath: string): number {
  return fs.statSync(filePath).size;
}

function _getAgentTemp(): string {
  tl.assertAgent("2.115.0");
  const tempDirectory = tl.getVariable("Agent.TempDirectory");
  if (!tempDirectory) {
    throw new Error(
      "Agent.TempDirectory is not set"
        .concat(constants.SPACE)
        .concat(ErrorCode.AGENT_TEMP_DIRECTORY_NOT_SET.toString())
    );
  }
  return tempDirectory;
}

function _deleteFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath);
      tl.debug(`Removed unfinished downloaded file`);
    }
  } catch (err) {
    tl.debug(`Failed to delete '${filePath}'. ${err}`);
  }
}

import * as fs from 'fs'
import * as os from 'os'
import path from 'path'
import {APPLICATION_NAME} from '../application-constants'

import * as taskLib from 'azure-pipelines-task-lib/task';

export function cleanUrl(url: string): string {
  if (url && url.endsWith('/')) {
    return url.slice(0, url.length - 1)
  }
  return url
}

export async function createTempDir(): Promise<string> {
  const appPrefix = APPLICATION_NAME
  
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix))
  console.log("tempDir::::::::::::::::::tempDir" + tempDir);

  return tempDir
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  if (tempDir && fs.existsSync(tempDir)) {
    await taskLib.rmRF(tempDir)
  }
}

export function checkIfGithubHostedAndLinux(): boolean {
  return String(process.env['RUNNER_NAME']).includes('Hosted Agent') && (process.platform === 'linux' || process.platform === 'darwin')
}

export function parseToBoolean(value: string | boolean): boolean {
  if (value !== null && value !== '' && (value.toString().toLowerCase() === 'true' || value === true)) {
    return true
  }
  return false
}


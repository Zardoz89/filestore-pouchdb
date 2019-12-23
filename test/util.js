/* eslint-env node, browser, es2017 */

import { isBrowser } from 'browser-or-node'
import FileStorage from '../src/fileStorage.js'

function buildTextBlob(text) {
  return new Blob([text], { type: 'text/plain' })
}

function buildTextFile(path, label, text) {
  if (isBrowser) {
    return new FileStorage.FsFile(path, label, buildTextBlob(text))
  }
  return new FileStorage.FsFile(path, label, Buffer.from(text), 'text/plain')
}

async function getTextFileText(fsFile) {
  if (isBrowser) {
    return await fsFile.blob.text()
  }
  return fsFile.blob.toString()
}

export { buildTextFile, getTextFileText }


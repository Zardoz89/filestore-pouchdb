/**
 * File and Directory classes
 */
/* eslint-env browser, es2017 */
import { PATH_SEPARATOR } from './constants.js'
import { normalizeString, normalizePath } from './utils.js'

/**
 * Class that represents a file stored on FileStorage
 */
export class FsFile {
  /**
   * Constructor
   * @param {string} path - Path of the file
   * @param {array} label - User label of the file. If is ommited would be the last part of the path
   * @param {blob} blob - A blob to be stored
   */
  constructor(path, label, blob, ...[lastModified]) {
    this._path = normalizePath(path)
    if (typeof label === 'undefined' || label === null) {
      const pathElements = FsFile.getPathElements(this.path)
      this._label = pathElements[pathElements.length - 1]
    } else {
      this._label = normalizeString(label)
    }
    this._blob = blob
    if (lastModified) {
      this._lastModified = lastModified
    } else {
      this._lastModified = Date.now()
    }
  }

  get path() {
    return this._path
  }

  set path(path) {
    this._path = normalizePath(path)
  }

  get label() {
    return this._label
  }

  set label(label) {
    this._label = normalizeString(label)
  }

  /** Returns a blob with the content of this file */
  get blob() {
    return this._blob
  }

  /**
   * The File.lastModified read-only property provides the last modified date of the file as the number of
   * milliseconds since the Unix epoch (January 1, 1970 at midnight). Files without a known last modified date return
   * the current date.
   */
  get lastModified() {
    return this._lastModified
  }

  /** Return the path elements */
  getPathElements() {
    return FsFile.getPathElements(this.path)
  }

  /** Split a valid path on path elements */
  static getPathElements(path) {
    return path.split(PATH_SEPARATOR).filter(Boolean)
  }

  /** Builds a valid path from his path elements */
  static getPathFromPathElements(pathElements) {
    return pathElements.join(PATH_SEPARATOR)
  }
}

/**
 * Class that represents a Directory
 */
export class Directory extends FsFile {
  /**
   * Constructor
   * @param {string} path
   */
  constructor(path) {
    // File generates name from the last part of the path
    super(path, null, null, null)
  }
}


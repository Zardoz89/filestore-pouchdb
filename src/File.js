/**
 * File and Directory classes
 */
/* eslint-env browser, es2017 */
import { PATH_SEPARATOR } from './constants.js'
import { normalizeString, normalizePath } from './utils.js'

/**
 * File class that represents a file stored on it
 */
export class File {
  /**
   * Constructor
   * @param {string} path - Path of the file
   * @param {array} label - User label of the file. If is ommited would be the last part of the path
   * @param {blob} blob - A blob to be stored
   */
  constructor(path, label, blob) {
    this.path = normalizePath(path)
    if (typeof label === 'undefined' || label === null) {
      const pathElements = File.getPathElements(this.path)
      this.label = pathElements[pathElements.length - 1]
    } else {
      this.label = normalizeString(label)
    }
    this.blob = blob
  }

  /** Return the path elements */
  getPathElements() {
    return File.getPathElements(this.path)
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
export class Directory extends File {
  /**
   * Constructor
   * @param {string} path
   */
  constructor(path) {
    // File generates name from the last part of the path
    super(path, null, null, null)
  }
}


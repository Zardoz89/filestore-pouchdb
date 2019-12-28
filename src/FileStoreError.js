/**
 * @license MIT
 * @module FileStoreError
 */

/**
 * Base clase for all FileStorage errors
 *
 * @property pouchDbError PouchDb error if there was an error throw by PouchDb
 */
export class FileStoreError extends Error {
  /**
   * Constructor
   * @param {object} pouchDbError - PouchDb error object
   * @param {...*} params
   */
  constructor(pouchDbError = {}, ...params) {
    super(...params)
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileStoreError)
    }

    this.name = this.constructor.name
    this.pouchDbError = pouchDbError
  }
}

/** @ignore */
export default FileStoreError

/**
 * Helper to throw generic errors from PouchDb errors
 */
export function unknowError(pouchDbError) {
  return new FileStoreError(pouchDbError, `Unknow error : ${pouchDbError}`)
}


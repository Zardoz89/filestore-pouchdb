/**
 * Errors throw by FileStorage
 */

/**
 * Base clase for all FileStorage errors
 *
 * @property pouchDbError PouchDb error if there was an error throw by PouchDb
 */
export class FileStoreError extends Error {
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

/**
 * Helper to throw generic errors from PouchDb errors
 */
export function unknowError(pouchDbError) {
  return new FileStoreError(pouchDbError, `Unknow error : ${pouchDbError}`)
}

/**
 * File not found error
 */
export class FileNotFoundError extends FileStoreError {
  constructor(pouchDbError = {}, ...params) {
    super(pouchDbError, ...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileNotFoundError)
    }

    this.name = this.constructor.name
  }
}

/**
 * Inavlid path error
 */
export class InvalidPathError extends FileStoreError {
  constructor(pouchDbError = {}, ...params) {
    super(pouchDbError, ...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidPathError)
    }

    this.name = this.constructor.name
  }
}
/**
 * File with the same path
 */
export class FileWithSamePath extends FileStoreError {
  constructor(pouchDbError = {}, ...params) {
    super(pouchDbError, ...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileWithSamePath)
    }

    this.name = this.constructor.name
  }
}


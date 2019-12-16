import FileStoreError from './FileStoreError'

/**
 * File not found error
 */
export default class FileNotFoundError extends FileStoreError {
  constructor(pouchDbError = {}, ...params) {
    super(pouchDbError, ...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileNotFoundError)
    }

    this.name = this.constructor.name
  }
}


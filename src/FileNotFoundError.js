import FileStoreError from './FileStoreError'

/**
 * File not found error
 * @extends FileStoreError
 */
class FileNotFoundError extends FileStoreError {
  constructor(pouchDbError = {}, ...params) {
    super(pouchDbError, ...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileNotFoundError)
    }

    this.name = this.constructor.name
  }
}

export default FileNotFoundError


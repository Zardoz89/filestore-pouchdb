import FileStoreError from './FileStoreError'

/**
 * Inavlid path error
 * @extends FileStoreError
 */
class InvalidPathError extends FileStoreError {
  constructor(pouchDbError = {}, ...params) {
    super(pouchDbError, ...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidPathError)
    }

    this.name = this.constructor.name
  }
}

export default InvalidPathError


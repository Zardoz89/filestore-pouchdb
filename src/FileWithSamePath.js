import FileStoreError from './FileStoreError'

/**
 * File with the same path
 * @extends FileStoreError
 */
class FileWithSamePath extends FileStoreError {
  constructor(pouchDbError = {}, ...params) {
    super(pouchDbError, ...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileWithSamePath)
    }

    this.name = this.constructor.name
  }
}

export default FileWithSamePath


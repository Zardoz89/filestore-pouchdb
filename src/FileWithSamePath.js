import FileStoreError from './FileStoreError'

/**
 * File with the same path
 */
export default class FileWithSamePath extends FileStoreError {
  constructor(pouchDbError = {}, ...params) {
    super(pouchDbError, ...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileWithSamePath)
    }

    this.name = this.constructor.name
  }
}


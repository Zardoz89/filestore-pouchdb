/**
 * @file Simple file storage over PouchDb
 *
 * Handles a simple file storage over PouchDB. Mimics some functionality of a virtual filesystem like directories and
 * file hierarchy, but avoids to try to be a full virtual filesystem.
 */
import { FileStoreError, FileNotFoundError, FileWithSameHashExists, FileWithSamePath } from './errors.js'

import PouchDb from 'pouchdb'
import FindPlugin from 'pouchdb-find'

PouchDb.plugin(FindPlugin)

/** Default database name to use @constant {string} @default */
const DEFAULT_DATABASE_NAME = 'fileStorage'
/** Path separator @constant {string} @default */
const PATH_SEPARATOR = '/'
/** Database doucment ID prefix to differenciate from '_design' or other data store in it @constant {string} */
const DOCUMENT_ID_PREFIX = 'file_'

/** Document to be stored in the database */
class DbDocument {
  /**
   * Constructor
   * @param {string} id
   * @param {array} pathElements
   * @param {string} name
   * @param {string} mimeType
   * @param blob
   */
  constructor(_id, pathElements, name, mimeType, blob) {
    this._id = _id
    this.pathElements = pathElements
    this.name = name
    this.mimeType = mimeType
    this.blob = blob
  }
}

/** File class that represents a file stored on it */
class File {
  /**
   * Constructor
   * @param {string} path
   * @param {array} logicalName
   * @param {string} mimeType
   * @param blob
   */
  constructor(path, logicalName, mimeType, blob) {
    this.path = path
    this.logicalName = logicalName
    this.mimeType = mimeType
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
class Directory extends File {
  /**
   * Constructor
   * @param {string} path
   * @param {array} logicalName
   * @param {string} mimeType
   * @param blob
   */
  constructor(path) {
    const nameStartPos = path.lastIndexOf(PATH_SEPARATOR)
    let name = ''
    if (nameStartPos === -1) {
      name = path
    } else {
      name = path.substring(nameStartPos)
    }
    super(path, name, null, null)
  }
}

/**
 * Adapter function that generated a valid File class from a DbDocument class
 * @param {DbDocument} dbDocument
 */
function dbDocumentToFileAdapter(dbDocument) {
  return new File(File.getPathFromPathElements(dbDocument.pathElements), dbDocument.name, dbDocument.mimeType,
    dbDocument.blob)
}

/**
 * File storage wrapper over a PouchDb database
 */
class FileStorage {
  constructor(db) {
    this.db = db
  }

  /**
  * Cleans the whole filesystem in database
  */
  async format() {
    let allDocs = await this.db.allDocs({ include_docs: true, startkey: DOCUMENT_ID_PREFIX, endkey: DOCUMENT_ID_PREFIX + '\uffff' })
      .catch((err) => {
        if (err.name !== 'not_found') {
          throw new FileStoreError(err, `Unknow error : ${err}`)
        }
      })

    allDocs = allDocs.rows.map(row => {
      return { _id: row.id, _rev: row.doc._rev, _deleted: true }
    })

    await this.db.bulkDocs(allDocs)
      .catch((err) => {
        if (err.name !== 'not_found') {
          throw new FileStoreError(err, `Unknow error : ${err}`)
        }
      })
    return true
  }

  /**
  * Adds a file to the filesystem
  * @param file File that contains the data and the metadata
  * @param {object} [options] - Options
  * @param {object} [options.overwrite] - Overwrites any existing previous file
  * @return file hash
  */
  async addFile(file, options = { overwrite: false }) {
    const pathElements = file.getPathElements()
    const hash = file.logicalName // TODO hash from blob
    const id = DOCUMENT_ID_PREFIX + hash

    const document = new DbDocument(id, pathElements, file.logicalName, '', file.blob)

    const originalDoc = await this.db.get(id)
      .catch((err) => {
        if (err.name !== 'not_found') {
          throw new FileStoreError(err, `Unknow error : ${err}`)
        }
      })
    if (originalDoc !== undefined) {
      if (!options.overwrite) {
        throw new FileWithSameHashExists(`File with the same content exists. Use options.overwrite = true to replace it. Hash: ${hash}`)
      } else {
        document._rev = originalDoc._rev
      }
    }

    // Check if a file with the same path exists and throw error if overwrite is false and it isn't originalDoc
    const documentsWithSamePath = await this.db.find({
      selector: {
        pathElements: { $eq: pathElements }
      },
      fields: ['_id']
    }).catch(err => { throw new FileStoreError(err, `Unknow error : ${err}`) })

    if (documentsWithSamePath.docs.length > 0) {
      // We delete the docs with the same path
      if (options.overwrite) {
        const docs = documentsWithSamePath.docs.map(doc => {
          return { _id: doc._id, _rev: doc._rev, _deleted: true }
        })
          .filter(doc => doc._id !== document._id)

        await this.db.bulkDocs(docs)
          .catch((err) => {
            if (err.name !== 'not_found') {
              throw new FileStoreError(err, `Unknow error : ${err}`)
            }
          })
      } else {
        throw new FileWithSamePath(`File with the same path exists. Use options.overwrite = true to replace it. Path: ${file.path}`)
      }
    }

    await this.db.put(document)
      .catch((err) => {
        throw new FileStoreError(err, `Unknow error : ${err}`)
      })
    return hash
  }

  /**
   * Generates a directory
   *
   * A directory consists on a file with empty data
   * @param {string} path - Path of the directory
   * @param {object} [options - Options
   * @param {object} [options.parent] - Makes father directories. If father directories exists, don't fail
   * @return Directory hash
   */
  async mkDir(path, options = { parents: false }) {
    const directory = new Directory(path, name)
    return this.addFile(directory)
  }

  /**
   * Deletes a directory
   * @param {string} path - Path of the directory
   * @param {object} [options] - Options
   * @param {object} [options.recursive] - Delete all content of the directory on a recursive way
   */
  async rmDir(path, options = { recursive: false }) {
    // TODO
  }

  /**
   * Return a file using his hash
   * @param {string} fileHash Hash of the file
   * @return A instance of File if the hash points to a valid file or directory
   */
  async getFileFromHash(fileHash) {
    const doc = await this.db.get(DOCUMENT_ID_PREFIX + fileHash)
      .catch(err => {
        if (err.name === 'not_found') {
          throw new FileNotFoundError(err, `File with hash ${fileHash} not found.`)
        } else {
          throw new FileStoreError(err, `Unknow error : ${err}`)
        }
      })
    return dbDocumentToFileAdapter(doc)
  }

  /**
   * Return a file using his path
   * @param {string} path Path to the file
   * @return A instance of File if the path points to a valid file or directory
   */
  async getFile(path) {
    const pathElements = File.getPathElements(path)
    const response = await this.db.find({
      selector: {
        pathElements: { $eq: pathElements }
      }
    }).catch(err => { throw new FileStoreError(err, `Unknow error : ${err}`) })

    if (!response.docs || response.docs.length === 0) {
      throw new FileNotFoundError(`File with path ${path} not found.`)
    }
    return dbDocumentToFileAdapter(response.docs[0])
  }

  /**
   * Return all the files stored
   * @param {object} options
   * @param {object} [options.onlyPaths] - Only retrives the paths
   * @return {array} A sorted array of File or a sorted array of strings with the paths if onlyPaths is true
   */
  async listAllFiles(options = { onlyPaths: false }) {
    const allDocs = await this.db.query('path', { include_docs: true, attachments: !options.onlyPaths })
      .catch(err => {
        throw new FileStoreError(err, `Unknow error : ${err}`)
      })
    if (options.onlyPaths) {
      return allDocs.rows.map(row => dbDocumentToFileAdapter(row.doc).path)
    } else {
      return allDocs.rows.map(row => dbDocumentToFileAdapter(row.doc))
    }
  }

  /**
   * Search a file by his hash and deleted it
   * @param filehash - Hash of the file to be deleted
   * @return {boolean} True if the file exists and is been deleted. False if the file doesn't exists
   */
  async deleteFromHash(fileHash) {
    const doc = await this.db.get(DOCUMENT_ID_PREFIX + fileHash, { attachments: false })
      .catch(err => {
        if (err.name !== 'not_found') {
          throw new FileStoreError(err, `Unknow error : ${err}`)
        }
        return false
      })
    if (!doc) {
      return false
    }

    return this.db.remove(doc._id, doc._rev)
      .catch(err => {
        throw new FileStoreError(err, `Unknow error : ${err}`)
      })
      .then(result => {
        return result.ok
      })
  }

  /**
   * Unwraps the PouchDb instance
   */
  unwrap() {
    return this.db
  }
}

/**
 * Initialice a file system in a PouchDb database
 * @param {string} [databaseName] - The name of the database to use
 * @return {Promise} A valid instance of FileStorage
 */
async function initFileSystem(databaseName) {
  if (!databaseName || databaseName === '') {
    databaseName = DEFAULT_DATABASE_NAME
  }
  const db = new PouchDb(databaseName)

  // Adds a index to quickly search by path
  await db.createIndex({
    index: {
      fields: ['pathElements']
    }
  })

  // Constructs a view to manage the hiearchy
  const pathViewDocument = {
    _id: '_design/path',
    views: {
      path: {
        map: function (doc) {
          /* eslint no-undef: "off" */
          emit(doc.pathElements, doc)
        }.toString()
      }
    }
  }
  await db.put(pathViewDocument)
    .catch(err => {
      if (err.name !== 'conflict') {
        console.error(err)
        throw err
      }
    })

  return new FileStorage(db)
}

export default {
  File,
  FileStorage,
  initFileSystem,
  PATH_SEPARATOR,
  FileStoreError,
  FileNotFoundError,
  FileWithSameHashExists,
  FileWithSamePath
}

// vim: set backupcopy=yes :

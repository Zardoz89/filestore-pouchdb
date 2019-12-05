/**
 * @file Simple file storage over PouchDb
 *
 * Handles a simple file storage over PouchDB. Mimics some functionality of a virtual filesystem like directories and
 * file hierarchy, but avoids to try to be a full virtual filesystem.
 */
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
  format() {
    return this.db.allDocs({ include_docs: true, startkey: DOCUMENT_ID_PREFIX, endkey: DOCUMENT_ID_PREFIX + '\uffff' })
      .then(allDocs => {
        return allDocs.rows.map(row => {
          return { _id: row.id, _rev: row.doc._rev, _deleted: true }
        })
      })
      .then(deleteDocs => {
        return this.db.bulkDocs(deleteDocs)
      })
  }

  /**
  * Adds a file to the filesystem
  * @param file File that contains the data and the metadata
  * @param {object} [options] - Options
  * @param {object} [options.overwrite] - Overwrites any existing previous file
  */
  addFile(file, options) {
    // const { overwrite = false } = options

    const pathElements = file.getPathElements()
    const fileName = file.logicalName
    const id = fileName // TODO hash from blob
    const document = new DbDocument(DOCUMENT_ID_PREFIX + id, pathElements, fileName, '', file.blob)

    return this.db.put(document)
  }

  /**
   * Generates a directory
   *
   * A directory consists on a file with empty data
   * @param {string} path - Path of the directory
   * @param {object} [options - Options
   * @param {object} [options.parent] - Makes father directories. If father directories exists, don't fail
   */
  mkDir(path, options) {
    // const { parent = false } = options

    const pathElements = File.getPathElements(path)

    const fileName = pathElements[pathElements.length - 1]
    const id = fileName
    const document = new DbDocument(DOCUMENT_ID_PREFIX + id, pathElements, fileName, null, null)

    return this.db.put(document)
  }

  /**
   * Deletes a directory
   * @param {string} path - Path of the directory
   * @param {object} [options] - Options
   * @param {object} [options.recursive] - Delete all content of the directory on a recursive way
   */
  rmDir(path, options) {
    // const { recursive = false } = options
    // TODO
  }

  /**
   * Return a file using his hash
   * @param {string} fileHash
   */
  getFileFromHash(fileHash) {
    return new Promise((resolve, reject) => {
      this.db.get(DOCUMENT_ID_PREFIX + fileHash)
        .then(doc => {
          resolve(dbDocumentToFileAdapter(doc))
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Return a file using his path
   * @param {string} path
   */
  getFile(path) {
    return new Promise((resolve, reject) => {
      const pathElements = File.getPathElements(path)
      this.db.find({
        selector: {
          pathElements: { $eq: pathElements }
        }
      })
        .then(response => {
          if (!response.docs || response.docs.length === 0) {
            throw new Error(`File with path ${path} not found`)
          }
          resolve(dbDocumentToFileAdapter(response.docs[0]))
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Return all the files stored
   */
  listAllFiles() {
    return new Promise((resolve, reject) => {
      this.db.query('path', { include_docs: true, attachments: true })
      // this.db.allDocs({
      //  include_docs: true, attachments: true, startkey: DOCUMENT_ID_PREFIX, endkey: DOCUMENT_ID_PREFIX + '\uffff'
      // })
        .then(result => {
          resolve(result.rows.map(row => dbDocumentToFileAdapter(row.doc)))
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Search a file by his hash and deleted it
   */
  deleteFileFromHash(fileHash) {
    return this.db.remove(fileName)
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

export default { File, FileStorage, initFileSystem, PATH_SEPARATOR }

// vim: set backupcopy=yes :

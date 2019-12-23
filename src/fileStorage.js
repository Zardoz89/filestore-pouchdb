/**
 * Simple file storage over PouchDb
 *
 * Handles a simple file storage over PouchDB. Mimics some functionality of a virtual filesystem like directories and
 * file hierarchy, but avoids to try to be a full virtual filesystem.
 */
/* eslint-env browser, es2017 */
import { DEFAULT_DATABASE_NAME, PATH_SEPARATOR, DOCUMENT_ID_PREFIX } from './constants.js'
import { normalizePath, getFatherDirectory } from './utils.js'
import { FsFile, Directory } from './File.js'
import { FileStoreError, unknowError } from './FileStoreError'
import FileNotFoundError from './FileNotFoundError'
import FileWithSamePath from './FileWithSamePath'
import InvalidPathError from './InvalidPathError'
import DbDocument from './DbDocument.js'

import PouchDb from 'pouchdb'
import FindPlugin from 'pouchdb-find'

PouchDb.plugin(FindPlugin)

/**
 * Adapter function that generated a valid File class from a DbDocument class
 * @param {DbDocument} dbDocument
 */
function dbDocumentToFileAdapter(dbDocument) {
  if (dbDocument.isDirectory) {
    return new Directory(FsFile.getPathFromPathElements(dbDocument.pathElements))
  }
  let blob = null
  let type = null
  if (dbDocument._attachments && dbDocument._attachments.self) {
    if (!dbDocument._attachments.self.stub) {
      blob = dbDocument._attachments.self.data
      type = dbDocument._attachments.self.content_type
    }
  }
  return new FsFile(FsFile.getPathFromPathElements(dbDocument.pathElements), dbDocument.label, blob, type, dbDocument.lastModified)
}

/**
 * Verify if teh father directory exists
 * @param db {PouchDb} database
 * @param pathElements {array} pathElements
 * @return {boolean} True if the fatherDirectory exists
 */
async function verifyFatherDirectoryExists(db, pathElements, throwError) {
  if (pathElements.length > 1) {
    const fatherDirectory = getFatherDirectory(pathElements)
    const fatherDirectoryDocument = await searchDocumentsByPath(db, fatherDirectory)
    if (fatherDirectoryDocument.length === 0) {
      if (throwError) {
        throw new InvalidPathError(`Father directory ${FsFile.getPathFromPathElements(fatherDirectory)} not exists.`)
      }
      return false
    }
  }
  return true
}

async function searchDocumentsByPath(db, pathElements) {
  const response = await db.find({
    selector: {
      pathElements: { $eq: pathElements }
    }
  })
    .catch(err => {
      throw unknowError(err)
    })
  if (response.docs && response.docs.length > 0) {
    return response.docs
  }
  return []
}

/**
 * File storage wrapper over a PouchDb database
 */
class FileStorage {
  constructor(db) {
    this.db = db
  }

  generateFileId(file) {
    return file.path
  }

  /**
   * Cleans the whole filesystem in database
   * @returns {boolean} True if does it sucesfully
   */
  async format() {
    let allDocs = await this.db.allDocs({ include_docs: true, startkey: DOCUMENT_ID_PREFIX, endkey: DOCUMENT_ID_PREFIX + '\uffff' })
      .catch((err) => {
        if (err.name !== 'not_found') {
          throw unknowError(err)
        }
      })

    allDocs = allDocs.rows.map(row => {
      return { _id: row.id, _rev: row.doc._rev, _deleted: true }
    })

    await this.db.bulkDocs(allDocs)
      .catch((err) => {
        if (err.name !== 'not_found') {
          throw unknowError(err)
        }
      })
    return true
  }

  /**
   * Adds a file to the filesystem
   * @param file File that contains the data and the metadata
   * @param {object} [options] - Options
   * @param {object} [options.overwrite] - Overwrites any existing previous file
   * @return {string} File path
   */
  async addFile(file, options = { overwrite: false }) {
    const pathElements = file.getPathElements()
    if (pathElements.length === 0) {
      throw new InvalidPathError(`Invalid file path ${file.path}`)
    }
    const fileId = this.generateFileId(file)
    const documentId = DOCUMENT_ID_PREFIX + fileId

    // Verify that father directory exists
    await verifyFatherDirectoryExists(this.db, pathElements, true)

    const document = new DbDocument(documentId, pathElements, file.label, file instanceof Directory, file.lastModified, file.blob, file.type)

    // Check file duplication
    const originalDoc = await this.db.get(documentId)
      .catch((err) => {
        if (err.name !== 'not_found') {
          throw unknowError(err)
        }
      })
    if (originalDoc !== undefined) {
      if (!options.overwrite) {
        throw new FileWithSamePath(`File with the same path exists. Use options.overwrite = true to replace it. Path: ${file.path}`)
      } else {
        document._rev = originalDoc._rev
      }
    }

    await this.db.put(document)
      .catch((err) => {
        throw unknowError(err)
      })
    return fileId
  }

  /**
   * Generates a directory
   *
   * A directory consists on a special file with empty data
   * @param {string} path - Path of the directory
   * @param {object} [options - Options
   * @param {object} [options.parent] - Makes father directories. If father directories exists, don't fail
   * @return {string} Directory path
   */
  async mkDir(path, options = { parents: false }) {
    const directory = new Directory(path)
    if (options.parents) {
      const pathElements = directory.getPathElements().map((val, index, arr) => {
        if (index === 0) {
          return val
        }
        return arr.slice(0, index + 1).join(PATH_SEPARATOR)
      })
      for (const element of pathElements) {
        await this.addFile(new Directory(element))
          .catch(err => {
            if (!(err instanceof FileWithSamePath)) {
              throw err
            }
          })
      }
      return directory.path
    }

    return this.addFile(directory)
  }

  /**
   * Deletes a directory
   * @param {string} path - Path of the directory
   * @param {object} [options] - Options
   * @param {object} [options.recursive] - Delete all content of the directory on a recursive way
   * @returns {boolean} True if deletes sucesfully one or more directories or files. False if not deleted anything
   */
  async rmDir(path, options = { recursive: false }) {
    path = normalizePath(path)
    const docId = DOCUMENT_ID_PREFIX + path
    const doc = await this.db.get(docId, { attachments: false })
      .catch(err => {
        if (err.name !== 'not_found') {
          throw unknowError(err)
        }
        return false
      })
    if (!doc) {
      return false
    }
    if (!doc.isDirectory) {
      return false
    }

    // Check if it have childrens and implement the logic of options.recursive
    const childrens = await this.listAllFilesOnAPath(path, { onlyPaths: true })
    if (childrens.length > 0 && !options.recursive) {
      return false
    } else if (options.recursive) {
      await Promise.all(childrens.map(children => { this.rmDir(children, options) }))
    }

    return this.db.remove(doc._id, doc._rev)
      .catch(err => {
        throw unknowError(err)
      })
      .then(result => {
        return result.ok
      })
  }

  /**
   * Return a file using his path
   * @param {string} path Path to the file
   * @return {File} A instance of File if the path points to a valid file or directory
   */
  async getFile(path) {
    path = normalizePath(path)
    const docId = DOCUMENT_ID_PREFIX + path
    const doc = await this.db.get(docId, { attachments: true, binary: true })
      .catch(err => {
        if (err.name === 'not_found') {
          throw new FileNotFoundError(`File with path ${path} not found.`)
        } else {
          throw unknowError(err)
        }
      })
    return dbDocumentToFileAdapter(doc)
  }

  /**
   * Return all the files stored
   * @param {object} options
   * @param {object} [options.onlyPaths] - Only retrives the paths
   * @return {array} A sorted array of File or a sorted array of strings with the paths if onlyPaths is true
   */
  async listAllFiles(options = { onlyPaths: false }) {
    const allDocs = await this.db.query('path', { include_docs: true, attachments: !options.onlyPaths, binary: !options.onlyPaths })
      .catch(err => {
        throw unknowError(err)
      })
    if (options.onlyPaths) {
      return allDocs.rows.map(row => dbDocumentToFileAdapter(row.doc).path)
    } else {
      return allDocs.rows.map(row => dbDocumentToFileAdapter(row.doc))
    }
  }

  /**
   * Return all the files stored on a subdir
   * @param {object} options
   * @param {object} [options.onlyPaths] - Only retrives the paths
   * @return {array} A sorted array of File or a sorted array of strings with the paths if onlyPaths is true
   */
  async listAllFilesOnAPath(path, options = { onlyPaths: false }) {
    path = normalizePath(path)
    const level = (path.match(new RegExp(PATH_SEPARATOR, 'g')) || []).length
    const allFiles = await this.listAllFiles(options)
    if (options.onlyPaths) {
      let files = allFiles.filter(file => file.startsWith(path))
      files = files.filter(file => {
        const fileLevel = (file.match(new RegExp(PATH_SEPARATOR, 'g')) || []).length
        return (level + 1) === fileLevel
      })
      return files
    } else {
      let files = allFiles.filter(file => file.path.startsWith(path))
      files = files.filter(file => {
        const pathLevel = (file.path.match(new RegExp(PATH_SEPARATOR, 'g')) || []).length
        return (level + 1) === pathLevel
      })
      return files
    }
  }

  /**
   * Search a file by his id and deleted it
   * @param fileid - Id of the file to be deleted
   * @return {boolean} True if the file exists and is been deleted. False if the file doesn't exists
   */
  async delete(filePath) {
    const docId = DOCUMENT_ID_PREFIX + normalizePath(filePath)
    const doc = await this.db.get(docId, { attachments: false })
      .catch(err => {
        if (err.name !== 'not_found') {
          throw unknowError(err)
        }
        return false
      })
    if (!doc) {
      return false
    }
    if (doc.isDirectory) {
      return false
    }

    return this.db.remove(doc._id, doc._rev)
      .catch(err => {
        throw unknowError(err)
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
 * @param {string|PouchDB} [database] - The name of the database to use or a PouchDB instance
 * @param {object} [pouchdbOptions] - PouchDb database creation options
 * @return {Promise} A valid instance of FileStorage
 */
async function initFileSystem(database, pouchdbOptions = {}) {
  let db = null
  if (database instanceof PouchDb) {
    db = database
  } else {
    if (!database || database === '') {
      database = DEFAULT_DATABASE_NAME
    }
    db = new PouchDb(database, pouchdbOptions)
  }

  const initializedDocument = await db.get('_local/filestorage')
    .catch(err => {
      if (err.name !== 'not_found') {
        throw unknowError(err)
      }
    })

  if (!initializedDocument || !initializedDocument.initialized) {
    // Adds a index to quickly search by path
    await db.createIndex({
      index: {
        fields: ['pathElements']
      }
    })
      .catch(err => {
        throw unknowError(err)
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
          throw err
        }
      })
      .catch(err => {
        throw unknowError(err)
      })

    await db.put({
      _id: '_local/filestorage',
      initialized: true
    })
      .catch(err => {
        throw unknowError(err)
      })
  }

  return new FileStorage(db)
}

export default {
  FsFile,
  FileStorage,
  initFileSystem,
  PATH_SEPARATOR,
  normalizePath,
  FileStoreError,
  FileNotFoundError,
  InvalidPathError,
  FileWithSamePath
}

// vim: set backupcopy=yes :

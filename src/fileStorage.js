import PouchDb from 'pouchdb'
import FindPlugin from 'pouchdb-find'

PouchDb.plugin(FindPlugin)

const DEFAULT_DATABASE_NAME = 'fileStorage'
const PATH_SEPARATOR = '/'
const DOCUMENT_ID_PREFIX = 'file_'

class DbDocument {
  constructor(_id, pathElements, name, mimeType, blob) {
    this._id = _id
    this.pathElements = pathElements
    this.name = name
    this.mimeType = mimeType
    this.blob = blob
  }
}

class File {
  constructor(path, logicalName, mimeType, blob) {
    this.path = path
    this.logicalName = logicalName
    this.mimeType = mimeType
    this.blob = blob
  }

  getPathElements() {
    return File.getPathElements(this.path)
  }

  static getPathElements(path) {
    return path.split(PATH_SEPARATOR).filter(Boolean)
  }

  static getPathFromPathElements(pathElements) {
    return pathElements.join(PATH_SEPARATOR)
  }
}

function dbDocumentToFileAdapter(dbDocument) {
  return new File(File.getPathFromPathElements(dbDocument.pathElements), dbDocument.name, dbDocument.mimeType,
    dbDocument.blob)
}

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
  */
  addFile(file) {
    const pathElements = file.getPathElements()
    const fileName = file.logicalName
    const id = fileName // TODO hash from blob
    const document = new DbDocument(DOCUMENT_ID_PREFIX + id, pathElements, fileName, '', file.blob)

    return this.db.put(document)
  }

  getFileFromHash(fileHash) {
    return new Promise((resolve, reject) => {
      this.db.get(DOCUMENT_ID_PREFIX + fileHash)
        .then(doc => {
          resolve(dbDocumentToFileAdapter(doc))
        })
        .catch(err => reject(err))
    })
  }

  getFile(path) {
    // TODO
    // const pathElements = File.getPathElements(path)
    this.db.query('path')
      .then(result => {
        console.log(result)
      })
      .catch(err => console.error(err))
  }

  listAllFiles() {
    return new Promise((resolve, reject) => {
      this.db.allDocs({
        include_docs: true, attachments: true, startkey: DOCUMENT_ID_PREFIX, endkey: DOCUMENT_ID_PREFIX + '\uffff'
      })
        .then(result => {
          resolve(result.rows.map(row => dbDocumentToFileAdapter(row.doc)))
        })
        .catch(err => reject(err))
    })
  }

  deleteFileFromHash(fileHash) {
    return this.db.remove(fileName)
  }
}

function initFileSystem(databaseName) {
  if (!databaseName || databaseName === '') {
    databaseName = DEFAULT_DATABASE_NAME
  }
  const db = new PouchDb(databaseName)

  /*
  db.createIndex({
    index: {
      fields: ['pathElements']
    }
  })
  */

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
  db.put(pathViewDocument).catch(err => {
    if (err.name !== 'conflict') {
      console.error(err)
      throw err
    }
  })

  return new FileStorage(db)
}

export default { File, initFileSystem }

// vim: set backupcopy=yes :

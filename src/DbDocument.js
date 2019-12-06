/**
 * Document to be stored in the database
 */
export class DbDocument {
  /**
   * Constructor
   * @param {string} id
   * @param {array} pathElements
   * @param {string} label
   * @param {boolean} isDirectory - Flag that marks the document as a directory
   * @param {string} mimeType
   * @param blob
   */
  constructor(_id, pathElements, label, isDirectory, mimeType, blob) {
    this._id = _id
    this.pathElements = pathElements
    this.label = label
    this.isDirectory = isDirectory
    this.mimeType = mimeType
    this.blob = blob
  }
}

/**
 * Document to be stored in the database
 */
/* eslint-env browser, es2017 */
export default class DbDocument {
  /**
   * Constructor
   * @param {string} id
   * @param {array} pathElements
   * @param {string} label
   * @param {boolean} isDirectory - Flag that marks the document as a directory
   * @param {blob|string} blob - A blob to be stored as attachment
   */
  constructor(_id, pathElements, label, isDirectory, blob) {
    this._id = _id
    this.pathElements = pathElements
    this.label = label
    this.isDirectory = isDirectory
    if (blob != null) {
      this._attachments = {
        self: {
          content_type: blob.type,
          data: blob
        }
      }
    }
  }
}

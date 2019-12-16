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
   * @param {number} lastModified - Number of milliseconds since the Unix epoch (January 1, 1970 at midnight)
   * @param {blob} blob - A blob to be stored as attachment
   */
  constructor(_id, pathElements, label, isDirectory, lastModified, blob) {
    this._id = _id
    this.pathElements = pathElements
    this.label = label
    this.isDirectory = isDirectory
    this.lastModified = lastModified
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

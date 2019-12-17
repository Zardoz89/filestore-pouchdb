/**
 * Document to be stored in the database
 *
 * @module
 * @private
 */
/* eslint-env es2017 */

/**
 * Document to be stored in teh pouchdb database
 * @private
 */
class DbDocument {
  /**
   * Constructor
   * @private
   * @param {string} id
   * @param {array} pathElements
   * @param {string} label
   * @param {boolean} isDirectory - Flag that marks the document as a directory
   * @param {number} lastModified - Number of milliseconds since the Unix epoch (January 1, 1970 at midnight)
   * @param {blob|buffer} blob - A blob to be stored as attachment
   * @param {string} type - Content type of thw data to be stored
   */
  constructor(_id, pathElements, label, isDirectory, lastModified, blob, type) {
    this._id = _id
    this.pathElements = pathElements
    this.label = label
    this.isDirectory = isDirectory
    this.lastModified = lastModified
    if (blob != null) {
      this._attachments = {
        self: {
          content_type: type,
          data: blob
        }
      }
    }
  }
}

export default DbDocument


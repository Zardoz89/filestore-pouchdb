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
   * @param {string} mimeType - mime type of the date to be stored
   * @param {blob|string} blob - A blob or base64 string to be stored as attachment
   */
  constructor(_id, pathElements, label, isDirectory, mimeType, blob) {
    this._id = _id
    this.pathElements = pathElements
    this.label = label
    this.isDirectory = isDirectory
    if (blob != null) {
      this._attachments = {
        self: {
          content_type: mimeType,
          data: blob
        }
      }
    }
  }
}

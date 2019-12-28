/**
 * Constants used everywhere on FileStorage
 * @license MIT
 * @module constants
 */

/**
 * Library version
 * @constant {string}
 * @default
 */
export const VERSION = '0.0.1'
/**
 * Default database name to use
 * @constant {string}
 * @default
 * @private
 */
export const DEFAULT_DATABASE_NAME = 'fileStorage'
/**
 * Path separator
 * @constant {string}
 * @default
 */
export const PATH_SEPARATOR = '/'
/**
 * Database doucment ID prefix to differenciate from '_design' or other data store in it @constant {string}
 * @private
 */
export const DOCUMENT_ID_PREFIX = 'file_'
/**
 * Document ID that flags if the file storage is initialized
 * @private
 */
export const INITIALIZED_FLAG_DOCUMENT_ID = '_local/filestorage'


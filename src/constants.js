/**
 * Constants used everywhere on FileStorage
 */

/** Library version */
export const VERSION = '0.0.1'
/** Default database name to use @constant {string} @default */
export const DEFAULT_DATABASE_NAME = 'fileStorage'
/** Path separator @constant {string} @default */
export const PATH_SEPARATOR = '/'
/** Database doucment ID prefix to differenciate from '_design' or other data store in it @constant {string} */
export const DOCUMENT_ID_PREFIX = 'file_'
/** Document ID that flags if the file storage is initialized */
export const INITIALIZED_FLAG_DOCUMENT_ID = '_local/filestorage'


/**
 * Misc helper functions
 * @license MIT
 * @module utils
 */

import { PATH_SEPARATOR } from './constants.js'

/**
 * Applies Unicode NFD normalization
 * @param {string} string - A string to normalize
 */
export function normalizeString(string) {
  return string.trim().normalize('NFD')
}

/**
 * Normalizes a path to avoid problems
 * @param {string} path - A string with a path to normalize
 */
export function normalizePath(path) {
  const normalizedPathString = normalizeString(path)
  if (normalizedPathString.indexOf(PATH_SEPARATOR) === 0) {
    return normalizedPathString.substring(1)
  }
  return normalizedPathString
}

/**
 * Returns the father directoy of a path
 * @param {array} pathElements - Path
 * @returns {array} Father directoy path or null if the path is on the root
 */
export function getFatherDirectory(pathElements) {
  if (pathElements.length > 1) {
    return pathElements.slice(0, pathElements.length - 1)
  }
  return null
}


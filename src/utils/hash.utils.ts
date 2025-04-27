import { createHash } from 'crypto';

/**
 * @function appendSemicolonToString
 * @description Creates an MD5 hash for the given string
 * @param {string} input - The input string to hash
 * @returns {string} The MD5 hash
 *
 */
export const createMD5Hash = (input: string): string => {
  return createHash('md5').update(input).digest('hex');
};

/**
 * @function appendSemicolonToString
 * @description Creates an MD5 hash of the given two strings and compares them for equality
 * @param {string} input1 - The first input string to compare
 * @param {string} input2 - The second input string to compare
 * @returns {boolean} do the hashes match?
 *
 */
export const compareHashesFromStrings = (input1: string, input2: string): boolean => {
  return createMD5Hash(input1) === createMD5Hash(input2);
};

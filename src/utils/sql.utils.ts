import { readdir } from 'fs/promises';

/**
 * @function extractTableName
 * @description Extracts the table name of the given SQL trigger. Falls back to null
 * if no match is found
 * @param {string} triggerSql - Trigger SQL string
 * @returns {string} returns the table name that the trigger is created on or returns null
 * by default
 *
 */
export function extractTableName(triggerSql: string): string | null {
  // A regex to extract the schema and table name from the trigger SQL.
  const tableMatch = triggerSql.match(/ON\s+([a-zA-Z0-9_`"]+(?:\.[a-zA-Z0-9_`"]+)?)/);

  if (tableMatch) {
    return tableMatch[1].replace(/`/g, '').toLowerCase().split('.').pop() as string; // This will return schema.table or just table
  } else {
    return null;
  }
}

/**
 * @function extractFunctionName
 * @description Extracts the function name of the given SQL trigger. Falls back to null
 * if no match is found
 * @param {string} triggerSql - Trigger SQL string
 * @returns {string | null} returns the function name that the trigger uses on or returns null
 * by default
 *
 */
export function extractFunctionName(triggerSql: string): string | null {
  // A regex to extract the function name from the trigger SQL
  const functionMatch = triggerSql.match(/EXECUTE\s+FUNCTION\s+(\w+)/);
  return functionMatch ? functionMatch[1] : null;
}

/**
 * @function getFilesWithDirectories
 * @description Grab the files from the directory and make an object combining the two
 * @param {string[]} directories - The directories to get files from
 * @returns {Promise<{ fileName: string; directory: string }[][]>} returns an array of promises for each
 * directory that contains an array of file name and directory name mapping
 *
 */
export function getFilesWithDirectories(
  directories: string[]
): Promise<{ fileName: string; directory: string }[][]> {
  return Promise.all(
    directories.map(async (dir) => {
      try {
        const files = await readdir(dir); // Read files in the current directory
        return files.map((file) => ({ fileName: file, directory: dir })); // Return array of file objects
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
        return []; // Return empty array in case of error
      }
    })
  );
}

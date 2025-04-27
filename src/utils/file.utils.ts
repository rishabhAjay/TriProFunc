import { createReadStream, existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { fs } from 'memfs';
import { TDataOut } from 'memfs/lib/encoding';
import path from 'path';
import { createInterface } from 'readline/promises';

/**
 * @function createDirectoryIfNotExists
 * @description Creates the directory if it does not exist
 * @param {string} directoryName - The name of the directory to create
 * @returns {Promise<void> | null} The mkdir promise or null
 *
 */
export const createDirectoryIfNotExists = (directoryName: string): Promise<void> | null => {
  if (!existsSync(directoryName)) {
    return mkdir(process.cwd() + `/${directoryName}`);
  }
  return null;
};

/**
 * @function createMigrationUpAndDownFilesInMemory
 * @description Creates the UP and DOWN migration files in memory if it does not exist
 * @param {number} timestamp - The timestamp associated with the file creation
 * @param {string} migrationName - The migration file name
 * @returns { Promise<[void, void]> | null} The writeFile promises or null
 *
 */
export const createMigrationUpAndDownFilesInMemory = (
  timestamp: number,
  migrationName: string
): Promise<[void, void]> | null => {
  if (
    !fs.existsSync(`/${timestamp}_${migrationName}_up.sql`) &&
    !fs.existsSync(`/${timestamp}_${migrationName}_down.sql`)
  )
    return Promise.all([
      fs.promises.writeFile(`/${timestamp}_${migrationName}_up.sql`, '-- UP'),

      fs.promises.writeFile(`/${timestamp}_${migrationName}_down.sql`, '-- DOWN'),
    ]);
  return null;
};

/**
 * @function appendToMigrationFilesInMemory
 * @description Appends DOWN and UP contents of the migration to the respective migration files in memory
 * @param {number} timestamp - The timestamp associated with the file creation
 * @param {string} migrationName - The migration file name
 * @param {string} downContents - The contents of the DOWN part of the migration
 * @param {string} upContents - The contents of the UP part of the migration
 * @returns { Promise<[void, void]>} The appendFile promises or null
 *
 */
export const appendToMigrationFilesInMemory = (
  timestamp: number,
  migrationName: string,
  downContents: string,
  upContents: string
): Promise<[void, void]> => {
  return Promise.all([
    fs.promises.appendFile(
      `/${timestamp}_${migrationName}_up.sql`,
      `\n${upContents}${appendSemicolonToString(upContents)}`
    ),
    fs.promises.appendFile(
      `/${timestamp}_${migrationName}_down.sql`,
      `\n${downContents}${appendSemicolonToString(downContents)}`
    ),
  ]);
};

/**
 * @function readMigrationFilesInMemory
 * @description Read the migration UP and DOWN files present in memory
 * @param {number} timestamp - The timestamp associated with the file creation
 * @param {string} migrationName - The migration file name
 * @returns {Promise<[TDataOut, TDataOut]>} The readFile promises or null
 *
 */
export const readMigrationFilesInMemory = (
  timestamp: number,
  migrationName: string
): Promise<[TDataOut, TDataOut]> => {
  return Promise.all([
    fs.promises.readFile(`/${timestamp}_${migrationName}_up.sql`),
    fs.promises.readFile(`/${timestamp}_${migrationName}_down.sql`),
  ]);
};

/**
 * @function writeCombinedMigrationFileToDisk
 * @description Read the migration UP and DOWN files present in memory and write it to disk
 * in the given migration directory
 * @param {number} timestamp - The timestamp associated with the file creation
 * @param {string} migrationName - The migration file name
 * @param {string} migrationDirectory - The parent directory of migration files
 * @returns {Promise<void>} The writeFile promise
 *
 */
export const writeCombinedMigrationFileToDisk = async (
  timestamp: number,
  migrationName: string,
  migrationDirectory: string
): Promise<void> => {
  const [upMigrationInMem, downMigrationInMem] = await readMigrationFilesInMemory(
    timestamp,
    migrationName
  );
  return writeFile(
    process.cwd() + `/${migrationDirectory}/${timestamp}_${migrationName}.sql`,
    upMigrationInMem + '\n' + downMigrationInMem
  );
};

/**
 * @function writeCombinedMigrationFileToDisk
 * @description Return the contents between two markers within a file,
 * if the endLine argument is not present, assume it as till EOF
 * @param {string} directory - The timestamp associated with the file creation
 * @param {string} filePath - The migration file name
 * @param {string} startLine - The parent directory of migration files
 * @param {string} [endLine] - The parent directory of migration files(optional)
 * @returns { Promise<string | void>} The file contents in string or void
 *
 */
export const extractContentBetweenLines = (
  directory: string,
  filePath: string,
  startLine: string,
  endLine?: string
): Promise<string | void> => {
  return new Promise((resolve, reject) => {
    const inputStream = createReadStream(path.join(process.cwd() + `/${directory}`, filePath));
    const rl = createInterface({
      input: inputStream,
      crlfDelay: Infinity,
    });

    let isBetweenLines = false; // Flag to track if we're between the start and end lines
    let result: string[] = [];

    rl.on('line', (line) => {
      // Check if the current line matches the start string
      if (line.includes(startLine)) {
        isBetweenLines = true;
        return;
      }
      if (endLine && line.includes(endLine) && isBetweenLines) {
        isBetweenLines = false; // Stop collecting after the end string
        return;
      }
      // If we are between the start and end lines, push to the result
      if (isBetweenLines) {
        result.push(line);
      }

      // Check if the current line matches the end string
    });

    rl.on('close', () => {
      isBetweenLines = false;
      // Output the extracted lines (between the start and end strings)
      resolve(result.join('\n'));
    });
    rl.on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * @function appendSemicolonToString
 * @description Appends a semicolon if it is missing from the given sql string
 * @param {string} sqlString - The sql string to append the semicolon to
 * @returns {string} The sql string with appended semicolon
 *
 */
export const appendSemicolonToString = (sqlString: string): string => {
  return sqlString && sqlString !== '' ? (sqlString.trim().slice(-1) === ';' ? '' : ';') : '';
};

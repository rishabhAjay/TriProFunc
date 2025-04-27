import chalk from 'chalk';
import { highlight } from 'sql-highlight';

export class LoggingService {
  constructor() {}
  error(message: string, error?: any) {
    console.error(chalk.red.bold.underline(`${message}`), error);
  }

  warn(message: string) {
    console.warn(chalk.yellowBright.bold(`${message}`));
  }

  info(message: string) {
    console.log(chalk.hex('#02acf0').bold(`${message}`));
  }

  success(message: string) {
    console.log(chalk.greenBright.bold.underline(`${message}`));
  }

  sqlLog(sql: string) {
    console.log(
      highlight(sql, {
        colors: {
          keyword: '\x1b[34m', // SQL reserved keywords
          identifier: '\x1b[90m',
          function: '\x1b[35m', // Functions
          number: '\x1b[32m', // Numbers
          string: '\x1b[32m', // Strings
          special: '\x1b[94m', // Special characters
          bracket: '\x1b[93m', // Brackets (parentheses)
          comment: '\x1b[2m\x1b[90m', // Comments
          clear: '\x1b[0m', // Clear (inserted after each match)
        },
      })
    );
  }
}

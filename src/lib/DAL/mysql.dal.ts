import { FieldPacket, QueryResult } from 'mysql2';
import { IDAL, IStatementKeys, IStatementObject } from './IDAL';

export class MysqlDAL implements IDAL {
  constructor() {}

  returnResult(queryResult: [QueryResult, FieldPacket[]]) {
    return queryResult[0] as Array<any>;
  }

  returnSingleResult(queryResult: [QueryResult, FieldPacket[]]) {
    return (queryResult as any)[0][0];
  }

  returnResultCount(queryResult: [QueryResult, FieldPacket[]]) {
    return queryResult[0];
  }

  cleanQueryDefiner(sql: string, createOrReplace: boolean = false): string {
    return sql
      .replace(
        /^CREATE DEFINER=`[^`]+`@`[^`]+` /,
        createOrReplace ? 'CREATE OR REPLACE ' : 'CREATE '
      )
      .trim();
  }

  mapQueryStatementObjects(resultObject: any, statementType: IStatementKeys): IStatementObject {
    let objectProperty = `SQL Original Statement`;
    switch (statementType) {
      case 'trigsrc':
        objectProperty = `SQL Original Statement`;
        break;
      case 'prosrc':
        objectProperty = `Create Procedure`;
        break;
      case 'funsrc':
        objectProperty = `Create Function`;
        break;
      case 'tabledef':
        objectProperty = `Create Table`;
        break;
      default:
        break;
    }
    return {
      [statementType]: this.cleanQueryDefiner(
        this.returnSingleResult(resultObject)[objectProperty]
      ) as string,
    } as IStatementObject;
  }
}

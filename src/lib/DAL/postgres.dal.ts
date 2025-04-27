import { QueryResult } from 'pg';
import { IDAL, IStatementKeys, IStatementObject } from './IDAL';

export class PostgresDAL implements IDAL {
  constructor() {}

  returnResult(queryResult: QueryResult<any>) {
    return queryResult.rows;
  }

  returnSingleResult(queryResult: QueryResult<any>) {
    return queryResult.rows[0];
  }

  returnResultCount(queryResult: QueryResult<any>) {
    return Number(queryResult.rowCount);
  }

  cleanQueryDefiner(sql: string): string {
    return sql.trim();
  }

  mapQueryStatementObjects(resultObject: any, statementType: IStatementKeys): IStatementObject {
    return {
      [statementType]: this.cleanQueryDefiner(
        this.returnSingleResult(resultObject)[statementType]
      ) as string,
    } as IStatementObject;
  }
}

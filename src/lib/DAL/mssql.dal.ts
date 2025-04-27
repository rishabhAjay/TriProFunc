import { IDAL, IStatementKeys, IStatementObject } from './IDAL';
import { IResult } from 'mssql';

export class MssqlDAL implements IDAL {
  constructor() {}

  returnResult(queryResult: IResult<any>) {
    return queryResult.recordset;
  }

  returnSingleResult(queryResult: IResult<any>) {
    return queryResult.recordset[0];
  }

  returnResultCount(queryResult: IResult<any>) {
    return Number(queryResult.rowsAffected[0]);
  }

  cleanQueryDefiner(sql: string): string {
    return sql.trim() + '\n' + 'GO;';
  }

  mapQueryStatementObjects(resultObject: any, statementType: IStatementKeys): IStatementObject {
    return {
      [statementType]: this.cleanQueryDefiner(
        this.returnSingleResult(resultObject)?.[statementType] || ''
      ) as string,
    } as IStatementObject;
  }
}

import { IResult } from 'mssql';
import { FieldPacket, QueryResult as MysqlQueryResult } from 'mysql2';
import { QueryResult } from 'pg';

export type IStatementKeys = 'trigsrc' | 'prosrc' | 'funsrc' | 'tabledef';

export type IStatementObject = {
  [x in IStatementKeys]: string;
};

/**
 * @interface IDAL
 * @description This interface represents the structure of an abstract class for a Data Access Layer.
 * It defines the required properties and methods that any implementing class must follow.
 */
export interface IDAL {
  /**
   * @function returnResult
   * @param {[MysqlQueryResult, FieldPacket[]] | QueryResult<any> | IResult<any>} queryResult -
   * The resulting object of a query
   * @description Returns a standardized array of query results
   * @returns {Array<any>} - An array containing the query results
   *
   */
  returnResult(
    queryResult: [MysqlQueryResult, FieldPacket[]] | QueryResult<any> | IResult<any>
  ): Array<any>;

  /**
   * @function returnSingleResult
   * @param {[MysqlQueryResult, FieldPacket[]] | QueryResult<any> | IResult<any>} queryResult -
   * The resulting object of a query
   * @description Returns a standardized object of query result
   * @returns {any} - An object containing the query result
   *
   */
  returnSingleResult(
    queryResult: [MysqlQueryResult, FieldPacket[]] | QueryResult<any> | IResult<any>
  ): any;

  /**
   * @function returnResultCount
   * @param {[MysqlQueryResult, FieldPacket[]] | QueryResult<any> | IResult<any>} queryResult -
   * The resulting object of a query
   * @description Returns the count of a query result
   * @returns {number | MysqlQueryResult} - A number representing the count of query result
   *
   */
  returnResultCount(
    queryResult: [MysqlQueryResult, FieldPacket[]] | QueryResult<any> | IResult<any>
  ): number | MysqlQueryResult;

  /**
   * @function returnResultCount
   * @param {string} sql - The SQL string to clean
   * @param {string} [createOrReplace] - Return the query with Create or Replace?(optional)
   * @description Applies any transformation on the SQL query
   * @returns {string}  A cleaned SQL query
   *
   */
  cleanQueryDefiner(sql: string, createOrReplace?: boolean): string;

  /**
   * @function returnResultCount
   * @param {any} resultObject - The object of the query result
   * @description Returns a standardized mapping of the returning SQL statements as result
   * @returns {string} - A mapping of different types of queries with the source code of the query
   *
   */
  mapQueryStatementObjects(resultObject: any, statementType: IStatementKeys): IStatementObject;
}

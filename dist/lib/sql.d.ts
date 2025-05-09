import * as parser from 'pgsql-ast-parser';
import { IMutField, IRow, ISemanticType } from '../interfaces';
export declare function parseSQLExpr(sql: string): parser.Expr;
export declare const reservedKeywords: Set<string>;
export declare const sqlFunctions: Set<string>;
export declare const aggFuncs: Set<string>;
export declare function getSQLItemAnalyticType(item: parser.Expr, fields: IMutField[]): [ISemanticType, boolean];
export declare function walkFid(sql: string): string[];
export declare function replaceFid(sql: string, fields: IMutField[]): string;
export declare function expr(sql: string, datas: IRow[] | Record<string, any[]>): string | number | boolean | (string | number | boolean | null)[] | null;

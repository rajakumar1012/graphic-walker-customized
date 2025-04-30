import { IRow, Specification, IFilterFiledSimple, IExpression, IViewQuery, IViewField } from './interfaces';
import { INestNode } from './components/pivotTable/inteface';
export interface IVisSpace {
    dataView: IRow[];
    schema: Specification;
}
export declare const applyFilter: (data: IRow[], filters: readonly IFilterFiledSimple[]) => Promise<IRow[]>;
export declare const transformDataService: (data: IRow[], trans: {
    key: string;
    expression: IExpression;
}[]) => Promise<IRow[]>;
export declare const applyViewQuery: (data: IRow[], query: IViewQuery) => Promise<IRow[]>;
export declare const buildPivotTableService: (dimsInRow: IViewField[], dimsInColumn: IViewField[], allData: IRow[], aggData: IRow[], collapsedKeyList: string[], showTableSummary: boolean, sort?: {
    fid: string;
    type: "ascending" | "descending";
    mode: "row" | "column";
}) => Promise<{
    lt: INestNode;
    tt: INestNode;
    metric: (IRow | null)[][];
}>;
export declare const applySort: (data: IRow[], viewMeasures: string[], sort: "ascending" | "descending") => Promise<IRow[]>;

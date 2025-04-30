import { IRow, Filters, IViewField, IFilterField, IKeyWord, IField, FieldIdentifier } from '../interfaces';
import { type ClassValue } from 'clsx';
export declare function checkMajorFactor(data: IRow[], childrenData: Map<any, IRow[]>, dimensions: string[], measures: string[]): {
    majorKey: string;
    majorSum: number;
};
export declare function checkChildOutlier(data: IRow[], childrenData: Map<any, IRow[]>, dimensions: string[], measures: string[]): {
    outlierKey: string;
    outlierSum: number;
};
export interface IPredicate {
    key: string;
    type: 'discrete' | 'continuous';
    range: Set<any> | [number, number];
}
export declare function getPredicates(selection: IRow[], dimensions: string[], measures: string[]): IPredicate[];
export declare function getPredicatesFromVegaSignals(signals: Filters, dimensions: string[], measures: string[]): IPredicate[];
export declare function filterByPredicates(data: IRow[], predicates: IPredicate[]): IRow[];
export declare function applyFilters(dataSource: IRow[], filters: Filters): IRow[];
export declare function createCountField(): IViewField;
export declare function createVirtualFields(): IViewField[];
export declare function getFieldIdentifier(field: IField): FieldIdentifier;
export declare function getRange(nums: number[]): [number, number];
export declare function makeNumbersBeautiful(nums: number[]): number[];
export declare function classNames(...classes: (string | undefined)[]): string;
export declare function getMeaAggName(meaName: string, agg?: string | undefined): string;
export declare function getMeaAggKey(meaKey: string, agg?: string | undefined): string;
export declare function getFilterMeaAggKey(field: IFilterField): string;
export declare function getSort({ rows, columns }: {
    rows: readonly IViewField[];
    columns: readonly IViewField[];
}): import("../interfaces").ISortMode;
export declare function getSortedEncoding({ rows, columns }: {
    rows: readonly IViewField[];
    columns: readonly IViewField[];
}): "none" | "row" | "column";
export declare function parseCmpFunction(str?: string): (a: any, b: any) => number;
export declare function parseErrorMessage(errorLike: any): string;
export declare const formatDate: (date: Date) => string;
export declare const isNotEmpty: <T>(x: T | undefined | null) => x is T;
export declare function parseKeyword(keyword: IKeyWord): RegExp;
export declare function range(start: number, end: number): number[];
export declare function binarySearchClosest<T>(arr: T[], target: number, keyF: (v: T) => number): T;
export declare function startTask(task: () => void): void;
export declare function cn(...inputs: ClassValue[]): string;
export declare function _unstable_encodeRuleValue(value: any): any;
export declare function arrayEqual(list1: any[], list2: any[]): boolean;

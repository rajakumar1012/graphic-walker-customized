import { IChart, IMutField, DraggableFieldState, IFilterRule, ISortMode, IAggregator, IVisualLayout, IVisualConfigNew, IVisSpec, PartialChart, ICoordMode, IGeoUrl, ISemanticType, IPaintMap, IField, IPaintMapV2, IDefaultConfig } from '../interfaces';
import type { FeatureCollection } from 'geojson';
import { KVTuple } from './utils';
import { WithHistory, freeze } from './withHistory';
import { DATE_TIME_DRILL_LEVELS, DATE_TIME_FEATURE_LEVELS } from '../constants';
type normalKeys = keyof Omit<DraggableFieldState, 'filters'>;
export declare enum Methods {
    setConfig = 0,
    removeField = 1,
    reorderField = 2,
    moveField = 3,
    cloneField = 4,
    createBinlogField = 5,
    appendFilter = 6,
    modFilter = 7,
    writeFilter = 8,
    setName = 9,
    applySort = 10,
    transpose = 11,
    setLayout = 12,
    setFieldAggregator = 13,
    setGeoData = 14,
    setCoordSystem = 15,
    createDateDrillField = 16,
    createDateFeatureField = 17,
    changeSemanticType = 18,
    setFilterAggregator = 19,
    addFoldField = 20,
    upsertPaintField = 21,
    addSQLComputedField = 22,
    removeAllField = 23,
    editAllField = 24,
    replaceWithNLPQuery = 25
}
export type PropsMap = {
    [Methods.setConfig]: KVTuple<IVisualConfigNew>;
    [Methods.removeField]: [keyof DraggableFieldState, number];
    [Methods.reorderField]: [keyof DraggableFieldState, number, number];
    [Methods.moveField]: [normalKeys, number, normalKeys, number, number | null];
    [Methods.cloneField]: [normalKeys, number, normalKeys, number, string, number | null];
    [Methods.createBinlogField]: [normalKeys, number, 'bin' | 'binCount' | 'log10' | 'log2' | 'log', string, number];
    [Methods.appendFilter]: [number, normalKeys, number, null];
    [Methods.modFilter]: [number, normalKeys, number];
    [Methods.writeFilter]: [number, IFilterRule | null];
    [Methods.setName]: [string];
    [Methods.applySort]: [ISortMode];
    [Methods.transpose]: [];
    [Methods.setLayout]: [KVTuple<IVisualLayout>[]];
    [Methods.setFieldAggregator]: [normalKeys, number, IAggregator];
    [Methods.setGeoData]: [FeatureCollection | undefined, string | undefined, IGeoUrl | undefined];
    [Methods.setCoordSystem]: [ICoordMode];
    [Methods.createDateDrillField]: [normalKeys, number, (typeof DATE_TIME_DRILL_LEVELS)[number], string, string, string | undefined, number | undefined];
    [Methods.createDateFeatureField]: [normalKeys, number, (typeof DATE_TIME_FEATURE_LEVELS)[number], string, string, string | undefined, number | undefined];
    [Methods.changeSemanticType]: [normalKeys, number, ISemanticType];
    [Methods.setFilterAggregator]: [number, IAggregator | ''];
    [Methods.addFoldField]: [normalKeys, number, normalKeys, number, string, number | null];
    [Methods.upsertPaintField]: [IPaintMap | IPaintMapV2 | null, string];
    [Methods.addSQLComputedField]: [string, string, string];
    [Methods.removeAllField]: [string];
    [Methods.editAllField]: [string, Partial<IField>];
    [Methods.replaceWithNLPQuery]: [string, string];
};
export type VisActionOf<T> = T extends Methods ? [T, ...PropsMap[T]] : never;
export type VisAction = VisActionOf<Methods>;
export type VisSpecWithHistory = WithHistory<IChart, VisAction>;
export declare const reducer: (data: IChart, action: VisAction) => IChart;
export declare const perform: (data: VisSpecWithHistory, action: VisAction) => VisSpecWithHistory;
export declare const undo: (data: VisSpecWithHistory) => VisSpecWithHistory;
export declare const redo: (data: VisSpecWithHistory) => VisSpecWithHistory;
export declare const at: (data: VisSpecWithHistory, cursor: number) => IChart;
export { freeze };
export declare const performers: { [K in keyof typeof Methods]: (data: VisSpecWithHistory, ...args: PropsMap[(typeof Methods)[K]]) => VisSpecWithHistory; };
export declare function newChart(fields: IMutField[], name: string, visId?: string, defaultConfig?: IDefaultConfig): IChart;
export declare function fillChart(chart: PartialChart): IChart;
export declare function fromSnapshot(snapshot: PartialChart): VisSpecWithHistory;
export declare function fromFields(fields: IMutField[], name: string, defaultConfig?: IDefaultConfig): VisSpecWithHistory;
export declare function exportFullRaw(data: VisSpecWithHistory, maxHistory?: number): string;
export declare function exportNow(data: VisSpecWithHistory): IChart;
export declare function importNow(data: IChart): VisSpecWithHistory;
export declare function importFull(data: string): VisSpecWithHistory;
export declare function resolveChart(data: string): IChart;
export declare function convertChart(data: IVisSpec): IChart;
export declare function parseChart(chart: IVisSpec | IChart): IChart;

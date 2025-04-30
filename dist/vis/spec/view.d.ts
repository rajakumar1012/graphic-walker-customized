import { IChannelScales, IField, IFieldInfos, IRow, IStackMode } from '../../interfaces';
import { IEncodeProps } from './encode';
export interface SingleViewProps extends IEncodeProps {
    defaultAggregated: boolean;
    stack: IStackMode;
    hasLegend?: boolean;
    hideLegend?: boolean;
    dataSource: readonly IRow[];
}
export declare function getSingleView(props: SingleViewProps): {
    config: any;
    transform: ({
        calculate: string;
        as: string;
    } | null)[];
    mark: {
        type: string;
        opacity: number;
        tooltip: {
            content: string;
        };
    };
    encoding: {
        [key: string]: any;
    };
};
export declare function resolveScale<T extends Object>(scale: T | ((info: IFieldInfos) => T), field: IField | null | undefined, data: readonly IRow[], theme: 'dark' | 'light'): T | undefined;
export declare function resolveScales(scale: IChannelScales, view: any, data: readonly IRow[], theme: 'dark' | 'light'): any;

import { VisSpecWithHistory } from './visSpecHistory';
import type { IChart, IChatMessage } from "../interfaces";
export declare function toVegaSimplified(chart: IChart): any;
export declare function toChatMessage(history: VisSpecWithHistory): IChatMessage[];

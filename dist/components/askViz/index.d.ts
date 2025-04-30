import React from 'react';
import { IAskVizFeedback, IChart, IViewField, IVisSpec } from '../../interfaces';
declare const _default: React.FunctionComponent<{
    api?: string | ((metas: IViewField[], query: string) => PromiseLike<IVisSpec | IChart> | IVisSpec | IChart);
    feedbackApi?: string | ((data: IAskVizFeedback) => void);
    headers?: Record<string, string>;
}>;
export default _default;

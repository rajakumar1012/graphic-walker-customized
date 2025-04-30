import { IComputationFunction, ISemanticType } from '../../interfaces';
import React from 'react';
export interface FieldProfilingProps {
    field: string;
    computation: IComputationFunction;
}
export declare const FieldProfiling: (props: FieldProfilingProps & {
    semanticType: ISemanticType;
    displayOffset?: number;
    offset?: number;
} & {
    key?: React.Key;
}) => React.JSX.Element;

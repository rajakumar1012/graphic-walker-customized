import React from 'react';
import { INestNode } from './inteface';
import { IField } from '../../interfaces';
export interface TreeProps {
    data: INestNode;
    dimsInCol: IField[];
    measInCol: IField[];
    onHeaderCollapse: (node: INestNode) => void;
    onTopTreeHeaderRowNumChange: (num: number) => void;
    enableCollapse: boolean;
    displayOffset?: number;
}
declare const TopTree: React.FC<TreeProps>;
export default TopTree;

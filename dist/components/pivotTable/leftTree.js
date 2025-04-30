import React, { useMemo } from 'react';
import { MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { formatDate } from "../../utils";
import { parsedOffsetDate } from "../../lib/op/offset";
function getChildCount(node) {
    if (node.isCollapsed || node.children.length === 0) {
        return 1;
    }
    return node.children.map(getChildCount).reduce((a, b) => a + b, 0);
}
/**
 * render pivot table left tree table
 * @param node
 * @param dimsInRow
 * @param depth
 * @param cellRows
 * @returns
 */
function renderTree(node, dimsInRow, depth, cellRows, meaNumber, onHeaderCollapse, enableCollapse, displayOffset) {
    const childrenSize = getChildCount(node);
    const { isCollapsed } = node;
    if (depth > dimsInRow.length) {
        return;
    }
    const field = depth > 0 ? dimsInRow[depth - 1] : undefined;
    const formatter = field?.semanticType === 'temporal' ? (x) => formatDate(parsedOffsetDate(displayOffset, field.offset)(x)) : (x) => `${x}`;
    cellRows[cellRows.length - 1].push(React.createElement("td", { key: `${depth}-${node.fieldKey}-${node.value}`, className: `bg-secondary text-secondary-foreground align-top whitespace-nowrap p-2 text-xs m-1 border`, colSpan: isCollapsed ? node.height + 1 : 1, rowSpan: isCollapsed ? Math.max(meaNumber, 1) : childrenSize * Math.max(meaNumber, 1) },
        React.createElement("div", { className: "flex" },
            React.createElement("div", null, formatter(node.value)),
            node.height > 0 && node.key !== '__total' && enableCollapse && (React.createElement(React.Fragment, null,
                isCollapsed && React.createElement(PlusCircleIcon, { className: "w-3 ml-1 self-center cursor-pointer", onClick: () => onHeaderCollapse(node) }),
                !isCollapsed && React.createElement(MinusCircleIcon, { className: "w-3 ml-1 self-center cursor-pointer", onClick: () => onHeaderCollapse(node) }))))));
    if (isCollapsed)
        return;
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        renderTree(child, dimsInRow, depth + 1, cellRows, meaNumber, onHeaderCollapse, enableCollapse);
        if (i < node.children.length - 1) {
            cellRows.push([]);
        }
    }
}
const LeftTree = (props) => {
    const { data, dimsInRow, measInRow, onHeaderCollapse } = props;
    const nodeCells = useMemo(() => {
        const cellRows = [[]];
        renderTree(data, dimsInRow, 0, cellRows, measInRow.length, onHeaderCollapse, props.enableCollapse, props.displayOffset);
        cellRows[0].shift();
        if (measInRow.length > 0) {
            const ans = [];
            for (let row of cellRows) {
                ans.push([
                    ...row,
                    React.createElement("td", { key: `0-${measInRow[0].fid}-${measInRow[0].aggName}`, className: "bg-secondary text-secondary-foreground whitespace-nowrap p-2 text-xs m-1 border" },
                        measInRow[0].aggName,
                        "(",
                        measInRow[0].name,
                        ")"),
                ]);
                for (let j = 1; j < measInRow.length; j++) {
                    ans.push([
                        React.createElement("td", { key: `${j}-${measInRow[j].fid}-${measInRow[j].aggName}`, className: "bg-secondary text-secondary-foreground whitespace-nowrap p-2 text-xs m-1 border" },
                            measInRow[j].aggName,
                            "(",
                            measInRow[j].name,
                            ")"),
                    ]);
                }
            }
            return ans;
        }
        return cellRows;
    }, [data, dimsInRow, measInRow]);
    return (React.createElement("thead", { className: "bg-secondary border" }, nodeCells.map((row, rIndex) => (React.createElement("tr", { className: "border", key: rIndex }, row)))));
};
export default LeftTree;
//# sourceMappingURL=leftTree.js.map
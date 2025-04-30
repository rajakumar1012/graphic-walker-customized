import React from 'react';
import { useMemo } from 'react';
import { getMeaAggKey } from '../../utils';
import { format } from 'd3-format';
function getCellData(cell, measure, formatter) {
    const meaKey = getMeaAggKey(measure.fid, measure.aggName);
    if (cell[meaKey] === undefined) {
        return '--';
    }
    const formattedValue = formatter(cell[meaKey]);
    return formattedValue;
}
const MetricTable = React.memo((props) => {
    const { matrix, meaInRows, meaInColumns, numberFormat } = props;
    const numberFormatter = useMemo(() => {
        const numberFormatter = numberFormat ? format(numberFormat) : (v) => v.toLocaleString();
        return (value) => {
            if (typeof value !== 'number') {
                return `${value}`;
            }
            return numberFormatter(value);
        };
    }, [numberFormat]);
    return (React.createElement("tbody", { className: "bg-background text-foreground border-r border-b" }, matrix.map((row, rIndex) => {
        if (meaInRows.length !== 0) {
            return meaInRows.map((rowMea, rmIndex) => {
                return (React.createElement("tr", { className: "divide-x divide-border", key: `${rIndex}-${rowMea.fid}-${rowMea.aggName}` }, row.flatMap((cell, cIndex) => {
                    cell = cell ?? {};
                    if (meaInColumns.length !== 0) {
                        return meaInColumns.map((colMea, cmIndex) => (React.createElement("td", { className: "whitespace-nowrap p-2 text-xs", key: `${rIndex}-${cIndex}-${rowMea.fid}-${rowMea.aggName}-${colMea.fid}-${colMea.aggName}` },
                            getCellData(cell, rowMea, numberFormatter),
                            " , ",
                            getCellData(cell, colMea, numberFormatter))));
                    }
                    return (React.createElement("td", { className: "whitespace-nowrap p-2 text-xs", key: `${rIndex}-${cIndex}-${rowMea.fid}-${rowMea.aggName}` }, getCellData(cell, rowMea, numberFormatter)));
                })));
            });
        }
        return (React.createElement("tr", { className: "divide-x divide-border", key: rIndex }, row.flatMap((cell, cIndex) => {
            cell = cell ?? {};
            if (meaInRows.length === 0 && meaInColumns.length !== 0) {
                return meaInColumns.map((colMea, cmIndex) => (React.createElement("td", { className: "whitespace-nowrap p-2 text-xs", key: `${rIndex}-${cIndex}-${cmIndex}-${colMea.fid}-${colMea.aggName}` }, getCellData(cell, colMea, numberFormatter))));
            }
            else if (meaInRows.length === 0 && meaInColumns.length === 0) {
                return (React.createElement("td", { className: "whitespace-nowrap p-2 text-xs", key: `${rIndex}-${cIndex}` }, `True`));
            }
            else {
                return meaInRows.flatMap((rowMea, rmIndex) => (React.createElement("td", { className: "whitespace-nowrap p-2 text-xs", key: `${rIndex}-${cIndex}-${rmIndex}-${rowMea.fid}-${rowMea.aggName}` }, meaInColumns.flatMap((colMea, cmIndex) => (React.createElement("td", { className: "whitespace-nowrap p-2 text-xs", key: `${rIndex}-${cIndex}-${rmIndex}-${cmIndex}-${colMea.fid}-${colMea.aggName}` },
                    getCellData(cell, rowMea, numberFormatter),
                    " , ",
                    getCellData(cell, colMea, numberFormatter)))))));
            }
        })));
    })));
}, function areEqual(prevProps, nextProps) {
    if (JSON.stringify(prevProps.matrix) === JSON.stringify(nextProps.matrix) && prevProps.numberFormat === nextProps.numberFormat) {
        return true;
    }
    return false;
});
export default MetricTable;
//# sourceMappingURL=metricTable.js.map
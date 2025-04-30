import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { buildPivotTableService } from '../../services';
import { toWorkflow } from '../../utils/workflow';
import { dataQuery } from '../../computation';
import { useAppRootContext } from '../../components/appRoot';
import LeftTree from './leftTree';
import TopTree from './topTree';
import { unstable_batchedUpdates } from 'react-dom';
import MetricTable from './metricTable';
import LoadingLayer from '../loadingLayer';
import { useCompututaion } from '../../store';
import { fold2 } from '../../lib/op/fold';
import { getFieldIdentifier, getSort, getSortedEncoding } from '../../utils';
import { getAllFields, getViewEncodingFields } from '../../store/storeStateLib';
const PivotTable = function PivotTableComponent(props) {
    const { data, visualConfig, layout, draggableFieldState } = props;
    const computation = useCompututaion();
    const appRef = useAppRootContext();
    const [leftTree, setLeftTree] = useState(null);
    const [topTree, setTopTree] = useState(null);
    const [metricTable, setMetricTable] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const enableCollapse = !props.disableCollapse;
    const [tableCollapsedHeaderMap, setTableCollapsedHeaderMap] = useState({});
    const updateTableCollapsedHeader = useCallback((node) => {
        const { uniqueKey, height } = node;
        if (height < 1)
            return;
        setTableCollapsedHeaderMap((map) => {
            const updatedMap = { ...map };
            // if some child nodes of the incoming node are collapsed, remove them first
            Object.entries(updatedMap).forEach(([existingKey, existingPath]) => {
                if (existingKey.startsWith(uniqueKey) && existingKey.length > uniqueKey.length) {
                    delete updatedMap[existingKey];
                }
            });
            if (!updatedMap[uniqueKey]) {
                updatedMap[uniqueKey] = node.path;
            }
            else {
                delete updatedMap[uniqueKey];
            }
            return updatedMap;
        });
    }, []);
    const { rows, columns } = draggableFieldState;
    const { defaultAggregated, folds } = visualConfig;
    const { showTableSummary } = layout;
    const aggData = useRef([]);
    const [topTreeHeaderRowNum, setTopTreeHeaderRowNum] = useState(0);
    const dimsInRow = useMemo(() => {
        return rows.filter((f) => f.analyticType === 'dimension');
    }, [rows]);
    const dimsInColumn = useMemo(() => {
        return columns.filter((f) => f.analyticType === 'dimension');
    }, [columns]);
    const measInRow = useMemo(() => {
        return rows.filter((f) => f.analyticType === 'measure');
    }, [rows]);
    const measInColumn = useMemo(() => {
        return columns.filter((f) => f.analyticType === 'measure');
    }, [columns]);
    useEffect(() => {
        if (!enableCollapse) {
            generateNewTable();
            return;
        }
        if (Object.keys(tableCollapsedHeaderMap).length > 0) {
            // If some visual configs change, clear the collapse state
            // As tableCollapsedHeaderMap is also listened, data will be reaggregated later.
            setTableCollapsedHeaderMap({});
            // This forces data to be reaggregated if showTableSummary is on, as aggregation will be skipped later.
            if (showTableSummary) {
                aggregateGroupbyData();
            }
        }
        else {
            aggregateThenGenerate();
        }
    }, [data, enableCollapse]);
    useEffect(() => {
        if (!enableCollapse || showTableSummary) {
            // If showTableSummary is on, there is no need to generate extra queries. Directly generate new table.
            generateNewTable();
        }
        else {
            aggregateThenGenerate();
        }
    }, [enableCollapse, tableCollapsedHeaderMap]);
    useEffect(() => {
        aggregateThenGenerate();
    }, [showTableSummary]);
    const aggregateThenGenerate = async () => {
        await aggregateGroupbyData();
        generateNewTable();
    };
    const generateNewTable = () => {
        appRef.current?.updateRenderStatus('rendering');
        setIsLoading(true);
        const sort = getSort(draggableFieldState);
        const sortedEncoding = getSortedEncoding(draggableFieldState);
        buildPivotTableService(dimsInRow, dimsInColumn, data, aggData.current, Object.keys(tableCollapsedHeaderMap), showTableSummary, sort !== 'none' && sortedEncoding !== 'none'
            ? {
                fid: sortedEncoding === 'column' ? `${measInRow[0].fid}_${measInRow[0].aggName}` : `${measInColumn[0].fid}_${measInColumn[0].aggName}`,
                mode: sortedEncoding,
                type: sort,
            }
            : undefined)
            .then((data) => {
            const { lt, tt, metric } = data;
            unstable_batchedUpdates(() => {
                setLeftTree(lt);
                setTopTree(tt);
                setMetricTable(metric);
            });
            appRef.current?.updateRenderStatus('idle');
            setIsLoading(false);
        })
            .catch((err) => {
            appRef.current?.updateRenderStatus('error');
            console.log(err);
            setIsLoading(false);
        });
    };
    const groupbyCombListRef = useRef([]);
    const aggregateGroupbyData = () => {
        if (dimsInRow.length === 0 && dimsInColumn.length === 0)
            return;
        if (data.length === 0)
            return;
        let groupbyCombListInRow = [];
        let groupbyCombListInCol = [];
        if (showTableSummary) {
            groupbyCombListInRow = dimsInRow.map((dim, idx) => dimsInRow.slice(0, idx));
            groupbyCombListInCol = dimsInColumn.map((dim, idx) => dimsInColumn.slice(0, idx));
        }
        else {
            const collapsedDimList = Object.entries(tableCollapsedHeaderMap).map(([key, path]) => path[path.length - 1].key);
            const collapsedDimsInRow = dimsInRow.filter((dim) => collapsedDimList.includes(dim.fid));
            const collapsedDimsInColumn = dimsInColumn.filter((dim) => collapsedDimList.includes(dim.fid));
            groupbyCombListInRow = collapsedDimsInRow.map((dim) => dimsInRow.slice(0, dimsInRow.indexOf(dim) + 1));
            groupbyCombListInCol = collapsedDimsInColumn.map((dim) => dimsInColumn.slice(0, dimsInColumn.indexOf(dim) + 1));
        }
        groupbyCombListInRow.push(dimsInRow);
        groupbyCombListInCol.push(dimsInColumn);
        const groupbyCombList = groupbyCombListInCol
            .flatMap((combInCol) => groupbyCombListInRow.map((combInRow) => [...combInCol, ...combInRow]))
            .slice(0, -1);
        if (groupbyCombListRef.current.length === groupbyCombList.length &&
            groupbyCombListRef.current.every((x, i) => x.length === groupbyCombList[i].length && x.every((y, j) => getFieldIdentifier(y) === getFieldIdentifier(groupbyCombList[i][j])))) {
            return;
        }
        groupbyCombListRef.current = groupbyCombList;
        setIsLoading(true);
        appRef.current?.updateRenderStatus('computing');
        const groupbyPromises = groupbyCombList.map((dimComb) => {
            const viewFilters = draggableFieldState.filters;
            const allFields = getAllFields(draggableFieldState);
            const viewFields = getViewEncodingFields(draggableFieldState, 'table');
            const viewMeasures = viewFields.filter((f) => f.analyticType === 'measure');
            const sort = getSort(draggableFieldState);
            const { limit } = visualConfig;
            const { timezoneDisplayOffset } = visualConfig;
            const workflow = toWorkflow(viewFilters, allFields, dimComb, viewMeasures, defaultAggregated, sort, folds ?? [], limit > 0 ? limit : undefined, timezoneDisplayOffset);
            return dataQuery(computation, workflow, limit > 0 ? limit : undefined)
                .then((res) => fold2(res, defaultAggregated, allFields, viewMeasures, dimComb, folds))
                .catch((err) => {
                appRef.current?.updateRenderStatus('error');
                return [];
            });
        });
        return new Promise((resolve, reject) => {
            Promise.all(groupbyPromises)
                .then((result) => {
                setIsLoading(false);
                const finalizedData = [...result.flat()];
                aggData.current = finalizedData;
                resolve();
            })
                .catch((err) => {
                console.error(err);
                setIsLoading(false);
                reject();
            });
        });
    };
    // const { leftTree, topTree, metricTable } = store;
    return (React.createElement("div", { className: "relative" },
        isLoading && React.createElement(LoadingLayer, null),
        React.createElement("div", { className: "flex" },
            React.createElement("table", { className: "border border-collapse" },
                React.createElement("thead", { className: "border" },
                    new Array(Math.max(topTreeHeaderRowNum - 1, 0)).fill(0).map((_, i) => (React.createElement("tr", { className: "", key: i },
                        React.createElement("td", { className: "bg-secondary text-secondary-foreground p-2 m-1 text-xs border", colSpan: dimsInRow.length + (measInRow.length > 0 ? 1 : 0) }, "_")))),
                    topTreeHeaderRowNum > 0 && (React.createElement("tr", { className: "" },
                        dimsInRow.map((x) => (React.createElement("td", { className: "bg-secondary text-secondary-foreground p-2 m-1 text-xs border whitespace-nowrap", colSpan: 1 }, x.name))),
                        measInRow.length > 0 && (React.createElement("td", { className: "bg-secondary text-secondary-foreground p-2 m-1 text-xs border", colSpan: 1 }, "_"))))),
                leftTree && (React.createElement(LeftTree, { data: leftTree, dimsInRow: dimsInRow, measInRow: measInRow, onHeaderCollapse: (n) => updateTableCollapsedHeader(n), enableCollapse: enableCollapse, displayOffset: visualConfig.timezoneDisplayOffset }))),
            React.createElement("table", { className: "border border-collapse" },
                topTree && (React.createElement(TopTree, { data: topTree, dimsInCol: dimsInColumn, measInCol: measInColumn, onHeaderCollapse: (n) => updateTableCollapsedHeader(n), onTopTreeHeaderRowNumChange: (num) => setTopTreeHeaderRowNum(num), enableCollapse: enableCollapse, displayOffset: visualConfig.timezoneDisplayOffset })),
                metricTable && (React.createElement(MetricTable, { matrix: metricTable, meaInColumns: measInColumn, meaInRows: measInRow, numberFormat: layout.format.numberFormat || '' }))))));
};
export default PivotTable;
//# sourceMappingURL=index.js.map
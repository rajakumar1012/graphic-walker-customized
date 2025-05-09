import { observer } from 'mobx-react-lite';
import { useCompututaion, useVizStore } from '../store';
import DataTable from './dataTable';
import React, { useMemo } from 'react';
import { addFilterForQuery, addTransformForQuery, processExpression } from '../utils/workflow';
import { COUNT_FIELD_ID, MEA_KEY_ID, MEA_VAL_ID } from '../constants';
import { isNotEmpty } from '../utils';
import { Dialog, DialogContent } from './ui/dialog';
import { toJS } from "mobx";
const DataBoard = observer(function DataBoardModal() {
    const vizStore = useVizStore();
    const computation = useCompututaion();
    const { showDataBoard, selectedMarkObject, allFields, config, viewFilters } = vizStore;
    const filters = useMemo(() => {
        const mark = toJS(selectedMarkObject);
        const entries = Object.entries(mark).filter((x) => ![MEA_KEY_ID, MEA_VAL_ID, COUNT_FIELD_ID].includes(x[0]) && isNotEmpty(x[1]));
        if (isNotEmpty(mark[MEA_KEY_ID]) && isNotEmpty(mark[MEA_VAL_ID])) {
            entries.push([mark[MEA_KEY_ID], mark[MEA_VAL_ID]]);
        }
        return entries.map(([k, v]) => ({ fid: k, rule: { type: 'one of', value: [v] } }));
    }, [selectedMarkObject]);
    const computedFileds = useMemo(() => allFields.filter((x) => x.fid !== COUNT_FIELD_ID && x.computed && x.expression && x.aggName !== 'expr'), [allFields]);
    const filteredComputation = useMemo(() => {
        return (query) => computation(addTransformForQuery(addFilterForQuery(query, viewFilters
            .map((f) => ({ fid: f.fid, rule: f.rule }))
            .filter((x) => !!x.rule)
            .concat(filters)), computedFileds.map((x) => ({
            expression: processExpression(x.expression, allFields, config),
            key: x.fid,
        }))));
    }, [computation, filters, computedFileds, allFields, config]);
    const metas = useMemo(() => {
        return allFields.filter((x) => x.aggName !== 'expr').filter((x) => ![MEA_KEY_ID, MEA_VAL_ID, COUNT_FIELD_ID].includes(x.fid));
    }, [allFields]);
    return (React.createElement(Dialog, { open: showDataBoard, onOpenChange: () => {
            vizStore.setShowDataBoard(false);
        } },
        React.createElement(DialogContent, null,
            React.createElement("div", { className: "mt-4" },
                React.createElement(DataTable, { size: 100, computation: filteredComputation, metas: metas, disableFilter: true, displayOffset: config.timezoneDisplayOffset })))));
});
export default DataBoard;
//# sourceMappingURL=dataBoard.js.map
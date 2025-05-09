import React, { useEffect, useState, useRef, useMemo, useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { useCompututaion, useVizStore } from '../../store';
import { useTranslation } from 'react-i18next';
import { getMeaAggKey } from '../../utils';
import styled from 'styled-components';
import embed from 'vega-embed';
import { builtInThemes } from '../../vis/theme';
import { explainBySelection } from '../../lib/insights/explainBySelection';
import { Dialog, DialogContent } from '../ui/dialog';
import LoadingLayer from '../loadingLayer';
import { themeContext } from "../../store/theme";
const Container = styled.div `
    height: 50vh;
    overflow-y: hidden;
`;
const TabsList = styled.div `
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
    height: 100%;
    overflow-y: scroll;
`;
const Tab = styled.div `
    margin-block: 0.2em;
    margin-inline: 0.2em;
    padding: 0.5em;
    border-width: 2px;
    cursor: pointer;
`;
const getCategoryName = (row, field) => {
    if (field.semanticType === 'quantitative') {
        let id = field.fid;
        return `${row[id][0].toFixed(2)}-${row[id][1].toFixed(2)}`;
    }
    else {
        return row[field.fid];
    }
};
const ExplainData = observer(({ themeKey }) => {
    const vizStore = useVizStore();
    const dark = useContext(themeContext);
    const computationFunction = useCompututaion();
    const { allFields, viewMeasures, viewDimensions, viewFilters, showInsightBoard, selectedMarkObject, config } = vizStore;
    const { timezoneDisplayOffset } = config;
    const [explainDataInfoList, setExplainDataInfoList] = useState([]);
    const [selectedInfoIndex, setSelectedInfoIndex] = useState(0);
    const chartRef = useRef(null);
    const vegaConfig = useMemo(() => {
        const config = {
            ...builtInThemes[themeKey ?? 'vega']?.[dark],
        };
        return config;
    }, [themeKey, dark]);
    const { t } = useTranslation();
    const explain = async (predicates) => {
        const explainInfoList = await explainBySelection({
            predicates,
            viewFilters,
            allFields,
            viewMeasures,
            viewDimensions,
            computationFunction,
            timezoneDisplayOffset,
        });
        setExplainDataInfoList(explainInfoList);
    };
    useEffect(() => {
        if (!showInsightBoard || Object.keys(selectedMarkObject).length === 0)
            return;
        const predicates = viewDimensions.map((field) => {
            return {
                key: field.fid,
                type: 'discrete',
                range: new Set([selectedMarkObject[field.fid]]),
            };
        });
        explain(predicates);
    }, [viewMeasures, viewDimensions, showInsightBoard, selectedMarkObject]);
    useEffect(() => {
        if (chartRef.current && explainDataInfoList.length > 0) {
            const { normalizedData, normalizedParentData, targetField, measureField } = explainDataInfoList[selectedInfoIndex];
            const { semanticType: targetType, name: targetName, fid: targetId } = targetField;
            const data = [
                ...normalizedData.map((row) => ({
                    category: getCategoryName(row, targetField),
                    ...row,
                    type: 'child',
                })),
                ...normalizedParentData.map((row) => ({
                    category: getCategoryName(row, targetField),
                    ...row,
                    type: 'parent',
                })),
            ];
            const xField = {
                x: {
                    field: 'category',
                    type: targetType === 'quantitative' ? 'ordinal' : targetType,
                    axis: {
                        title: `Distribution of Values for ${targetName}`,
                    },
                },
            };
            const spec = {
                data: {
                    values: data,
                },
                width: 320,
                height: 200,
                encoding: {
                    ...xField,
                    color: {
                        legend: {
                            orient: 'bottom',
                        },
                    },
                },
                layer: [
                    {
                        mark: {
                            type: 'bar',
                            width: 15,
                            opacity: 0.7,
                        },
                        encoding: {
                            y: {
                                field: getMeaAggKey(measureField.fid, measureField.aggName),
                                type: 'quantitative',
                                title: `${measureField.aggName} ${measureField.name} for All Marks`,
                            },
                            color: { datum: 'All Marks' },
                        },
                        transform: [{ filter: "datum.type === 'parent'" }],
                    },
                    {
                        mark: {
                            type: 'bar',
                            width: 10,
                            opacity: 0.7,
                        },
                        encoding: {
                            y: {
                                field: getMeaAggKey(measureField.fid, measureField.aggName),
                                type: 'quantitative',
                                title: `${measureField.aggName} ${measureField.name} for Selected Mark`,
                            },
                            color: { datum: 'Selected Mark' },
                        },
                        transform: [{ filter: "datum.type === 'child'" }],
                    },
                ],
                resolve: { scale: { y: 'independent' } },
            };
            embed(chartRef.current, spec, {
                mode: 'vega-lite',
                actions: false,
                config: vegaConfig,
                tooltip: {
                    theme: dark,
                },
            });
        }
    }, [explainDataInfoList, chartRef.current, selectedInfoIndex, vegaConfig]);
    return (React.createElement(Dialog, { open: showInsightBoard, onOpenChange: () => {
            vizStore.setShowInsightBoard(false);
            setSelectedInfoIndex(0);
        } },
        React.createElement(DialogContent, null,
            explainDataInfoList.length === 0 && React.createElement(LoadingLayer, null),
            React.createElement(Container, { className: "grid grid-cols-4" },
                React.createElement(TabsList, { className: "col-span-1" }, explainDataInfoList.map((option, i) => {
                    return (React.createElement(Tab, { key: i, className: `${selectedInfoIndex === i ? 'border-primary' : ''} text-xs`, onClick: () => setSelectedInfoIndex(i) },
                        option.targetField.name,
                        " ",
                        option.score.toFixed(2)));
                })),
                React.createElement("div", { className: "col-span-3 text-center overflow-y-scroll" },
                    React.createElement("div", { ref: chartRef }))))));
});
export default ExplainData;
//# sourceMappingURL=index.js.map
import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { ISegmentKey } from './interfaces';
import VisualSettings from './visualSettings';
import PosFields from './fields/posFields';
import AestheticFields from './fields/aestheticFields';
import DatasetFields from './fields/datasetFields/index';
import ReactiveRenderer from './renderer/index';
import { VizStoreWrapper, useVizStore, withErrorReport, withTimeout } from './store';
import VisNav from './segments/visNav';
import { mergeLocaleRes, setLocaleLanguage } from './locales/i18n';
import FilterField from './fields/filterField';
import DatasetConfig from './dataSource/datasetConfig';
import CodeExport from './components/codeExport';
import VisualConfig from './components/visualConfig';
import ExplainData from './components/explainData';
import GeoConfigPanel from './components/leafletRenderer/geoConfigPanel';
import AskViz from './components/askViz';
import { renderSpec } from './store/visualSpecStore';
import FieldsContextWrapper from './fields/fieldsContext';
import { guardDataKeys } from './utils/dataPrep';
import { getComputation } from './computation/clientComputation';
import LogPanel from './fields/datasetFields/logPanel';
import BinPanel from './fields/datasetFields/binPanel';
import RenamePanel from './components/renameField';
import { ErrorContext } from './utils/reportError';
import { ErrorBoundary } from 'react-error-boundary';
import Errorpanel from './components/errorpanel';
import { useCurrentMediaTheme } from './utils/media';
import Painter from './components/painter';
import { classNames, cn, parseErrorMessage } from './utils';
import { VizEmbedMenu } from './components/embedMenu';
import DataBoard from './components/dataBoard';
import SideResize from './components/side-resize';
import { VegaliteMapper } from './lib/vl2gw';
import { newChart } from './models/visSpecHistory';
import ComputedFieldDialog from './components/computedField';
import { VizAppContext } from './store/context';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { ChartPieIcon, CircleStackIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { TabsContent } from '@radix-ui/react-tabs';
import { VegaliteChat } from './components/chat';
export const VizApp = observer(function VizApp(props) {
    const { computation, darkMode = 'light', i18nLang = 'en-US', enhanceAPI, i18nResources, themeKey = 'vega', themeConfig, vizThemeConfig, toolbar, geographicData, computationTimeout = 60000, spec, chart, vlSpec, onError, } = props;
    const { t, i18n } = useTranslation();
    const curLang = i18n.language;
    useEffect(() => {
        if (i18nResources) {
            mergeLocaleRes(i18nResources);
        }
    }, [i18nResources]);
    useEffect(() => {
        if (i18nLang !== curLang) {
            setLocaleLanguage(i18nLang);
        }
    }, [i18nLang, curLang]);
    const vizStore = useVizStore();
    useEffect(() => {
        if (geographicData) {
            vizStore.setGeographicData(geographicData, geographicData.key);
        }
    }, [vizStore, geographicData]);
    useEffect(() => {
        if (spec) {
            vizStore.replaceNow(renderSpec(spec, vizStore.meta, vizStore.currentVis.name ?? 'Chart 1', vizStore.currentVis.visId));
        }
    }, [spec, vizStore]);
    useEffect(() => {
        if (chart) {
            vizStore.importCode(chart);
        }
    }, [chart, vizStore]);
    useEffect(() => {
        if (vlSpec) {
            const emptyChart = newChart(vizStore.meta, '');
            vizStore.replaceNow(VegaliteMapper(spec, [...emptyChart.encodings.dimensions, ...emptyChart.encodings.measures], vizStore.currentVis.name ?? 'Chart 1', vizStore.currentVis.visId));
        }
    }, [vlSpec, vizStore]);
    const rendererRef = useRef(null);
    const downloadCSVRef = useRef({ download() { } });
    const reportError = useCallback((msg, code) => {
        const err = new Error(`Error${code ? `(${code})` : ''}: ${msg}`);
        console.error(err);
        onError?.(err);
        if (code) {
            vizStore.updateShowErrorResolutionPanel(code, msg);
        }
    }, [vizStore, onError]);
    const { segmentKey, vizEmbededMenu } = vizStore;
    const wrappedComputation = useMemo(() => (computation ? withErrorReport(withTimeout(computation, computationTimeout), (err) => reportError(parseErrorMessage(err), 501)) : async () => []), [reportError, computation, computationTimeout]);
    const [portal, setPortal] = useState(null);
    return (React.createElement(ErrorContext, { value: { reportError } },
        React.createElement(ErrorBoundary, { fallback: React.createElement("div", null, "Something went wrong"), onError: props.onError },
            React.createElement(VizAppContext, { ComputationContext: wrappedComputation, themeContext: darkMode, vegaThemeContext: { vizThemeConfig: props.vizThemeConfig ?? props.themeConfig ?? props.themeKey }, portalContainerContext: portal },
                React.createElement("div", { className: classNames(`App font-sans bg-background text-foreground m-0 p-0`, darkMode === 'dark' ? 'dark' : '') },
                    React.createElement(FieldsContextWrapper, null,
                        React.createElement("div", { className: "bg-background text-foreground" },
                            React.createElement(Errorpanel, null),
                            React.createElement(Tabs, { value: segmentKey, onValueChange: (v) => vizStore.setSegmentKey(v) },
                                React.createElement(TabsList, { className: "mx-4" },
                                    React.createElement(TabsTrigger, { value: ISegmentKey.data },
                                        React.createElement(CircleStackIcon, { className: "w-4 mr-2" }),
                                        " ",
                                        t('App.segments.data')),
                                    React.createElement(TabsTrigger, { value: ISegmentKey.vis },
                                        React.createElement(ChartPieIcon, { className: "w-4 mr-2" }),
                                        " ",
                                        t('App.segments.vis')),
                                    enhanceAPI?.features?.vlChat && (React.createElement(TabsTrigger, { value: ISegmentKey.chat },
                                        React.createElement(ChatBubbleLeftRightIcon, { className: "w-4 mr-2" }),
                                        " ",
                                        t('App.segments.chat')))),
                                React.createElement(TabsContent, { value: ISegmentKey.data },
                                    React.createElement("div", { className: "mx-4 -mt-px p-4 border rounded-md rounded-t-none" },
                                        React.createElement(DatasetConfig, null))),
                                React.createElement(TabsContent, { value: ISegmentKey.vis },
                                    !props.hideChartNav && (React.createElement("div", { className: "px-2 mx-2 mt-2" },
                                        React.createElement(VisNav, null))),
                                    React.createElement("div", { style: { marginTop: '0em' }, className: cn('m-4 p-4 border border-border rounded-md rounded-tl-none', props.hideChartNav ? 'border-t-0 rounded-t-none' : '') },
                                        enhanceAPI?.features?.askviz && (React.createElement(AskViz, { api: typeof enhanceAPI.features.askviz === 'boolean' ? '' : enhanceAPI.features.askviz, feedbackApi: typeof enhanceAPI.features.feedbackAskviz === 'boolean' ? '' : enhanceAPI.features.feedbackAskviz, headers: enhanceAPI?.header })),
                                        React.createElement(VisualSettings, { csvHandler: downloadCSVRef, rendererHandler: rendererRef, darkModePreference: darkMode, experimentalFeatures: props.experimentalFeatures, exclude: toolbar?.exclude, extra: toolbar?.extra }),
                                        React.createElement(CodeExport, null),
                                        React.createElement(ExplainData, { themeKey: themeKey }),
                                        vizStore.showDataBoard && React.createElement(DataBoard, null),
                                        React.createElement(VisualConfig, null),
                                        React.createElement(LogPanel, null),
                                        React.createElement(BinPanel, null),
                                        React.createElement(RenamePanel, null),
                                        React.createElement(ComputedFieldDialog, null),
                                        React.createElement(Painter, { themeConfig: themeConfig, themeKey: themeKey }),
                                        vizStore.showGeoJSONConfigPanel && React.createElement(GeoConfigPanel, { geoList: props.geoList }),
                                        React.createElement("div", { className: "sm:flex" },
                                            React.createElement(SideResize, { defaultWidth: 240, handleWidth: 4, className: "min-w-[100%] max-w-full sm:min-w-[96px] sm:max-w-[35%] flex-shrink-0", handlerClassName: "hidden sm:block" },
                                                React.createElement(DatasetFields, null)),
                                            React.createElement("div", { className: "flex-1 min-w-[0px]" },
                                                React.createElement("div", null,
                                                    React.createElement(PosFields, null)),
                                                React.createElement("div", { className: "my-0.5 sm:ml-0.5 p-1 border relative h-[600px]", onMouseLeave: () => {
                                                        vizEmbededMenu.show && vizStore.closeEmbededMenu();
                                                    }, onClick: () => {
                                                        vizEmbededMenu.show && vizStore.closeEmbededMenu();
                                                    } },
                                                    computation && (React.createElement(ReactiveRenderer, { csvRef: downloadCSVRef, ref: rendererRef, vizThemeConfig: vizThemeConfig ?? themeConfig ?? themeKey, computationFunction: wrappedComputation, 
                                                        // @TODO remove channelScales
                                                        scales: props.scales ?? props.channelScales })),
                                                    React.createElement(VizEmbedMenu, null))),
                                            React.createElement(SideResize, { defaultWidth: 180, handleWidth: 4, className: "min-w-[100%] max-w-full sm:min-w-[164px] sm:max-w-[314px] flex-shrink-0", handlerClassName: "hidden sm:block" },
                                                React.createElement(FilterField, null),
                                                React.createElement(AestheticFields, null))))),
                                enhanceAPI?.features?.vlChat && (React.createElement(TabsContent, { value: ISegmentKey.chat },
                                    React.createElement(VegaliteChat, { api: typeof enhanceAPI.features.vlChat === 'boolean' ? '' : enhanceAPI.features.vlChat, headers: enhanceAPI?.header, 
                                        // @TODO remove channelScales
                                        scales: props.scales ?? props.channelScales })))))),
                    React.createElement("div", { ref: setPortal }))))));
});
export function VizAppWithContext(props) {
    const { computation, onMetaChange, fieldKeyGuard, keepAlive, storeRef, defaultConfig, ...rest } = props;
    // @TODO remove deprecated props
    const appearance = props.appearance ?? props.dark;
    const data = props.data ?? props.dataSource;
    const fields = props.fields ?? props.rawFields ?? [];
    const { computation: safeComputation, safeMetas, onMetaChange: safeOnMetaChange, } = useMemo(() => {
        if (data) {
            if (props.fieldKeyGuard) {
                const { safeData, safeMetas } = guardDataKeys(data, fields);
                return {
                    safeMetas,
                    computation: getComputation(safeData),
                    onMetaChange: (safeFID, meta) => {
                        const index = safeMetas.findIndex((x) => x.fid === safeFID);
                        if (index >= 0) {
                            props.onMetaChange?.(fields[index].fid, meta);
                        }
                    },
                };
            }
            return {
                safeMetas: fields,
                computation: getComputation(data),
                onMetaChange: props.onMetaChange,
            };
        }
        return {
            safeMetas: fields,
            computation: props.computation,
            onMetaChange: props.onMetaChange,
        };
    }, [fields, data ? data : props.computation, props.fieldKeyGuard, props.onMetaChange]);
    const darkMode = useCurrentMediaTheme(appearance);
    return (React.createElement(VizStoreWrapper, { onMetaChange: safeOnMetaChange, meta: safeMetas, keepAlive: keepAlive, storeRef: storeRef, defaultConfig: defaultConfig },
        React.createElement(VizApp, { darkMode: darkMode, computation: safeComputation, ...rest })));
}
//# sourceMappingURL=App.js.map
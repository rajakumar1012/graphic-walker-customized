import { computed, makeAutoObservable, observable } from 'mobx';
import { convertChart, exportFullRaw, exportNow, fromFields, fromSnapshot, importFull, importNow, newChart, parseChart, performers, redo, undo, } from '../models/visSpecHistory';
import { emptyEncodings, forwardVisualConfigs, visSpecDecoder } from '../utils/save';
import { feature } from 'topojson-client';
import { ISegmentKey, } from '../interfaces';
import { GLOBAL_CONFIG } from '../config';
import { COUNT_FIELD_ID, PAINT_FIELD_ID, MEA_KEY_ID, MEA_VAL_ID } from '../constants';
import { toWorkflow } from '../utils/workflow';
import { uniqueId } from '../models/utils';
import { getSort, getSortedEncoding } from '../utils';
import { getSQLItemAnalyticType, parseSQLExpr } from '../lib/sql';
import { IPaintMapAdapter } from '../lib/paint';
import { toChatMessage } from "../models/chat";
import { viewEncodingKeys } from "../models/visSpec";
import { getAllFields, getViewEncodingFields } from './storeStateLib';
const encodingKeys = Object.keys(emptyEncodings).filter((dkey) => !GLOBAL_CONFIG.META_FIELD_KEYS.includes(dkey));
export class VizSpecStore {
    visList;
    visIndex = 0;
    createdVis = 0;
    editingFilterIdx = null;
    meta;
    segmentKey = ISegmentKey.vis;
    showInsightBoard = false;
    showDataBoard = false;
    vizEmbededMenu = { show: false, position: [0, 0] };
    showDataConfig = false;
    showCodeExportPanel = false;
    showVisualConfigPanel = false;
    showGeoJSONConfigPanel = false;
    removeConfirmIdx = null;
    filters = {};
    tableCollapsedHeaderMap = new Map();
    selectedMarkObject = {};
    showLogSettingPanel = false;
    showBinSettingPanel = false;
    showRenamePanel = false;
    createField = undefined;
    localGeoJSON = undefined;
    showErrorResolutionPanel = 0;
    showPainterPanel = false;
    lastErrorMessage = '';
    showAskvizFeedbackIndex = 0;
    lastSpec = '';
    editingComputedFieldFid = undefined;
    defaultConfig;
    onMetaChange;
    constructor(meta, options) {
        this.meta = meta;
        this.visList = options?.empty ? [] : [fromFields(meta, 'Chart 1', options?.defaultConfig)];
        this.createdVis = this.visList.length;
        this.defaultConfig = options?.defaultConfig;
        this.onMetaChange = options?.onMetaChange;
        makeAutoObservable(this, {
            visList: observable.shallow,
            allEncodings: computed.struct,
            filters: observable.ref,
            tableCollapsedHeaderMap: observable.ref,
        });
    }
    get visLength() {
        return this.visList.length;
    }
    get vizList() {
        return this.visList.map((x) => x.now);
    }
    get currentVis() {
        return this.visList[this.visIndex].now;
    }
    get currentEncodings() {
        return this.currentVis.encodings;
    }
    get viewFilters() {
        return this.currentEncodings.filters;
    }
    get dimensions() {
        return this.currentEncodings.dimensions;
    }
    get measures() {
        return this.currentEncodings.measures;
    }
    get rows() {
        return this.currentEncodings.rows;
    }
    get columns() {
        return this.currentEncodings.columns;
    }
    get sort() {
        return getSort({ columns: this.columns, rows: this.rows });
    }
    get sortedEncoding() {
        return getSortedEncoding({ columns: this.columns, rows: this.rows });
    }
    get allFields() {
        return getAllFields(this);
    }
    get config() {
        return this.currentVis.config;
    }
    get layout() {
        return {
            ...this.currentVis.layout,
            ...(this.localGeoJSON
                ? {
                    geoJson: this.localGeoJSON,
                }
                : {}),
        };
    }
    get allEncodings() {
        const result = {};
        encodingKeys.forEach((k) => {
            result[k] = this.currentEncodings[k];
        });
        return result;
    }
    get viewEncodings() {
        const result = {};
        viewEncodingKeys(this.config.geoms[0]).forEach((k) => {
            result[k] = this.currentEncodings[k];
        });
        return result;
    }
    get viewEncodingFields() {
        return getViewEncodingFields(this.viewEncodings, this.config.geoms[0]);
    }
    get viewDimensions() {
        return this.viewEncodingFields.filter((x) => x.analyticType === 'dimension');
    }
    get viewMeasures() {
        return this.viewEncodingFields.filter((x) => x.analyticType === 'measure');
    }
    get workflow() {
        return toWorkflow(this.viewFilters, this.allFields, this.viewDimensions, this.viewMeasures, this.config.defaultAggregated, this.sort, this.config.folds, this.config.limit, this.config.timezoneDisplayOffset);
    }
    get limit() {
        return this.config.limit;
    }
    get canUndo() {
        return this.visList[this.visIndex].cursor > 0;
    }
    get canRedo() {
        const viz = this.visList[this.visIndex];
        return viz.cursor !== viz.timeline.length;
    }
    get chatMessages() {
        return toChatMessage(this.visList[this.visIndex]);
    }
    get paintFields() {
        if (!this.currentVis.config.defaultAggregated) {
            const { columns, rows } = this.currentEncodings;
            if (columns.length !== 1 || rows.length !== 1) {
                return { type: 'error', key: 'count' };
            }
            const col = columns[0];
            const row = rows[0];
            // range on temporal need use a temporal Domain, which is not impemented
            if (col.semanticType === 'temporal' || row.semanticType === 'temporal') {
                return { type: 'error', key: 'temporal' };
            }
            if (col.aggName === 'expr' ||
                row.aggName === 'expr' ||
                col.fid === MEA_KEY_ID ||
                col.fid === MEA_VAL_ID ||
                row.fid === MEA_KEY_ID ||
                row.fid === MEA_VAL_ID ||
                col.fid === PAINT_FIELD_ID ||
                row.fid === PAINT_FIELD_ID) {
                return { type: 'error', key: 'count' };
            }
            return {
                type: 'new',
                x: col,
                y: row,
            };
        }
        else {
            const { columns, rows, color, shape, size, opacity } = this.currentEncodings;
            if (columns.length !== 1 || rows.length !== 1) {
                return { type: 'error', key: 'count' };
            }
            const col = columns[0];
            const row = rows[0];
            if (col.aggName === 'expr' ||
                row.aggName === 'expr' ||
                col.fid === MEA_KEY_ID ||
                col.fid === MEA_VAL_ID ||
                row.fid === MEA_KEY_ID ||
                row.fid === MEA_VAL_ID ||
                col.fid === PAINT_FIELD_ID ||
                row.fid === PAINT_FIELD_ID) {
                return { type: 'error', key: 'count' };
            }
            const guard = (f) => (f?.fid === PAINT_FIELD_ID ? undefined : f);
            if (col.analyticType === 'dimension' && row.analyticType === 'dimension') {
                return {
                    type: 'new',
                    x: col,
                    y: row,
                };
            }
            return {
                type: 'agg',
                x: col,
                y: row,
                color: guard(color[0]),
                shape: guard(shape[0]),
                size: guard(size[0]),
                opacity: guard(opacity[0]),
            };
        }
    }
    get paintInfo() {
        const existPaintField = this.currentEncodings.dimensions.find((x) => x.fid === PAINT_FIELD_ID);
        if (existPaintField) {
            const param = existPaintField.expression?.params.find((x) => x.type === 'map')?.value;
            if (param) {
                return {
                    type: 'exist',
                    item: IPaintMapAdapter(param),
                    new: this.paintFields,
                };
            }
            const paramV2 = existPaintField.expression?.params.find((x) => x.type === 'newmap')?.value;
            if (paramV2) {
                return {
                    type: 'exist',
                    item: paramV2,
                    new: this.paintFields,
                };
            }
        }
        return this.paintFields;
    }
    appendFilter(index, sourceKey, sourceIndex) {
        const oriF = this.currentEncodings[sourceKey][sourceIndex];
        if (oriF.fid === MEA_KEY_ID || oriF.fid === MEA_VAL_ID || oriF.fid === COUNT_FIELD_ID || oriF.aggName === 'expr') {
            return;
        }
        this.visList[this.visIndex] = performers.appendFilter(this.visList[this.visIndex], index, sourceKey, sourceIndex, null);
        this.editingFilterIdx = index;
    }
    undo() {
        this.visList[this.visIndex] = undo(this.visList[this.visIndex]);
    }
    redo() {
        this.visList[this.visIndex] = redo(this.visList[this.visIndex]);
    }
    setVisName(index, name) {
        this.visList[index] = performers.setName(this.visList[index], name);
    }
    setMeta(meta) {
        this.meta = meta;
    }
    setOnMetaChange(onMetaChange) {
        this.onMetaChange = onMetaChange;
    }
    setDefaultConfig(defaultConfig) {
        this.defaultConfig = defaultConfig;
    }
    resetVisualization(name = 'Chart 1') {
        this.visList = [fromFields(this.meta, name, this.defaultConfig)];
        this.createdVis = 1;
    }
    addVisualization(defaultName) {
        const name = defaultName ? (typeof defaultName === 'function' ? defaultName(this.createdVis + 1) : defaultName) : 'Chart ' + (this.createdVis + 1);
        this.visList.push(fromFields(this.meta, name, this.defaultConfig));
        this.createdVis += 1;
        this.visIndex = this.visList.length - 1;
    }
    removeVisualization(index) {
        if (this.visLength === 1)
            return;
        if (this.visIndex >= index && this.visIndex > 0)
            this.visIndex -= 1;
        this.visList.splice(index, 1);
    }
    duplicateVisualization(index) {
        this.visList.push(fromSnapshot({
            ...this.visList[index].now,
            name: this.visList[index].now.name + ' Copy',
            visId: uniqueId(),
        }));
        this.createdVis += 1;
        this.visIndex = this.visList.length - 1;
    }
    setFilterEditing(index) {
        this.editingFilterIdx = index;
    }
    closeFilterEditing() {
        this.editingFilterIdx = null;
    }
    setSegmentKey(sk) {
        this.segmentKey = sk;
    }
    setVisualConfig(...args) {
        this.visList[this.visIndex] = performers.setConfig(this.visList[this.visIndex], ...args);
    }
    setCoordSystem(mode) {
        this.visList[this.visIndex] = performers.setCoordSystem(this.visList[this.visIndex], mode);
    }
    setVisualLayout(...args) {
        if (typeof args[0] === 'string') {
            this.visList[this.visIndex] = performers.setLayout(this.visList[this.visIndex], [args]);
        }
        else {
            this.visList[this.visIndex] = performers.setLayout(this.visList[this.visIndex], args);
        }
    }
    reorderField(stateKey, sourceIndex, destinationIndex) {
        if (GLOBAL_CONFIG.META_FIELD_KEYS.includes(stateKey))
            return;
        if (sourceIndex === destinationIndex)
            return;
        this.visList[this.visIndex] = performers.reorderField(this.visList[this.visIndex], stateKey, sourceIndex, destinationIndex);
    }
    moveField(sourceKey, sourceIndex, destinationKey, destinationIndex) {
        if (sourceKey === 'filters') {
            return this.removeField(sourceKey, sourceIndex);
        }
        else if (destinationKey === 'filters') {
            return this.appendFilter(destinationIndex, sourceKey, sourceIndex);
        }
        const oriF = this.currentEncodings[sourceKey][sourceIndex];
        const sourceMeta = GLOBAL_CONFIG.META_FIELD_KEYS.includes(sourceKey);
        const destMeta = GLOBAL_CONFIG.META_FIELD_KEYS.includes(destinationKey);
        if (sourceMeta && destMeta && (oriF.fid === MEA_KEY_ID || oriF.fid === MEA_VAL_ID || oriF.fid === COUNT_FIELD_ID || oriF.fid === PAINT_FIELD_ID)) {
            return;
        }
        const limit = GLOBAL_CONFIG.CHANNEL_LIMIT[destinationKey] ?? Infinity;
        if (destMeta === sourceMeta) {
            this.visList[this.visIndex] = performers.moveField(this.visList[this.visIndex], sourceKey, sourceIndex, destinationKey, destinationIndex, limit);
        }
        else if (destMeta) {
            this.visList[this.visIndex] = performers.removeField(this.visList[this.visIndex], sourceKey, sourceIndex);
        }
        else {
            // add an encoding
            if (oriF.fid === MEA_KEY_ID || oriF.fid === MEA_VAL_ID) {
                this.visList[this.visIndex] = performers.addFoldField(this.visList[this.visIndex], sourceKey, sourceIndex, destinationKey, destinationIndex, uniqueId(), limit);
                return;
            }
            this.visList[this.visIndex] = performers.cloneField(this.visList[this.visIndex], sourceKey, sourceIndex, destinationKey, destinationIndex, uniqueId(), limit);
        }
    }
    modFilter(index, sourceKey, sourceIndex) {
        this.visList[this.visIndex] = performers.modFilter(this.visList[this.visIndex], index, sourceKey, sourceIndex);
    }
    removeField(sourceKey, sourceIndex) {
        if (GLOBAL_CONFIG.META_FIELD_KEYS.includes(sourceKey))
            return;
        this.visList[this.visIndex] = performers.removeField(this.visList[this.visIndex], sourceKey, sourceIndex);
    }
    writeFilter(index, rule) {
        this.visList[this.visIndex] = performers.writeFilter(this.visList[this.visIndex], index, rule);
    }
    transpose() {
        this.visList[this.visIndex] = performers.transpose(this.visList[this.visIndex]);
    }
    createBinField(stateKey, index, binType, binNumber = 10) {
        const newVarKey = uniqueId();
        const state = this.currentEncodings;
        const existedRelatedBinField = state.dimensions.find((f) => f.computed &&
            f.expression &&
            f.expression.op === binType &&
            f.expression.params[0].value === state[stateKey][index].fid &&
            f.expression.num === binNumber);
        if (existedRelatedBinField) {
            return existedRelatedBinField.fid;
        }
        this.visList[this.visIndex] = performers.createBinlogField(this.visList[this.visIndex], stateKey, index, binType, newVarKey, binNumber);
        return newVarKey;
    }
    createLogField(stateKey, index, scaleType, logNumber = 10) {
        this.visList[this.visIndex] = performers.createBinlogField(this.visList[this.visIndex], stateKey, index, scaleType, uniqueId(), logNumber);
    }
    renameFieldInChart(stateKey, index, newName) {
        const origianlField = this.currentEncodings[stateKey][index];
        if (!origianlField) {
            return;
        }
        this.visList[this.visIndex] = performers.editAllField(this.visList[this.visIndex], origianlField.fid, { name: newName });
    }
    createDateTimeDrilledField(stateKey, index, drillLevel, name, format, offset) {
        this.visList[this.visIndex] = performers.createDateDrillField(this.visList[this.visIndex], stateKey, index, drillLevel, uniqueId(), name, format, offset ?? new Date().getTimezoneOffset());
    }
    createDateFeatureField(stateKey, index, drillLevel, name, format, offset) {
        this.visList[this.visIndex] = performers.createDateFeatureField(this.visList[this.visIndex], stateKey, index, drillLevel, uniqueId(), name, format, offset ?? new Date().getTimezoneOffset());
    }
    setFieldAggregator(stateKey, index, aggName) {
        this.visList[this.visIndex] = performers.setFieldAggregator(this.visList[this.visIndex], stateKey, index, aggName);
    }
    setFilterAggregator(index, aggName) {
        this.visList[this.visIndex] = performers.setFilterAggregator(this.visList[this.visIndex], index, aggName);
    }
    applyDefaultSort(sortType = 'ascending') {
        this.visList[this.visIndex] = performers.applySort(this.visList[this.visIndex], sortType);
    }
    exportCurrentChart() {
        return exportFullRaw(this.visList[this.visIndex]);
    }
    exportAllCharts() {
        return this.visList.map((x) => exportFullRaw(x));
    }
    exportCode() {
        return this.visList.map((x) => exportNow(x));
    }
    importCode(data) {
        this.visList = data.map((x) => {
            if ('layout' in x) {
                return importNow(x);
            }
            else {
                return fromSnapshot(convertChart(visSpecDecoder(forwardVisualConfigs(x))));
            }
        });
        this.createdVis = this.visList.length;
        this.visIndex = 0;
    }
    appendRaw(data) {
        const newChart = importFull(data);
        this.visList.push(newChart);
        this.createdVis += 1;
        this.visIndex = this.visList.length - 1;
    }
    importRaw(data) {
        this.visList = data.map(importFull);
        this.createdVis = this.visList.length;
        this.visIndex = 0;
    }
    appendFromCode(data) {
        const newChart = fromSnapshot(parseChart(data));
        this.visList.push(newChart);
        this.createdVis += 1;
        this.visIndex = this.visList.length - 1;
    }
    setAskvizFeedback(show) {
        this.showAskvizFeedbackIndex = show ? this.visIndex : undefined;
    }
    replaceNow(chart) {
        this.visList[this.visIndex] = fromSnapshot(chart);
    }
    selectVisualization(index) {
        this.visIndex = index;
    }
    setShowDataConfig(show) {
        this.showDataConfig = show;
    }
    setShowInsightBoard(show) {
        this.showInsightBoard = show;
    }
    setShowDataBoard(show) {
        this.showDataBoard = show;
    }
    showEmbededMenu(position) {
        this.vizEmbededMenu.show = true;
        this.vizEmbededMenu.position = position;
    }
    setShowCodeExportPanel(show) {
        this.showCodeExportPanel = show;
    }
    setShowVisualConfigPanel(show) {
        this.showVisualConfigPanel = show;
    }
    closeEmbededMenu() {
        this.vizEmbededMenu.show = false;
    }
    setFilters(props) {
        this.filters = props;
    }
    updateCurrentDatasetMetas(fid, diffMeta) {
        const field = this.meta.find((f) => f.fid === fid);
        if (field) {
            for (let mk in diffMeta) {
                field[mk] = diffMeta[mk];
            }
        }
        this.onMetaChange?.(fid, diffMeta);
    }
    openRemoveConfirmModal(index) {
        this.removeConfirmIdx = index;
    }
    closeRemoveConfirmModal() {
        this.removeConfirmIdx = null;
    }
    setGeographicData(data, geoKey, geoUrl) {
        const geoJSON = data.type === 'GeoJSON' ? data.data : feature(data.data, data.objectKey || Object.keys(data.data.objects)[0]);
        if (!('features' in geoJSON)) {
            console.error('Invalid GeoJSON: GeoJSON must be a FeatureCollection, but got', geoJSON);
            return;
        }
        this.localGeoJSON = geoJSON;
        if (geoUrl) {
            this.visList[this.visIndex] = performers.setGeoData(this.visList[this.visIndex], undefined, geoKey, geoUrl);
        }
        else {
            this.visList[this.visIndex] = performers.setGeoData(this.visList[this.visIndex], geoJSON, geoKey, undefined);
        }
    }
    clearGeographicData() {
        this.visList[this.visIndex] = performers.setGeoData(this.visList[this.visIndex], undefined, undefined, undefined);
    }
    changeSemanticType(stateKey, index, semanticType) {
        this.visList[this.visIndex] = performers.changeSemanticType(this.visList[this.visIndex], stateKey, index, semanticType);
    }
    updatePaint(paintMap, name) {
        this.visList[this.visIndex] = performers.upsertPaintField(this.visList[this.visIndex], paintMap, name);
    }
    updateGeoKey(key) {
        this.setVisualLayout('geoKey', key);
    }
    updateTableCollapsedHeader(node) {
        const { uniqueKey, height } = node;
        if (height < 1)
            return;
        const updatedMap = new Map(this.tableCollapsedHeaderMap);
        // if some child nodes of the incoming node are collapsed, remove them first
        updatedMap.forEach((existingPath, existingKey) => {
            if (existingKey.startsWith(uniqueKey) && existingKey.length > uniqueKey.length) {
                updatedMap.delete(existingKey);
            }
        });
        if (!updatedMap.has(uniqueKey)) {
            updatedMap.set(uniqueKey, node.path);
        }
        else {
            updatedMap.delete(uniqueKey);
        }
        this.tableCollapsedHeaderMap = updatedMap;
    }
    resetTableCollapsedHeader() {
        const updatedMap = new Map();
        this.tableCollapsedHeaderMap = updatedMap;
    }
    setShowGeoJSONConfigPanel(show) {
        this.showGeoJSONConfigPanel = show;
    }
    setShowBinSettingPanel(show) {
        this.showBinSettingPanel = show;
    }
    setShowLogSettingPanel(show) {
        this.showLogSettingPanel = show;
    }
    setShowRenamePanel(show) {
        this.showRenamePanel = show;
    }
    setCreateField(field) {
        this.createField = field;
    }
    updateSelectedMarkObject(newMarkObj) {
        this.selectedMarkObject = newMarkObj;
    }
    updateShowErrorResolutionPanel(errCode, msg = '') {
        this.showErrorResolutionPanel = errCode;
        this.lastErrorMessage = msg;
    }
    setShowPainter(show) {
        this.showPainterPanel = show;
    }
    updateLastSpec(spec) {
        this.lastSpec = spec;
    }
    setComputedFieldFid(fid) {
        this.editingComputedFieldFid = fid;
    }
    upsertComputedField(fid, name, sql) {
        if (fid === '') {
            this.visList[this.visIndex] = performers.addSQLComputedField(this.visList[this.visIndex], uniqueId(), name, sql);
        }
        else {
            const originalField = this.allFields.find((x) => x.fid === fid);
            if (!originalField)
                return;
            const [semanticType, isAgg] = getSQLItemAnalyticType(parseSQLExpr(sql), this.allFields);
            const analyticType = semanticType === 'quantitative' ? 'measure' : 'dimension';
            const newAggName = isAgg ? 'expr' : analyticType === 'dimension' ? undefined : 'sum';
            const preAggName = originalField.aggName === 'expr' ? 'expr' : originalField.aggName === undefined ? undefined : 'sum';
            this.visList[this.visIndex] = performers.editAllField(this.visList[this.visIndex], fid, {
                name,
                analyticType,
                semanticType,
                ...(preAggName !== newAggName ? { aggName: newAggName } : {}),
                expression: { as: fid, op: 'expr', params: [{ type: 'sql', value: sql }] },
            });
        }
    }
    removeComputedField(sourceKey, sourceIndex) {
        const oriF = this.currentEncodings[sourceKey][sourceIndex];
        if (oriF.computed) {
            this.visList[this.visIndex] = performers.removeAllField(this.visList[this.visIndex], oriF.fid);
        }
    }
    replaceWithNLPQuery(query, response) {
        this.visList[this.visIndex] = performers.replaceWithNLPQuery(this.visList[this.visIndex], query, response);
    }
}
export function renderSpec(spec, meta, name, visId) {
    const chart = newChart(meta, name, visId);
    const fields = chart.encodings.dimensions.concat(chart.encodings.measures);
    chart.config.defaultAggregated = Boolean(spec.aggregate);
    if ((spec.geomType?.length ?? 0) > 0) {
        chart.config.geoms = spec.geomType?.map((g) => geomAdapter(g)) ?? ['tick'];
    }
    if ((spec.facets?.length ?? 0) > 0) {
        const facets = (spec.facets || []).concat(spec.highFacets || []);
        for (let facet of facets) {
            const f = fields.find((f) => f.fid === facet);
            f && (chart.encodings.rows = chart.encodings.rows.concat([f]));
        }
    }
    if (spec.position) {
        const [cols, rows] = spec.position;
        if (cols) {
            const f = fields.find((f) => f.fid === cols);
            f && (chart.encodings.columns = chart.encodings.columns.concat([f]));
        }
        if (rows) {
            const f = fields.find((f) => f.fid === rows);
            f && (chart.encodings.rows = chart.encodings.rows.concat([f]));
        }
    }
    if (spec.color && spec.color.length > 0) {
        const color = spec.color[0];
        const f = fields.find((f) => f.fid === color);
        f && (chart.encodings.color = chart.encodings.color.concat([f]));
    }
    if (spec.size && spec.size.length > 0) {
        const size = spec.size[0];
        const f = fields.find((f) => f.fid === size);
        f && (chart.encodings.size = chart.encodings.size.concat([f]));
    }
    if (spec.opacity && spec.opacity.length > 0) {
        const opacity = spec.opacity[0];
        const f = fields.find((f) => f.fid === opacity);
        f && (chart.encodings.opacity = chart.encodings.opacity.concat([f]));
    }
    return chart;
}
function geomAdapter(geom) {
    switch (geom) {
        case 'interval':
        case 'bar':
            return 'bar';
        case 'line':
            return 'line';
        case 'boxplot':
            return 'boxplot';
        case 'area':
            return 'area';
        case 'point':
            return 'point';
        case 'arc':
            return 'arc';
        case 'circle':
            return 'circle';
        case 'heatmap':
            return 'circle';
        case 'rect':
            return 'rect';
        case 'tick':
        default:
            return 'tick';
    }
}
//# sourceMappingURL=visualSpecStore.js.map
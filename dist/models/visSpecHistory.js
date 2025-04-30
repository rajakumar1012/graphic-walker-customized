import { arrayEqual, createCountField, createVirtualFields, isNotEmpty } from '../utils';
import { emptyEncodings, emptyVisualConfig, emptyVisualLayout, visSpecDecoder, forwardVisualConfigs } from '../utils/save';
import { insert, mutPath, remove, replace, uniqueId } from './utils';
import { atWith, create, freeze, performWith, redoWith, undoWith } from './withHistory';
import { GLOBAL_CONFIG } from '../config';
import { COUNT_FIELD_ID, MEA_KEY_ID, MEA_VAL_ID, PAINT_FIELD_ID } from '../constants';
import { algebraLint } from '../lib/gog';
import { getSQLItemAnalyticType, parseSQLExpr, replaceFid } from '../lib/sql';
import produce from 'immer';
// note: only add new methods at end
export var Methods;
(function (Methods) {
    Methods[Methods["setConfig"] = 0] = "setConfig";
    Methods[Methods["removeField"] = 1] = "removeField";
    Methods[Methods["reorderField"] = 2] = "reorderField";
    Methods[Methods["moveField"] = 3] = "moveField";
    Methods[Methods["cloneField"] = 4] = "cloneField";
    Methods[Methods["createBinlogField"] = 5] = "createBinlogField";
    Methods[Methods["appendFilter"] = 6] = "appendFilter";
    Methods[Methods["modFilter"] = 7] = "modFilter";
    Methods[Methods["writeFilter"] = 8] = "writeFilter";
    Methods[Methods["setName"] = 9] = "setName";
    Methods[Methods["applySort"] = 10] = "applySort";
    Methods[Methods["transpose"] = 11] = "transpose";
    Methods[Methods["setLayout"] = 12] = "setLayout";
    Methods[Methods["setFieldAggregator"] = 13] = "setFieldAggregator";
    Methods[Methods["setGeoData"] = 14] = "setGeoData";
    Methods[Methods["setCoordSystem"] = 15] = "setCoordSystem";
    Methods[Methods["createDateDrillField"] = 16] = "createDateDrillField";
    Methods[Methods["createDateFeatureField"] = 17] = "createDateFeatureField";
    Methods[Methods["changeSemanticType"] = 18] = "changeSemanticType";
    Methods[Methods["setFilterAggregator"] = 19] = "setFilterAggregator";
    Methods[Methods["addFoldField"] = 20] = "addFoldField";
    Methods[Methods["upsertPaintField"] = 21] = "upsertPaintField";
    Methods[Methods["addSQLComputedField"] = 22] = "addSQLComputedField";
    Methods[Methods["removeAllField"] = 23] = "removeAllField";
    Methods[Methods["editAllField"] = 24] = "editAllField";
    Methods[Methods["replaceWithNLPQuery"] = 25] = "replaceWithNLPQuery";
})(Methods || (Methods = {}));
const actions = {
    [Methods.setConfig]: (data, key, value) => mutPath(data, 'config', (c) => ({ ...c, [key]: value })),
    [Methods.removeField]: (data, encoding, index) => mutPath(data, `encodings.${encoding}`, (fields) => remove(fields, index)),
    [Methods.reorderField]: (data, encoding, from, to) => mutPath(data, `encodings.${encoding}`, (fields) => fields.map((x, i, a) => {
        if (i === from)
            return a[to];
        if (i === to)
            return a[from];
        return x;
    })),
    [Methods.moveField]: (data, from, findex, to, tindex, limit) => {
        const oriField = data.encodings[from][findex];
        const field = to === 'dimensions'
            ? mutPath(oriField, 'analyticType', () => 'dimension')
            : to === 'measures'
                ? mutPath(oriField, 'analyticType', () => 'measure')
                : oriField;
        return mutPath(data, 'encodings', (e) => ({
            ...e,
            [from]: remove(data.encodings[from], findex),
            [to]: insert(data.encodings[to], field, tindex).slice(0, limit ?? Infinity),
        }));
    },
    [Methods.cloneField]: (data, from, findex, to, tindex, newVarKey, limit) => {
        const field = { ...data.encodings[from][findex] };
        return mutPath(data, 'encodings', (e) => ({
            ...e,
            [to]: insert(data.encodings[to], field, tindex).slice(0, limit ?? Infinity),
        }));
    },
    [Methods.createBinlogField]: (data, encoding, index, op, newVarKey, num) => {
        const originField = data.encodings[encoding][index];
        const isBin = op.startsWith('bin');
        const channel = isBin ? 'dimensions' : encoding;
        const prefix = isBin ? `${op}${num}` : `log${num}`;
        const newField = {
            fid: newVarKey,
            name: `${prefix}(${originField.name})`,
            semanticType: isBin ? 'ordinal' : 'quantitative',
            analyticType: isBin ? 'dimension' : originField.analyticType,
            computed: true,
            expression: {
                op,
                as: newVarKey,
                params: [
                    {
                        type: 'field',
                        value: originField.fid,
                    },
                ],
                num,
            },
        };
        if (!isBin) {
            newField.aggName = 'sum';
        }
        return mutPath(data, `encodings.${channel}`, (a) => a.concat(newField));
    },
    [Methods.appendFilter]: (data, index, from, findex, _dragId) => {
        const originField = data.encodings[from][findex];
        return mutPath(data, 'encodings.filters', (filters) => insert(filters, {
            ...originField,
            rule: null,
        }, index));
    },
    [Methods.modFilter]: (data, index, from, findex) => mutPath(data, 'encodings.filters', (filters) => {
        const originField = data.encodings[from][findex];
        return replace(filters, index, (f) => ({
            ...originField,
            rule: null,
        }));
    }),
    [Methods.writeFilter]: (data, index, rule) => mutPath(data, 'encodings.filters', (filters) => replace(filters, index, (x) => ({ ...x, rule }))),
    [Methods.setName]: (data, name) => ({
        ...data,
        name,
    }),
    [Methods.applySort]: (data, sort) => {
        const { rows, columns } = data.encodings;
        const yField = rows.length > 0 ? rows[rows.length - 1] : null;
        const xField = columns.length > 0 ? columns[columns.length - 1] : null;
        if (xField !== null && xField.analyticType === 'dimension' && yField !== null && yField.analyticType === 'measure') {
            return mutPath(data, 'encodings.columns', (cols) => replace(cols, cols.length - 1, (x) => ({ ...x, sort })));
        }
        if (xField !== null && xField.analyticType === 'measure' && yField !== null && yField.analyticType === 'dimension') {
            return mutPath(data, 'encodings.rows', (rows) => replace(rows, rows.length - 1, (x) => ({ ...x, sort })));
        }
        return data;
    },
    [Methods.transpose]: (data) => mutPath(data, 'encodings', (e) => ({
        ...e,
        columns: e.rows,
        rows: e.columns,
    })),
    [Methods.setLayout]: (data, kvs) => mutPath(data, 'layout', (l) => Object.assign({}, l, Object.fromEntries(kvs))),
    [Methods.setFieldAggregator]: (data, encoding, index, aggName) => mutPath(data, `encodings.${encoding}`, (f) => replace(f, index, (x) => ({ ...x, aggName }))),
    [Methods.setGeoData]: (data, geojson, geoKey, geoUrl) => mutPath(data, 'layout', (l) => ({ ...l, geojson, geoKey, geoUrl })),
    [Methods.setCoordSystem]: (data, system) => mutPath(data, 'config', (c) => ({
        ...c,
        coordSystem: system,
        geoms: [GLOBAL_CONFIG.GEOM_TYPES[system][0]],
    })),
    [Methods.createDateDrillField]: (data, channel, index, drillLevel, newVarKey, newName, format, offset) => {
        const originField = data.encodings[channel][index];
        const newField = {
            fid: newVarKey,
            name: newName,
            semanticType: 'temporal',
            analyticType: originField.analyticType,
            aggName: 'sum',
            computed: true,
            timeUnit: drillLevel,
            expression: {
                op: 'dateTimeDrill',
                as: newVarKey,
                params: [
                    {
                        type: 'field',
                        value: originField.fid,
                    },
                    {
                        type: 'value',
                        value: drillLevel,
                    },
                    ...(format
                        ? [
                            {
                                type: 'format',
                                value: format,
                            },
                        ]
                        : []),
                    ...(isNotEmpty(offset)
                        ? [
                            {
                                type: 'offset',
                                value: offset,
                            },
                        ]
                        : []),
                ],
            },
        };
        return mutPath(data, `encodings.${channel}`, (a) => a.concat(newField));
    },
    [Methods.createDateFeatureField]: (data, channel, index, drillLevel, newVarKey, newName, format, offset) => {
        const originField = data.encodings[channel][index];
        const newField = {
            fid: newVarKey,
            name: newName,
            semanticType: 'ordinal',
            analyticType: originField.analyticType,
            aggName: 'sum',
            computed: true,
            expression: {
                op: 'dateTimeFeature',
                as: newVarKey,
                params: [
                    {
                        type: 'field',
                        value: originField.fid,
                    },
                    {
                        type: 'value',
                        value: drillLevel,
                    },
                    ...(format
                        ? [
                            {
                                type: 'format',
                                value: format,
                            },
                        ]
                        : []),
                    ...(isNotEmpty(offset)
                        ? [
                            {
                                type: 'offset',
                                value: offset,
                            },
                        ]
                        : []),
                ],
            },
        };
        return mutPath(data, `encodings.${channel}`, (a) => a.concat(newField));
    },
    [Methods.changeSemanticType]: (data, channel, index, semanticType) => {
        return mutPath(data, `encodings.${channel}`, (f) => replace(f, index, (x) => ({ ...x, semanticType })));
    },
    [Methods.setFilterAggregator]: (data, index, aggName) => {
        return mutPath(data, `encodings.filters`, (f) => replace(f, index, (x) => ({ ...x, aggName: aggName || 'sum', enableAgg: aggName ? true : false, rule: null })));
    },
    [Methods.addFoldField]: (originalData, from, findex, to, tindex, newVarKey, limit) => {
        let data = originalData;
        const originalField = data.encodings[from][findex];
        if (!data.config.folds) {
            const validFoldBy = [...data.encodings.measures, ...data.encodings.details].filter((f) => f.analyticType === 'measure' && f.fid !== MEA_VAL_ID);
            data = actions[Methods.setConfig](data, 'folds', validFoldBy.filter((_, i) => i === 0).map((x) => x.fid));
        }
        if (originalField.fid === MEA_VAL_ID) {
            const meaKeyIndexes = Object.keys(data.encodings)
                .filter((x) => x !== 'filters')
                .map((k) => [k, data.encodings[k].findIndex((f) => f.fid === MEA_KEY_ID)])
                .filter(([k, i]) => i >= 0);
            if (meaKeyIndexes.length === 1) {
                // there is no Measure Name in Chart, add it in Details channel (which has no limit)
                const [fromKey, fromIndex] = meaKeyIndexes[0];
                data = actions[Methods.cloneField](data, fromKey, fromIndex, 'details', 0, `${newVarKey}_auto`, Infinity);
            }
        }
        return actions[Methods.cloneField](data, from, findex, to, tindex, newVarKey, limit);
    },
    [Methods.upsertPaintField]: (data, map, name) => {
        if (!map) {
            return mutPath(data, 'encodings', (encodings) => Object.fromEntries(Object.entries(encodings).map(([c, f]) => [c, f.filter((x) => x.fid !== PAINT_FIELD_ID)])));
        }
        const expression = 'facets' in map
            ? { op: 'paint', as: PAINT_FIELD_ID, params: [{ type: 'newmap', value: map }] }
            : {
                op: 'paint',
                as: PAINT_FIELD_ID,
                params: [{ type: 'map', value: map }],
            };
        const hasErased = map.usedColor.includes(255);
        return mutPath(data, 'encodings', (enc) => {
            let hasPaintField = false;
            let hasFilterField = false;
            const entries = Object.entries(enc).map(([channel, fields]) => {
                const i = fields.findIndex((x) => x.fid === PAINT_FIELD_ID);
                if (i > -1) {
                    hasPaintField = true;
                    if (channel === 'filters') {
                        hasFilterField = true;
                    }
                    return [
                        channel,
                        replace(fields, i, (x) => ({
                            ...x,
                            expression,
                        })),
                    ];
                }
                return [channel, fields];
            });
            const erasedFilter = {
                fid: PAINT_FIELD_ID,
                analyticType: 'dimension',
                name,
                semanticType: 'nominal',
                computed: true,
                expression,
                rule: {
                    type: 'not in',
                    value: [''],
                },
            };
            if (hasPaintField) {
                if (!hasFilterField && hasErased) {
                    return mutPath(Object.fromEntries(entries), 'filters', (f) => f.concat(erasedFilter));
                }
                return Object.fromEntries(entries);
            }
            // if is creating paint field, add it to color encoding.
            const field = {
                fid: PAINT_FIELD_ID,
                analyticType: 'dimension',
                name,
                semanticType: 'nominal',
                computed: true,
                expression,
            };
            const result = mutPath(mutPath(enc, 'dimensions', (f) => insert(f, field, f.length)), 'color', () => [{ ...field }]);
            if (hasErased) {
                return mutPath(result, 'filters', (f) => f.concat(erasedFilter));
            }
            return result;
        });
    },
    [Methods.addSQLComputedField]: (data, fid, name, sql) => {
        const [type, isAgg] = getSQLItemAnalyticType(parseSQLExpr(sql), data.encodings.dimensions.concat(data.encodings.measures));
        const analyticType = type === 'quantitative' ? 'measure' : 'dimension';
        return mutPath(data, `encodings.${analyticType}s`, (f) => f.concat({
            analyticType,
            fid,
            name,
            semanticType: type,
            computed: true,
            aggName: isAgg ? 'expr' : analyticType === 'dimension' ? undefined : 'sum',
            expression: {
                op: 'expr',
                as: fid,
                params: [{ type: 'sql', value: sql }],
            },
        }));
    },
    [Methods.removeAllField]: (data, fid) => {
        return mutPath(data, 'encodings', (e) => Object.fromEntries(Object.entries(e).map(([fname, fields]) => {
            const newFields = fields.filter((x) => x.fid !== fid);
            if (fields.length === newFields.length) {
                return [fname, fields];
            }
            return [fname, newFields];
        })));
    },
    [Methods.editAllField]: (data, fid, newData) => {
        if (Object.keys(newData).includes('name')) {
            const originalField = data.encodings.dimensions.concat(data.encodings.measures).find((x) => x.fid === fid);
            // if name is changed, update all computed fields
            return produce(data, (draft) => {
                if (!originalField)
                    return;
                Object.values(draft.encodings).forEach((fields) => fields.forEach((field, i) => {
                    if (field.fid === fid) {
                        fields[i] = { ...field, ...newData };
                    }
                    else if (field.expression?.op === 'expr') {
                        const sqlParam = field.expression.params.find((x) => x.type === 'sql');
                        if (sqlParam) {
                            const newVal = replaceFid(sqlParam.value, [
                                { ...originalField, fid: newData.name, name: originalField.name ?? originalField.fid },
                            ]);
                            if (newVal !== sqlParam.value) {
                                sqlParam.value = newVal;
                            }
                        }
                    }
                }));
            });
        }
        return mutPath(data, 'encodings', (e) => Object.fromEntries(Object.entries(e).map(([fname, fields]) => {
            const hasField = fields.find((x) => x.fid === fid);
            if (hasField) {
                return [fname, fields.map((x) => (x.fid === fid ? { ...x, ...newData } : x))];
            }
            return [fname, fields];
        })));
    },
    [Methods.replaceWithNLPQuery]: (data, _query, response) => {
        return { ...JSON.parse(response), visId: data.visId, name: data.name };
    },
};
const diffChangedEncodings = (prev, next) => {
    const result = {};
    Object.keys(next.encodings).forEach((k) => {
        if (next.encodings[k] !== prev.encodings[k]) {
            result[k] = next.encodings[k];
        }
    });
    return result;
};
function makeFieldAtLast(arr, lasts) {
    const result = [];
    const found = new Array(lasts.length).fill(null).map(() => []);
    arr.forEach((x) => {
        const i = lasts.findIndex((f) => f(x));
        if (i >= 0) {
            found[i].push(x);
        }
        else {
            result.push(x);
        }
    });
    return result.concat(found.flat());
}
function lintExtraFields(encodings) {
    const result = {};
    if (encodings.dimensions && encodings.dimensions.length > 0) {
        result.dimensions = makeFieldAtLast(encodings.dimensions, [(i) => i.fid === PAINT_FIELD_ID, (i) => i.fid === MEA_KEY_ID]);
    }
    if (encodings.measures && encodings.measures.length > 0) {
        result.measures = makeFieldAtLast(encodings.measures, [(i) => i.fid === COUNT_FIELD_ID, (i) => i.fid === MEA_VAL_ID]);
    }
    return result;
}
const diffLinter = (item, original) => {
    const diffs = diffChangedEncodings(original, item);
    const geom = item.config.geoms[0];
    if (Object.keys(diffs).length === 0 && arrayEqual(item.config.geoms, original.config.geoms))
        return item;
    if (!arrayEqual(item.config.geoms, original.config.geoms)) {
        return mutPath(item, 'encodings', (x) => ({ ...x, ...algebraLint(geom, x), ...lintExtraFields(x) }));
    }
    return mutPath(item, 'encodings', (x) => ({ ...x, ...algebraLint(geom, diffs), ...lintExtraFields(diffs) }));
};
const reducerMiddleWares = [diffLinter];
function reducerT(data, action) {
    const [type, ...props] = action;
    const result = actions[type](data, ...props);
    return reducerMiddleWares.reduce((item, f) => f(item, data), result);
}
export const reducer = reducerT;
export const perform = performWith(reducerT);
export const undo = undoWith(reducerT);
export const redo = redoWith(reducerT);
export const at = atWith(reducerT);
export { freeze };
export const performers = Object.fromEntries(Object.keys(Methods).map((k) => [k, (data, ...args) => perform(data, [Methods[k], ...args])]));
function emptyChart(visId, name, defaultConfig) {
    return {
        config: defaultConfig?.config ? { ...emptyVisualConfig, ...defaultConfig.config } : emptyVisualConfig,
        encodings: emptyEncodings,
        layout: defaultConfig?.layout ? { ...emptyVisualLayout, ...defaultConfig.layout } : emptyVisualLayout,
        visId: visId,
        name,
    };
}
export function newChart(fields, name, visId, defaultConfig) {
    if (fields.length === 0)
        return emptyChart(visId || uniqueId(), name, defaultConfig);
    const extraFields = [createCountField(), ...createVirtualFields()];
    const extraDimensions = extraFields.filter((x) => x.analyticType === 'dimension');
    const extraMeasures = extraFields.filter((x) => x.analyticType === 'measure');
    return mutPath(emptyChart(visId || uniqueId(), name, defaultConfig), 'encodings', (e) => ({
        ...e,
        dimensions: fields
            .filter((f) => f.analyticType === 'dimension')
            .map((f) => ({
            fid: f.fid,
            name: f.name || f.fid,
            basename: f.basename || f.name || f.fid,
            semanticType: f.semanticType,
            analyticType: f.analyticType,
            offset: f.offset,
        }))
            .concat(extraDimensions),
        measures: fields
            .filter((f) => f.analyticType === 'measure')
            .map((f) => ({
            fid: f.fid,
            name: f.name || f.fid,
            basename: f.basename || f.name || f.fid,
            analyticType: f.analyticType,
            semanticType: f.semanticType,
            aggName: 'sum',
            offset: f.offset,
        }))
            .concat(extraMeasures),
    }));
}
export function fillChart(chart) {
    const result = emptyChart(chart.visId || uniqueId(), chart.name || 'Chart');
    result.config = {
        ...result.config,
        ...chart.config,
    };
    result.encodings = {
        ...result.encodings,
        ...chart.encodings,
    };
    result.layout = {
        ...result.layout,
        ...chart.layout,
        size: {
            ...result.layout.size,
            ...chart.layout?.size,
        },
    };
    return result;
}
export function fromSnapshot(snapshot) {
    return create(fillChart(snapshot));
}
export function fromFields(fields, name, defaultConfig) {
    return create(newChart(fields, name, undefined, defaultConfig));
}
export function exportFullRaw(data, maxHistory = 30) {
    const result = {
        base: data.cursor > maxHistory ? at(data, data.cursor - maxHistory) : data.base,
        timeline: data.timeline.slice(Math.max(0, data.cursor - maxHistory)),
    };
    return JSON.stringify(result);
}
export function exportNow(data) {
    return data.now;
}
export function importNow(data) {
    return fromSnapshot(data);
}
export function importFull(data) {
    const result = JSON.parse(data);
    const base = fromSnapshot(result.base);
    return result.timeline.reduce(perform, base);
}
export function resolveChart(data) {
    const result = JSON.parse(data);
    const base = fillChart(result.base);
    return result.timeline.reduce(reducer, base);
}
export function convertChart(data) {
    const result = emptyChart(data.visId, data.name || 'Chart');
    result.config = {
        ...result.config,
        defaultAggregated: data.config.defaultAggregated,
        geoms: data.config.geoms?.slice() ?? [],
        limit: data.config.limit,
        coordSystem: data.config.coordSystem,
        folds: data.config.folds,
    };
    result.encodings = {
        ...result.encodings,
        dimensions: data.encodings.dimensions?.slice() ?? [],
        measures: data.encodings.measures?.slice() ?? [],
        rows: data.encodings.rows?.slice() ?? [],
        columns: data.encodings.columns?.slice() ?? [],
        color: data.encodings.color?.slice() ?? [],
        opacity: data.encodings.opacity?.slice() ?? [],
        size: data.encodings.size?.slice() ?? [],
        shape: data.encodings.shape?.slice() ?? [],
        theta: data.encodings.theta?.slice() ?? [],
        radius: data.encodings.radius?.slice() ?? [],
        longitude: data.encodings.longitude?.slice() ?? [],
        latitude: data.encodings.latitude?.slice() ?? [],
        geoId: data.encodings.geoId?.slice() ?? [],
        details: data.encodings.details?.slice() ?? [],
        filters: data.encodings.filters?.slice() ?? [],
        text: data.encodings.text?.slice() ?? [],
    };
    result.layout = {
        ...result.layout,
        background: data.config.background,
        format: data.config.format,
        interactiveScale: data.config.interactiveScale,
        resolve: data.config.resolve,
        showActions: data.config.showActions,
        stack: data.config.stack,
        zeroScale: data.config.zeroScale,
        size: {
            ...result.layout.size,
            ...data.config.size,
        },
        colorPalette: data.config.colorPalette,
        geojson: data.config.geojson,
        geoKey: data.config.geoKey,
        geoUrl: data.config.geoUrl,
        primaryColor: data.config.primaryColor,
        scale: data.config.scale,
        scaleIncludeUnmatchedChoropleth: data.config.scaleIncludeUnmatchedChoropleth,
        showTableSummary: data.config.showTableSummary,
        useSvg: data.config.useSvg,
    };
    return result;
}
export function parseChart(chart) {
    return 'layout' in chart ? chart : convertChart(visSpecDecoder(forwardVisualConfigs(chart)));
}
//# sourceMappingURL=visSpecHistory.js.map
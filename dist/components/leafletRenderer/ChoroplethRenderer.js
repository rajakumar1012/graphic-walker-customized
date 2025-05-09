import React, { Fragment, forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { CircleMarker, MapContainer, Polygon, Marker, TileLayer, Tooltip, AttributionControl } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { getMeaAggKey, getMeaAggName } from '../../utils';
import { useColorScale, useOpacityScale } from './encodings';
import { isValidLatLng } from './POIRenderer';
import { TooltipContent } from './tooltip';
import { useAppRootContext } from '../appRoot';
import { useGeoJSON } from '../../hooks/service';
import { useTranslation } from 'react-i18next';
import { ChangeView } from './utils';
import ColorPanel from './color';
import { themeContext } from "../../store/theme";
const resolveCoords = (featureGeom) => {
    switch (featureGeom.type) {
        case 'Polygon': {
            const coords = featureGeom.coordinates[0];
            return [coords.map((c) => [c[1], c[0]])];
        }
        case 'Point': {
            const coords = featureGeom.coordinates;
            return [[[coords[1], coords[0]]]];
        }
        case 'GeometryCollection': {
            const coords = featureGeom.geometries.map(resolveCoords);
            return coords.flat();
        }
        case 'LineString': {
            const coords = featureGeom.coordinates;
            return [coords.map((c) => [c[1], c[0]])];
        }
        case 'MultiLineString': {
            const coords = featureGeom.coordinates;
            return coords.map((c) => c.map((c) => [c[1], c[0]]));
        }
        case 'MultiPoint': {
            const coords = featureGeom.coordinates;
            return [coords.map((c) => [c[1], c[0]])];
        }
        case 'MultiPolygon': {
            const coords = featureGeom.coordinates;
            return coords.map((c) => c[0].map((c) => [c[1], c[0]]));
        }
        default: {
            return [];
        }
    }
};
const resolveCenter = (coordinates) => {
    let area = 0;
    let centroid = [0, 0];
    for (let i = 0; i < coordinates.length - 1; i++) {
        let [x1, y1] = coordinates[i];
        let [x2, y2] = coordinates[i + 1];
        let tempArea = x1 * y2 - x2 * y1;
        area += tempArea;
        centroid[0] += (x1 + x2) * tempArea;
        centroid[1] += (y1 + y2) * tempArea;
    }
    area /= 2;
    centroid[0] /= 6 * area;
    centroid[1] /= 6 * area;
    return centroid;
};
const ChoroplethRenderer = forwardRef(function ChoroplethRenderer(props, ref) {
    const { name, data, allFields, features: localFeatures, featuresUrl, geoKey, defaultAggregated, geoId, color, opacity, text, details, vegaConfig, scaleIncludeUnmatchedChoropleth, showAllGeoshapeInChoropleth, scales, tileUrl, } = props;
    const darkMode = useContext(themeContext);
    useImperativeHandle(ref, () => ({}));
    const features = useGeoJSON(localFeatures, featuresUrl);
    const { t } = useTranslation('translation');
    const geoIndices = useMemo(() => {
        if (geoId) {
            return data.map((row) => row[geoId.fid]);
        }
        return [];
    }, [geoId, data]);
    const [indices, geoShapes] = useMemo(() => {
        if (geoIndices.length && geoKey && features) {
            const indices = [];
            const shapes = geoIndices.map((id, i) => {
                const feature = id ? features.features.find((f) => f.properties && f.properties[geoKey] === id) : undefined;
                if (feature) {
                    indices.push(i);
                }
                return feature;
            });
            return [indices, shapes];
        }
        return [[], []];
    }, [geoIndices, features, geoKey]);
    const missingDataGeoShapes = useMemo(() => {
        if (showAllGeoshapeInChoropleth && features) {
            const indices = new Set(geoIndices);
            return features.features
                .filter((x) => x.properties)
                .filter((x) => !indices.has(x.properties[geoKey]))
                .map((f) => ({ coords: resolveCoords(f.geometry), name: f.properties[geoKey] }));
        }
        return [];
    }, [geoIndices, features, showAllGeoshapeInChoropleth, geoKey]);
    useEffect(() => {
        if (geoShapes.length > 0) {
            const notMatched = geoShapes.filter((f) => !f);
            if (notMatched.length) {
                console.warn(`Failed to render ${notMatched.length.toLocaleString()} items of ${data.length.toLocaleString()} rows due to missing geojson feature.`);
            }
        }
    }, [geoShapes]);
    const lngLat = useMemo(() => {
        if (geoShapes.length > 0) {
            return geoShapes.map((feature) => {
                if (feature) {
                    return resolveCoords(feature.geometry);
                }
                return [];
            }, []);
        }
        return [];
    }, [geoShapes]);
    const [bounds, center] = useMemo(() => {
        const allLngLat = lngLat.flat(2);
        if (allLngLat.length > 0) {
            const [bounds, coords] = allLngLat.reduce(([bounds, acc], [lat, lng]) => {
                if (lat < bounds[0][0]) {
                    bounds[0][0] = lat;
                }
                if (lat > bounds[1][0]) {
                    bounds[1][0] = lat;
                }
                if (lng < bounds[0][1]) {
                    bounds[0][1] = lng;
                }
                if (lng > bounds[1][1]) {
                    bounds[1][1] = lng;
                }
                return [bounds, [acc[0] + lng, acc[1] + lat]];
            }, [
                [[...allLngLat[0]], [...allLngLat[0]]],
                [0, 0],
            ]);
            return [bounds, [coords[0] / lngLat.length, coords[1] / lngLat.length]];
        }
        return [
            [
                [-180, -90],
                [180, 90],
            ],
            [0, 0],
        ];
    }, [lngLat]);
    const distribution = useMemo(() => {
        if (scaleIncludeUnmatchedChoropleth) {
            return data;
        }
        return indices.map((i) => data[i]);
    }, [data, indices, scaleIncludeUnmatchedChoropleth]);
    const opacityScale = useOpacityScale(distribution, opacity, defaultAggregated, scales);
    const { mapper: colorScale, display: colorDisplay } = useColorScale(distribution, color, defaultAggregated, vegaConfig);
    const tooltipFields = useMemo(() => {
        return details.concat([color, opacity].filter(Boolean)).map((f) => ({
            ...f,
            key: defaultAggregated && f.analyticType === 'measure' && f.aggName ? getMeaAggKey(f.fid, f.aggName) : f.fid,
        }));
    }, [defaultAggregated, details, color, opacity]);
    const mapRef = useRef(null);
    useEffect(() => {
        const container = mapRef.current?.getContainer();
        if (container) {
            const ro = new ResizeObserver(() => {
                mapRef.current?.invalidateSize();
            });
            ro.observe(container);
            return () => {
                ro.unobserve(container);
            };
        }
    });
    const appRef = useAppRootContext();
    useEffect(() => {
        const ctx = appRef.current;
        if (ctx) {
            ctx.exportChart = async (mode) => ({
                mode,
                title: name || 'untitled',
                nCols: 0,
                nRows: 0,
                charts: [],
                container: () => mapRef.current?.getContainer() ?? null,
                chartType: 'map',
            });
        }
    }, []);
    if (!features && (localFeatures || featuresUrl)) {
        return React.createElement("div", { className: "flex items-center justify-center w-full h-full" }, t('main.tabpanel.settings.geography_settings.loading'));
    }
    const border = darkMode === 'dark' ? '#fff4' : '#0004';
    return (React.createElement(MapContainer, { preferCanvas: true, attributionControl: false, center: center, ref: mapRef, zoom: 5, bounds: bounds, style: { width: '100%', height: '100%', zIndex: 1 } },
        React.createElement(ChangeView, { bounds: bounds }),
        tileUrl === undefined && (React.createElement(TileLayer, { className: "map-tile", attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" })),
        tileUrl && React.createElement(TileLayer, { className: "map-tile", url: tileUrl }),
        React.createElement(AttributionControl, { prefix: "Leaflet" }),
        lngLat.length > 0 &&
            data.flatMap((row, i) => {
                const coords = lngLat[i];
                const opacity = opacityScale(row);
                const color = colorScale(row);
                return coords.map((coord, j) => {
                    if (coord.length === 0) {
                        return null;
                    }
                    if (coord.length === 1) {
                        return (React.createElement(CircleMarker, { key: `${i}-${opacity}-${color}-${j}`, center: coord[0], radius: 3, opacity: 0.8, fillOpacity: opacity, fillColor: color, color: border, weight: 1, stroke: true, fill: true }, tooltipFields.length > 0 && (React.createElement(Tooltip, null,
                            React.createElement("header", null, data[i][geoId.fid]),
                            tooltipFields.map((f, j) => (React.createElement(TooltipContent, { key: j, allFields: allFields, vegaConfig: vegaConfig, field: f, value: row[f.key] })))))));
                    }
                    const center = text && coord.length >= 3 ? resolveCenter(coord) : [NaN, NaN];
                    return (React.createElement(Fragment, { key: `${i}-${opacity}-${color}-${j}` },
                        React.createElement(Polygon, { positions: coord, pathOptions: {
                                fillOpacity: opacity * 0.8,
                                fillColor: color,
                                color: border,
                                weight: 1,
                                stroke: true,
                                fill: true,
                            } },
                            React.createElement(Tooltip, null,
                                React.createElement("header", null, data[i][geoId.fid]),
                                tooltipFields.map((f, j) => (React.createElement(TooltipContent, { key: j, allFields: allFields, vegaConfig: vegaConfig, field: f, value: row[f.key] }))))),
                        text && data[i][text.fid] && isValidLatLng(center[0], center[1]) && (React.createElement(Marker, { position: center, interactive: false, icon: divIcon({
                                className: '!bg-transparent !border-none',
                                html: `<div style="font-size: 11px; transform: translate(-50%, -50%); opacity: 0.8;">${data[i][text.fid]}</div>`,
                            }) }))));
                });
            }),
        missingDataGeoShapes.flatMap(({ coords, name }, i) => {
            const opacity = 0.3;
            const color = '#808080';
            return coords.map((coord, j) => {
                if (coord.length === 0) {
                    return null;
                }
                if (coord.length === 1) {
                    return (React.createElement(CircleMarker, { key: `missing-${i}-${j}`, center: coord[0], radius: 3, opacity: 0.8, fillOpacity: opacity, fillColor: color, color: border, weight: 1, stroke: true, fill: true }, tooltipFields.length > 0 && (React.createElement(Tooltip, null,
                        React.createElement("header", null, name),
                        tooltipFields.map((f, j) => (React.createElement("p", { key: j },
                            f.analyticType === 'measure' && f.aggName ? getMeaAggName(f.name, f.aggName) : f.name,
                            ": Null")))))));
                }
                const center = text && coord.length >= 3 ? resolveCenter(coord) : [NaN, NaN];
                return (React.createElement(Fragment, { key: `missing-${i}-${j}` },
                    React.createElement(Polygon, { positions: coord, pathOptions: {
                            fillOpacity: opacity * 0.8,
                            fillColor: color,
                            color: border,
                            weight: 1,
                            stroke: true,
                            fill: true,
                        } },
                        React.createElement(Tooltip, null,
                            React.createElement("header", null, name),
                            tooltipFields.map((f, j) => (React.createElement("p", { key: j },
                                f.analyticType === 'measure' && f.aggName ? getMeaAggName(f.name, f.aggName) : f.name,
                                ": Null"))))),
                    text && data[i][text.fid] && isValidLatLng(center[0], center[1]) && (React.createElement(Marker, { position: center, interactive: false, icon: divIcon({
                            className: '!bg-transparent !border-none',
                            html: `<div style="font-size: 11px; transform: translate(-50%, -50%); opacity: 0.8;">${data[i][text.fid]}</div>`,
                        }) }))));
            });
        }),
        colorDisplay && React.createElement(ColorPanel, { display: colorDisplay, field: color })));
});
export default ChoroplethRenderer;
//# sourceMappingURL=ChoroplethRenderer.js.map
import { IStoInfoV2SchemaUrl } from '../interfaces';
import { forwardVisualConfigs, visSpecDecoder } from '../utils/save';
import { uniqueId } from '../models/utils';
import { convertChart, exportFullRaw, fromFields, fromSnapshot } from '../models/visSpecHistory';
export class DataStore {
    metaDict = {};
    metaMap = {};
    visDict = {};
    dataSources = [];
    updateDatasetMetas(id, fid, diffMeta) {
        const field = this.metaDict[id].find((f) => f.fid === fid);
        if (field) {
            for (let mk in diffMeta) {
                field[mk] = diffMeta[mk];
            }
        }
    }
    importData(data) {
        if (data.$schema === IStoInfoV2SchemaUrl) {
            this.metaDict = data.metaDict;
            const metaMap = {};
            Object.keys(data.metaDict).forEach((k) => {
                const meta = data.metaDict[k];
                metaMap[encodeMeta(meta)] = k;
            });
            this.metaMap = metaMap;
            this.dataSources = data.datasets;
            this.visDict = data.specDict;
        }
        else {
            const metaDict = {};
            const dsDict = Object.fromEntries(data.dataSources.map((x) => [x.id, x]));
            const dataSources = [];
            const metaMap = {};
            const visDict = {};
            data.datasets.forEach(({ dsId, id, name, rawFields }) => {
                const key = encodeMeta(rawFields);
                if (metaMap[key]) {
                    id = metaMap[key];
                }
                else {
                    metaMap[key] = id;
                    metaDict[id] = rawFields;
                    visDict[id] = [];
                }
                const ds = dsDict[dsId];
                dataSources.push({
                    data: ds.data,
                    id: dsId,
                    metaId: id,
                    name,
                });
            });
            const [defaultId] = Object.keys(metaDict);
            if (defaultId) {
                data.specList.forEach((x) => {
                    const key = encodeMeta(x.encodings.dimensions.concat(x.encodings.measures).filter((x) => !x.computed));
                    const store = visDict[key] || visDict[defaultId];
                    store.push(exportFullRaw(fromSnapshot(convertChart(visSpecDecoder(forwardVisualConfigs(x))))));
                });
            }
            this.metaDict = metaDict;
            this.visDict = visDict;
            this.dataSources = dataSources;
        }
    }
    exportData() {
        const resultSpecList = {};
        Object.keys(this.visDict).forEach((k) => {
            resultSpecList[k] = this.visDict[k];
        });
        return {
            $schema: IStoInfoV2SchemaUrl,
            datasets: this.dataSources,
            metaDict: this.metaDict,
            specDict: resultSpecList,
        };
    }
    addDataSource(data) {
        const metaKey = encodeMeta(data.fields);
        if (!this.metaMap[metaKey]) {
            this.metaMap[metaKey] = uniqueId();
        }
        const metaId = this.metaMap[metaKey];
        this.metaDict[metaId] = data.fields;
        const id = uniqueId();
        this.dataSources.push({
            data: data.data,
            id,
            metaId,
            name: data.name,
        });
        if (!this.visDict[metaId]) {
            this.visDict[metaId] = [exportFullRaw(fromFields(data.fields, 'Chart 1'))];
        }
        return id;
    }
}
function encodeMeta(m) {
    return m
        .map((x) => `${x.name}-${x.analyticType[0]}-${x.semanticType[0]}`)
        .sort()
        .join(',');
}
//# sourceMappingURL=dataStore.js.map
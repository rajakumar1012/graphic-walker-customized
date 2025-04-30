/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
// import InsightSpaceWorker from './workers/InsightService.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
// import ExplainerWorker from './workers/explainer.worker?worker&inline';
import FilterWorker from './workers/filter.worker?worker&inline';
import TransformDataWorker from './workers/transform.worker?worker&inline';
import ViewQueryWorker from './workers/viewQuery.worker?worker&inline';
import BuildMetricTableWorker from './workers/buildMetricTable.worker?worker&inline';
import SortWorker from './workers/sort.worker?worker&inline';
function workerService(worker, data) {
    return new Promise((resolve, reject) => {
        worker.postMessage(data);
        worker.onmessage = (e) => {
            if (typeof e.data === 'string') {
                reject({
                    success: false,
                    message: e.data,
                });
            }
            resolve(e.data);
        };
        worker.onerror = (e) => {
            reject({
                success: false,
                message: e,
            });
        };
    });
}
// export async function preAnalysis(props: PreAnalysisParams) {
//     if (workerState.eWorker !== null) {
//         workerState.eWorker.terminate();
//     }
//     try {
//         workerState.eWorker = new ExplainerWorker() as Worker;
//         const tmp = await workerService<boolean, { type: string; data: PreAnalysisParams}>(workerState.eWorker, { type: 'preAnalysis', data: props });
//     } catch (error) {
//         console.error(error)
//     }
// }
// export function destroyWorker() {
//     if (workerState.eWorker) {
//         workerState.eWorker.terminate();
//         workerState.eWorker = null;
//     }
// }
export const applyFilter = async (data, filters) => {
    if (filters.length === 0)
        return data;
    const worker = new FilterWorker();
    try {
        const res = await workerService(worker, {
            dataSource: data,
            filters: filters,
        });
        return res;
    }
    catch (error) {
        throw new Error(error.message);
    }
    finally {
        worker.terminate();
    }
};
export const transformDataService = async (data, trans) => {
    if (data.length === 0)
        return data;
    const worker = new TransformDataWorker();
    try {
        const res = await workerService(worker, {
            dataSource: data,
            trans,
        });
        return res;
    }
    catch (error) {
        throw new Error(error.message);
    }
    finally {
        worker.terminate();
    }
};
export const applyViewQuery = async (data, query) => {
    const worker = new ViewQueryWorker();
    try {
        const res = await workerService(worker, {
            dataSource: data,
            query: query,
        });
        return res;
    }
    catch (err) {
        throw new Error(err.message);
    }
    finally {
        worker.terminate();
    }
};
export const buildPivotTableService = async (dimsInRow, dimsInColumn, allData, aggData, collapsedKeyList, showTableSummary, sort) => {
    const worker = new BuildMetricTableWorker();
    try {
        const res = await workerService(worker, {
            dimsInRow,
            dimsInColumn,
            allData,
            aggData,
            collapsedKeyList,
            showTableSummary,
            sort,
        });
        return res;
    }
    catch (error) {
        throw new Error('Uncaught error in TableBuilderDataWorker', { cause: error });
    }
    finally {
        worker.terminate();
    }
};
export const applySort = async (data, viewMeasures, sort) => {
    const worker = new SortWorker();
    try {
        const res = await workerService(worker, {
            data,
            viewMeasures,
            sort,
        });
        return res;
    }
    catch (err) {
        throw new Error('Uncaught error in ViewQueryWorker', { cause: err });
    }
    finally {
        worker.terminate();
    }
};
//# sourceMappingURL=services.js.map
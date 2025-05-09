import { parseCmpFunction } from '../utils';
const cmp = parseCmpFunction('');
function compareMulti(a, b) {
    if (a.length < b.length)
        return -compareMulti(b, a);
    for (let i = 0; i < a.length; i++) {
        if (!b[i])
            return 1;
        const c = cmp(a[i], b[i]);
        if (c !== 0)
            return c;
    }
    return 0;
}
export function sortBy(data, viewMeasures, sort) {
    const sortM = sort === 'ascending' ? 1 : -1;
    return data
        .map((x) => ({
        data: x,
        value: viewMeasures.map((f) => x[f]),
    }))
        .sort((a, b) => sortM * compareMulti(a.value, b.value))
        .map((x) => x.data);
}
//# sourceMappingURL=sort.js.map
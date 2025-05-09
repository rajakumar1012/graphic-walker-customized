import React from 'react';
import { observer } from 'mobx-react-lite';
import DataTable from '../components/dataTable';
import { toJS } from 'mobx';
import { getComputation } from '../computation/clientComputation';
const Table = ({ commonStore, size = 10 }) => {
    const { tmpDSRawFields, tmpDataSource, displayOffset } = commonStore;
    const metas = toJS(tmpDSRawFields);
    const computation = React.useMemo(() => getComputation(tmpDataSource), [tmpDataSource]);
    return (React.createElement("div", { className: "rounded border" },
        React.createElement(DataTable, { size: size, metas: metas, computation: computation, displayOffset: displayOffset, onMetaChange: (fid, fIndex, diffMeta) => {
                commonStore.updateTempDatasetMetas(fid, diffMeta);
            } })));
};
export default observer(Table);
//# sourceMappingURL=table.js.map
import React, { useMemo } from 'react';
import { Droppable } from '@kanaries/react-beautiful-dnd';
import { DRAGGABLE_STATE_KEYS } from './fieldsContext';
import { AestheticFieldContainer } from './components';
import SingleEncodeEditor from './encodeFields/singleEncodeEditor';
import { observer } from 'mobx-react-lite';
import { useVizStore } from '../store';
import MultiEncodeEditor from './encodeFields/multiEncodeEditor';
import { GLOBAL_CONFIG } from '../config';
const aestheticFields = DRAGGABLE_STATE_KEYS.filter((f) => ['color', 'opacity', 'size', 'shape', 'details', 'text'].includes(f.id));
const AestheticFields = (props) => {
    const vizStore = useVizStore();
    const { config } = vizStore;
    const { geoms } = config;
    const channels = useMemo(() => {
        switch (geoms[0]) {
            case 'bar':
            case 'tick':
            case 'arc':
            case 'line':
            case 'area':
            case 'boxplot':
                return aestheticFields.filter((f) => f.id !== 'shape');
            case 'text':
                return aestheticFields.filter((f) => f.id === 'text' || f.id === 'color' || f.id === 'size' || f.id === 'opacity');
            case 'table':
                return [];
            case 'poi':
                return aestheticFields.filter((f) => f.id === 'color' || f.id === 'opacity' || f.id === 'size' || f.id === 'details');
            case 'choropleth':
                return aestheticFields.filter((f) => f.id === 'color' || f.id === 'opacity' || f.id === 'text' || f.id === 'details');
            default:
                return aestheticFields.filter((f) => f.id !== 'text');
        }
    }, [geoms[0]]);
    return (React.createElement("div", null, channels.map((dkey, i, { length }) => {
        if (GLOBAL_CONFIG.CHANNEL_LIMIT[dkey.id] === 1) {
            return (React.createElement(AestheticFieldContainer, { name: dkey.id, key: dkey.id, style: { position: 'relative' } },
                React.createElement(Droppable, { droppableId: dkey.id, direction: "horizontal" }, (provided, snapshot) => React.createElement(SingleEncodeEditor, { dkey: dkey, provided: provided, snapshot: snapshot }))));
        }
        else {
            return (React.createElement(AestheticFieldContainer, { name: dkey.id, key: dkey.id, style: { position: 'relative' } },
                React.createElement(Droppable, { droppableId: dkey.id, direction: "vertical" }, (provided, snapshot) => React.createElement(MultiEncodeEditor, { dkey: dkey, provided: provided, snapshot: snapshot }))));
        }
    })));
};
export default observer(AestheticFields);
//# sourceMappingURL=aestheticFields.js.map
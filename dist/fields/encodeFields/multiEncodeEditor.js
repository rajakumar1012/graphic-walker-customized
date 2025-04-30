import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useVizStore } from '../../store';
import { ChevronUpDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { COUNT_FIELD_ID, MEA_KEY_ID, MEA_VAL_ID } from '../../constants';
import DropdownContext from '../../components/dropdownContext';
import { GLOBAL_CONFIG } from '../../config';
import { Draggable } from '@kanaries/react-beautiful-dnd';
import styled from 'styled-components';
import SelectContext from '../../components/selectContext';
import { refMapper } from '../fieldsContext';
import { getFieldIdentifier } from "../../utils";
const PillActions = styled.div `
    overflow: visible !important;
    width: calc(100% - 1.875rem);
`;
const SingleEncodeEditor = (props) => {
    const { dkey, provided, snapshot } = props;
    const vizStore = useVizStore();
    const { currentEncodings, config, allFields } = vizStore;
    const folds = config.folds ?? [];
    const channelItems = currentEncodings[dkey.id];
    const { t } = useTranslation();
    const aggregationOptions = useMemo(() => {
        return GLOBAL_CONFIG.AGGREGATOR_LIST.map((op) => ({
            value: op,
            label: t(`constant.aggregator.${op}`),
        }));
    }, []);
    const foldOptions = useMemo(() => {
        const validFoldBy = allFields.filter((f) => f.analyticType === 'measure' && f.fid !== MEA_VAL_ID);
        return validFoldBy.map((f) => ({
            key: f.fid,
            label: f.name,
        }));
    }, [allFields]);
    return (React.createElement("div", { className: "relative select-none flex flex-col py-0.5 px-1 touch-none", ...provided.droppableProps, ref: refMapper(provided.innerRef) },
        channelItems.map((channelItem, index) => {
            return (React.createElement(Draggable, { key: `encode_${dkey.id}_${index}_${getFieldIdentifier(channelItem)}`, draggableId: `encode_${dkey.id}_${index}_${getFieldIdentifier(channelItem)}`, index: index }, (provided, snapshot) => {
                return (React.createElement("div", { ref: refMapper(provided.innerRef), ...provided.draggableProps, ...provided.dragHandleProps, className: 'flex items-stretch h-[30px] my-0.5 relative touch-none' +
                        (provided.draggableProps.style?.transform ? ' z-10' : '') +
                        (channelItem.aggName === 'expr' && !config.defaultAggregated ? ' !opacity-50' : '') },
                    React.createElement("div", { onClick: () => {
                            vizStore.removeField(dkey.id, 0);
                        }, className: "grow-0 shrink-0 px-1.5 flex items-center justify-center bg-destructive text-destructive-foreground cursor-pointer" },
                        React.createElement(TrashIcon, { className: "w-4" })),
                    React.createElement(PillActions, { className: "flex-1 flex items-center border border-l-0 px-2 space-x-2 truncate" },
                        channelItem.fid === MEA_KEY_ID && (React.createElement(SelectContext, { options: foldOptions, selectedKeys: folds, onSelect: (keys) => {
                                vizStore.setVisualConfig('folds', keys);
                            }, className: "flex-1" },
                            React.createElement("span", { className: "flex-1 truncate", title: channelItem.name }, channelItem.name))),
                        channelItem.fid !== MEA_KEY_ID && React.createElement("span", { className: "flex-1 truncate" }, channelItem.name),
                        ' ',
                        channelItem.analyticType === 'measure' &&
                            channelItem.fid !== COUNT_FIELD_ID &&
                            config.defaultAggregated &&
                            channelItem.aggName !== 'expr' && (React.createElement(DropdownContext, { options: aggregationOptions, onSelect: (value) => {
                                vizStore.setFieldAggregator(dkey.id, 0, value);
                            } },
                            React.createElement("span", { className: "bg-transparent text-muted-foreground float-right focus:outline-none focus: dark:focus: flex items-center ml-2" },
                                channelItem.aggName || '',
                                React.createElement(ChevronUpDownIcon, { className: "w-3" })))))));
            }));
        }),
        channelItems.length !== 0 && provided.placeholder,
        channelItems.length === 0 && React.createElement("div", { className: `h-[34px] w-full` }),
        React.createElement("div", { className: `p-1.5 m-1 bg-muted text-muted-foreground pointer-events-none border flex item-center justify-center grow ${(snapshot.draggingFromThisWith && channelItems.length === 1) || channelItems.length === 0 ? 'opacity-100' : 'opacity-0'} absolute inset-0 z-0` }, t('actions.drop_field'))));
};
export default observer(SingleEncodeEditor);
//# sourceMappingURL=multiEncodeEditor.js.map
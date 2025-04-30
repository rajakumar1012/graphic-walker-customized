import React, { useContext, useMemo, useEffect, createContext, useRef } from 'react';
import { VizSpecStore } from './visualSpecStore';
function createKeepAliveContext(create) {
    const dict = {};
    return (key, ...args) => {
        if (key) {
            if (!dict[key])
                dict[key] = create(...args);
            return dict[key];
        }
        else {
            return create(...args);
        }
    };
}
const getVizStore = createKeepAliveContext((meta, opts) => new VizSpecStore(meta, opts));
export const VisContext = React.createContext(null);
const noop = () => { };
export const VizStoreWrapper = (props) => {
    const storeKey = props.keepAlive ? `${props.keepAlive}` : '';
    const store = useMemo(() => getVizStore(storeKey, props.meta, { onMetaChange: props.onMetaChange, defaultConfig: props.defaultConfig }), [storeKey]);
    const lastMeta = useRef(props.meta);
    useEffect(() => {
        if (lastMeta.current !== props.meta) {
            store.setMeta(props.meta);
            lastMeta.current = props.meta;
        }
    }, [props.meta, store]);
    const lastOnMetaChange = useRef(props.onMetaChange);
    useEffect(() => {
        if (lastOnMetaChange.current !== props.onMetaChange) {
            store.setOnMetaChange(props.onMetaChange);
            lastOnMetaChange.current = props.onMetaChange;
        }
    }, [props.meta, store]);
    const lastDefaultConfig = useRef(props.defaultConfig);
    useEffect(() => {
        if (lastDefaultConfig.current !== props.defaultConfig) {
            store.setDefaultConfig(props.defaultConfig);
            lastDefaultConfig.current = props.defaultConfig;
        }
    }, [props.defaultConfig, store]);
    useEffect(() => {
        if (props.storeRef) {
            const ref = props.storeRef;
            ref.current = store;
            return () => {
                ref.current = null;
            };
        }
        return noop;
    }, [props.storeRef, store]);
    return React.createElement(VisContext.Provider, { value: store }, props.children);
};
export function useVizStore() {
    return useContext(VisContext);
}
export const ComputationContext = createContext(async () => []);
export function useCompututaion() {
    return useContext(ComputationContext);
}
export function withTimeout(f, timeout) {
    return (...args) => Promise.race([
        f(...args),
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), timeout);
        }),
    ]);
}
export function withErrorReport(f, onError) {
    return (...args) => f(...args).catch((err) => {
        onError(err);
        throw err;
    });
}
//# sourceMappingURL=index.js.map
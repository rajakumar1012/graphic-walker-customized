import React from 'react';
import Spinner from './spinner';
export default function LoadingLayer() {
    return (React.createElement("div", { className: "bg-black/10 opacity-50 absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center" },
        React.createElement(Spinner, { className: "text-primary w-4 h-4 mr-2" }),
        React.createElement("span", { className: "text-sm text-primary" }, "Loading...")));
}
//# sourceMappingURL=loadingLayer.js.map
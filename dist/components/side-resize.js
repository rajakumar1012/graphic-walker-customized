import React, { useRef, useState } from 'react';
export default function SideResize(props) {
    const sidebarRef = useRef(null);
    const [isResizing, setIsResizing] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(props.defaultWidth);
    const startResizing = React.useCallback(() => {
        setIsResizing(true);
    }, []);
    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);
    const resize = React.useCallback((mouseMoveEvent) => {
        if (isResizing) {
            setSidebarWidth(mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left);
        }
    }, [isResizing]);
    React.useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);
    return (React.createElement("div", { className: `relative ${props.className}`, style: { width: sidebarWidth }, ref: sidebarRef },
        props.children,
        React.createElement("div", { className: `absolute right-0 inset-y-0 cursor-col-resize ${props.handlerClassName}`, style: { width: props.handleWidth ?? 6 }, onMouseDown: startResizing })));
}
//# sourceMappingURL=side-resize.js.map
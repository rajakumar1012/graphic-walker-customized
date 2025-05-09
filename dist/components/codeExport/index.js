import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useVizStore } from '../../store';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
const syntaxHighlight = (json) => {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 4);
    }
    json = json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
        .replace(/\s/g, '&nbsp;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'text-sky-500'; // number
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'text-purple-500'; // key
            }
            else {
                cls = 'text-emerald-500'; // string
            }
        }
        else if (/true|false/.test(match)) {
            cls = 'text-blue-500';
        }
        else if (/null/.test(match)) {
            cls = 'text-sky-500';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
};
const CodeExport = observer((props) => {
    const vizStore = useVizStore();
    const { showCodeExportPanel } = vizStore;
    const { t } = useTranslation();
    const [tabKey, setTabKey] = useState('graphic-walker');
    const [code, setCode] = useState('');
    const specTabs = [
        {
            key: 'graphic-walker',
            label: 'Graphic-Walker',
        },
        {
            key: 'vega-lite',
            label: 'Vega-Lite',
        },
        ...(vizStore.layout.showActions
            ? [
                {
                    key: 'workflow',
                    label: 'Workflow',
                },
            ]
            : []),
    ];
    useEffect(() => {
        if (showCodeExportPanel) {
            if (tabKey === 'graphic-walker') {
                const res = vizStore.exportCode();
                setCode(res);
            }
            else if (tabKey === 'vega-lite') {
                setCode(vizStore.lastSpec);
            }
            else if (tabKey === 'workflow') {
                const workflow = vizStore.workflow;
                setCode(workflow);
            }
            else {
                console.error('unknown tabKey');
            }
        }
    }, [tabKey, showCodeExportPanel, vizStore]);
    return (React.createElement(Dialog, { open: showCodeExportPanel, onOpenChange: () => {
            vizStore.setShowCodeExportPanel(false);
        } },
        React.createElement(DialogContent, null,
            React.createElement("h1", null, "Code Export"),
            React.createElement(Tabs, { value: tabKey, onValueChange: setTabKey },
                React.createElement(TabsList, { className: "my-1" }, specTabs.map((tab) => (React.createElement(TabsTrigger, { key: tab.key, value: tab.key }, tab.label)))),
                React.createElement("div", { className: "border rounded-md overflow-hidden" },
                    React.createElement("div", { className: "text-sm px-6 max-h-96 overflow-auto " },
                        React.createElement("code", { dangerouslySetInnerHTML: { __html: syntaxHighlight(code) } })))),
            React.createElement(DialogFooter, { className: "mt-2" },
                React.createElement(Button, { children: "Copy to Clipboard", onClick: () => {
                        navigator.clipboard.writeText(JSON.stringify(code));
                        vizStore.setShowCodeExportPanel(false);
                    } }),
                React.createElement(Button, { variant: "outline", children: t('actions.cancel'), onClick: () => {
                        vizStore.setShowCodeExportPanel(false);
                    } })))));
});
export default CodeExport;
//# sourceMappingURL=index.js.map
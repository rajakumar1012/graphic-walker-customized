import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from "../../utils";
const Tabs = React.forwardRef(({ ...props }, ref) => (React.createElement(TabsPrimitive.Root, { ref: ref, activationMode: "manual", ...props })));
const TabsList = React.forwardRef(({ className, ...props }, ref) => (React.createElement(TabsPrimitive.List, { ref: ref, className: cn('border-b flex h-9 space-x-8 items-center justify-start py-1', className), ...props })));
TabsList.displayName = TabsPrimitive.List.displayName;
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (React.createElement(TabsPrimitive.Trigger, { ref: ref, className: cn('inline-flex items-center justify-center whitespace-nowrap text-muted-foreground border-b-2 border-transparent hover:text-accent-foreground hover:border-accent-foreground px-1 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-primary data-[state=active]:border-primary', className), ...props })));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
const TabsContent = React.forwardRef(({ className, ...props }, ref) => (React.createElement(TabsPrimitive.Content, { ref: ref, className: cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className), ...props })));
TabsContent.displayName = TabsPrimitive.Content.displayName;
export { Tabs, TabsList, TabsTrigger, TabsContent };
//# sourceMappingURL=tabs.js.map
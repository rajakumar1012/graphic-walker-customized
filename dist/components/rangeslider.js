import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from "../utils";
const Slider = React.forwardRef(({ className, ...props }, ref) => (React.createElement(SliderPrimitive.Root, { ref: ref, minStepsBetweenThumbs: 1, className: cn('relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50', className), ...props },
    React.createElement(SliderPrimitive.Track, { className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20" },
        React.createElement(SliderPrimitive.Range, { className: "absolute h-full bg-primary" })),
    React.createElement(SliderPrimitive.Thumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" }),
    React.createElement(SliderPrimitive.Thumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" }))));
Slider.displayName = SliderPrimitive.Root.displayName;
export { Slider };
//# sourceMappingURL=rangeslider.js.map
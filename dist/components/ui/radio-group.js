import * as React from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "../../utils";
const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
    return (React.createElement(RadioGroupPrimitive.Root, { className: cn("grid gap-2", className), ...props, ref: ref }));
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;
const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => {
    return (React.createElement(RadioGroupPrimitive.Item, { ref: ref, className: cn("aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className), ...props },
        React.createElement(RadioGroupPrimitive.Indicator, { className: "flex items-center justify-center" },
            React.createElement(CheckIcon, { className: "h-3.5 w-3.5 fill-primary" }))));
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
export { RadioGroup, RadioGroupItem };
//# sourceMappingURL=radio-group.js.map
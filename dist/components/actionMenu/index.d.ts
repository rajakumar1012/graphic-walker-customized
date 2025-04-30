import React, { type ReactElement, type ComponentPropsWithoutRef } from 'react';
import { type ReactTag } from './a11y';
import { type IActionMenuItem } from './list';
interface IActionMenuContext {
    disabled: boolean;
    expanded: boolean;
    moveTo(x: number, y: number): void;
    open(): void;
    close(): void;
    _items: readonly IActionMenuItem[];
}
interface IActionMenuProps {
    menu?: IActionMenuItem[];
    disabled?: boolean;
    /** @default false */
    enableContextMenu?: boolean;
    title?: string;
}
type IActionMenuButtonProps<T extends ReactTag> = ({
    /** @default "button" */
    as: T;
} | {
    /** @default "button" */
    as?: ReactTag;
}) & {
    onPress?: (ctx: IActionMenuContext | undefined) => void;
    /** @deprecated use `onPress()` instead */
    onClick?: () => void;
};
declare const _default: React.FC<IActionMenuProps & Omit<React.HTMLAttributes<HTMLDivElement>, keyof IActionMenuProps>> & {
    Button: React.MemoExoticComponent<(<T extends ReactTag>(props: IActionMenuButtonProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof IActionMenuProps>) => ReactElement)>;
};
export default _default;

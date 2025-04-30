import { IUIThemeConfig, IThemeKey } from '../interfaces';
import { GWGlobalConfig } from '../vis/theme';
export declare const themeContext: import("react").Context<"dark" | "light">;
export declare const vegaThemeContext: import("react").Context<{
    vizThemeConfig?: IThemeKey | GWGlobalConfig;
}>;
export declare const portalContainerContext: import("react").Context<HTMLDivElement | null>;
/**
 * for portal shadow doms
 */
export declare const uiThemeContext: import("react").Context<IUIThemeConfig>;

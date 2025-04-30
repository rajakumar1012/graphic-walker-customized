export declare const VizAppContext: (props: {
    children?: React.ReactNode | Iterable<React.ReactNode>;
} & {
    ComputationContext: import("..").IComputationFunction;
    themeContext: "dark" | "light";
    vegaThemeContext: {
        vizThemeConfig?: import("..").IThemeKey | import("../vis/theme").GWGlobalConfig;
    };
    portalContainerContext: HTMLDivElement | null;
}) => import("react").ReactNode | Iterable<import("react").ReactNode>;

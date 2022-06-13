import { Writable } from "./reactive";
export * from "./reactive";
export { arrayWith } from "./utils";
export declare type Component<Args extends any[]> = (context: Context, ...args: Args) => RenderedComponent;
export interface Context {
    width: number;
    height: number;
    colors: Writable<{
        [name: string]: string;
    }>;
    setColor(interval: ColorInterval): ColorInterval;
    useStore<T>(initialValue: T): Writable<T>;
    useInput(store: Writable<string>): InputStore;
    renderChild<Args extends any[]>(component: Component<Args>, dimensions: {
        width: number;
        height: number;
        x: number;
        y: number;
    }, ...args: Args): ChildComponent;
}
export interface ChildComponent {
    x: number;
    y: number;
    component: RenderedComponent;
}
declare type ColorInterval = {
    y: number;
    start: number;
    fg?: string;
    bg?: string;
    end?: number;
    length?: number;
};
export interface RenderedComponent {
    text: string[];
    children?: ChildComponent[];
    onDestroy?(): void;
    colors?: ColorInterval[];
}
export interface LiteralOptions {
    target: HTMLElement | string;
    dev?: boolean;
    colors?: {
        defaultFG: string;
        defaultBG: string;
        [name: string]: string;
    };
}
export interface InputStore extends Writable<string> {
    focus(): void;
    cleanup(): void;
}
export declare function Literal({ target, dev, colors }: LiteralOptions): <Args extends any[]>(component: Component<Args>, ...args: Args) => () => void;
//# sourceMappingURL=main.d.ts.map
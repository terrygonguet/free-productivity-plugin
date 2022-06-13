import { RenderedComponent } from "./main";
export declare function arrayWith<T>(length: number, f: (i: number) => T): T[];
export declare function traverse(tree: RenderedComponent, cb: (comp: RenderedComponent) => void, depthFirst?: boolean): void;
export declare function collect<T>(tree: RenderedComponent, cb: (comp: RenderedComponent) => T): T[];
//# sourceMappingURL=utils.d.ts.map
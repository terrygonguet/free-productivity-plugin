declare type Unsubscriber = () => void;
declare type OnStopCallback = () => void;
declare type Setter<T> = (value: T) => void;
declare type OnStartCallback<T> = (set: Setter<T>) => void | OnStopCallback;
declare type Listener<T> = (value: T) => void;
export interface Readable<T> {
    subscribe(f: Listener<T>): Unsubscriber;
    get(): T;
}
export interface Writable<T> extends Readable<T> {
    set(value: T): void;
    update(f: (value: T) => T): void;
}
export declare function readable<T>(initialValue: T, start: OnStartCallback<T>): Readable<T>;
export declare function writable<T>(initialValue: T, start?: OnStartCallback<T>): Writable<T>;
export declare function derived<T extends [any, ...any[]], U>(dependencies: {
    [Index in keyof T]: Readable<T[Index]>;
}, f: (values: T) => U): Readable<U>;
export declare function derived<T, U>(dependency: Readable<T>, f: (value: T) => U): Readable<U>;
export {};
//# sourceMappingURL=reactive.d.ts.map
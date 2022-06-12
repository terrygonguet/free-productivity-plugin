type Unsubscriber = () => void
type OnStopCallback = () => void
type Setter<T> = (value: T) => void
type OnStartCallback<T> = (set: Setter<T>) => void | OnStopCallback
type Listener<T> = (value: T) => void

export interface Readable<T> {
	subscribe(f: Listener<T>): Unsubscriber
	get(): T
}

export interface Writable<T> extends Readable<T> {
	set(value: T): void
	update(f: (value: T) => T): void
}

export function readable<T>(initialValue: T, start: OnStartCallback<T>): Readable<T> {
	const { subscribe, get } = writable(initialValue, start)
	return { subscribe, get }
}

export function writable<T>(initialValue: T, start?: OnStartCallback<T>): Writable<T> {
	let value = initialValue
	let listeners: Listener<T>[] = []
	let stop: OnStopCallback | void = undefined

	function set(newValue: T) {
		value = newValue
		listeners.forEach(l => l(value))
	}

	return {
		subscribe(f) {
			const cb = f.bind(undefined)
			cb(value)
			let prev = listeners
			listeners = [...listeners, cb]
			if (prev.length == 0) stop = start?.(set)
			return function () {
				listeners = listeners.filter(l => l != cb)
				if (listeners.length == 0) stop?.()
			}
		},
		set,
		update(f) {
			set(f(value))
		},
		get() {
			return value
		},
	}
}

export function derived<T extends [any, ...any[]], U>(
	dependencies: { [Index in keyof T]: Readable<T[Index]> },
	f: (values: T) => U,
): Readable<U>
export function derived<T, U>(dependency: Readable<T>, f: (value: T) => U): Readable<U>
export function derived<T, U>(dependencies: Readable<T> | any[], f: (value: T) => U) {
	let value: U
	let listeners: Listener<U>[] = []

	function set(newValue: T) {
		value = f(newValue)
		listeners.forEach(l => l(value))
	}

	if (Array.isArray(dependencies)) {
		// let's just bailout of TS here
		const values: any = []
		let initialized = false
		for (let i = 0; i < dependencies.length; i++) {
			dependencies[i].subscribe((value: any) => {
				values[i] = value
				if (initialized) set(values)
			})
		}
		initialized = true
		set(values)
	} else dependencies.subscribe(set)

	return {
		subscribe(g: Listener<U>) {
			g(value)
			listeners = [...listeners, g]
			return function () {
				listeners = listeners.filter(l => l != g)
			}
		},
		get() {
			return value
		},
	}
}

import { RenderedComponent } from "./main"
import { writable, isReadable, Readable } from "./reactive"

export function arrayWith<T>(length: number, f: (i: number) => T) {
	return Array(length)
		.fill(null)
		.map((_, i) => f(i))
}

export function traverse(tree: RenderedComponent, cb: (comp: RenderedComponent) => void) {
	asValue(tree.children ?? []).forEach(comp => traverse(asValue(comp.component), cb))
	cb(tree)
}

export function collect<T>(tree: RenderedComponent, cb: (comp: RenderedComponent) => T): T[] {
	const results =
		asValue(tree.children ?? []).flatMap(comp => collect(asValue(comp.component), cb)) ?? []
	results.push(cb(tree))
	return results
}

export type MaybeReadable<T> = T | Readable<T>

export function asStore<T>(maybeStore: MaybeReadable<T>): Readable<T> {
	return isReadable(maybeStore) ? maybeStore : writable(maybeStore)
}

export function asValue<T>(maybeStore: MaybeReadable<T>): T {
	return isReadable(maybeStore) ? maybeStore.value : maybeStore
}

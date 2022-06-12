import { RenderedComponent } from "./main"

export function arrayWith<T>(length: number, f: (i: number) => T) {
	return Array(length)
		.fill(null)
		.map((_, i) => f(i))
}

export function traverse(
	tree: RenderedComponent,
	cb: (comp: RenderedComponent) => void,
	depthFirst = true,
) {
	if (depthFirst) {
		tree.children?.forEach(comp => traverse(comp.component, cb, depthFirst))
		cb(tree)
	} else throw new Error("Not implemented yet")
}

export function collect<T>(tree: RenderedComponent, cb: (comp: RenderedComponent) => T): T[] {
	const results = tree.children?.flatMap(comp => collect(comp.component, cb)) ?? []
	results.push(cb(tree))
	return results
}

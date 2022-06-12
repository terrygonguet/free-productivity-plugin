import { derived, Writable, writable } from "./reactive"
import { collect, traverse } from "./utils"
export * from "./reactive"
export { arrayWith } from "./utils"

const css = String.raw
const defaultColors = {
	defaultFG: "white",
	defaultBG: "black",
	gray: "#3D3C3A",
	red: "#B22222",
	green: "#347C2C",
	blue: "#4863A0",
	cyan: "#57FEFF",
	magenta: "#F6358A",
	yellow: "#E2F516",
	orange: "#EE9A4D",
	white: "white",
	black: "black",
}

export type Component<Args extends any[]> = (context: Context, ...args: Args) => RenderedComponent

export interface Context {
	width: number
	height: number
	colors: Writable<{ [name: string]: string }>
	setColor(interval: ColorInterval): ColorInterval
	useStore<T>(initialValue: T): Writable<T>
	useInput(store: Writable<string>): InputStore
	renderChild<Args extends any[]>(
		component: Component<Args>,
		dimensions: { width: number; height: number; x: number; y: number },
		...args: Args
	): ChildComponent
}

export interface ChildComponent {
	x: number
	y: number
	component: RenderedComponent
}

type ColorInterval = {
	y: number
	start: number
	fg?: string
	bg?: string
	end?: number
	length?: number
}

export interface RenderedComponent {
	text: string[]
	children?: ChildComponent[]
	onDestroy?(): void
	colors?: ColorInterval[]
}

export interface LiteralOptions {
	target: HTMLElement | string
	dev?: boolean
	colors?: {
		defaultFG: string
		defaultBG: string
		[name: string]: string
	}
}

export interface InputStore extends Writable<string> {
	focus(): void
	cleanup(): void
}

export function Literal({ target, dev = false, colors = defaultColors }: LiteralOptions) {
	const root = typeof target == "string" ? document.querySelector<HTMLElement>(target) : target
	if (!root) throw new Error("TODO")
	root.innerHTML = ""

	root.setAttribute(
		"style",
		css`
			font-family: monospace;
			display: grid;
			place-items: center;
			text-align: center;
			white-space: pre-wrap;
		`,
	)

	const reference = document.createElement("span")
	reference.innerText = "0"
	reference.setAttribute(
		"style",
		css`
			position: fixed;
			top: -9999px;
			left: -9999px;
		`,
	)
	root.append(reference)

	const wrapper = document.createElement("div")
	wrapper.setAttribute(
		"style",
		css`
			word-break: break-all;
			overflow: hidden;
			min-width: 0;
			min-height: 0;
		`,
	)
	root.append(wrapper)

	const referenceObserver = new ResizeObserver(([entry]) => {
		charSize.set([entry.contentRect.width, entry.contentRect.height])
	})
	referenceObserver.observe(reference)

	const rootObserver = new ResizeObserver(([entry]) => {
		rootSize.set([entry.contentRect.width, entry.contentRect.height])
	})
	rootObserver.observe(root)

	let charSize = writable<[number, number]>([8, 16])
	if (dev)
		derived(charSize, size => console.log("Characters size changed to " + JSON.stringify(size)))
	let rootSize = writable<[number, number]>([0, 0])
	if (dev)
		derived(rootSize, size => console.log("Container size changed to " + JSON.stringify(size)))
	let size = derived(
		[charSize, rootSize],
		([[$charW, $charH], [$rootW, $rootH]]) =>
			[Math.floor($rootW / $charW), Math.floor($rootH / $charH)] as [number, number],
	)
	if (dev) derived(size, size => console.log("Grid size changed to " + JSON.stringify(size)))

	const styles = document.querySelector("style#literal-styles") ?? document.createElement("style")
	styles.id = "literal-styles"
	document.head.append(styles)
	const reactiveColors = writable(colors)
	reactiveColors.subscribe(colors => {
		root.style.color = colors.defaultFG
		root.style.backgroundColor = colors.defaultBG
		const vars = Object.entries(colors).flatMap(([name, value]) => [
			css`
				.literal-fg-${name} {
					color: ${value};
				}
			`,
			css`
				.literal-bg-${name} {
					background-color: ${value};
				}
			`,
		])
		styles.innerHTML = vars.join("\n")
	})

	function createContext(
		{ width, height, dx, dy }: { width: number; height: number; dx: number; dy: number },
		rerender: (dimensions: [number, number]) => void,
		stateNode: StateNode,
		inputsMap: Map<Writable<string>, HTMLTextAreaElement> = new Map(),
	): Context {
		let rafID: number
		function requestRender() {
			cancelAnimationFrame(rafID)
			rafID = requestAnimationFrame(() => {
				const $size = size.get()
				rerender($size)
			})
		}

		return {
			width,
			height,
			colors: reactiveColors,
			setColor({ y, start, end, length, fg, bg }) {
				return {
					y: y + dy,
					start: start + dx,
					end: end ? end + dx : undefined,
					length,
					fg,
					bg,
				}
			},
			useStore(initialValue) {
				let curIndex = stateNode.curIndex++
				const store = stateNode.stores[curIndex]
				if (store) return store
				else {
					const store = writable(initialValue)
					stateNode.stores[curIndex] = store
					store.subscribe(requestRender)
					return store
				}
			},
			useInput(store) {
				if (!inputsMap.has(store)) {
					const input = document.createElement("textarea")
					input.setAttribute(
						"style",
						css`
							position: fixed;
							top: -9999px;
							left: -9999px;
						`,
					)
					root?.append(input)
					inputsMap.set(store, input)
					input.oninput = _ => store.set(input.value)
					store.subscribe(value => (input.value = value))
				}

				return {
					...store,
					cleanup() {
						inputsMap.get(store)?.remove()
					},
					focus() {
						inputsMap.get(store)?.focus()
					},
				}
			},
			renderChild(component, { width: w, height: h, x, y }, ...args) {
				const width = Math.max(w, 0)
				const height = Math.max(h, 0)
				const nextNode = stateNode.children.get(component) ?? {
					children: new Map(),
					stores: [],
					curIndex: 0,
				}
				nextNode.curIndex = 0
				stateNode.children.set(component, nextNode)
				const context = createContext(
					{ width, height, dx: dx + x, dy: dy + y },
					rerender,
					nextNode,
					inputsMap,
				)
				return { x, y, component: component(context, ...args) }
			},
		}
	}

	interface StateNode {
		stores: Writable<any>[]
		children: Map<Function, StateNode>
		curIndex: number
	}

	return function <Args extends any[]>(component: Component<Args>, ...args: Args) {
		let tree: RenderedComponent
		const stateRoot: StateNode = {
			children: new Map(),
			stores: [],
			curIndex: 0,
		}
		const inputsMap = new Map()
		const unsub = size.subscribe(function rerender([width, height]) {
			if (width * height == 0) return
			if (tree) traverse(tree, comp => comp.onDestroy?.())
			stateRoot.curIndex = 0
			const context = createContext(
				{ width, height, dx: 0, dy: 0 },
				rerender,
				stateRoot,
				inputsMap,
			)
			tree = component(context, ...args)
			const colorIntervals = collect(tree, comp => comp.colors ?? []).flat()
			const rendered = render(tree)
			const colorized = colorize(rendered, colorIntervals)
			const html = colorized.join("")
			wrapper.innerHTML = html
		})
		return unsub
	}
}

function render(tree: RenderedComponent): string[] {
	let { text } = tree
	for (const { x, y, component } of tree.children ?? []) {
		for (let i = 0; i < component.text.length; i++) {
			const parentLine = text[y + i]
			if (!parentLine) continue
			const childLine = component.text[i]
			text[y + i] =
				parentLine.slice(0, x) + childLine + parentLine.slice(x + childLine.length)
		}
	}
	return text
}

function colorize(rendered: string[], intervals: ColorInterval[]) {
	// sort by row then start index
	intervals.sort((a, b) => (a.y == b.y ? a.start - b.start : a.y - b.y))
	// consolidate compatible adjacent color intervals to reduce the number of <span>
	let cur = intervals[0]
	let curEndIndex = cur.end ?? cur.start + (cur.length ?? 0) - 1
	const consolidated: ColorInterval[] = []
	for (let i = 1; i < intervals.length; i++) {
		const { y, start, end, length, fg, bg } = intervals[i]
		curEndIndex = cur.end ?? cur.start + (cur.length ?? 0) - 1
		if (cur.y != y || cur.fg != fg || cur.bg != bg || curEndIndex != start) {
			consolidated.push(cur)
			cur = intervals[i]
		} else {
			cur.end = end ?? start + (length ?? 0) - 1
			cur.length = undefined
		}
	}
	consolidated.push(cur)
	// insert <span> at start and end of intervals
	const split = rendered.map(row => row.split(""))
	for (const { y, start, end, length, fg, bg } of consolidated) {
		const row = split[y]
		if (!row) continue
		const endIndex = end ?? start + (length ?? 0) - 1
		const fgClass = fg ? `literal-fg-${fg}` : ""
		const bgClass = bg ? `literal-bg-${bg}` : ""
		row[start] = `<span class="${fgClass} ${bgClass}">` + row[start]
		row[endIndex] = row[endIndex] + "</span>"
	}
	return split.map(row => row.join(""))
}

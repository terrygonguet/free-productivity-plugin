import { derived, isReadable, readable, Readable, Writable, writable } from "./reactive"
import { asStore, asValue, collect, MaybeReadable, traverse } from "./utils"
export * from "./reactive"
export { arrayWith } from "./utils"

const css = String.raw
const defaultColors: Colors = {
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

export type Component<Props extends {}> = (context: Context<Props>) => RenderedComponent

export interface RenderedComponent {
	text: MaybeReadable<string[]>
	colors?: MaybeReadable<ColorInterval[]>
	children?: MaybeReadable<ChildComponent[]>
	onDestroy?(): void
}

/**
 * Helper to get type hints
 */
export function component<Props extends {}>(component: Component<Props>): Component<Props> {
	return component
}

type Vec2D = [number, number]

export interface ChildComponent {
	position: Readable<Vec2D>
	component: MaybeReadable<RenderedComponent>
}

export interface Context<Props extends {}> {
	size: Readable<Vec2D>
	colors: Writable<{ [name: string]: string }>
	properties: Readable<Props>
	// colorize(interval: ColorInterval): ColorInterval
	// useStore<T>(initialValue: T): Writable<T>
	// useInput(store: Writable<string>): InputStore
	child<ChildProps extends {}>(options: {
		size: MaybeReadable<Vec2D>
		position: MaybeReadable<Vec2D>
		component: Component<ChildProps>
		properties: MaybeReadable<ChildProps>
	}): ChildComponent
}

interface ColorInterval_end {
	y: number
	start: number
	fg?: string
	bg?: string
	end: number
}

interface ColorInterval_length {
	y: number
	start: number
	fg?: string
	bg?: string
	length: number
}

export type ColorInterval = ColorInterval_end | ColorInterval_length

export interface Colors {
	defaultFG: string
	defaultBG: string
	[name: string]: string
}

export interface LiteralOptions {
	target: HTMLElement | string
	dev?: boolean
	colors?: Colors
}

export function Literal({ target, dev = false, colors = defaultColors }: LiteralOptions) {
	const root = typeof target == "string" ? document.querySelector<HTMLElement>(target) : target
	if (!root) throw new Error("TODO")
	root.innerHTML = ""

	const reactiveColors = writable(colors)
	const { size, wrapper } = init({ root, dev, colors: reactiveColors })

	function createContext<ChildProps extends {}>(
		size: Readable<Vec2D>,
		offset: Readable<Vec2D>,
		properties: Readable<ChildProps>,
		colors: Writable<Colors>,
		state: State,
	): Context<ChildProps> {
		return {
			size,
			colors,
			properties,
			child({ size, position, component, properties }) {
				const childPos = derived(
					[offset, asStore(position)],
					([[dx, dy], [x, y]]) => [dx + x, dy + y] as [number, number],
				)
				const context = createContext(
					derived(asStore(size), ([w, h]) => [Math.max(0, w), Math.max(0, h)]),
					childPos,
					asStore(properties),
					colors,
					state,
				)
				const tree = component(context)
				listenTo(tree, scheduleRender)
				return {
					position: childPos,
					component: tree,
				}
			},
			// colorize() {},
			// useInput() {},
			// useStore() {},
		}
	}

	let rafId: number
	function scheduleRender() {
		cancelAnimationFrame(rafId)
		rafId = requestAnimationFrame(rerender)
	}
	function rerender() {
		const [w, h] = size.value
		if (w == 0 || h == 0) return
		const rendered = render(tree)
		const intervals = collect(tree, comp => asValue(comp.colors ?? [])).flat()
		const colorized = colorize(rendered, intervals)
		const html = colorized.join("")
		wrapper.innerHTML = html
	}

	let tree: RenderedComponent
	return function <Props extends {}>(
		component: Component<Props>,
		properties: MaybeReadable<Props>,
	) {
		const rootState = State.create(root)
		const zero = writable<Vec2D>([0, 0])
		const context = createContext(size, zero, asStore(properties), reactiveColors, rootState)
		tree = component(context)
		listenTo(tree, scheduleRender)
		size.subscribe(scheduleRender)
	}
}

interface InitOptions {
	root: HTMLElement
	dev: boolean
	colors: Writable<Colors>
}

function init({ root, dev, colors }: InitOptions) {
	root.setAttribute(
		"style",
		css`
			font-family: monospace;
			display: grid;
			place-items: center;
			text-align: center;
			white-space: pre-wrap;
			/* line-height: 1; */
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

	let charSize = writable<Vec2D>([8, 16])
	if (dev)
		charSize.subscribe(size =>
			console.log("Characters size changed to " + JSON.stringify(size)),
		)
	let rootSize = writable<Vec2D>([0, 0])
	if (dev)
		rootSize.subscribe(size => console.log("Container size changed to " + JSON.stringify(size)))
	let size = derived(
		[charSize, rootSize],
		([[$charW, $charH], [$rootW, $rootH]]) =>
			[Math.floor($rootW / $charW), Math.floor($rootH / $charH)] as Vec2D,
	)
	if (dev) size.subscribe(size => console.log("Grid size changed to " + JSON.stringify(size)))

	const styles = document.querySelector("style#literal-styles") ?? document.createElement("style")
	styles.id = "literal-styles"
	document.head.append(styles)
	colors.subscribe(colors => {
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

	return { wrapper, size }
}

function render(tree: RenderedComponent): string[] {
	const parent = asValue(tree.text)
	const children = asValue(tree.children ?? [])
	for (const { component, position } of children) {
		const child = render(asValue(component))
		const [x, y] = asValue(position)
		for (let i = 0; i < child.length; i++) {
			const parentLine = parent[y + i]
			if (!parentLine) continue
			const childLine = child[i]
			parent[y + i] =
				parentLine.slice(0, x) + childLine + parentLine.slice(x + childLine.length)
		}
	}
	return parent
}

function colorize(rendered: string[], intervals: ColorInterval[]): string[] {
	if (intervals.length == 0) return rendered

	function getEndIndex(cur: ColorInterval) {
		return "end" in cur ? cur.end : cur.start + cur.length - 1
	}
	function toCI_end(interval: ColorInterval): ColorInterval_end {
		return { ...interval, end: getEndIndex(interval) }
	}

	// sort by row then start index
	intervals.sort((a, b) => (a.y == b.y ? a.start - b.start : a.y - b.y))
	// consolidate compatible adjacent color intervals to reduce the number of <span>
	let cur = toCI_end(intervals[0])
	const consolidated: ColorInterval_end[] = []
	for (let i = 1; i < intervals.length; i++) {
		const { y, start, fg, bg } = intervals[i]
		if (cur.y != y || cur.fg != fg || cur.bg != bg || cur.end != start) {
			consolidated.push(cur)
			cur = toCI_end(intervals[i])
		} else {
			cur.end = getEndIndex(intervals[i])
		}
	}
	consolidated.push(cur)
	// insert <span> at start and end of intervals
	const split = rendered.map(row => row.split(""))
	for (const { y, start, end, fg, bg } of consolidated) {
		const row = split[y]
		if (!row) continue
		const fgClass = fg ? `literal-fg-${fg}` : ""
		const bgClass = bg ? `literal-bg-${bg}` : ""
		row[start] = `<span class="${fgClass} ${bgClass}">` + row[start]
		row[end] = row[end] + "</span>"
	}
	return split.map(row => row.join(""))
}

function listenTo(comp: RenderedComponent, cb: () => void) {
	if (isReadable(comp.text)) comp.text.subscribe(cb)
	if (isReadable(comp.colors)) comp.colors.subscribe(cb)
	if (isReadable(comp.children)) comp.children.subscribe(cb)
}

export interface InputStore extends Writable<string> {
	focus(): void
	cleanup(): void
}

class State {
	stores: Writable<any>[] = []
	children: Map<Function, State> = new Map()
	curIndex: number = 0

	inputs: Map<Writable<string>, HTMLInputElement> = new Map()
	textareas: Map<Writable<string>, HTMLTextAreaElement> = new Map()
	root: HTMLElement

	private constructor(root: HTMLElement) {
		this.root = root
	}

	static create(root: HTMLElement) {
		return new State(root)
	}

	useInput(store: Writable<string>, { multiline = false } = {}): InputStore {
		const map = multiline ? this.textareas : this.inputs
		if (!this.inputs.has(store)) {
			const el = document.createElement(multiline ? "textarea" : "input")
			if (!multiline) (el as any).type = "text"
			el.setAttribute(
				"style",
				css`
					position: fixed;
					top: -9999px;
					left: -9999px;
				`,
			)
			this.root.append(el)
			map.set(store, el as any)
			el.oninput = _ => store.set(el.value)
			store.subscribe(value => (el.value = value))
		}

		return {
			...store,
			cleanup() {
				map.get(store)?.remove()
			},
			focus() {
				map.get(store)?.focus()
			},
		}
	}

	child<T>(component: Component<T>): State {
		if (this.children.has(component)) return this.children.get(component)!
		else {
			const childNode = new State(this.root)
			childNode.inputs = this.inputs
			childNode.textareas = this.textareas
			this.children.set(component, childNode)
			return childNode
		}
	}

	useStore<T>(initialValue: T): Writable<T> {
		let curIndex = this.curIndex++
		const store = this.stores[curIndex]
		if (store) return store
		else {
			const store = writable(initialValue)
			this.stores[curIndex] = store
			// store.subscribe(requestRender)
			return store
		}
	}
}

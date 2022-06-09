import { derived, Writable, writable } from "./reactive"
import { traverse } from "./utils"
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

type createContext = (
	dimensions: { width: number; height: number; dx: number; dy: number },
	rerender: (dimensions: [number, number]) => void,
	stateNode: StateNode,
	colorMap: ColorMap,
) => Context

export interface Context {
	width: number
	height: number
	colors: Writable<{ [name: string]: string }>
	colorNames: string[]
	requestRender(): void
	useState<T>(initialValue: T): [T, (value: T) => void]
	renderChild<Args extends any[]>(
		component: Component<Args>,
		dimensions: { width: number; height: number; x: number; y: number },
		...args: Args
	): ChildComponent
	setColor(x: number, y: number, color: ColorOptions, length?: number): void
	clearColors(): void
}

export interface ChildComponent {
	x: number
	y: number
	component: RenderedComponent
}

export interface RenderedComponent {
	text: string[]
	children?: ChildComponent[]
	onDestroy?(): void
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

interface StateNode {
	values: any[]
	children: Map<Function, StateNode>
	curIndex: number
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

	const styles = document.createElement("style")
	document.head.append(styles)

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

	const reactiveColors = writable(colors)
	let colorNames: string[] = []
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
		colorNames = Object.keys(colors).filter(name => !["defaultFG", "defaultBG"].includes(name))
	})

	const createContext: createContext = (
		{ width, height, dx, dy },
		rerender,
		stateNode,
		colorMap,
	) => {
		let rafID: number
		function requestRender() {
			cancelAnimationFrame(rafID)
			rafID = requestAnimationFrame(() => {
				const clear = size.subscribe(rerender)
				clear()
			})
		}
		return {
			width,
			height,
			colors: reactiveColors,
			colorNames,
			requestRender,
			useState<T>(initialValue: T) {
				let curIndex = stateNode.curIndex++
				const value = stateNode.values[curIndex] ?? initialValue
				stateNode.values[curIndex] = value
				return [
					value,
					(newValue: T) => {
						stateNode.values[curIndex] = newValue
						requestRender()
					},
				]
			},
			renderChild(component, { width: w, height: h, x, y }, ...args) {
				const width = Math.max(w, 0)
				const height = Math.max(h, 0)
				const nextNode = stateNode.children.get(component) ?? {
					children: new Map(),
					values: [],
					curIndex: 0,
				}
				nextNode.curIndex = 0
				stateNode.children.set(component, nextNode)
				const context = createContext(
					{ width, height, dx: dx + x, dy: dy + y },
					rerender,
					nextNode,
					colorMap,
				)
				return { x, y, component: component(context, ...args) }
			},
			setColor(x, y, color, length = 1) {
				colorMap.set(x + dx, y + dy, color, length)
			},
			clearColors() {
				colorMap.clear(dx, dy, width, height)
			},
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

	return function <Args extends any[]>(component: Component<Args>, ...args: Args) {
		let tree: RenderedComponent
		const stateRoot: StateNode = {
			children: new Map(),
			values: [],
			curIndex: 0,
		}
		const colorMap = new ColorMap()
		const unsub = size.subscribe(function rerender([width, height]) {
			if (width * height == 0) return
			if (tree) traverse(tree, comp => comp.onDestroy?.())
			colorMap.reset()
			stateRoot.curIndex = 0
			const context = createContext(
				{ width, height, dx: 0, dy: 0 },
				rerender,
				stateRoot,
				colorMap,
			)
			tree = component(context, ...args)
			const rendered = render(tree)
			const html = colorMap.colorize(rendered).join("")
			wrapper.innerHTML = html
		})
		return unsub
	}
}

type Interval = {
	start: number
	fg?: string
	bg?: string
	end: number
}

type ColorOptions = { fg?: string; bg?: string }

class ColorMap {
	map: Interval[][] = []

	reset() {
		this.map = []
	}

	set(x: number, y: number, { fg, bg }: ColorOptions, length = 1) {
		const row = this.map[y] ?? []
		this.map[y] = row
		row.push({ start: x, fg, bg, end: x + length })
	}

	clear(x: number, y: number, width: number, height: number) {
		for (let i = y; i < y + height; i++) {
			const row = this.map[i]
			if (!row) continue
			for (let j = 0; j < row.length; j++) {
				const { start, end, fg, bg } = row[j]
				const xx = x + width
				if (x > end || xx < start) continue
				if (x <= start) {
					if (xx >= end) delete row[j]
					else row[j].start = xx
				} else {
					row[j].end = x
					if (xx < end) row.push({ start: xx, fg, bg, end })
				}
			}
		}
	}

	colorize(rows: string[]) {
		for (let y = 0; y < this.map.length; y++) {
			const intervals = this.map[y]
			if (!rows[y] || !intervals) continue
			intervals.sort((a, b) => b.start - a.start)
			for (const { start, end, fg, bg } of intervals) {
				const classes = [fg ? `literal-fg-${fg}` : "", bg ? `literal-bg-${bg}` : ""]
					.filter(Boolean)
					.join(" ")
				rows[y] =
					rows[y].slice(0, start) +
					`<span class="${classes}">` +
					rows[y].slice(start, end) +
					"</span>" +
					rows[y].slice(end)
			}
		}
		return rows
	}
}

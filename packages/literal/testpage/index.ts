import { Context, Literal, RenderedComponent, arrayWith } from "../src/main"
import { makeGrid, step } from "./conways"

function Container({ width, height, renderChild, setColor }: Context): RenderedComponent {
	for (let y = 0; y < height; y++) {
		setColor(0, y, { fg: "green" }, width)
	}

	return {
		text: arrayWith(height, y => {
			switch (y) {
				case 0:
					return "┏" + "━".repeat(width - 2) + "┓"
				case height - 1:
					return "┗" + "━".repeat(width - 2) + "┛"
				default:
					return "┃" + "█".repeat(width - 2) + "┃"
			}
		}),
		children: [renderChild(Conways, { x: 1, y: 1, width: width - 2, height: height - 2 })],
	}
}

function Conways({ width, height, useState, clearColors }: Context): RenderedComponent {
	const [grid, setGrid] = useState(makeGrid(height, Math.floor(width / 2), 0.3))
	const id = setTimeout(() => setGrid(step(grid, { born: [3], survive: [2, 3] })), 100)
	clearColors()

	return {
		text: grid.map(
			row => row.map(cell => (cell ? "██" : "  ")).join("") + (width % 2 == 0 ? "" : " "),
		),
		onDestroy() {
			clearTimeout(id)
		},
	}
}

const render = Literal({ target: "#app", dev: true })
render(Container)

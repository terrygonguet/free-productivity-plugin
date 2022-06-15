import { arrayWith, component, Context, derived, RenderedComponent, writable } from "../src/main"

function createGrid(width: number, height: number) {
	return arrayWith(height, y => arrayWith(width, x => 0))
}

function step(grid: number[][]) {
	const [first, ...rest] = grid
	const width = first.length

	return [
		...rest.map(row => row.map(cell => Math.max(0, cell + (Math.random() < 0.25 ? -1 : 0)))),
		arrayWith(width, x => 4),
	]
}

export default component(function ({ size, colorize }) {
	const grid = writable(createGrid(0, 0))
	size.subscribe(([width, height]) => grid.set(createGrid(width, height)))
	setInterval(() => grid.update(step), 50)

	return {
		text: derived(grid, grid =>
			grid.map(row =>
				row
					.map(cell => {
						switch (cell) {
							case 0:
								return " "
							case 1:
								return "░"
							case 2:
								return "▒"
							case 3:
								return "▓"
							case 4:
								return "█"
						}
					})
					.join(""),
			),
		),
		colors: derived(grid, grid =>
			grid.flatMap((row, y) =>
				row
					.map<any>((cell, x) => {
						switch (cell) {
							case 1:
								return colorize({ y, start: x, length: 1, fg: "red" })
							case 2:
								return colorize({ y, start: x, length: 1, fg: "orange" })
							case 3:
								return colorize({ y, start: x, length: 1, fg: "yellow" })
							case 4:
								return colorize({ y, start: x, length: 1, fg: "white" })
							default:
								return
						}
					})
					.filter(Boolean),
			),
		),
	}
})

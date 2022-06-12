import { arrayWith, Context, RenderedComponent } from "../src/main"

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

export default function Fire({ width, height, useStore, setColor }: Context): RenderedComponent {
	const grid = useStore(createGrid(width, height))
	const $grid = grid.get()
	if ($grid.length != height || $grid[0]?.length != width) grid.set(createGrid(width, height))

	const id = setTimeout(() => grid.update(step), 50)

	const text = $grid.map(row =>
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
	)
	const colors: any = $grid.flatMap((row, y) =>
		row
			.map((cell, x) => {
				switch (cell) {
					case 1:
						return setColor({ y, start: x, length: 1, fg: "red" })
					case 2:
						return setColor({ y, start: x, length: 1, fg: "orange" })
					case 3:
						return setColor({ y, start: x, length: 1, fg: "yellow" })
					case 4:
						return setColor({ y, start: x, length: 1, fg: "white" })
					default:
						return
				}
			})
			.filter(Boolean),
	)

	return {
		text,
		colors,
		onDestroy() {
			clearTimeout(id)
		},
	}
}

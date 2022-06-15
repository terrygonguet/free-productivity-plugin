import { component, derived, writable } from "../src/main"
import { makeGrid, step } from "./conways"

export default component(function ({ size }) {
	console.log("Run Conways")

	const rule = { born: [3], survive: [2, 3] }
	const grid = writable(makeGrid(0, 0, 0))
	size.subscribe(([width, height]) => grid.set(makeGrid(height, Math.floor(width / 2), 0.3)))
	setInterval(() => grid.update(g => step(g, rule)), 100)

	return {
		text: derived(grid, grid =>
			grid.map(row => row.map(cell => (cell ? "██" : "  ")).join("")),
		),
	}
})

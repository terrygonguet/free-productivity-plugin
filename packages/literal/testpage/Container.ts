import { arrayWith, component, derived } from "../src/main"
import Conways from "./Conways"

export default component(function ({ size, child }) {
	console.log("Run Container")
	return {
		text: derived(size, ([width, height]) =>
			arrayWith(height, y => {
				switch (y) {
					case 0:
						return "┏" + "━".repeat(width - 2) + "┓"
					case height - 1:
						return "┗" + "━".repeat(width - 2) + "┛"
					default:
						return "┃" + " ".repeat(width - 2) + "┃"
				}
			}),
		),
		children: [
			child({
				size: derived(size, ([w, h]) => [w - 2, h - 2]),
				position: [1, 1],
				component: Conways,
				properties: {},
			}),
		],
	}
})

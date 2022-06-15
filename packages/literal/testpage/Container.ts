import { arrayWith, component, derived } from "../src/main"
import Fire from "./Fire"

const Container = component(function ({ size, child, colorize }) {
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
		colors: derived(size, ([width, height]) =>
			arrayWith(height, y => {
				switch (y) {
					case 0:
					case height - 1:
						return [colorize({ start: 0, length: width, y, fg: "green" })]
					default:
						return [
							colorize({ start: 0, length: 1, y, fg: "green" }),
							colorize({ start: width - 1, length: 1, y, fg: "green" }),
						]
				}
			}).flat(),
		),
		children: [
			child({
				size: derived(size, ([w, h]) => [w - 2, h - 2]),
				position: [1, 1],
				component: Fire,
				properties: {},
			}),
		],
	}
})

export default Container

import { arrayWith, Component, Context, RenderedComponent } from "../src/main"

export default function Container<Args extends any[]>(
	{ width, height, renderChild, setColor }: Context,
	child: Component<Args>,
	...childArgs: Args
): RenderedComponent {
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
		children: [
			renderChild(child, { x: 1, y: 1, width: width - 2, height: height - 2 }, ...childArgs),
		],
		colors: arrayWith(height, y => {
			switch (y) {
				case 0:
				case height - 1:
					return [{ y, start: 0, fg: "gray", length: width }]
				default:
					return [
						{ y, start: 0, fg: "gray", length: 1 },
						{ y, start: width - 1, fg: "gray", length: 1 },
					]
			}
		})
			.flat()
			.map(setColor),
	}
}

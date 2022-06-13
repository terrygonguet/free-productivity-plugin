import { arrayWith, Component, Context, RenderedComponent } from "literal"

export default function Border<Args extends any[]>(
	{ width, height, renderChild }: Context,
	child?: Component<Args>,
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
					return "┃" + " ".repeat(width - 2) + "┃"
			}
		}),
		children: child
			? [
					renderChild(
						child,
						{ x: 1, y: 1, width: width - 2, height: height - 2 },
						...childArgs,
					),
			  ]
			: [],
	}
}

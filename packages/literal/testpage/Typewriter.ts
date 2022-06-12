import { arrayWith, Context, RenderedComponent } from "../src/main"

export default function Typewriter({
	width,
	height,
	useStore,
	useInput,
}: Context): RenderedComponent {
	const text = useStore("initial")
	const blinker = useStore(true)
	const $text = text.get() + (blinker.get() ? "█" : " ")
	const input = useInput(text)
	const lines = $text
		.split("\n")
		.flatMap(p => {
			const lines: string[] = []
			let y = 0
			do {
				lines.push(p.slice(y * width, (y + 1) * width).padEnd(width, " "))
				p = p.slice(width)
				y++
			} while (p.length > 0)
			return lines
		})
		.slice(0, height)
	while (lines.length < height) {
		lines.push(" ".repeat(width))
	}

	const id = setTimeout(() => blinker.update(b => !b), 700)
	input.focus()

	return {
		text: lines,
		onDestroy() {
			clearTimeout(id)
		},
	}
}

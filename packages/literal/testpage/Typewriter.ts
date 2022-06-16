import { arrayWith, component, derived, subscribe, writable } from "../src/main"

export default component(function ({ size, useInput, colorize }) {
	const input = useInput(true)

	const cursor = writable<[number, number, boolean]>([0, 0, true])
	subscribe([input, size], ([text, [w]]) => {
		cursor.set([...cursorCoords(text, input.element.selectionStart, w), true])
		input.width = w
	})
	const id = setInterval(() => cursor.update(([x, y, b]) => [x, y, !b]), 750)

	function focus() {
		input.element.focus()
	}
	window.addEventListener("focus", focus)
	window.addEventListener("click", focus)
	focus()

	return {
		text: derived([size, input], ([[w, h], text]) => {
			const lines = text.split("\n").flatMap(line => splitLine(line, w))
			return arrayWith(h, y => lines[y] ?? " ".repeat(w))
		}),
		colors: derived(cursor, ([start, y, blinker]) => {
			if (!blinker) return []
			else return [colorize({ start, y, length: 1, fg: "defaultBG", bg: "defaultFG" })]
		}),
		onDestroy() {
			clearInterval(id)
			window.removeEventListener("focus", focus)
			window.removeEventListener("click", focus)
			input.cleanup()
		},
	}
})

function splitLine(line: string, length: number): string[] {
	if (line.length == 0) return [" ".repeat(length)]
	const lines: string[] = []
	while (line.length > 0) {
		lines.push(line.slice(0, length).padEnd(length, " "))
		line = line.slice(length)
	}
	return lines
}

function cursorCoords(text: string, index: number, width: number): [number, number] {
	const lines = text.slice(0, index).split("\n")
	const y = lines.reduce((acc, cur) => acc + Math.floor(cur.length / width), 0) + lines.length - 1
	return [(lines.at(-1)?.length ?? 0) % width, y]
}

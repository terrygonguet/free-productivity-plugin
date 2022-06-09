/**
 * @param {boolean[][]} grid
 * @param {{ born: number[], survive: number[] }} rule
 * @param {boolean} wrap
 */
export function step(grid, rule, wrap = true) {
	return grid.map((col, x) =>
		col.map((cell, y) => {
			const n = countNeighbours(grid, x, y, wrap)
			if (rule.born.includes(n)) return true
			else if (rule.survive.includes(n)) return cell
			else return false
		}),
	)
}

/**
 * @param {boolean[][]} grid
 * @param {number} x
 * @param {number} y
 * @param {boolean} wrap
 */
function countNeighbours(grid, x, y, wrap = true) {
	const { rows, cols } = dimensions(grid)
	return [
		[x + 1, y + 1],
		[x + 1, y],
		[x + 1, y - 1],
		[x, y + 1],
		[x, y - 1],
		[x - 1, y + 1],
		[x - 1, y],
		[x - 1, y - 1],
	].reduce((acc, [x, y]) => {
		if (wrap) return acc + (grid.at(x % cols).at(y % rows) ? 1 : 0)
		else return acc + (grid[x]?.[y] ? 1 : 0)
	}, 0)
}

export function makeGrid(cols = 50, rows = 50, fillRatio = 0.5) {
	return Array(cols)
		.fill(0)
		.map(_ =>
			Array(rows)
				.fill(0)
				.map(_ => Math.random() < fillRatio),
		)
}

/**
 * @param {boolean[][]} grid
 */
function dimensions(grid) {
	return {
		cols: grid.length,
		rows: grid[0]?.length ?? 0,
	}
}

/**
 * @param {string} str
 */
function parseRule(str) {
	str = str.trim()
	const check = /^[B|b|S|s]\d+\/?[B|b|S|s]\d+$/
	if (!check.test(str)) return

	/** @type {number[]} */
	const born = []
	/** @type {number[]} */
	const survive = []
	let cur = str[0].toLowerCase() == "b" ? born : survive

	const chars = str.split("").slice(1)
	for (const char of chars) {
		if (char == "/") continue
		const n = parseInt(char, 10)
		if (!Number.isInteger(n)) {
			cur = char.toLowerCase() == "b" ? born : survive
			continue
		}
		cur.push(n)
	}

	return { born, survive }
}

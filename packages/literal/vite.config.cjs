const { defineConfig } = require("vite")
const path = require("path")

module.exports = defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, "src/main.ts"),
			name: "Literal",
			fileName: format => `literal.${format}.js`,
		},
	},
})

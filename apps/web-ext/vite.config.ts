import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import { resolve, dirname } from "path"

const root = dirname(import.meta.url).replace("file:", "")

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	build: {
		rollupOptions: {
			input: {
				popup: resolve(root, "popup/index.html"),
			},
		},
	},
})

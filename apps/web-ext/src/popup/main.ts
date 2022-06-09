import Popup from "./Popup.svelte"

const app = new Popup({
	target: document.querySelector("#app") ?? document.body,
})

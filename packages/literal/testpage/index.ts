import { Literal } from "../src/main"
import Container from "./Container"

const render = Literal({ target: "#app", dev: true })
const tree = render(Container, {})

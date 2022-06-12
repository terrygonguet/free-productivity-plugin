import { Literal } from "../src/main"
import Container from "./Container"
import Typewriter from "./Typewriter"

const render = Literal({ target: "#app", dev: true })
render(Container, Typewriter)

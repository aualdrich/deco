import React from "react"
import { createRoot } from "react-dom/client"
import HelloWorld from "./components/HelloWorld"

const container = document.getElementById("react-root")
if (container) {
  createRoot(container).render(<HelloWorld />)
}

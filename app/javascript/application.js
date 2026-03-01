import React from "react"
import { createRoot } from "react-dom/client"
import HelloWorld from "./components/HelloWorld"
import KanbanBoard from "./components/KanbanBoard"

const helloContainer = document.getElementById("react-root")
if (helloContainer) {
  createRoot(helloContainer).render(<HelloWorld />)
}

const kanbanContainer = document.getElementById("kanban-board-root")
if (kanbanContainer) {
  createRoot(kanbanContainer).render(<KanbanBoard />)
}

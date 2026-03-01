import { createRoot } from "react-dom/client"
import HelloWorld from "./components/HelloWorld"
import KanbanBoard from "./components/KanbanBoard"
import ProjectsList from "./components/ProjectsList"

const rootContainer = document.getElementById("react-root")
if (rootContainer) {
  // Both the home page and /projects currently use #react-root.
  // Mount the correct component based on URL.
  const path = window.location.pathname

  if (path === "/projects" || path === "/projects/") {
    createRoot(rootContainer).render(<ProjectsList />)
  } else {
    createRoot(rootContainer).render(<HelloWorld />)
  }
}

const kanbanContainer = document.getElementById("kanban-board-root")
if (kanbanContainer) {
  createRoot(kanbanContainer).render(<KanbanBoard />)
}

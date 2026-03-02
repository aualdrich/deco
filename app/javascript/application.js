import { createRoot } from "react-dom/client"
import HelloWorld from "./components/HelloWorld"
import KanbanBoard from "./components/KanbanBoard"
import ProjectsList from "./components/ProjectsList"

const rootContainer = document.getElementById("react-root")
if (rootContainer) {
  // Both the home page and /projects currently use #react-root.
  // Mount the correct component based on a server-rendered hint.
  const component = rootContainer.dataset.component

  if (component === "ProjectsList") {
    createRoot(rootContainer).render(<ProjectsList />)
  } else {
    createRoot(rootContainer).render(<HelloWorld />)
  }
}

const kanbanContainer = document.getElementById("kanban-board-root")
if (kanbanContainer) {
  const projectId = kanbanContainer.dataset.projectId
  const projectName = kanbanContainer.dataset.projectName
  createRoot(kanbanContainer).render(<KanbanBoard projectId={projectId} projectName={projectName} />)
}

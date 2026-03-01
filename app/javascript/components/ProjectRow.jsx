import { useState } from "react"

export default function ProjectRow({ project, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function navigateToBoard() {
    window.location.href = `/projects/${project.id}/board`
  }

  function handleRowClick() {
    if (confirmingDelete) return
    navigateToBoard()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleRowClick()
      }}
      className="flex items-center justify-between gap-4 rounded px-4 py-3 transition-colors bg-deco-surface border border-deco-border hover:bg-deco-raised"
      style={{ borderLeft: "3px solid var(--color-deco-gold)" }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-semibold text-deco-text">{project.name}</div>
        </div>

        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-xs text-deco-muted">
          <div className="truncate">
            <span className="font-medium text-deco-muted">Directory:</span>{" "}
            {project.directory || "—"}
          </div>
          <div className="truncate">
            <span className="font-medium text-deco-muted">Agent:</span>{" "}
            {project.agent_name || "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-deco-muted">Are you sure?</span>
            <button
              type="button"
              onClick={() => {
                onDelete(project.id)
                setConfirmingDelete(false)
              }}
              className="rounded px-2 py-1 text-xs font-medium transition-colors bg-transparent border border-red-700 text-red-200 hover:bg-red-950/40"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded px-2 py-1 text-xs transition-colors bg-transparent border border-deco-border text-deco-muted hover:bg-deco-raised"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="rounded px-2 py-1 text-xs transition-colors bg-transparent border border-deco-gold text-deco-gold hover:bg-deco-raised"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded px-2 py-1 text-xs transition-colors bg-transparent border border-red-700 text-red-300 hover:bg-red-950/40"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}

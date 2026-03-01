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
      className="flex items-center justify-between gap-4 rounded px-4 py-3 transition-colors hover:bg-[#343445]"
      style={{
        backgroundColor: "#2d2d3a",
        border: "1px solid #4a4a5a",
        borderLeft: "3px solid #c9a84c",
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-semibold" style={{ color: "#f5f0e8" }}>
            {project.name}
          </div>
        </div>

        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ color: "#a09880" }}>
          <div className="truncate">
            <span className="font-medium" style={{ color: "#a09880" }}>
              Directory:
            </span>{" "}
            {project.directory || "—"}
          </div>
          <div className="truncate">
            <span className="font-medium" style={{ color: "#a09880" }}>
              Agent:
            </span>{" "}
            {project.agent_name || "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "#a09880" }}>
              Are you sure?
            </span>
            <button
              type="button"
              onClick={() => {
                onDelete(project.id)
                setConfirmingDelete(false)
              }}
              className="rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-[#4a2d2d]"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #b91c1c",
                color: "#fecaca",
              }}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded px-2 py-1 text-xs transition-colors hover:bg-[#3a3a4a]"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #4a4a5a",
                color: "#a09880",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="rounded px-2 py-1 text-xs transition-colors hover:bg-[#3a3a4a]"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #c9a84c",
                color: "#c9a84c",
              }}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded px-2 py-1 text-xs transition-colors hover:bg-[#4a2d2d]"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #b91c1c",
                color: "#fca5a5",
              }}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}

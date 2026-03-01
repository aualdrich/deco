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
      className="flex items-center justify-between gap-4 rounded border border-slate-200 bg-white px-4 py-3 shadow-sm hover:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-semibold text-slate-900">
            {project.name}
          </div>
        </div>

        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
          <div className="truncate">
            <span className="font-medium text-slate-700">Directory:</span>{" "}
            {project.directory || "—"}
          </div>
          <div className="truncate">
            <span className="font-medium text-slate-700">Agent:</span>{" "}
            {project.agent_name || "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-700">Are you sure?</span>
            <button
              type="button"
              onClick={() => {
                onDelete(project.id)
                setConfirmingDelete(false)
              }}
              className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}

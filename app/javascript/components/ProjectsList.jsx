import { useEffect, useState } from "react"
import ProjectModal from "./ProjectModal"
import ProjectRow from "./ProjectRow"

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content
}

export default function ProjectsList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)

      try {
        const res = await fetch("/projects.json", {
          headers: { Accept: "application/json" },
        })

        if (!res.ok) throw new Error(`Failed to load projects (${res.status})`)

        const data = await res.json()
        if (cancelled) return

        setProjects(Array.isArray(data) ? data : [])
      } catch (err) {
        if (cancelled) return
        setLoadError(err?.message ?? "Failed to load projects")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  function openCreate() {
    setEditingProject(null)
    setModalOpen(true)
  }

  function openEdit(project) {
    setEditingProject(project)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingProject(null)
  }

  function handleSave(savedProject) {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === savedProject.id)
      if (exists) return prev.map((p) => (p.id === savedProject.id ? savedProject : p))
      return [savedProject, ...prev]
    })

    closeModal()
  }

  async function handleDelete(projectId) {
    const res = await fetch(`/projects/${projectId}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": csrfToken(),
        Accept: "application/json",
      },
    })

    if (!res.ok && res.status !== 204) {
      // Keep UI simple: surface failure via alert.
      // (Inline error UI could be added later.)
      // eslint-disable-next-line no-alert
      alert(`Failed to delete project (${res.status})`)
      return
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
            <p className="mt-1 text-sm text-slate-600">
              Create a project, then jump into its board.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New Project
          </button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-700">
              Loading…
            </div>
          ) : loadError ? (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {loadError}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="text-sm font-medium text-slate-900">
                No projects yet.
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Create your first one.
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={openCreate}
                  className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  New Project
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen ? (
        <ProjectModal
          project={editingProject}
          onClose={closeModal}
          onSave={handleSave}
        />
      ) : null}
    </div>
  )
}

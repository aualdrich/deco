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
      return [...prev, savedProject].sort((a, b) => a.name.localeCompare(b.name))
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
    <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl md:text-3xl font-semibold uppercase tracking-widest"
              style={{ color: "#c9a84c", fontFamily: "Playfair Display, serif" }}
            >
              Projects
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#a09880" }}>
              Create a project, then jump into its board.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="rounded px-4 py-2 text-sm font-medium transition-colors hover:bg-[#3a3a4a]"
            style={{
              border: "1px solid #c9a84c",
              color: "#c9a84c",
              backgroundColor: "transparent",
            }}
          >
            New Project
          </button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div
              className="rounded p-4 text-sm"
              style={{
                backgroundColor: "#2d2d3a",
                border: "1px solid #4a4a5a",
                color: "#f5f0e8",
              }}
            >
              Loading…
            </div>
          ) : loadError ? (
            <div
              className="rounded p-4 text-sm"
              style={{
                backgroundColor: "#3a2d2d",
                border: "1px solid #7a2d2d",
                color: "#f5f0e8",
              }}
            >
              {loadError}
            </div>
          ) : projects.length === 0 ? (
            <div
              className="rounded p-10 text-center"
              style={{
                backgroundColor: "#2d2d3a",
                border: "1px dashed #c9a84c",
              }}
            >
              <div className="text-sm font-medium" style={{ color: "#f5f0e8" }}>
                No projects yet.
              </div>
              <div className="mt-1 text-sm" style={{ color: "#a09880" }}>
                Create your first one.
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={openCreate}
                  className="rounded px-4 py-2 text-sm font-medium transition-colors hover:bg-[#3a3a4a]"
                  style={{
                    border: "1px solid #c9a84c",
                    color: "#c9a84c",
                    backgroundColor: "transparent",
                  }}
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

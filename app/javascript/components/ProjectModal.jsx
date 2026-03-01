import { useEffect, useMemo, useState } from "react"

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content
}

export default function ProjectModal({ project, onClose, onSave }) {
  const isEdit = Boolean(project?.id)

  const initialValues = useMemo(() => {
    return {
      name: project?.name ?? "",
      directory: project?.directory ?? "",
      agent_name: project?.agent_name ?? "",
    }
  }, [project])

  const [values, setValues] = useState(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    setValues(initialValues)
    setErrors([])
  }, [initialValues])

  function updateField(field) {
    return (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setSubmitting(true)
    setErrors([])

    try {
      const url = isEdit ? `/projects/${project.id}` : "/projects"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken(),
        },
        body: JSON.stringify({ project: values }),
      })

      if (res.ok) {
        const savedProject = await res.json()
        onSave(savedProject)
        return
      }

      let payload = null
      try {
        payload = await res.json()
      } catch {
        payload = null
      }

      if (payload?.errors) {
        setErrors(Array.isArray(payload.errors) ? payload.errors : [String(payload.errors)])
      } else {
        setErrors([`Request failed (${res.status})`])
      }
    } catch (err) {
      setErrors([err?.message ?? "Request failed"])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg rounded-lg p-6 shadow-xl bg-deco-surface border border-deco-border">
        <div className="flex items-start justify-between gap-4">
          <h2
            className="text-lg font-semibold uppercase tracking-widest text-deco-gold"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            {isEdit ? "Edit Project" : "New Project"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm transition-colors text-deco-muted hover:bg-deco-raised"
          >
            Close
          </button>
        </div>

        {errors.length > 0 ? (
          <div className="mt-4 rounded p-3 text-sm bg-red-950/40 border border-red-800 text-deco-text">
            <ul className="list-disc pl-5">
              {errors.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-deco-muted">
              Name <span className="text-red-300">*</span>
            </label>
            <input
              className="mt-1 w-full rounded px-3 py-2 text-sm bg-deco-raised border border-deco-border text-deco-text focus:outline-none focus:border-deco-gold"
              value={values.name}
              onChange={updateField("name")}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-deco-muted">
              Directory
            </label>
            <input
              className="mt-1 w-full rounded px-3 py-2 text-sm bg-deco-raised border border-deco-border text-deco-text focus:outline-none focus:border-deco-gold"
              value={values.directory}
              onChange={updateField("directory")}
              placeholder="/path/to/repo"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-deco-muted">
              Agent name
            </label>
            <input
              className="mt-1 w-full rounded px-3 py-2 text-sm bg-deco-raised border border-deco-border text-deco-text focus:outline-none focus:border-deco-gold"
              value={values.agent_name}
              onChange={updateField("agent_name")}
              placeholder="e.g. deco"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-2 text-sm transition-colors bg-transparent border border-deco-border text-deco-muted hover:bg-deco-raised"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded px-3 py-2 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-60 bg-deco-gold border border-deco-gold text-deco-bg"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

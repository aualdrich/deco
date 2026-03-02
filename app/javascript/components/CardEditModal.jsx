import { useState, useEffect, useRef } from "react"
import csrfToken from "../lib/csrf"

const COLUMN_OPTIONS = [
  { id: "todo",       label: "Todo" },
  { id: "doing",      label: "Doing" },
  { id: "in-review",  label: "In Review" },
  { id: "in-qa",      label: "In QA" },
  { id: "in-preview", label: "In Preview" },
  { id: "done",       label: "Done" },
]

export default function CardEditModal({ card, projectId, onClose, onCardUpdated }) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? "")
  const [status, setStatus] = useState(card.status)
  const [steps, setSteps] = useState(card.steps ?? [])
  const [newStepTitle, setNewStepTitle] = useState("")
  const [saving, setSaving] = useState(false)

  const newStepRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/projects/${projectId}/cards/${card.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken(),
        },
        body: JSON.stringify({ card: { title: title.trim(), description, status } }),
      })
      if (!res.ok) throw new Error("Save failed")
      const updatedCard = await res.json()
      onCardUpdated({ ...updatedCard, steps })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddStep(e) {
    e.preventDefault()
    if (!newStepTitle.trim()) return
    try {
      const res = await fetch(`/projects/${projectId}/cards/${card.id}/steps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken(),
        },
        body: JSON.stringify({ step: { title: newStepTitle.trim(), position: steps.length } }),
      })
      if (!res.ok) throw new Error("Failed to add step")
      const newStep = await res.json()
      setSteps((prev) => [...prev, newStep])
      setNewStepTitle("")
      newStepRef.current?.focus()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleToggleStep(step) {
    const updated = { ...step, completed: !step.completed }
    setSteps((prev) => prev.map((s) => (s.id === step.id ? updated : s)))
    try {
      await fetch(`/projects/${projectId}/cards/${card.id}/steps/${step.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken(),
        },
        body: JSON.stringify({ step: { completed: updated.completed } }),
      })
    } catch (err) {
      // Revert on failure
      setSteps((prev) => prev.map((s) => (s.id === step.id ? step : s)))
      console.error(err)
    }
  }

  async function handleDeleteStep(step) {
    setSteps((prev) => prev.filter((s) => s.id !== step.id))
    try {
      await fetch(`/projects/${projectId}/cards/${card.id}/steps/${step.id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken() },
      })
    } catch (err) {
      setSteps((prev) => [...prev, step])
      console.error(err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 flex flex-col max-h-[90vh] bg-deco-surface border border-deco-gold rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-deco-border flex-shrink-0">
          <h2
            className="text-sm font-semibold uppercase tracking-widest text-deco-gold"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Edit Card
          </h2>
          <button
            onClick={onClose}
            className="text-deco-muted hover:text-deco-text transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">

          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-widest text-deco-muted">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm bg-deco-raised text-deco-text border border-deco-border outline-none focus:border-deco-gold placeholder-deco-muted"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-widest text-deco-muted">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded px-3 py-2 text-sm bg-deco-raised text-deco-text border border-deco-border outline-none focus:border-deco-gold placeholder-deco-muted resize-none"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-widest text-deco-muted">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm bg-deco-raised text-deco-text border border-deco-border outline-none focus:border-deco-gold"
            >
              {COLUMN_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded py-3 text-sm font-semibold uppercase tracking-widest bg-deco-gold text-deco-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Saving…" : "Save"}
          </button>

          {/* Steps divider */}
          <div className="border-t border-deco-border pt-4">
            <h3
              className="text-xs font-semibold uppercase tracking-widest text-deco-gold mb-3"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Steps
            </h3>

            {/* Step list */}
            <div className="flex flex-col gap-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={step.completed}
                    onChange={() => handleToggleStep(step)}
                    className="flex-shrink-0 accent-deco-gold w-4 h-4 cursor-pointer"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      step.completed
                        ? "line-through text-deco-muted"
                        : "text-deco-text"
                    }`}
                  >
                    {step.title}
                  </span>
                  <button
                    onClick={() => handleDeleteStep(step)}
                    className="text-deco-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-base leading-none flex-shrink-0"
                    aria-label="Delete step"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add step */}
            <form onSubmit={handleAddStep} className="mt-3">
              <input
                ref={newStepRef}
                type="text"
                placeholder="Add a step…"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm bg-deco-raised text-deco-text border border-deco-border outline-none focus:border-deco-gold placeholder-deco-muted"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from "react"

export default function CardModal({ card, projectId, readOnly, onClose, onArchive, onRestore, onCreate }) {
  const isCreate = !card
  const [title, setTitle] = useState(card?.title || "")
  const [description, setDescription] = useState(card?.description || "")
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const backdropRef = useRef(null)

  function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content ?? ""
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  function handleBackdropClick(e) {
    if (e.target === backdropRef.current) onClose()
  }

  async function handleCreate() {
    if (!title.trim()) return
    setBusy(true)
    try {
      await onCreate(title.trim(), description.trim())
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    if (!title.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/projects/${projectId}/cards/${card.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken(),
        },
        body: JSON.stringify({ card: { title: title.trim(), description: description.trim() } }),
      })
      if (!res.ok) throw new Error("Save failed")
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleArchive() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/projects/${projectId}/cards/${card.id}/archive`, {
        method: "PATCH",
        headers: { "X-CSRF-Token": csrfToken() },
      })
      if (!res.ok) throw new Error("Archive failed")
      onArchive(card.id)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  async function handleRestore() {
    setBusy(true)
    try {
      const res = await fetch(`/projects/${projectId}/cards/${card.id}/restore`, {
        method: "PATCH",
        headers: { "X-CSRF-Token": csrfToken() },
      })
      if (!res.ok) throw new Error("Restore failed")
      onRestore(card.id)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        className="relative w-full max-w-lg rounded-lg bg-deco-surface shadow-2xl"
        style={{ borderTop: "3px solid var(--color-deco-gold)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2
            className="text-deco-gold uppercase tracking-widest font-bold text-xs"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {isCreate ? "New Card" : readOnly ? "Archived Card" : "Edit Card"}
          </h2>
          <button
            onClick={onClose}
            className="text-deco-muted hover:text-deco-text transition-colors text-2xl leading-none ml-4"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-deco-muted">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={readOnly}
              className="w-full rounded px-3 py-2 text-sm bg-deco-raised text-deco-text border border-deco-border outline-none focus:border-deco-gold placeholder-deco-muted disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-deco-muted">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={readOnly}
              rows={4}
              placeholder="Add a description…"
              className="w-full rounded px-3 py-2 text-sm bg-deco-raised text-deco-text border border-deco-border outline-none focus:border-deco-gold placeholder-deco-muted resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Archived badge */}
          {readOnly && (
            <div>
              <span className="inline-block text-xs uppercase tracking-widest text-deco-muted border border-deco-border rounded px-2 py-0.5">
                Archived · read only
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-between items-center gap-3"
          style={{ borderTop: "1px solid var(--color-deco-border)" }}
        >
          {isCreate ? (
            <>
              <span />
              <button
                onClick={handleCreate}
                disabled={busy || !title.trim()}
                className="px-4 py-2 rounded text-sm uppercase tracking-widest font-semibold bg-deco-gold text-deco-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {busy ? "Adding…" : "Add card"}
              </button>
            </>
          ) : readOnly ? (
            <>
              <span />
              <button
                onClick={handleRestore}
                disabled={busy}
                className="px-4 py-2 rounded text-sm uppercase tracking-widest font-semibold bg-deco-gold text-deco-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {busy ? "Restoring…" : "Restore card"}
              </button>
            </>
          ) : (
            <>
              {/* Archive — left, destructive */}
              <div className="flex items-center gap-3">
                {confirming ? (
                  <>
                    <span className="text-xs text-deco-muted">Are you sure?</span>
                    <button
                      onClick={() => setConfirming(false)}
                      disabled={busy}
                      className="text-xs uppercase tracking-widest text-deco-muted hover:text-deco-text transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleArchive}
                      disabled={busy}
                      className="px-3 py-1.5 rounded text-xs uppercase tracking-widest border border-red-600 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors"
                    >
                      {busy ? "Archiving…" : "Yes, archive"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleArchive}
                    disabled={busy}
                    className="text-xs uppercase tracking-widest text-deco-muted hover:text-red-400 transition-colors"
                  >
                    Archive
                  </button>
                )}
              </div>

              {/* Save — right */}
              <button
                onClick={handleSave}
                disabled={busy || !title.trim()}
                className="px-4 py-2 rounded text-sm uppercase tracking-widest font-semibold bg-deco-gold text-deco-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

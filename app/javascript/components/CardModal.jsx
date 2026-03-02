import { useEffect, useRef, useState } from "react"

export default function CardModal({ card, projectId, readOnly, onClose, onArchive, onRestore }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-lg bg-deco-surface border border-deco-border shadow-xl overflow-hidden"
        style={{ borderTop: "3px solid var(--color-deco-gold)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <h2
            className="text-deco-gold uppercase tracking-widest font-bold text-sm leading-tight flex-1 pr-4"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {card.title}
          </h2>
          <button
            onClick={onClose}
            className="text-deco-muted hover:text-deco-text transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-2">
          {card.description ? (
            <p className="text-deco-text text-sm leading-relaxed">{card.description}</p>
          ) : (
            <p className="text-deco-muted text-sm italic">No description.</p>
          )}
        </div>

        {/* Read-only badge */}
        {readOnly && (
          <div className="px-6 pb-2">
            <span className="inline-block text-xs uppercase tracking-widest text-deco-muted border border-deco-border rounded px-2 py-0.5">
              Archived · read only
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-deco-border flex justify-between items-center gap-3">
          {readOnly ? (
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
              {/* Archive — left side, secondary/destructive */}
              <div className="flex items-center gap-2">
                {confirming && (
                  <span className="text-xs text-deco-muted">Archive this card?</span>
                )}
                <button
                  onClick={confirming ? () => setConfirming(false) : undefined}
                  disabled={busy}
                  className={`px-3 py-2 rounded text-xs uppercase tracking-widest border transition-colors disabled:opacity-50 ${
                    confirming
                      ? "border-deco-border text-deco-muted hover:text-deco-text"
                      : "hidden"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchive}
                  disabled={busy}
                  className={`px-3 py-2 rounded text-xs uppercase tracking-widest border transition-colors disabled:opacity-50 ${
                    confirming
                      ? "border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
                      : "border-deco-border text-deco-muted hover:border-red-600 hover:text-red-400"
                  }`}
                >
                  {busy ? "Archiving…" : confirming ? "Yes, archive" : "Archive"}
                </button>
              </div>

              {/* Close — right */}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded text-sm uppercase tracking-widest font-semibold bg-deco-raised text-deco-muted border border-deco-border hover:text-deco-text transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

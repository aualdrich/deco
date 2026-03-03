import { useEffect, useMemo, useRef, useState } from "react"

function normalizeMessages(chatMessages) {
  if (!Array.isArray(chatMessages)) return []
  return chatMessages
    .map((m) => {
      if (!m) return null
      if (typeof m === "string") return { role: "assistant", content: m }
      const role = m.role || m.sender || m.author || m.type
      const content = m.content || m.text || m.message || ""
      return { ...m, role, content }
    })
    .filter(Boolean)
}

function MessageBubble({ message }) {
  const role = (message?.role || "").toString().toLowerCase()
  const isUser = role === "user" || role === "human" || role === "client"

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-sm bg-deco-gold text-deco-bg px-3 py-2 text-sm"
            : "max-w-[85%] rounded-2xl rounded-bl-sm bg-deco-raised text-deco-text px-3 py-2 text-sm border border-deco-border"
        }
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    </div>
  )
}

export default function PlanningChat({ card, onClose }) {
  const [draft, setDraft] = useState("")
  const backdropRef = useRef(null)
  const bottomRef = useRef(null)

  const messages = useMemo(() => normalizeMessages(card?.chat_messages), [card])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length])

  function handleBackdropClick(e) {
    // On mobile, the panel is full-screen so this never fires.
    if (e.target === backdropRef.current) onClose?.()
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Step 7 wires this up to the API.
    setDraft("")
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={
        "fixed inset-0 z-50 bg-deco-bg md:flex md:items-center md:justify-center md:bg-deco-bg/70 md:p-4"
      }
    >
      <div
        className={
          "relative flex h-full w-full flex-col bg-deco-surface shadow-2xl md:h-[min(80vh,48rem)] md:max-w-3xl md:rounded-lg"
        }
        style={{ borderTop: "3px solid var(--color-deco-gold)" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 md:px-6 md:pt-6 md:pb-4"
          style={{ borderBottom: "1px solid var(--color-deco-border)" }}
        >
          {/* Mobile back/close */}
          <button
            onClick={() => onClose?.()}
            className="md:hidden text-deco-muted hover:text-deco-text transition-colors text-xl leading-none"
            aria-label="Back"
            type="button"
          >
            ←
          </button>

          <div className="min-w-0 flex-1">
            <div
              className="text-deco-gold uppercase tracking-widest font-bold text-xs truncate"
              style={{ fontFamily: "Playfair Display, serif" }}
              title={card?.title}
            >
              {card?.title || "Planning Chat"}
            </div>
            <div className="text-xs text-deco-muted truncate">In-app planning chat</div>
          </div>

          {/* Desktop close */}
          <button
            onClick={() => onClose?.()}
            className="hidden md:inline-flex text-deco-muted hover:text-deco-text transition-colors text-2xl leading-none"
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
          {messages.length === 0 ? (
            <div className="text-sm text-deco-muted">No messages yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m, idx) => (
                <MessageBubble key={m.id || m.created_at || idx} message={m} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 md:px-6"
          style={{ borderTop: "1px solid var(--color-deco-border)" }}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={1}
              placeholder="Type a message…"
              className="flex-1 resize-none rounded px-3 py-2 text-sm bg-deco-raised text-deco-text border border-deco-border outline-none focus:border-deco-gold placeholder-deco-muted"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded text-sm uppercase tracking-widest font-semibold bg-deco-gold text-deco-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
              disabled={!draft.trim()}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

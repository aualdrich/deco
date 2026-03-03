import { useEffect, useRef, useState } from "react"

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
  const [messages, setMessages] = useState(() => normalizeMessages(card?.chat_messages))
  const [isStreaming, setIsStreaming] = useState(false)
  const backdropRef = useRef(null)
  const bottomRef = useRef(null)

  const projectId = card?.project_id || card?.project?.id
  const cardId = card?.id

  useEffect(() => {
    // Keep local state in sync when the card changes (e.g., user opens a different card)
    setMessages(normalizeMessages(card?.chat_messages))
  }, [cardId])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages, isStreaming])

  function handleBackdropClick(e) {
    // On mobile, the panel is full-screen so this never fires.
    if (e.target === backdropRef.current) onClose?.()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isStreaming) return

    const userText = draft.trim()
    if (!userText) return

    if (!projectId || !cardId) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: missing project/card id." }
      ])
      return
    }

    const tempUserId = `user-${Date.now()}`
    const tempAssistantId = `assistant-${Date.now()}`

    // 1) Optimistically render the user's message immediately.
    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: userText },
      { id: tempAssistantId, role: "assistant", content: "" }
    ])
    setDraft("")
    setIsStreaming(true)

    const csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content")

    let assistantText = ""

    try {
      // 2) Stream assistant response from the proxy endpoint.
      const res = await fetch(
        `/projects/${projectId}/cards/${cardId}/planning_chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
          },
          body: JSON.stringify({ message: userText })
        }
      )

      if (!res.ok) {
        let msg = `Request failed (${res.status})`
        try {
          const body = await res.json()
          if (body?.errors?.length) msg = body.errors.join(", ")
        } catch {
          // ignore
        }
        throw new Error(msg)
      }

      if (!res.body) throw new Error("Streaming not supported in this browser")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (readerDone) break

        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by a blank line.
        let sepIndex
        while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, sepIndex)
          buffer = buffer.slice(sepIndex + 2)

          const lines = rawEvent
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.startsWith("data:"))

          for (const line of lines) {
            const payload = line.replace(/^data:\s*/, "").trim()
            if (!payload) continue
            if (payload === "[DONE]") {
              done = true
              break
            }

            try {
              const json = JSON.parse(payload)
              const choice = (json.choices && json.choices[0]) || {}
              const delta = choice.delta || {}
              const message = choice.message || {}
              const chunkText =
                (delta && typeof delta.content === "string" && delta.content) ||
                (message && typeof message.content === "string" && message.content) ||
                ""

              if (chunkText) {
                assistantText += chunkText
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempAssistantId
                      ? { ...m, content: assistantText }
                      : m
                  )
                )
              }
            } catch {
              // ignore malformed partial payloads
            }
          }
        }
      }

      // 4) Persist both sides to chat_messages (idempotent on the server).
      try {
        await fetch(`/projects/${projectId}/cards/${cardId}/chat_messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
          },
          body: JSON.stringify({
            messages: [
              { role: "user", content: userText },
              { role: "assistant", content: assistantText || "…" }
            ]
          })
        })
      } catch {
        // If persistence fails, we still keep the local chat.
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "(Warning) Could not persist chat history. Try refreshing and resending if needed."
          }
        ])
      }
    } catch (err) {
      const errorText = err?.message || "Unknown error"
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssistantId
            ? {
                ...m,
                content: `Error: ${errorText}`
              }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
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

              {isStreaming ? (
                <div className="text-xs text-deco-muted">Assistant is typing…</div>
              ) : null}
            </div>
          )}
          <div ref={bottomRef} />
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  // Let the form submit handler run.
                  e.currentTarget.form?.requestSubmit()
                }
              }}
              rows={1}
              placeholder={isStreaming ? "Waiting for assistant…" : "Type a message…"}
              disabled={isStreaming}
              className="flex-1 resize-none rounded px-3 py-2 text-sm bg-deco-raised text-deco-text border border-deco-border outline-none focus:border-deco-gold placeholder-deco-muted disabled:opacity-70"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded text-sm uppercase tracking-widest font-semibold bg-deco-gold text-deco-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
              disabled={isStreaming || !draft.trim()}
            >
              {isStreaming ? "…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

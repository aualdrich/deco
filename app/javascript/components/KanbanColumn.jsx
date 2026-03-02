import { useState, useRef, useEffect } from "react"
import KanbanCard from "./KanbanCard"

export default function KanbanColumn({ column, onAddCard, onCardClick }) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const titleRef = useRef(null)

  useEffect(() => {
    if (isAdding && titleRef.current) {
      titleRef.current.focus()
    }
  }, [isAdding])

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      cancel()
    }
  }

  function cancel() {
    setIsAdding(false)
    setTitle("")
    setDescription("")
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onAddCard(column.id, title.trim(), description.trim())
    cancel()
  }

  return (
    <div className="min-w-[280px] w-[280px] md:flex-1 md:min-w-0 rounded-lg p-3 flex flex-col gap-2 bg-deco-surface border border-deco-gold">
      <h2
        className="text-sm font-semibold uppercase tracking-widest pb-2 mb-1 text-deco-gold border-b border-deco-border"
        style={{ fontFamily: "Playfair Display, serif" }}
      >
        {column.title}
      </h2>

      <div className="flex flex-col gap-2">
        {column.cards.map((card) => (
          <KanbanCard key={card.id} card={card} onCardClick={onCardClick} />
        ))}
      </div>

      {isAdding ? (
        <form
          onSubmit={handleSubmit}
          className="mt-1 flex flex-col gap-2"
          onKeyDown={handleKeyDown}
        >
          <input
            ref={titleRef}
            type="text"
            placeholder="Card title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded px-2 py-1.5 text-sm bg-deco-raised text-deco-text border border-deco-border outline-none focus:border-deco-gold placeholder-deco-muted"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded px-2 py-1.5 text-sm bg-deco-raised text-deco-text border border-deco-border outline-none focus:border-deco-gold placeholder-deco-muted resize-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded py-4 text-sm font-semibold uppercase tracking-widest bg-deco-gold text-deco-bg hover:opacity-90 transition-opacity"
            >
              Add
            </button>
            <button
              type="button"
              onClick={cancel}
              className="flex-1 rounded py-4 text-sm font-semibold uppercase tracking-widest bg-deco-raised text-deco-muted hover:text-deco-text border border-deco-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-1 w-full text-left px-1 py-1.5 text-xs text-deco-muted hover:text-deco-gold transition-colors uppercase tracking-widest"
        >
          + Add card
        </button>
      )}
    </div>
  )
}

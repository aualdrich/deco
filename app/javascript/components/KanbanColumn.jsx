import { useDroppable } from "@dnd-kit/core"
import KanbanCard from "./KanbanCard"

export default function KanbanColumn({ column, onOpenAddCard, onCardClick }) {
  const { setNodeRef } = useDroppable({ id: column.id })

  return (
    <div
      className="min-w-[280px] w-[280px] md:flex-1 md:min-w-0 rounded-lg p-3 flex flex-col gap-2 bg-deco-surface border border-deco-border"
      style={{ borderLeft: "4px solid var(--color-deco-gold)" }}
    >
      <h2
        className="text-sm font-semibold uppercase tracking-widest pb-2 mb-1 text-deco-gold border-b border-deco-border"
        style={{ fontFamily: "Playfair Display, serif" }}
      >
        {column.title}
      </h2>

      <div ref={setNodeRef} className="flex flex-col gap-2 flex-1 min-h-[60px]">
        {column.cards.map((card) => (
          <KanbanCard key={card.id} card={card} onCardClick={onCardClick} />
        ))}
      </div>

      <button
        onClick={() => onOpenAddCard(column.id)}
        className="mt-1 w-full text-left px-1 py-1.5 text-xs text-deco-muted hover:text-deco-gold transition-colors uppercase tracking-widest"
      >
        + Add card
      </button>
    </div>
  )
}

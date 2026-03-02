import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export default function KanbanCard({ card, onCardClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="rounded p-3 min-h-[60px] opacity-40 bg-transparent border border-dashed border-deco-border"
        style={{
          ...style,
          borderLeft: "3px dashed var(--color-deco-gold)",
        }}
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: "3px solid var(--color-deco-gold)",
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
      onClick={() => onCardClick?.(card)}
      className="rounded p-3 cursor-grab active:cursor-grabbing bg-deco-raised border border-deco-border select-none"
    >
      <p className="font-semibold text-sm text-deco-text">{card.title}</p>
      <p className="text-xs mt-1 text-deco-muted">{card.description}</p>
    </div>
  )
}

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

  const completedSteps = card.steps ? card.steps.filter((s) => s.completed).length : 0
  const totalSteps = card.steps ? card.steps.length : 0

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="rounded min-h-[60px] opacity-40 bg-transparent border border-dashed border-deco-border"
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
      {...attributes}
      {...listeners}
      onClick={() => onCardClick?.(card)}
      style={{
        ...style,
        borderLeft: "3px solid var(--color-deco-gold)",
        cursor: "grab",
      }}
      className="rounded p-3 bg-deco-raised border border-deco-border active:cursor-grabbing"
    >
      <p className="font-semibold text-sm text-deco-text">{card.title}</p>
      {card.description && (
        <p className="text-xs mt-1 text-deco-muted">{card.description}</p>
      )}
      {totalSteps > 0 && (
        <p className="text-xs mt-2 text-deco-gold">
          {completedSteps} / {totalSteps} steps
        </p>
      )}
    </div>
  )
}

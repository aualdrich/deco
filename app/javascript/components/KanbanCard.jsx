import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function DragHandle({ listeners }) {
  return (
    <div
      {...listeners}
      className="flex-shrink-0 flex flex-col gap-[3px] px-1 py-0.5 cursor-grab active:cursor-grabbing text-deco-muted hover:text-deco-gold transition-colors"
      title="Drag to move"
      aria-label="Drag handle"
    >
      {[0, 1].map((row) => (
        <div key={row} className="flex gap-[3px]">
          {[0, 1, 2].map((dot) => (
            <div key={dot} className="w-[3px] h-[3px] rounded-full bg-current" />
          ))}
        </div>
      ))}
    </div>
  )
}

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
      {...attributes}
      style={{
        ...style,
        borderLeft: "3px solid var(--color-deco-gold)",
      }}
      className="rounded bg-deco-raised border border-deco-border"
    >
      <div className="flex items-start gap-1 p-3">
        <button
          onClick={() => onCardClick?.(card)}
          className="flex-1 text-left min-w-0"
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
        </button>
        <DragHandle listeners={listeners} />
      </div>
    </div>
  )
}

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export default function KanbanCard({ card }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: "#3a3a4a",
    border: "1px solid #4a4a5a",
    borderLeft: "3px solid #c9a84c",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded p-3 cursor-grab active:cursor-grabbing"
    >
      <p className="font-semibold text-sm" style={{ color: "#f5f0e8" }}>
        {card.title}
      </p>
      <p className="text-xs mt-1" style={{ color: "#a09880" }}>
        {card.description}
      </p>
    </div>
  )
}

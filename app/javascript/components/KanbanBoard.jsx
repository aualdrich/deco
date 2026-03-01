import { useState } from "react"
import { DndContext, closestCorners, DragOverlay } from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import KanbanColumn from "./KanbanColumn"

const INITIAL_COLUMNS = [
  {
    id: "todo",
    title: "Todo",
    cards: [
      {
        id: "card-1",
        title: "Design system tokens",
        description: "Define color palette and typography scale",
      },
      {
        id: "card-2",
        title: "Set up CI pipeline",
        description: "GitHub Actions for lint and test",
      },
    ],
  },
  {
    id: "doing",
    title: "Doing",
    cards: [
      {
        id: "card-3",
        title: "Kanban board UI",
        description: "Art deco styled board with drag-and-drop",
      },
      {
        id: "card-4",
        title: "shadcn/ui integration",
        description: "Wire up component library",
      },
    ],
  },
  {
    id: "in-review",
    title: "In Review",
    cards: [
      {
        id: "card-5",
        title: "Rails scaffold",
        description: "Base app with React mounted",
      },
    ],
  },
  {
    id: "in-qa",
    title: "In QA",
    cards: [
      {
        id: "card-6",
        title: "Project routing",
        description: "GET /projects/:id route",
      },
      {
        id: "card-7",
        title: "RSpec setup",
        description: "Base test configuration",
      },
    ],
  },
  {
    id: "in-preview",
    title: "In Preview",
    cards: [
      {
        id: "card-8",
        title: "ngrok tunnel",
        description: "deco.ngrok.dev pointing to localhost:3001",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    cards: [
      {
        id: "card-9",
        title: "Initial Rails setup",
        description: "Rails 8.1.2 + React scaffold",
      },
      {
        id: "card-10",
        title: "mise configuration",
        description: "Ruby 3.4.5 + Node 25.7.0",
      },
    ],
  },
]

function findColumnIndexByCardId(columns, cardId) {
  return columns.findIndex((col) => col.cards.some((c) => c.id === cardId))
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS)
  const [activeCard, setActiveCard] = useState(null)

  function handleDragStart(event) {
    const { active } = event

    // Find the card being dragged across all columns.
    for (const col of columns) {
      const found = col.cards.find((c) => c.id === active.id)
      if (found) {
        setActiveCard(found)
        break
      }
    }
  }

  function handleDragEnd(event) {
    setActiveCard(null)

    const { active, over } = event
    if (!over) return

    const activeCardId = active.id
    const overCardId = over.id

    if (activeCardId === overCardId) return

    setColumns((prevColumns) => {
      const sourceColIndex = findColumnIndexByCardId(prevColumns, activeCardId)
      const destColIndex = findColumnIndexByCardId(prevColumns, overCardId)

      // If we can't find source/destination (e.g. dropped outside card), do nothing.
      if (sourceColIndex === -1 || destColIndex === -1) return prevColumns

      const sourceCol = prevColumns[sourceColIndex]
      const destCol = prevColumns[destColIndex]

      const activeIndex = sourceCol.cards.findIndex((c) => c.id === activeCardId)
      const overIndex = destCol.cards.findIndex((c) => c.id === overCardId)

      if (activeIndex === -1 || overIndex === -1) return prevColumns

      // Reorder within the same column.
      if (sourceColIndex === destColIndex) {
        const nextCards = arrayMove(sourceCol.cards, activeIndex, overIndex)
        return prevColumns.map((col, idx) =>
          idx === sourceColIndex ? { ...col, cards: nextCards } : col,
        )
      }

      // Move between columns.
      const movingCard = sourceCol.cards[activeIndex]
      const nextSourceCards = sourceCol.cards.filter((c) => c.id !== activeCardId)
      const nextDestCards = [...destCol.cards]
      nextDestCards.splice(overIndex, 0, movingCard)

      return prevColumns.map((col, idx) => {
        if (idx === sourceColIndex) return { ...col, cards: nextSourceCards }
        if (idx === destColIndex) return { ...col, cards: nextDestCards }
        return col
      })
    })
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen p-4 md:p-6 bg-deco-bg">
        <div className="flex flex-row gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <SortableContext
              key={col.id}
              items={col.cards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn column={col} />
            </SortableContext>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <div
            className="rounded p-3 bg-deco-raised border border-deco-border"
            style={{
              borderLeft: "3px solid var(--color-deco-gold)",
              cursor: "grabbing",
              opacity: 0.95,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            <p className="text-deco-text font-semibold text-sm m-0">{activeCard.title}</p>
            <p className="text-deco-muted text-xs mt-1 mb-0">{activeCard.description}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

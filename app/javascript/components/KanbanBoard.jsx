import { useState, useEffect } from "react"
import {
  DndContext,
  closestCorners,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import KanbanColumn from "./KanbanColumn"
import CardEditModal from "./CardEditModal"
import csrfToken from "../lib/csrf"

const COLUMN_DEFINITIONS = [
  { id: "todo",       title: "Todo" },
  { id: "doing",      title: "Doing" },
  { id: "in-review",  title: "In Review" },
  { id: "in-qa",      title: "In QA" },
  { id: "in-preview", title: "In Preview" },
  { id: "done",       title: "Done" },
]

function buildColumns(cards) {
  return COLUMN_DEFINITIONS.map((col) => ({
    ...col,
    cards: cards.filter((c) => c.status === col.id),
  }))
}

function findColumnIndexByCardId(columns, cardId) {
  return columns.findIndex((col) => col.cards.some((c) => c.id === cardId))
}

export default function KanbanBoard({ projectId }) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const [columns, setColumns] = useState(buildColumns([]))
  const [activeCard, setActiveCard] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.style.overscrollBehavior = "none"
    document.body.style.overscrollBehavior = "none"
    return () => {
      document.documentElement.style.overscrollBehavior = ""
      document.body.style.overscrollBehavior = ""
    }
  }, [])

  useEffect(() => {
    if (!projectId) return
    fetch(`/projects/${projectId}/cards`)
      .then((res) => res.json())
      .then((cards) => {
        setColumns(buildColumns(cards))
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load cards:", err)
        setLoading(false)
      })
  }, [projectId])

  function handleDragStart(event) {
    const { active } = event
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
    const overId = over.id

    if (activeCardId === overId) return

    const sourceColIndex = findColumnIndexByCardId(columns, activeCardId)
    if (sourceColIndex === -1) return

    const sourceCol = columns[sourceColIndex]
    const activeIndex = sourceCol.cards.findIndex((c) => c.id === activeCardId)
    if (activeIndex === -1) return

    let nextColumns

    // Dropping onto a column id (string) — move to end of that column
    if (typeof overId === "string") {
      const destColIndex = columns.findIndex((col) => col.id === overId)
      if (destColIndex === -1) return
      if (sourceColIndex === destColIndex) return

      const destCol = columns[destColIndex]
      const movingCard = { ...sourceCol.cards[activeIndex], status: destCol.id }
      const nextSourceCards = sourceCol.cards.filter((c) => c.id !== activeCardId)
      const nextDestCards = [...destCol.cards, movingCard]

      nextColumns = columns.map((col, idx) => {
        if (idx === sourceColIndex) return { ...col, cards: nextSourceCards }
        if (idx === destColIndex) return { ...col, cards: nextDestCards }
        return col
      })
    } else {
      // Dropping onto a card id (number) — reorder within or move between columns
      const destColIndex = findColumnIndexByCardId(columns, overId)
      if (destColIndex === -1) return

      const destCol = columns[destColIndex]
      const overIndex = destCol.cards.findIndex((c) => c.id === overId)
      if (overIndex === -1) return

      if (sourceColIndex === destColIndex) {
        const nextCards = arrayMove(sourceCol.cards, activeIndex, overIndex)
        nextColumns = columns.map((col, idx) =>
          idx === sourceColIndex ? { ...col, cards: nextCards } : col,
        )
      } else {
        const movingCard = { ...sourceCol.cards[activeIndex], status: destCol.id }
        const nextSourceCards = sourceCol.cards.filter((c) => c.id !== activeCardId)
        const nextDestCards = [...destCol.cards]
        nextDestCards.splice(overIndex, 0, movingCard)

        nextColumns = columns.map((col, idx) => {
          if (idx === sourceColIndex) return { ...col, cards: nextSourceCards }
          if (idx === destColIndex) return { ...col, cards: nextDestCards }
          return col
        })
      }
    }

    // Update local state first (optimistic)
    setColumns(nextColumns)

    // Persist new status + position to DB
    const newCol = nextColumns[findColumnIndexByCardId(nextColumns, activeCardId)]
    const newPosition = newCol.cards.findIndex((c) => c.id === activeCardId)

    fetch(`/projects/${projectId}/cards/${activeCardId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ card: { status: newCol.id, position: newPosition } }),
    }).catch((err) => console.error("Failed to persist card move:", err))
  }

  function handleCardUpdated(updatedCard) {
    setColumns((prev) => {
      const allCards = prev
        .flatMap((col) => col.cards)
        .map((c) => (c.id === updatedCard.id ? updatedCard : c))
      return buildColumns(allCards)
    })
    setSelectedCard(null)
  }

  async function handleAddCard(columnId, title, description) {
    const col = columns.find((c) => c.id === columnId)
    const position = col ? col.cards.length : 0

    try {
      const res = await fetch(`/projects/${projectId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken(),
        },
        body: JSON.stringify({ card: { title, description, status: columnId, position } }),
      })
      if (!res.ok) throw new Error("Failed to create card")
      const newCard = await res.json()
      setColumns((prev) =>
        prev.map((c) =>
          c.id === columnId ? { ...c, cards: [...c.cards, newCard] } : c,
        ),
      )
    } catch (err) {
      console.error("Failed to add card:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deco-bg">
        <p
          className="text-deco-muted text-sm uppercase tracking-widest"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Loading board…
        </p>
      </div>
    )
  }

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col overflow-hidden bg-deco-bg p-4 md:p-6">
        <div className="flex flex-row gap-4 overflow-x-auto flex-1 min-h-0 pb-2">
          {columns.map((col) => (
            <SortableContext
              key={col.id}
              items={col.cards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn column={col} onAddCard={handleAddCard} onCardClick={setSelectedCard} />
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

    {selectedCard && (
      <CardEditModal
        card={selectedCard}
        projectId={projectId}
        onClose={() => setSelectedCard(null)}
        onCardUpdated={handleCardUpdated}
      />
    )}
    </>
  )
}

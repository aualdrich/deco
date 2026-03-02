import { useState, useEffect } from "react"
import { DndContext, closestCorners, DragOverlay } from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import KanbanColumn from "./KanbanColumn"
import BoardTopBar from "./BoardTopBar"

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

export default function KanbanBoard({ projectId, projectName }) {
  const [columns, setColumns] = useState(buildColumns([]))
  const [activeCard, setActiveCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get("status") === "archived" ? "archived" : "active"
  })

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    const url = statusFilter === "archived"
      ? `/projects/${projectId}/cards?status=archived`
      : `/projects/${projectId}/cards`
    fetch(url)
      .then((res) => res.json())
      .then((cards) => {
        setColumns(buildColumns(cards))
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load cards:", err)
        setLoading(false)
      })
  }, [projectId, statusFilter])

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
    const overCardId = over.id

    if (activeCardId === overCardId) return

    const sourceColIndex = findColumnIndexByCardId(columns, activeCardId)
    const destColIndex = findColumnIndexByCardId(columns, overCardId)

    if (sourceColIndex === -1 || destColIndex === -1) return

    const sourceCol = columns[sourceColIndex]
    const destCol = columns[destColIndex]

    const activeIndex = sourceCol.cards.findIndex((c) => c.id === activeCardId)
    const overIndex = destCol.cards.findIndex((c) => c.id === overCardId)

    if (activeIndex === -1 || overIndex === -1) return

    let nextColumns

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

  function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content ?? ""
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
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-deco-bg">
      <BoardTopBar
        projectName={projectName}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />
      <div className="p-4 md:p-6">
        <div className="flex flex-row gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <SortableContext
              key={col.id}
              items={col.cards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn column={col} onAddCard={handleAddCard} />
            </SortableContext>
          ))}
        </div>
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

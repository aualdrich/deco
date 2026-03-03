import { useState, useEffect, useRef } from "react"
import { DndContext, closestCorners, pointerWithin, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import KanbanColumn from "./KanbanColumn"
import BoardTopBar from "./BoardTopBar"
import CardModal from "./CardModal"
import PlanningChat from "./PlanningChat"

// NOTE: Column ids must match backend Card::STATUSES (snake_case).
// Render order: todo → planning → ready_to_implement → doing → in_review → done
const COLUMN_DEFINITIONS = [
  { id: "todo",                title: "Todo" },
  { id: "planning",            title: "Planning" },
  { id: "ready_to_implement",  title: "Ready to Implement" },
  { id: "doing",               title: "Doing" },
  { id: "in_review",           title: "In Review" },
  { id: "done",                title: "Done" },
]

// Prefer cards over columns when both are under the pointer
function customCollision(args) {
  const hits = pointerWithin(args)
  if (hits.length > 0) {
    const cardHit = hits.find(({ id }) => !COLUMN_DEFINITIONS.some((c) => c.id === id))
    return cardHit ? [cardHit] : [hits[0]]
  }
  return closestCorners(args)
}

function buildColumns(cards) {
  return COLUMN_DEFINITIONS.map((col) => ({
    ...col,
    cards: cards.filter((c) => c.status === col.id),
  }))
}

function findColumnIndexByCardId(columns, cardId) {
  return columns.findIndex((col) => col.cards.some((c) => c.id === cardId))
}

function findCardById(columns, cardId) {
  for (const col of columns) {
    const found = col.cards.find((c) => c.id === cardId)
    if (found) return found
  }
  return null
}

export default function KanbanBoard({ projectId, projectName }) {
  const dragActivated = useRef(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )
  const [columns, setColumns] = useState(buildColumns([]))
  const [activeCard, setActiveCard] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [planningChatCard, setPlanningChatCard] = useState(null)
  const [creatingInColumn, setCreatingInColumn] = useState(null)
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
    dragActivated.current = true
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
    setTimeout(() => { dragActivated.current = false }, 100)

    const { active, over } = event
    if (!over) return

    const activeCardId = active.id
    const overId = over.id

    if (activeCardId === overId) return

    const sourceColIndex = findColumnIndexByCardId(columns, activeCardId)
    if (sourceColIndex === -1) return

    // over.id may be a column ID (dropping on empty space / empty column)
    // or a card ID (dropping directly on another card)
    const isOverColumn = COLUMN_DEFINITIONS.some((col) => col.id === overId)
    const destColIndex = isOverColumn
      ? columns.findIndex((col) => col.id === overId)
      : findColumnIndexByCardId(columns, overId)

    if (destColIndex === -1) return

    const sourceCol = columns[sourceColIndex]
    const destCol = columns[destColIndex]
    const activeIndex = sourceCol.cards.findIndex((c) => c.id === activeCardId)
    if (activeIndex === -1) return

    let nextColumns

    if (sourceColIndex === destColIndex) {
      // Same-column reorder — only meaningful when dropping on a sibling card
      const overIndex = sourceCol.cards.findIndex((c) => c.id === overId)
      if (overIndex === -1) return

      const newCards = arrayMove(sourceCol.cards, activeIndex, overIndex)
      nextColumns = columns.map((col, idx) => idx === sourceColIndex ? { ...col, cards: newCards } : col)

      // Update positions on server (best-effort)
      const moved = newCards[overIndex]
      persistCardMove(moved, sourceCol.id, overIndex)
    } else {
      // Cross-column move
      const movingCard = { ...sourceCol.cards[activeIndex], status: destCol.id }

      const sourceCards = [...sourceCol.cards]
      sourceCards.splice(activeIndex, 1)

      const destCards = [...destCol.cards]
      // If dropping on a card, insert above it; if dropping on column, append
      const overIndex = isOverColumn ? destCards.length : destCards.findIndex((c) => c.id === overId)
      const insertIndex = overIndex === -1 ? destCards.length : overIndex
      destCards.splice(insertIndex, 0, movingCard)

      nextColumns = columns.map((col, idx) => {
        if (idx === sourceColIndex) return { ...col, cards: sourceCards }
        if (idx === destColIndex) return { ...col, cards: destCards }
        return col
      })

      persistCardMove(movingCard, destCol.id, insertIndex)

      // Trigger rules for Planning chat
      if (sourceCol.id === "planning" && destCol.id !== "planning") {
        if (planningChatCard?.id === movingCard.id) setPlanningChatCard(null)
      }

      if (sourceCol.id !== "planning" && destCol.id === "planning") {
        setPlanningChatCard(movingCard)
        setSelectedCard(null)
      }
    }

    setColumns(nextColumns)
  }

  async function persistCardMove(card, newStatus, newPosition) {
    try {
      await fetch(`/projects/${projectId}/cards/${card.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
        },
        body: JSON.stringify({ card: { status: newStatus, position: newPosition } }),
      })
    } catch (err) {
      console.error("Failed to persist card move:", err)
    }
  }

  function openAddCard(columnId) {
    if (dragActivated.current) return
    setCreatingInColumn(columnId)
  }

  async function createCard(title, description) {
    const position = columns.find((c) => c.id === creatingInColumn)?.cards.length ?? 0
    const res = await fetch(`/projects/${projectId}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
      },
      body: JSON.stringify({ card: { title, description, status: creatingInColumn, position } }),
    })

    if (!res.ok) throw new Error("Create failed")

    const newCard = await res.json()
    setColumns((prev) => prev.map((col) => {
      if (col.id !== creatingInColumn) return col
      return { ...col, cards: [...col.cards, newCard] }
    }))
  }

  function handleCardClick(card) {
    if (dragActivated.current) return
    setSelectedCard(card)
  }

  function handleCardUpdated(updatedCard) {
    const prevCard = findCardById(columns, updatedCard.id)
    const prevStatus = prevCard?.status

    setColumns((prev) => {
      const sourceColIndex = findColumnIndexByCardId(prev, updatedCard.id)
      const destColIndex = prev.findIndex((col) => col.id === updatedCard.status)

      // If we can't find a destination column (unexpected status), fall back to in-place replace.
      if (destColIndex === -1) {
        return prev.map((col) => ({
          ...col,
          cards: col.cards.map((c) => c.id === updatedCard.id ? updatedCard : c),
        }))
      }

      // Same column: replace in place
      if (sourceColIndex !== -1 && sourceColIndex === destColIndex) {
        return prev.map((col, idx) => idx === sourceColIndex
          ? { ...col, cards: col.cards.map((c) => c.id === updatedCard.id ? updatedCard : c) }
          : col
        )
      }

      // Cross-column: remove from any column, append to destination
      return prev.map((col, idx) => {
        const without = col.cards.filter((c) => c.id !== updatedCard.id)
        if (idx !== destColIndex) return { ...col, cards: without }
        return { ...col, cards: [...without, updatedCard] }
      })
    })

    // Trigger rules for Planning chat (manual status edits, etc.)
    if (prevStatus === "planning" && updatedCard.status !== "planning") {
      if (planningChatCard?.id === updatedCard.id) setPlanningChatCard(null)
    }

    if (prevStatus !== "planning" && updatedCard.status === "planning") {
      setPlanningChatCard(updatedCard)
      setSelectedCard(null)
    }
  }

  function handleArchive(cardId) {
    setColumns((prev) => prev.map((col) => ({
      ...col,
      cards: col.cards.filter((c) => c.id !== cardId),
    })))
  }

  function handleRestore(cardId) {
    // Restored cards are forced to status "todo" on backend.
    // Easiest UX: reload for now.
    setStatusFilter("active")
  }

  const archivedView = statusFilter === "archived"

  return (
    <div className="min-h-screen bg-deco-bg text-deco-text">
      <BoardTopBar projectName={projectName} statusFilter={statusFilter} onFilterChange={setStatusFilter} />

      <div className="px-4 py-4">
        {loading ? (
          <div className="rounded p-4 text-sm bg-deco-surface border border-deco-border text-deco-text">Loading…</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={customCollision}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-2">
              {columns.map((col) => (
                <SortableContext
                  key={col.id}
                  id={col.id}
                  items={col.cards.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <KanbanColumn
                    column={col}
                    onOpenAddCard={openAddCard}
                    onCardClick={handleCardClick}
                  />
                </SortableContext>
              ))}
            </div>

            <DragOverlay>
              {activeCard ? (
                <div className="rounded p-3 bg-deco-raised border border-deco-border" style={{ borderLeft: "3px solid var(--color-deco-gold)" }}>
                  <p className="font-semibold text-sm text-deco-text">{activeCard.title}</p>
                  <p className="text-xs mt-1 text-deco-muted">{activeCard.description}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {creatingInColumn ? (
        <CardModal
          projectId={projectId}
          readOnly={false}
          onClose={() => setCreatingInColumn(null)}
          onCreate={createCard}
        />
      ) : null}

      {selectedCard ? (
        <CardModal
          card={selectedCard}
          projectId={projectId}
          readOnly={archivedView}
          onClose={() => setSelectedCard(null)}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onUpdate={handleCardUpdated}
          onOpenPlanningChat={(card) => setPlanningChatCard(card)}
        />
      ) : null}

      {planningChatCard ? (
        <PlanningChat
          card={planningChatCard}
          onClose={() => setPlanningChatCard(null)}
          onAccept={async (planText) => {
            try {
              const res = await fetch(`/projects/${projectId}/cards/${planningChatCard.id}/accept_plan`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
                },
                body: JSON.stringify({ description: planText }),
              })

              if (!res.ok) throw new Error("Accept plan failed")

              const updatedCard = await res.json()
              handleCardUpdated(updatedCard)

              // Close chat UI; also close the card modal so the user sees the move.
              setPlanningChatCard(null)
              setSelectedCard(null)
            } catch (err) {
              console.error(err)
            }
          }}
        />
      ) : null}
    </div>
  )
}

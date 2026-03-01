import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, within, act } from "@testing-library/react"

// Capture the handlers passed to DndContext so we can invoke them directly.
let lastOnDragStart
let lastOnDragEnd

vi.mock("@dnd-kit/core", async () => {
  const React = (await import("react")).default

  return {
    // DndContext is a simple wrapper that stores handlers for tests.
    DndContext: ({ children, onDragStart, onDragEnd }) => {
      lastOnDragStart = onDragStart
      lastOnDragEnd = onDragEnd
      return React.createElement(React.Fragment, null, children)
    },
    DragOverlay: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    closestCorners: vi.fn(),
  }
})

vi.mock("@dnd-kit/sortable", async () => {
  const React = (await import("react")).default

  return {
    SortableContext: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    arrayMove: (array, from, to) => {
      const copy = array.slice()
      const [item] = copy.splice(from, 1)
      copy.splice(to, 0, item)
      return copy
    },
    verticalListSortingStrategy: vi.fn(),
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      transition: null,
      isDragging: false,
    }),
  }
})

vi.mock("@dnd-kit/utilities", () => {
  return {
    CSS: {
      Transform: {
        toString: () => "",
      },
    },
  }
})

import KanbanBoard from "../KanbanBoard"

function columnContainerByHeader(headerText) {
  const header = screen.getByText(headerText)
  const container = header.closest("div")
  if (!container) throw new Error(`Could not find container for ${headerText}`)
  return container
}

describe("KanbanBoard", () => {
  beforeEach(() => {
    lastOnDragStart = undefined
    lastOnDragEnd = undefined
  })

  it("renders all six column headers", () => {
    render(<KanbanBoard />)

    expect(screen.getByText("Todo")).toBeInTheDocument()
    expect(screen.getByText("Doing")).toBeInTheDocument()
    expect(screen.getByText("In Review")).toBeInTheDocument()
    expect(screen.getByText("In QA")).toBeInTheDocument()
    expect(screen.getByText("In Preview")).toBeInTheDocument()
    expect(screen.getByText("Done")).toBeInTheDocument()
  })

  it("moves a card between columns on drag end", async () => {
    render(<KanbanBoard />)

    // Sanity check: card-1 starts in Todo.
    const todoCol = columnContainerByHeader("Todo")
    expect(within(todoCol).getByText("Design system tokens")).toBeInTheDocument()

    const doingCol = columnContainerByHeader("Doing")
    expect(within(doingCol).queryByText("Design system tokens")).toBeNull()

    // Invoke DndContext's onDragEnd with a mock event that indicates
    // card-1 was dragged over card-3 (which lives in the Doing column).
    expect(typeof lastOnDragEnd).toBe("function")

    await act(async () => {
      lastOnDragEnd({
        active: { id: "card-1" },
        over: { id: "card-3" },
      })
    })

    // After moving, card title should now be in Doing and removed from Todo.
    expect(within(columnContainerByHeader("Doing")).getByText("Design system tokens")).toBeInTheDocument()
    expect(within(columnContainerByHeader("Todo")).queryByText("Design system tokens")).toBeNull()
  })
})

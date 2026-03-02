import React from "react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import KanbanBoard from "../KanbanBoard"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockFetchJson(data, { ok = true } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok,
      json: async () => data,
    }))
  )
}

const COLUMN_TITLES = ["Todo", "Doing", "In Review", "In QA", "In Preview", "Done"]

describe("KanbanBoard", () => {
  it("renders all 6 column headers when the board is empty", async () => {
    mockFetchJson([])

    render(<KanbanBoard projectId="1" />)

    for (const title of COLUMN_TITLES) {
      expect(await screen.findByText(title)).toBeInTheDocument()
    }
  })

  it("shows fetched cards in the correct columns", async () => {
    mockFetchJson([
      { id: 1, title: "First task",  description: "desc",  status: "todo",  position: 0 },
      { id: 2, title: "Active work", description: "",      status: "doing", position: 0 },
    ])

    render(<KanbanBoard projectId="1" />)

    expect(await screen.findByText("First task")).toBeInTheDocument()
    expect(screen.getByText("Active work")).toBeInTheDocument()
  })

  it("shows an Add card affordance in each column", async () => {
    mockFetchJson([])

    render(<KanbanBoard projectId="1" />)

    // Wait for board to load (loading state disappears)
    await screen.findByText("Todo")

    const addButtons = screen.getAllByText("+ Add card")
    expect(addButtons).toHaveLength(COLUMN_TITLES.length)
  })

  it("opens the CardModal when + Add card is clicked", async () => {
    mockFetchJson([])

    render(<KanbanBoard projectId="1" />)

    await screen.findByText("Todo")

    const [firstAddButton] = screen.getAllByText("+ Add card")
    fireEvent.click(firstAddButton)

    expect(screen.getByText("New Card")).toBeInTheDocument()
    // Modal footer button has exact text "Add card" (not "+ Add card")
    expect(screen.getByRole("button", { name: /^add card$/i })).toBeInTheDocument()
  })

  it("submitting the modal POSTs to the API and adds the card to the column", async () => {
    const newCard = { id: 99, title: "Brand new card", description: "", status: "todo", position: 0 }

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })       // initial GET
      .mockResolvedValueOnce({ ok: true, json: async () => newCard })  // POST

    vi.stubGlobal("fetch", fetchMock)

    render(<KanbanBoard projectId="1" />)

    await screen.findByText("Todo")

    const [firstAddButton] = screen.getAllByText("+ Add card")
    fireEvent.click(firstAddButton)

    const titleInput = screen.getAllByRole("textbox")[0]
    fireEvent.change(titleInput, { target: { value: "Brand new card" } })

    fireEvent.click(screen.getByRole("button", { name: /^add card$/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/projects/1/cards",
        expect.objectContaining({ method: "POST" })
      )
    })

    expect(await screen.findByText("Brand new card")).toBeInTheDocument()
  })

  it("pressing Escape closes the add card modal", async () => {
    mockFetchJson([])

    render(<KanbanBoard projectId="1" />)

    await screen.findByText("Todo")

    const [firstAddButton] = screen.getAllByText("+ Add card")
    fireEvent.click(firstAddButton)

    expect(screen.getByText("New Card")).toBeInTheDocument()

    fireEvent.keyDown(window, { key: "Escape" })

    expect(screen.queryByText("New Card")).not.toBeInTheDocument()
  })
})

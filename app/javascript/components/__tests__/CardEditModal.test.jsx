import React from "react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import CardEditModal from "../CardEditModal"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const baseCard = {
  id: 1,
  title: "Write the spec",
  description: "Make it pass",
  status: "todo",
  steps: [
    { id: 10, title: "Research", completed: false, position: 0 },
    { id: 11, title: "Draft",    completed: true,  position: 1 },
  ],
}

function mockFetchJson(data, { ok = true } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, json: async () => data }))
  )
}

describe("CardEditModal", () => {
  it("renders with card values pre-filled", () => {
    mockFetchJson({})
    const onClose = vi.fn()

    render(
      <CardEditModal
        card={baseCard}
        projectId="1"
        onClose={onClose}
        onCardUpdated={vi.fn()}
      />
    )

    expect(screen.getByDisplayValue("Write the spec")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Make it pass")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Todo")).toBeInTheDocument()
    expect(screen.getByText("Research")).toBeInTheDocument()
    expect(screen.getByText("Draft")).toBeInTheDocument()
  })

  it("calls PATCH with updated values when Save is clicked", async () => {
    const updatedCard = { ...baseCard, title: "Updated title", steps: baseCard.steps }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => updatedCard })
    vi.stubGlobal("fetch", fetchMock)

    const onCardUpdated = vi.fn()

    render(
      <CardEditModal
        card={baseCard}
        projectId="1"
        onClose={vi.fn()}
        onCardUpdated={onCardUpdated}
      />
    )

    const titleInput = screen.getByDisplayValue("Write the spec")
    fireEvent.change(titleInput, { target: { value: "Updated title" } })

    fireEvent.click(screen.getByRole("button", { name: /save/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/projects/1/cards/1",
        expect.objectContaining({ method: "PATCH" })
      )
      expect(onCardUpdated).toHaveBeenCalled()
    })
  })

  it("pressing Enter in the Add step field calls POST", async () => {
    const newStep = { id: 99, title: "New step", completed: false, position: 2 }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => newStep })
    vi.stubGlobal("fetch", fetchMock)

    render(
      <CardEditModal
        card={baseCard}
        projectId="1"
        onClose={vi.fn()}
        onCardUpdated={vi.fn()}
      />
    )

    const addInput = screen.getByPlaceholderText("Add a step…")
    fireEvent.change(addInput, { target: { value: "New step" } })
    fireEvent.submit(addInput.closest("form"))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/projects/1/cards/1/steps",
        expect.objectContaining({ method: "POST" })
      )
    })

    expect(await screen.findByText("New step")).toBeInTheDocument()
  })

  it("clicking a step checkbox calls PATCH with completed:true", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...baseCard.steps[0], completed: true }),
    })
    vi.stubGlobal("fetch", fetchMock)

    render(
      <CardEditModal
        card={baseCard}
        projectId="1"
        onClose={vi.fn()}
        onCardUpdated={vi.fn()}
      />
    )

    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[0]) // "Research" is unchecked

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/projects/1/cards/1/steps/10",
        expect.objectContaining({ method: "PATCH" })
      )
    })
  })

  it("clicking × on a step calls DELETE and removes it from the list", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal("fetch", fetchMock)

    render(
      <CardEditModal
        card={baseCard}
        projectId="1"
        onClose={vi.fn()}
        onCardUpdated={vi.fn()}
      />
    )

    const deleteButtons = screen.getAllByRole("button", { name: /delete step/i })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/projects/1/cards/1/steps/10",
        expect.objectContaining({ method: "DELETE" })
      )
    })

    expect(screen.queryByText("Research")).not.toBeInTheDocument()
  })

  it("pressing Escape calls onClose", () => {
    mockFetchJson({})
    const onClose = vi.fn()

    render(
      <CardEditModal
        card={baseCard}
        projectId="1"
        onClose={onClose}
        onCardUpdated={vi.fn()}
      />
    )

    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })
})

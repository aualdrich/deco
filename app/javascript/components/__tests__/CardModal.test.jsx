import React from "react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import CardModal from "../CardModal"

afterEach(() => {
  vi.restoreAllMocks()
})

const activeCard = { id: 42, title: "Fix the switchboard", description: "A very important task" }
const archivedCard = { id: 7, title: "Old task", description: "Done long ago" }

function mockFetch({ ok = true } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok,
      json: async () => ({}),
    }))
  )
}

describe("CardModal — active card", () => {
  it("renders the card title", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.getByText("Fix the switchboard")).toBeInTheDocument()
  })

  it("renders the card description", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.getByText("A very important task")).toBeInTheDocument()
  })

  it("shows the Archive button", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.getByRole("button", { name: /archive/i })).toBeInTheDocument()
  })

  it("does not show the Restore button for active cards", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.queryByRole("button", { name: /restore/i })).not.toBeInTheDocument()
  })

  it("shows confirmation prompt after first Archive click", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /^archive$/i }))
    expect(screen.getByText(/archive this card/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /yes, archive/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
  })

  it("calls onArchive and onClose after confirming archive", async () => {
    mockFetch()
    const onArchive = vi.fn()
    const onClose = vi.fn()
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={onClose} onArchive={onArchive} onRestore={() => {}} />)

    fireEvent.click(screen.getByRole("button", { name: /^archive$/i }))
    fireEvent.click(screen.getByRole("button", { name: /yes, archive/i }))

    await waitFor(() => {
      expect(onArchive).toHaveBeenCalledWith(42)
      expect(onClose).toHaveBeenCalled()
    })
  })

  it("calls onClose when the footer Close button is clicked", () => {
    const onClose = vi.fn()
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={onClose} onArchive={() => {}} onRestore={() => {}} />)
    // Two close controls exist: × (aria-label) and footer "Close" button — target the footer one by text
    const closeButtons = screen.getAllByRole("button", { name: /close/i })
    fireEvent.click(closeButtons[closeButtons.length - 1])
    expect(onClose).toHaveBeenCalled()
  })

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn()
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={onClose} onArchive={() => {}} onRestore={() => {}} />)
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })
})

describe("CardModal — archived card (readOnly)", () => {
  it("shows the read-only badge", () => {
    render(<CardModal card={archivedCard} projectId="1" readOnly={true} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.getByText(/archived.*read only/i)).toBeInTheDocument()
  })

  it("shows the Restore card button", () => {
    render(<CardModal card={archivedCard} projectId="1" readOnly={true} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.getByRole("button", { name: /restore card/i })).toBeInTheDocument()
  })

  it("does not show the Archive button for archived cards", () => {
    render(<CardModal card={archivedCard} projectId="1" readOnly={true} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.queryByRole("button", { name: /^archive$/i })).not.toBeInTheDocument()
  })

  it("calls onRestore and onClose after clicking Restore", async () => {
    mockFetch()
    const onRestore = vi.fn()
    const onClose = vi.fn()
    render(<CardModal card={archivedCard} projectId="1" readOnly={true} onClose={onClose} onArchive={() => {}} onRestore={onRestore} />)

    fireEvent.click(screen.getByRole("button", { name: /restore card/i }))

    await waitFor(() => {
      expect(onRestore).toHaveBeenCalledWith(7)
      expect(onClose).toHaveBeenCalled()
    })
  })
})

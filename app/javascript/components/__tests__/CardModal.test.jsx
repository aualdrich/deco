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

describe("CardModal — create mode (card=null)", () => {
  it("renders with empty title and description fields", () => {
    render(<CardModal card={null} projectId="1" readOnly={false} onClose={() => {}} onCreate={() => {}} />)
    const emptyFields = screen.getAllByDisplayValue("")
    expect(emptyFields).toHaveLength(2) // title input + description textarea
  })

  it("shows 'New Card' header", () => {
    render(<CardModal card={null} projectId="1" readOnly={false} onClose={() => {}} onCreate={() => {}} />)
    expect(screen.getByText("New Card")).toBeInTheDocument()
  })

  it("shows 'Add card' button", () => {
    render(<CardModal card={null} projectId="1" readOnly={false} onClose={() => {}} onCreate={() => {}} />)
    expect(screen.getByRole("button", { name: /add card/i })).toBeInTheDocument()
  })

  it("Add card button is disabled when title is empty", () => {
    render(<CardModal card={null} projectId="1" readOnly={false} onClose={() => {}} onCreate={() => {}} />)
    expect(screen.getByRole("button", { name: /add card/i })).toBeDisabled()
  })

  it("Add card button enables when title is filled", () => {
    render(<CardModal card={null} projectId="1" readOnly={false} onClose={() => {}} onCreate={() => {}} />)
    const inputs = screen.getAllByRole("textbox")
    fireEvent.change(inputs[0], { target: { value: "My new card" } })
    expect(screen.getByRole("button", { name: /add card/i })).not.toBeDisabled()
  })

  it("calls onCreate and onClose when Add card is submitted", async () => {
    const onCreate = vi.fn(async () => {})
    const onClose = vi.fn()
    render(<CardModal card={null} projectId="1" readOnly={false} onClose={onClose} onCreate={onCreate} />)
    const inputs = screen.getAllByRole("textbox")
    fireEvent.change(inputs[0], { target: { value: "New card title" } })
    fireEvent.click(screen.getByRole("button", { name: /add card/i }))
    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith("New card title", "")
      expect(onClose).toHaveBeenCalled()
    })
  })

  it("does not show Archive button in create mode", () => {
    render(<CardModal card={null} projectId="1" readOnly={false} onClose={() => {}} onCreate={() => {}} />)
    expect(screen.queryByRole("button", { name: /archive/i })).not.toBeInTheDocument()
  })
})

describe("CardModal — active card", () => {
  it("renders the card title in a text input", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.getByDisplayValue("Fix the switchboard")).toBeInTheDocument()
  })

  it("renders the description in a textarea", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    const textarea = screen.getByPlaceholderText(/add a description/i)
    expect(textarea.tagName).toBe("TEXTAREA")
    expect(textarea.value).toBe("A very important task")
  })

  it("title and description fields are editable", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    const titleInput = screen.getByDisplayValue("Fix the switchboard")
    fireEvent.change(titleInput, { target: { value: "Updated title" } })
    expect(screen.getByDisplayValue("Updated title")).toBeInTheDocument()
  })

  it("shows the Archive button in initial state", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.getByRole("button", { name: /^archive$/i })).toBeInTheDocument()
  })

  it("does not show Cancel or Yes, archive in initial state", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /yes, archive/i })).not.toBeInTheDocument()
  })

  it("shows confirmation prompt after clicking Archive", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /^archive$/i }))
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /yes, archive/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
  })

  it("hides confirmation if Cancel is clicked", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /^archive$/i }))
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^archive$/i })).toBeInTheDocument()
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

  it("shows the Save button", () => {
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument()
  })

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn()
    render(<CardModal card={activeCard} projectId="1" readOnly={false} onClose={onClose} onArchive={() => {}} onRestore={() => {}} />)
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })
})

describe("CardModal — archived card (readOnly)", () => {
  it("renders title as a disabled input", () => {
    render(<CardModal card={archivedCard} projectId="1" readOnly={true} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    const titleInput = screen.getByDisplayValue("Old task")
    expect(titleInput).toBeDisabled()
  })

  it("renders description as a disabled textarea", () => {
    render(<CardModal card={archivedCard} projectId="1" readOnly={true} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    const textarea = screen.getByPlaceholderText(/add a description/i)
    expect(textarea).toBeDisabled()
    expect(textarea.value).toBe("Done long ago")
  })

  it("shows the archived read-only badge", () => {
    render(<CardModal card={archivedCard} projectId="1" readOnly={true} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.getByText(/archived.*read only/i)).toBeInTheDocument()
  })

  it("shows the Restore card button", () => {
    render(<CardModal card={archivedCard} projectId="1" readOnly={true} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.getByRole("button", { name: /restore card/i })).toBeInTheDocument()
  })

  it("does not show Archive or Save for archived cards", () => {
    render(<CardModal card={archivedCard} projectId="1" readOnly={true} onClose={() => {}} onArchive={() => {}} onRestore={() => {}} />)
    expect(screen.queryByRole("button", { name: /^archive$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()
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

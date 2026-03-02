import React from "react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import BoardTopBar from "../BoardTopBar"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("BoardTopBar", () => {
  it("renders the project name", () => {
    render(<BoardTopBar projectName="My Project" statusFilter="active" onFilterChange={() => {}} />)
    expect(screen.getByText("My Project")).toBeInTheDocument()
  })

  it("falls back to 'Board' when no projectName is provided", () => {
    render(<BoardTopBar statusFilter="active" onFilterChange={() => {}} />)
    expect(screen.getByText("Board")).toBeInTheDocument()
  })

  it("shows the active filter label on the trigger button", () => {
    render(<BoardTopBar projectName="Proj" statusFilter="active" onFilterChange={() => {}} />)
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("shows 'Archived' on the trigger button when statusFilter is archived", () => {
    render(<BoardTopBar projectName="Proj" statusFilter="archived" onFilterChange={() => {}} />)
    expect(screen.getByText("Archived")).toBeInTheDocument()
  })

  it("dropdown is closed by default", () => {
    render(<BoardTopBar projectName="Proj" statusFilter="active" onFilterChange={() => {}} />)
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("opens the dropdown when the trigger button is clicked", () => {
    render(<BoardTopBar projectName="Proj" statusFilter="active" onFilterChange={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /active|filter/i }))
    expect(screen.getByRole("listbox")).toBeInTheDocument()
  })

  it("shows both filter options in the dropdown", () => {
    render(<BoardTopBar projectName="Proj" statusFilter="active" onFilterChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByRole("option", { name: /active/i })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /archived/i })).toBeInTheDocument()
  })

  it("marks the current filter as selected (aria-selected)", () => {
    render(<BoardTopBar projectName="Proj" statusFilter="active" onFilterChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByRole("option", { name: /active/i })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("option", { name: /archived/i })).toHaveAttribute("aria-selected", "false")
  })

  it("calls onFilterChange with 'archived' when selecting Archived", () => {
    const onFilterChange = vi.fn()
    render(<BoardTopBar projectName="Proj" statusFilter="active" onFilterChange={onFilterChange} />)
    fireEvent.click(screen.getByRole("button"))
    fireEvent.click(screen.getByRole("option", { name: /archived/i }))
    expect(onFilterChange).toHaveBeenCalledWith("archived")
  })

  it("calls onFilterChange with 'active' when selecting Active from archived state", () => {
    const onFilterChange = vi.fn()
    render(<BoardTopBar projectName="Proj" statusFilter="archived" onFilterChange={onFilterChange} />)
    fireEvent.click(screen.getByRole("button"))
    fireEvent.click(screen.getByRole("option", { name: /active/i }))
    expect(onFilterChange).toHaveBeenCalledWith("active")
  })

  it("closes the dropdown after selecting an option", () => {
    render(<BoardTopBar projectName="Proj" statusFilter="active" onFilterChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    fireEvent.click(screen.getByRole("option", { name: /archived/i }))
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })
})

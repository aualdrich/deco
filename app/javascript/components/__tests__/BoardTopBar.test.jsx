import React from "react"
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import BoardTopBar from "../BoardTopBar"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("BoardTopBar", () => {
  it("renders the project name on the left", () => {
    render(<BoardTopBar projectName="My Project" statusFilter="active" onFilterChange={() => {}} />)
    expect(screen.getByText("My Project")).toBeInTheDocument()
  })

  it("shows 'Active' label when statusFilter is active", () => {
    render(<BoardTopBar projectName="Proj" statusFilter="active" onFilterChange={() => {}} />)
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("shows 'Archived' label when statusFilter is archived", () => {
    render(<BoardTopBar projectName="Proj" statusFilter="archived" onFilterChange={() => {}} />)
    expect(screen.getByText("Archived")).toBeInTheDocument()
  })

  it("calls onFilterChange with 'archived' when clicking in active state", () => {
    const onFilterChange = vi.fn()
    render(<BoardTopBar projectName="Proj" statusFilter="active" onFilterChange={onFilterChange} />)
    fireEvent.click(screen.getByRole("button", { pressed: false }))
    expect(onFilterChange).toHaveBeenCalledWith("archived")
  })

  it("calls onFilterChange with 'active' when clicking in archived state", () => {
    const onFilterChange = vi.fn()
    render(<BoardTopBar projectName="Proj" statusFilter="archived" onFilterChange={onFilterChange} />)
    fireEvent.click(screen.getByRole("button", { pressed: true }))
    expect(onFilterChange).toHaveBeenCalledWith("active")
  })

  it("falls back to 'Board' when no projectName is provided", () => {
    render(<BoardTopBar statusFilter="active" onFilterChange={() => {}} />)
    expect(screen.getByText("Board")).toBeInTheDocument()
  })
})

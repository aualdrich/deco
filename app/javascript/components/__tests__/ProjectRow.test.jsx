import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import ProjectRow from "../ProjectRow"

describe("ProjectRow", () => {
  const project = {
    id: 42,
    name: "Alpha",
    directory: "/alpha",
    agent_name: "deco",
  }

  it("renders name, directory, and agent_name", () => {
    render(<ProjectRow project={project} onEdit={() => {}} onDelete={() => {}} />)

    expect(screen.getByText("Alpha")).toBeInTheDocument()
    expect(screen.getByText("/alpha")).toBeInTheDocument()
    expect(screen.getByText("deco")).toBeInTheDocument()
  })

  it("Edit button calls onEdit with project", () => {
    const onEdit = vi.fn()

    render(<ProjectRow project={project} onEdit={onEdit} onDelete={() => {}} />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(project)
  })

  it("Delete button shows confirm UI", () => {
    render(<ProjectRow project={project} onEdit={() => {}} onDelete={() => {}} />)

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect(screen.getByText("Are you sure?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })

  it("Confirm calls onDelete with project id", () => {
    const onDelete = vi.fn()

    render(<ProjectRow project={project} onEdit={() => {}} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(42)

    // confirm UI is dismissed
    expect(screen.queryByText("Are you sure?")).toBeNull()
  })

  it("Cancel dismisses confirm UI without calling onDelete", () => {
    const onDelete = vi.fn()

    render(<ProjectRow project={project} onEdit={() => {}} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByText("Are you sure?")).toBeNull()
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()
  })
})

import React from "react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"

import ProjectsList from "../ProjectsList"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockFetchJson(data, { ok = true, status = 200 } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok,
      status,
      json: async () => data,
    }))
  )
}

describe("ProjectsList", () => {
  it("renders project rows from the API", async () => {
    mockFetchJson([
      { id: 1, name: "Alpha", directory: "/alpha", agent_name: "deco" },
      { id: 2, name: "Beta", directory: "/beta", agent_name: "worker" },
    ])

    render(<ProjectsList />)

    expect(await screen.findByText("Alpha")).toBeInTheDocument()
    expect(screen.getByText("Beta")).toBeInTheDocument()

    // Labels appear once per row.
    expect(screen.getAllByText("Directory:")).toHaveLength(2)
    expect(screen.getAllByText("Agent:")).toHaveLength(2)
  })

  it("shows empty state when API returns []", async () => {
    mockFetchJson([])

    render(<ProjectsList />)

    expect(await screen.findByText("No projects yet.")).toBeInTheDocument()
    expect(screen.getByText("Create your first one.")).toBeInTheDocument()
  })

  it("renders a New Project button", async () => {
    mockFetchJson([])

    render(<ProjectsList />)

    // Button in the header is always present.
    expect(await screen.findByRole("button", { name: "New Project" })).toBeInTheDocument()
  })
})

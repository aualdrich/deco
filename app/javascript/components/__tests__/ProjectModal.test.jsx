import React from "react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import ProjectModal from "../ProjectModal"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function setFetchOkJson(payload) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => payload,
    }))
  )
}

describe("ProjectModal", () => {
  it("renders with empty fields in create mode", () => {
    render(<ProjectModal project={null} onClose={() => {}} onSave={() => {}} />)

    expect(screen.getByText("New Project")).toBeInTheDocument()

    const inputs = screen.getAllByRole("textbox")
    // Order: name, directory, agent_name
    expect(inputs[0]).toHaveValue("")
    expect(inputs[1]).toHaveValue("")
    expect(inputs[2]).toHaveValue("")
  })

  it("renders with pre-filled fields in edit mode", () => {
    render(
      <ProjectModal
        project={{ id: 123, name: "Alpha", directory: "/alpha", agent_name: "deco" }}
        onClose={() => {}}
        onSave={() => {}}
      />
    )

    expect(screen.getByText("Edit Project")).toBeInTheDocument()

    const inputs = screen.getAllByRole("textbox")
    expect(inputs[0]).toHaveValue("Alpha")
    expect(inputs[1]).toHaveValue("/alpha")
    expect(inputs[2]).toHaveValue("deco")
  })

  it("calls fetch with POST on create submit", async () => {
    const onSave = vi.fn()
    setFetchOkJson({ id: 1, name: "Alpha", directory: "", agent_name: "" })

    render(<ProjectModal project={null} onClose={() => {}} onSave={onSave} />)

    const [nameInput] = screen.getAllByRole("textbox")
    fireEvent.change(nameInput, { target: { value: "Alpha" } })

    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      "/projects",
      expect.objectContaining({ method: "POST" })
    )

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: "Alpha" }))
    })
  })

  it("calls fetch with PATCH on edit submit", async () => {
    const onSave = vi.fn()
    setFetchOkJson({ id: 123, name: "Alpha2", directory: "/alpha", agent_name: "deco" })

    render(
      <ProjectModal
        project={{ id: 123, name: "Alpha", directory: "/alpha", agent_name: "deco" }}
        onClose={() => {}}
        onSave={onSave}
      />
    )

    const [nameInput] = screen.getAllByRole("textbox")
    fireEvent.change(nameInput, { target: { value: "Alpha2" } })

    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      "/projects/123",
      expect.objectContaining({ method: "PATCH" })
    )

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 123, name: "Alpha2" }))
    })
  })
})

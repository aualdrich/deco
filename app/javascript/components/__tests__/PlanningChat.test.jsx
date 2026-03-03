import React from "react"
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import PlanningChat from "../PlanningChat"

// ReadableStream is available in modern Node, but we import a fallback for safety.
import { ReadableStream } from "node:stream/web"

afterEach(() => {
  vi.restoreAllMocks()
})

beforeEach(() => {
  // jsdom doesn't implement this, but the component calls it.
  Element.prototype.scrollIntoView = vi.fn()
})

function makeSseStream(payloadStrings) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const s of payloadStrings) controller.enqueue(encoder.encode(s))
      controller.close()
    },
  })
}

function stubFetchForChat({ assistantContent = "Hello" } = {}) {
  const sse = [
    `data: ${JSON.stringify({ choices: [{ delta: { content: assistantContent } }] })}\n\n`,
    "data: [DONE]\n\n",
  ]

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      // Streaming endpoint
      if (url.toString().includes("/planning_chat")) {
        return {
          ok: true,
          status: 200,
          body: makeSseStream(sse),
        }
      }

      // Persistence endpoint
      if (url.toString().includes("/chat_messages")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        }
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      }
    })
  )
}

function buildCard(overrides = {}) {
  return {
    id: 123,
    project_id: 99,
    title: "In-App Planning",
    chat_messages: [],
    ...overrides,
  }
}

describe("PlanningChat", () => {
  it("renders existing chat history from card.chat_messages", () => {
    const card = buildCard({
      chat_messages: [
        { role: "user", content: "Hello assistant" },
        { role: "assistant", content: "Hi! How can I help?" },
      ],
    })

    render(<PlanningChat card={card} onClose={() => {}} onAccept={() => {}} />)

    expect(screen.getByText("Hello assistant")).toBeInTheDocument()
    expect(screen.getByText("Hi! How can I help?")).toBeInTheDocument()
  })

  it("auto-kickoff: when opened on a planning card with no chat history, it sends an intro message", async () => {
    stubFetchForChat({ assistantContent: "What are the requirements?" })

    const card = buildCard({
      status: "planning",
      title: "In-App Planning",
      description: "Let users plan features inside the app",
      chat_messages: [],
    })

    render(<PlanningChat card={card} onClose={() => {}} onAccept={() => {}} />)

    // The assistant should respond without the user typing anything.
    await waitFor(() => {
      expect(screen.getByText("What are the requirements?")).toBeInTheDocument()
    })

    // And the intro message should be present in the chat history.
    expect(
      screen.getByText(/I'd like to plan this feature: In-App Planning/i)
    ).toBeInTheDocument()
  })

  it("input and send: typing a message and clicking Send adds the user message to the display", async () => {
    stubFetchForChat({ assistantContent: "Sure." })
    const card = buildCard()

    render(<PlanningChat card={card} onClose={() => {}} onAccept={() => {}} />)

    const textbox = screen.getByRole("textbox")
    fireEvent.change(textbox, { target: { value: "Please make a plan" } })

    fireEvent.click(screen.getByRole("button", { name: /^send$/i }))

    // Optimistic render happens immediately, but we wait to avoid flakiness.
    await waitFor(() => {
      expect(screen.getByText("Please make a plan")).toBeInTheDocument()
    })
  })

  it("completion detection: when assistant message includes PLAN_COMPLETE markers, Accept and Revise buttons appear", async () => {
    const assistantContent = [
      "Here you go:\n\n",
      "<!-- PLAN_COMPLETE -->\nStep 1\nStep 2\n<!-- /PLAN_COMPLETE -->\n\n",
      "Anything else?",
    ].join("")

    stubFetchForChat({ assistantContent })
    const card = buildCard()

    render(<PlanningChat card={card} onClose={() => {}} onAccept={() => {}} />)

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Plan it" } })
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }))

    await waitFor(() => {
      expect(screen.getByText(/proposed plan/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /revise/i })).toBeInTheDocument()
    })

    // The extracted plan text should be displayed in the Proposed plan block.
    expect(screen.getByText(/Step 1\s*Step 2/)).toBeInTheDocument()
  })

  it("Accept button calls onAccept with the extracted plan text", async () => {
    const onAccept = vi.fn()
    const assistantContent = "<!-- PLAN_COMPLETE -->Do A\nDo B<!-- /PLAN_COMPLETE -->"
    stubFetchForChat({ assistantContent })

    render(<PlanningChat card={buildCard()} onClose={() => {}} onAccept={onAccept} />)

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Give me a plan" } })
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }))

    const accept = await screen.findByRole("button", { name: /accept/i })
    fireEvent.click(accept)

    expect(onAccept).toHaveBeenCalledWith("Do A\nDo B")
  })

  it("Revise button hides the action buttons and keeps chat open", async () => {
    const assistantContent = "<!-- PLAN_COMPLETE -->Revise Me<!-- /PLAN_COMPLETE -->"
    stubFetchForChat({ assistantContent })

    render(<PlanningChat card={buildCard()} onClose={() => {}} onAccept={() => {}} />)

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Plan" } })
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }))

    const revise = await screen.findByRole("button", { name: /revise/i })
    fireEvent.click(revise)

    expect(screen.queryByRole("button", { name: /accept/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /revise/i })).not.toBeInTheDocument()

    // Proposed plan content remains visible (chat stays open).
    expect(screen.getByText(/proposed plan/i)).toBeInTheDocument()
    expect(screen.getByText("Revise Me")).toBeInTheDocument()
  })

  it("renders without errors (basic responsive/layout smoke test)", () => {
    render(<PlanningChat card={buildCard()} onClose={() => {}} onAccept={() => {}} />)

    // The header title uses the card title when available.
    expect(screen.getByText("In-App Planning")).toBeInTheDocument()
    // Back button is present on mobile markup (md:hidden)
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument()
  })
})

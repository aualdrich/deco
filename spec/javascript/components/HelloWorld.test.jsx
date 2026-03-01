import { render, screen } from "@testing-library/react"
import HelloWorld from "../../../app/javascript/components/HelloWorld"

describe("HelloWorld", () => {
  it("renders 'Hello from Deco'", () => {
    render(<HelloWorld />)
    expect(screen.getByText("Hello from Deco")).toBeInTheDocument()
  })
})

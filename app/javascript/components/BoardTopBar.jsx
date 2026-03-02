import { useState, useRef, useEffect } from "react"

const FILTER_OPTIONS = [
  { value: "active",   label: "Active" },
  { value: "archived", label: "Archived" },
]

export default function BoardTopBar({ projectName, statusFilter, onFilterChange }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function selectFilter(value) {
    onFilterChange(value)
    setOpen(false)
    const url = new URL(window.location.href)
    if (value === "archived") {
      url.searchParams.set("status", "archived")
    } else {
      url.searchParams.delete("status")
    }
    window.history.pushState({}, "", url)
  }

  const activeLabel = FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "Active"

  return (
    <div
      className="safe-area-top sticky top-0 z-10 w-full flex-shrink-0 flex items-center justify-between px-4 py-3 bg-deco-surface border-b border-deco-border"
      style={{ minHeight: "3rem" }}
    >
      {/* Project name — left */}
      <h1
        className="text-deco-gold uppercase tracking-widest font-bold text-sm truncate mr-4"
        style={{ fontFamily: "Playfair Display, serif", maxWidth: "60%" }}
      >
        {projectName || "Board"}
      </h1>

      {/* Filter dropdown — right */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center gap-2 text-xs uppercase tracking-widest px-3 py-1.5 rounded border border-deco-border text-deco-muted hover:border-deco-gold hover:text-deco-gold transition-colors"
        >
          <span className="hidden sm:inline">{activeLabel}</span>
          {/* Funnel / filter icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open && (
          <ul
            role="listbox"
            aria-label="Filter cards by status"
            className="absolute right-0 mt-1 w-40 rounded border border-deco-border bg-deco-raised shadow-lg z-50 py-1"
          >
            {FILTER_OPTIONS.map(({ value, label }) => (
              <li key={value}>
                <button
                  role="option"
                  aria-selected={statusFilter === value}
                  onClick={() => selectFilter(value)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest text-left text-deco-text hover:text-deco-gold transition-colors"
                >
                  {/* Checkmark — visible only on active option */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className={`w-3.5 h-3.5 flex-shrink-0 text-deco-gold ${statusFilter === value ? "opacity-100" : "opacity-0"}`}
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

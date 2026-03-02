export default function BoardTopBar({ projectName, statusFilter, onFilterChange }) {
  const isArchived = statusFilter === "archived"

  function handleToggle() {
    const next = isArchived ? "active" : "archived"
    onFilterChange(next)
    // Reflect in URL without full page reload
    const url = new URL(window.location)
    if (next === "archived") {
      url.searchParams.set("status", "archived")
    } else {
      url.searchParams.delete("status")
    }
    window.history.pushState({}, "", url)
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-3 bg-deco-surface border-b border-deco-border"
      style={{ minHeight: "3rem" }}
    >
      {/* Project name — left */}
      <h1
        className="text-deco-gold uppercase tracking-widest font-bold text-sm truncate mr-4"
        style={{ fontFamily: "Playfair Display, serif", maxWidth: "60%" }}
      >
        {projectName || "Board"}
      </h1>

      {/* Filter toggle — right */}
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 text-xs uppercase tracking-widest px-3 py-1.5 rounded border transition-colors ${
          isArchived
            ? "bg-deco-gold text-deco-bg border-deco-gold"
            : "bg-transparent text-deco-muted border-deco-border hover:border-deco-gold hover:text-deco-gold"
        }`}
        title={isArchived ? "Viewing archived — click for active" : "View archived cards"}
        aria-pressed={isArchived}
      >
        <span className="hidden sm:inline">{isArchived ? "Archived" : "Active"}</span>
        {/* Archive icon — always visible */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path d="M2 3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3Z" />
          <path
            fillRule="evenodd"
            d="M4 8h12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Zm4 3a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2H8Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}

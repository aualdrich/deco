import KanbanCard from "./KanbanCard"

export default function KanbanColumn({ column }) {
  return (
    <div
      className="min-w-[280px] w-[280px] md:flex-1 md:min-w-0 rounded-lg p-3 flex flex-col gap-2"
      style={{ backgroundColor: "#2d2d3a", border: "1px solid #c9a84c" }}
    >
      <h2
        className="text-sm font-semibold uppercase tracking-widest pb-2 mb-1"
        style={{
          color: "#c9a84c",
          fontFamily: "Playfair Display, serif",
          borderBottom: "1px solid #4a4a5a",
        }}
      >
        {column.title}
      </h2>

      <div className="flex flex-col gap-2">
        {column.cards.map((card) => (
          <KanbanCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}

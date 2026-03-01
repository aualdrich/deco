import KanbanCard from "./KanbanCard"

export default function KanbanColumn({ column }) {
  return (
    <div className="min-w-[280px] w-[280px] md:flex-1 md:min-w-0 rounded-lg p-3 flex flex-col gap-2 bg-deco-surface border border-deco-gold">
      <h2
        className="text-sm font-semibold uppercase tracking-widest pb-2 mb-1 text-deco-gold border-b border-deco-border"
        style={{
          fontFamily: "Playfair Display, serif",
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

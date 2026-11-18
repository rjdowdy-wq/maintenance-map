export default function FilterBar({ tags, tag, onTag, openOnly, onOpenOnly }) {
  const pill = (active) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active ? 'bg-white text-ink' : 'bg-white/10 text-white active:bg-white/20'
    }`
  return (
    <div className="flex gap-2 overflow-x-auto px-3 pb-3 [scrollbar-width:none]">
      <button
        aria-pressed={openOnly}
        onClick={() => onOpenOnly(!openOnly)}
        className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
          openOnly ? 'border-red-600 bg-red-600 text-white' : 'border-white/40 text-white active:bg-white/10'
        }`}
      >
        Open issues only
      </button>
      <span className="mx-1 w-px shrink-0 bg-white/25" aria-hidden />
      <button className={pill(tag === 'All')} onClick={() => onTag('All')}>All properties</button>
      {tags.map((t) => (
        <button key={t} className={pill(tag === t)} onClick={() => onTag(t)}>{t}</button>
      ))}
    </div>
  )
}

import { STATUS, STATUS_COLOR } from '../lib/constants'

const TONE = {
  [STATUS.ISSUE]: 'bg-red-50 text-red-800',
  [STATUS.PROGRESS]: 'bg-yellow-50 text-yellow-900',
  [STATUS.OK]: 'bg-green-50 text-green-800',
}

export default function StatusBadge({ status }) {
  const s = status || STATUS.OK
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[s] ?? 'bg-slate-100 text-slate-700'}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s] ?? '#7B8794' }} />
      {s}
    </span>
  )
}

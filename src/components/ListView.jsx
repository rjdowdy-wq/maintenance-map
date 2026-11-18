import { useMemo, useState } from 'react'
import StatusBadge from './StatusBadge'
import { STATUS_RANK } from '../lib/constants'

const COLUMNS = [
  { key: 'location', label: 'Location' },
  { key: 'asset', label: 'Asset' },
  { key: 'type', label: 'Device type' },
  { key: 'serial', label: 'Serial number' },
  { key: 'address', label: 'Service address' },
  { key: 'status', label: 'Status' },
]

export default function ListView({ locations, tag, onOpen }) {
  const [sort, setSort] = useState({ key: 'location', dir: 1 })

  const rows = useMemo(() => {
    const out = []
    for (const loc of locations) {
      if (!loc.assets.length) out.push({ id: `l-${loc.id}`, loc, asset: null })
      else for (const asset of loc.assets) out.push({ id: asset.id, loc, asset })
    }
    const val = (r) => {
      switch (sort.key) {
        case 'location': return r.loc.name
        case 'asset': return r.asset?.name
        case 'type': return r.asset?.device_type
        case 'serial': return r.asset?.serial_number
        case 'address': return r.asset?.service_address
        case 'status': return r.asset ? STATUS_RANK[r.asset.status] ?? 3 : 4
        default: return ''
      }
    }
    return out.sort((a, b) => {
      const x = val(a), y = val(b)
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * sort.dir
      return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }) * sort.dir
    })
  }, [locations, sort])

  const assetCount = locations.reduce((n, l) => n + l.assets.length, 0)
  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }))

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <p className="shrink-0 border-b border-line px-4 py-3 text-sm text-slate-600">
        {tag === 'All' ? 'All properties' : tag}: {locations.length} {locations.length === 1 ? 'location' : 'locations'}, {assetCount} {assetCount === 1 ? 'asset' : 'assets'}
      </p>
      {rows.length === 0 ? (
        <p className="p-6 text-slate-600">Nothing matches these filters.</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} scope="col"
                    aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
                    className={`sticky top-0 z-10 border-b border-line bg-mist p-0 ${c.key === 'location' ? 'left-0 z-20' : ''}`}>
                    <button onClick={() => toggle(c.key)} className="flex w-full items-center gap-1 px-4 py-3 font-semibold">
                      {c.label}
                      <span aria-hidden className="text-xs text-slate-500">
                        {sort.key === c.key ? (sort.dir === 1 ? '▲' : '▼') : ''}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ id, loc, asset }) => (
                <tr key={id} className="active:bg-mist">
                  <td className="sticky left-0 border-b border-line bg-white px-4 py-3 font-semibold">
                    <button className="text-left underline decoration-line underline-offset-4" onClick={() => onOpen(loc.id, asset?.id ?? null)}>
                      {loc.name}
                    </button>
                    {tag === 'All' && loc.property_tag && <div className="text-xs font-normal text-slate-500">{loc.property_tag}</div>}
                  </td>
                  <td className="border-b border-line px-4 py-3">
                    {asset ? (
                      <button className="text-left" onClick={() => onOpen(loc.id, asset.id)}>{asset.name}</button>
                    ) : (
                      <span className="text-slate-400">No assets yet</span>
                    )}
                  </td>
                  <td className="border-b border-line px-4 py-3">{asset?.device_type ?? ''}</td>
                  <td className="border-b border-line px-4 py-3 tabular-nums">{asset?.serial_number ?? ''}</td>
                  <td className="border-b border-line px-4 py-3">{asset?.service_address ?? ''}</td>
                  <td className="border-b border-line px-4 py-3">{asset && <StatusBadge status={asset.status} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

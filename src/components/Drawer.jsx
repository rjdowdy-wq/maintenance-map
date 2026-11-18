import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { STATUS, locationStatus } from '../lib/constants'
import AssetFields, { blankAsset, cleanAsset } from './AssetFields'
import AssetView from './AssetView'
import StatusBadge from './StatusBadge'

export default function Drawer({ location, assetId, onClose, onOpenAsset, onBack, reload }) {
  const asset = assetId ? location.assets.find((a) => a.id === assetId) : null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center">
      <div className="sheet pointer-events-auto max-h-[82dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-sheet">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-white px-3 py-2">
          {asset ? (
            <button className="btn btn-ghost" onClick={onBack}>‹ {location.name}</button>
          ) : (
            <div className="min-w-0 flex-1 px-1">
              <h2 className="truncate text-lg font-bold">{location.name}</h2>
              <p className="truncate text-sm text-slate-500">{location.property_tag}</p>
            </div>
          )}
          <span className="flex-1" />
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">Close</button>
        </div>
        {asset ? (
          <AssetView key={asset.id} asset={asset} reload={reload} />
        ) : (
          <LocationView location={location} onOpenAsset={onOpenAsset} reload={reload} />
        )}
      </div>
    </div>
  )
}

function LocationView({ location, onOpenAsset, reload }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(blankAsset())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const status = locationStatus(location.assets)

  async function add(e) {
    e.preventDefault()
    if (!draft.name.trim()) return setErr('Asset name is required.')
    setBusy(true)
    const { data, error } = await supabase.from('assets')
      .insert({ ...cleanAsset(draft), location_id: location.id, status: STATUS.OK }).select().single()
    setBusy(false)
    if (error) return setErr(error.message)
    setDraft(blankAsset())
    setAdding(false)
    setErr('')
    await reload()
    onOpenAsset(data.id)
  }

  return (
    <div className="p-4">
      {status && (
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
          Overall: <StatusBadge status={status} />
        </div>
      )}
      {location.assets.length === 0 && !adding && <p className="mb-3 text-slate-600">No assets here yet.</p>}
      <ul className="space-y-2">
        {location.assets.map((a) => (
          <li key={a.id}>
            <button onClick={() => onOpenAsset(a.id)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-line p-3 text-left active:bg-mist">
              <span className="min-w-0">
                <span className="block truncate font-semibold">{a.name}</span>
                <span className="block truncate text-sm text-slate-600">{a.device_type || 'No device type'}</span>
                <span className="block truncate text-sm tabular-nums text-slate-500">{a.serial_number ? `S/N ${a.serial_number}` : 'No serial number'}</span>
              </span>
              <StatusBadge status={a.status} />
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <form onSubmit={add} className="mt-4 rounded-xl border border-line p-3">
          <AssetFields value={draft} onChange={setDraft} />
          {err && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{err}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-ghost flex-1" onClick={() => { setAdding(false); setErr('') }}>Cancel</button>
            <button className="btn btn-primary flex-1" disabled={busy}>{busy ? 'Saving…' : 'Save asset'}</button>
          </div>
        </form>
      ) : (
        <button className="btn btn-primary mt-4 w-full" onClick={() => setAdding(true)}>+ Add Asset Here</button>
      )}
    </div>
  )
}

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LAT, LNG, STATUS } from '../lib/constants'
import AssetFields, { blankAsset, cleanAsset } from './AssetFields'

export default function AddPinModal({ draft, tags, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [assets, setAssets] = useState([blankAsset()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const updateAsset = (i, v) => setAssets((list) => list.map((a, idx) => (idx === i ? v : a)))

  async function save(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Enter a location name.')
    if (!tag.trim()) return setError('Choose or type a property tag.')
    const filled = assets.filter((a) => Object.values(a).some((v) => v.trim()))
    if (filled.some((a) => !a.name.trim())) return setError('Give each asset a name, or remove the empty ones.')

    setBusy(true)
    const { data: loc, error: e1 } = await supabase
      .from('locations')
      .insert({ name: name.trim(), property_tag: tag.trim(), [LAT]: draft.lat, [LNG]: draft.lng })
      .select()
      .single()
    if (e1) {
      setBusy(false)
      return setError(e1.message)
    }
    if (filled.length) {
      const { error: e2 } = await supabase
        .from('assets')
        .insert(filled.map((a) => ({ ...cleanAsset(a), location_id: loc.id, status: STATUS.OK })))
      if (e2) {
        await supabase.from('locations').delete().eq('id', loc.id) // don't leave an empty pin behind
        setBusy(false)
        return setError(`Couldn't save assets: ${e2.message}`)
      }
    }
    onSaved(loc.id)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center" role="dialog" aria-modal="true" aria-label="Add pin">
      <form onSubmit={save} className="sheet max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">New location</h2>
            <p className="text-sm text-slate-500">{draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
        </div>

        <label className="label">Location name</label>
        <input className="input mb-4" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. North entrance" autoFocus />

        <label className="label">Property tag</label>
        <input className="input" list="property-tags" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Pick one below or type a new one" />
        {tags.length > 0 && (
          <div className="mb-5 mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <button type="button" key={t} onClick={() => setTag(t)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${tag === t ? 'border-accent bg-accent text-white' : 'border-line bg-white'}`}>
                {t}
              </button>
            ))}
          </div>
        )}

        <h3 className="mb-2 mt-4 font-bold">Assets at this spot</h3>
        <div className="space-y-4">
          {assets.map((a, i) => (
            <fieldset key={i} className="rounded-xl border border-line p-3">
              <div className="mb-2 flex items-center justify-between">
                <legend className="px-1 text-sm font-semibold text-slate-600">Asset {i + 1}</legend>
                {assets.length > 1 && (
                  <button type="button" className="text-sm font-semibold text-red-700" onClick={() => setAssets((l) => l.filter((_, idx) => idx !== i))}>
                    Remove
                  </button>
                )}
              </div>
              <AssetFields value={a} onChange={(v) => updateAsset(i, v)} />
            </fieldset>
          ))}
        </div>
        <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => setAssets((l) => [...l, blankAsset()])}>
          + Add another asset
        </button>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button className="btn btn-primary mt-4 w-full" disabled={busy}>{busy ? 'Saving…' : 'Save location'}</button>
      </form>
    </div>
  )
}

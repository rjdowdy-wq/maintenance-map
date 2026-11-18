import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/image'
import { LOG_TO_STATUS, LOG_TYPES } from '../lib/constants'
import AssetFields, { cleanAsset } from './AssetFields'
import StatusBadge from './StatusBadge'

const fmt = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

export default function AssetView({ asset, reload }) {
  const [logs, setLogs] = useState([])
  const [logsError, setLogsError] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [editErr, setEditErr] = useState('')
  const [zoom, setZoom] = useState(null)

  const loadLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from('asset_logs').select('*').eq('asset_id', asset.id).order('created_at', { ascending: false })
    if (error) setLogsError(error.message)
    else { setLogs(data); setLogsError('') }
  }, [asset.id])

  useEffect(() => { loadLogs() }, [loadLogs])

  async function saveDetails(e) {
    e.preventDefault()
    if (!draft.name.trim()) return setEditErr('Asset name is required.')
    const { error } = await supabase.from('assets').update(cleanAsset(draft)).eq('id', asset.id)
    if (error) return setEditErr(error.message)
    setEditing(false)
    setEditErr('')
    reload()
  }

  return (
    <div className="space-y-5 p-4">
      <section className="rounded-xl border border-line p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-tight">{asset.name}</h3>
          <StatusBadge status={asset.status} />
        </div>
        {editing ? (
          <form onSubmit={saveDetails} className="mt-4">
            <AssetFields value={draft} onChange={setDraft} />
            {editErr && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{editErr}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => { setEditing(false); setEditErr('') }}>Cancel</button>
              <button className="btn btn-primary flex-1">Save details</button>
            </div>
          </form>
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Device type</dt><dd>{asset.device_type || '—'}</dd>
              <dt className="text-slate-500">Serial number</dt><dd className="tabular-nums">{asset.serial_number || '—'}</dd>
              <dt className="text-slate-500">Service address</dt><dd>{asset.service_address || '—'}</dd>
            </dl>
            <button className="btn btn-ghost mt-4 w-full"
              onClick={() => {
                setDraft({ name: asset.name ?? '', device_type: asset.device_type ?? '', serial_number: asset.serial_number ?? '', service_address: asset.service_address ?? '' })
                setEditing(true)
              }}>
              Edit details
            </button>
          </>
        )}
      </section>

      <LogForm asset={asset} onSaved={() => Promise.all([loadLogs(), reload()])} />

      <section>
        <h3 className="mb-2 font-bold">History</h3>
        {logsError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{logsError}</p>}
        {!logsError && logs.length === 0 && <p className="text-slate-600">No logs yet. Add the first note above.</p>}
        <ol className="space-y-3">
          {logs.map((log) => (
            <li key={log.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={LOG_TO_STATUS[log.log_type]} />
                <span className="text-xs text-slate-500">{fmt(log.created_at)}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">{log.log_type}</p>
              {log.notes && <p className="mt-2 whitespace-pre-wrap">{log.notes}</p>}
              {log.photo_url && (
                <button onClick={() => setZoom(log.photo_url)} className="mt-3 block" aria-label="View photo full size">
                  <img src={log.photo_url} alt="Attached to log" loading="lazy" className="h-24 w-24 rounded-lg border border-line object-cover" />
                </button>
              )}
            </li>
          ))}
        </ol>
      </section>

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3" onClick={() => setZoom(null)} role="dialog" aria-label="Photo">
          <img src={zoom} alt="Log attachment, full size" className="max-h-full max-w-full object-contain" />
          <button className="btn absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] bg-white text-ink">Close</button>
        </div>
      )}
    </div>
  )
}

function LogForm({ asset, onSaved }) {
  const [note, setNote] = useState('')
  const [logType, setLogType] = useState('Progress Note')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function submit(e) {
    e.preventDefault()
    if (!note.trim() && !file) return setErr('Add a note or a photo.')
    setBusy(true)
    setErr('')
    try {
      let photo_url = null
      if (file) {
        const blob = await compressImage(file)
        const path = `${asset.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
        const { error: upErr } = await supabase.storage.from('asset-photos').upload(path, blob, { contentType: blob.type || 'image/jpeg' })
        if (upErr) throw upErr
        photo_url = supabase.storage.from('asset-photos').getPublicUrl(path).data.publicUrl
      }
      const { error: logErr } = await supabase.from('asset_logs')
        .insert({ asset_id: asset.id, log_type: logType, notes: note.trim() || null, photo_url })
      if (logErr) throw logErr
      const { error: statusErr } = await supabase.from('assets').update({ status: LOG_TO_STATUS[logType] }).eq('id', asset.id)
      if (statusErr) throw statusErr
      setNote('')
      setFile(null)
      await onSaved()
    } catch (ex) {
      setErr(ex.message || 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border-2 border-ink p-4">
      <h3 className="mb-3 font-bold">Log an update</h3>
      <div role="radiogroup" aria-label="Log type" className="mb-3 grid grid-cols-3 gap-1 rounded-lg bg-mist p-1">
        {LOG_TYPES.map((t) => (
          <button type="button" role="radio" aria-checked={logType === t} key={t} onClick={() => setLogType(t)}
            className={`min-h-[44px] rounded-md px-1 text-sm font-semibold ${logType === t ? 'bg-ink text-white' : 'text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>
      <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you see or do?" aria-label="Note" />
      <div className="mt-3 flex items-center gap-3">
        <label className="btn btn-ghost cursor-pointer">
          {file ? 'Retake photo' : 'Take photo'}
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {preview && (
          <>
            <img src={preview} alt="Selected photo preview" className="h-12 w-12 rounded-lg border border-line object-cover" />
            <button type="button" className="text-sm font-semibold text-red-700" onClick={() => setFile(null)}>Remove</button>
          </>
        )}
      </div>
      {err && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{err}</p>}
      <button className="btn btn-primary mt-4 w-full" disabled={busy}>{busy ? 'Saving…' : 'Save log'}</button>
    </form>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { hasOpenIssue } from './lib/constants'
import Login from './components/Login'
import FilterBar from './components/FilterBar'
import MapView from './components/MapView'
import ListView from './components/ListView'
import Drawer from './components/Drawer'
import AddPinModal from './components/AddPinModal'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <div className="flex h-dvh items-center justify-center bg-ink text-white">Loading…</div>
  if (!session) return <Login />
  return <Main />
}

function Main() {
  const [locations, setLocations] = useState([])
  const [error, setError] = useState('')
  const [tab, setTab] = useState('map')
  const [tag, setTag] = useState('All')
  const [openOnly, setOpenOnly] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [draft, setDraft] = useState(null)
  const [sel, setSel] = useState(null) // { locationId, assetId }

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('locations').select('*, assets(*)').order('name')
    if (error) return setError(error.message)
    setError('')
    setLocations(
      data.map((l) => ({
        ...l,
        assets: (l.assets ?? []).slice().sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
      }))
    )
  }, [])

  useEffect(() => { load() }, [load])

  const tags = useMemo(
    () => [...new Set(locations.map((l) => l.property_tag).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [locations]
  )
  const deviceTypes = useMemo(
    () => [...new Set(locations.flatMap((l) => l.assets.map((a) => a.device_type)).filter(Boolean))].sort(),
    [locations]
  )
  useEffect(() => { if (tag !== 'All' && !tags.includes(tag)) setTag('All') }, [tags, tag])

  const visible = useMemo(
    () => locations.filter((l) => (tag === 'All' || l.property_tag === tag) && (!openOnly || hasOpenIssue(l.assets))),
    [locations, tag, openOnly]
  )

  const selLoc = sel ? locations.find((l) => l.id === sel.locationId) : null
  const startAdd = () => { setSel(null); setAddMode(true) }
  const openFromList = (locationId, assetId) => { setSel({ locationId, assetId }); setTab('map') }

  return (
    <div className="flex h-dvh flex-col bg-mist">
      <datalist id="property-tags">{tags.map((t) => <option key={t} value={t} />)}</datalist>
      <datalist id="device-types">{deviceTypes.map((t) => <option key={t} value={t} />)}</datalist>

      <header className="shrink-0 bg-ink pt-[env(safe-area-inset-top)] text-white">
        <div className="flex items-center gap-3 px-3 py-3">
          <div role="tablist" className="flex rounded-lg bg-white/10 p-1">
            {[['map', 'Map View'], ['list', 'List View']].map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setAddMode(false) }}
                className={`min-h-[40px] rounded-md px-4 text-sm font-semibold ${tab === k ? 'bg-white text-ink' : 'text-white'}`}>
                {label}
              </button>
            ))}
          </div>
          <span className="flex-1" />
          <button className="text-sm font-semibold text-white/80 underline underline-offset-4" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
        <FilterBar tags={tags} tag={tag} onTag={setTag} openOnly={openOnly} onOpenOnly={setOpenOnly} />
      </header>

      <div className="relative min-h-0 flex-1">
        {error && (
          <div role="alert" className="absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-3 rounded-lg bg-red-600 p-3 text-sm text-white">
            <span>Couldn't load locations: {error}</span>
            <button className="font-bold underline" onClick={load}>Retry</button>
          </div>
        )}

        <div className={tab === 'map' ? 'absolute inset-0' : 'hidden'}>
          <MapView
            visible={tab === 'map'}
            locations={visible}
            selectedId={sel?.locationId ?? null}
            addMode={addMode}
            draft={draft}
            onPinClick={(id) => setSel({ locationId: id, assetId: null })}
            onMapClick={(pt) => { setDraft(pt); setAddMode(false) }}
          />

          {addMode && (
            <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-3 rounded-xl bg-accent p-3 text-white shadow-lg">
              <span className="font-semibold">Tap the map where the new pin goes.</span>
              <button className="rounded-lg bg-white/20 px-3 py-2 font-semibold" onClick={() => setAddMode(false)}>Cancel</button>
            </div>
          )}
          {!addMode && !selLoc && !draft && (
            <button onClick={startAdd}
              className="btn btn-primary absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 px-6 shadow-lg">
              + Add pin
            </button>
          )}
          {selLoc && (
            <Drawer
              location={selLoc}
              assetId={sel.assetId}
              onClose={() => setSel(null)}
              onBack={() => setSel({ locationId: selLoc.id, assetId: null })}
              onOpenAsset={(assetId) => setSel({ locationId: selLoc.id, assetId })}
              reload={load}
            />
          )}
        </div>

        {tab === 'list' && <ListView locations={visible} tag={tag} onOpen={openFromList} />}
      </div>

      {draft && (
        <AddPinModal
          draft={draft}
          tags={tags}
          onClose={() => setDraft(null)}
          onSaved={async (id) => { await load(); setDraft(null); setSel({ locationId: id, assetId: null }) }}
        />
      )}
    </div>
  )
}

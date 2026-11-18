import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { LAT, LNG, MAP_CENTER, MAP_ZOOM, pinColor } from '../lib/constants'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const PIN_SVG = `<svg viewBox="0 0 34 44" aria-hidden="true"><path class="body" stroke="#fff" stroke-width="2.5" d="M17 43C17 43 3 27 3 16a14 14 0 1 1 28 0c0 11-14 27-14 27z"/><circle cx="17" cy="16" r="5" fill="#fff"/></svg>`

function makePin(extraClass = '') {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = `pin ${extraClass}`.trim()
  el.innerHTML = PIN_SVG
  return el
}

export default function MapView({ visible, locations, selectedId, addMode, draft, onPinClick, onMapClick }) {
  const box = useRef(null)
  const map = useRef(null)
  const markers = useRef(new Map())
  const draftMarker = useRef(null)
  const locsRef = useRef(locations)
  const cb = useRef({})
  locsRef.current = locations
  cb.current = { onPinClick, onMapClick, addMode }

  // Create the map once.
  useEffect(() => {
    const m = new mapboxgl.Map({
      container: box.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
    })
    m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    m.addControl(
      new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
      'top-right'
    )
    m.on('click', (e) => {
      if (cb.current.addMode) cb.current.onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat })
    })
    map.current = m
    return () => {
      m.remove()
      map.current = null
      markers.current.clear()
    }
  }, [])

  // One permanent marker per location; colour recomputed from its assets.
  useEffect(() => {
    const m = map.current
    if (!m) return
    const seen = new Set()
    for (const loc of locations) {
      if (loc[LAT] == null || loc[LNG] == null) continue
      seen.add(loc.id)
      let entry = markers.current.get(loc.id)
      if (!entry) {
        const el = makePin()
        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          if (!cb.current.addMode) cb.current.onPinClick(loc.id)
        })
        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([loc[LNG], loc[LAT]])
          .addTo(m)
        entry = { marker, el }
        markers.current.set(loc.id, entry)
      }
      entry.el.style.setProperty('--pin', pinColor(loc.assets))
      entry.el.setAttribute('aria-label', loc.name)
      entry.marker.setLngLat([loc[LNG], loc[LAT]])
    }
    for (const [id, entry] of markers.current) {
      if (!seen.has(id)) {
        entry.marker.remove()
        markers.current.delete(id)
      }
    }
  }, [locations])

  useEffect(() => {
    for (const [id, entry] of markers.current) entry.el.classList.toggle('selected', id === selectedId)
  }, [selectedId, locations])

  // Temporary pin while the Add Pin modal is open.
  useEffect(() => {
    draftMarker.current?.remove()
    draftMarker.current = null
    const m = map.current
    if (m && draft) {
      const el = makePin('draft')
      el.style.setProperty('--pin', '#1F4FD8')
      draftMarker.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([draft.lng, draft.lat])
        .addTo(m)
    }
  }, [draft])

  // Keep the selected pin visible above the drawer.
  useEffect(() => {
    const m = map.current
    if (!m || !selectedId) return
    const loc = locsRef.current.find((l) => l.id === selectedId)
    if (loc) {
      m.easeTo({
        center: [loc[LNG], loc[LAT]],
        offset: [0, -Math.round(window.innerHeight * 0.2)],
        duration: 500,
      })
    }
  }, [selectedId])

  useEffect(() => {
    if (visible) requestAnimationFrame(() => map.current?.resize())
  }, [visible])

  useEffect(() => {
    if (map.current) map.current.getCanvas().style.cursor = addMode ? 'crosshair' : ''
  }, [addMode])

  return <div ref={box} className="absolute inset-0" />
}

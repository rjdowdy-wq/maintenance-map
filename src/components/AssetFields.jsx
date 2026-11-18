// Shared inputs for creating / editing an asset. Relies on <datalist id="device-types"> rendered in App.
export const blankAsset = () => ({ name: '', device_type: '', serial_number: '', service_address: '' })

export const cleanAsset = (a) => ({
  name: a.name.trim(),
  device_type: a.device_type.trim() || null,
  serial_number: a.serial_number.trim() || null,
  service_address: a.service_address.trim() || null,
})

export default function AssetFields({ value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value })
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Asset name</label>
        <input className="input" value={value.name} onChange={set('name')} placeholder="e.g. Front lawn irrigation meter" />
      </div>
      <div>
        <label className="label">Device type</label>
        <input className="input" list="device-types" value={value.device_type} onChange={set('device_type')} placeholder="e.g. Water meter" />
      </div>
      <div>
        <label className="label">Serial number</label>
        <input className="input" value={value.serial_number} onChange={set('serial_number')} autoCapitalize="characters" />
      </div>
      <div>
        <label className="label">Service address</label>
        <input className="input" value={value.service_address} onChange={set('service_address')} autoComplete="street-address" />
      </div>
    </div>
  )
}

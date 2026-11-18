// Mapbox uses [lng, lat]. International Drive, Orlando = 28.4500, -81.4700
export const MAP_CENTER = [-81.47, 28.45]
export const MAP_ZOOM = 16

// Column names on `locations` that hold the pin coordinates. Rename here if yours differ.
export const LAT = 'lat'
export const LNG = 'lng'

export const STATUS = { ISSUE: 'Issue Reported', PROGRESS: 'In Progress', OK: 'Operational' }
export const LOG_TYPES = ['Issue Reported', 'Progress Note', 'Resolved']

// Logging an entry sets the asset's status:
export const LOG_TO_STATUS = {
  'Issue Reported': STATUS.ISSUE,
  'Progress Note': STATUS.PROGRESS,
  Resolved: STATUS.OK,
}

export const STATUS_COLOR = {
  [STATUS.ISSUE]: '#D6342C',
  [STATUS.PROGRESS]: '#F2B01E',
  [STATUS.OK]: '#2E9D5B',
}
export const NO_ASSETS_COLOR = '#7B8794'
export const STATUS_RANK = { [STATUS.ISSUE]: 0, [STATUS.PROGRESS]: 1, [STATUS.OK]: 2 }

export function locationStatus(assets = []) {
  if (!assets.length) return null
  if (assets.some((a) => a.status === STATUS.ISSUE)) return STATUS.ISSUE
  if (assets.some((a) => a.status === STATUS.PROGRESS)) return STATUS.PROGRESS
  return STATUS.OK
}
export const pinColor = (assets) => STATUS_COLOR[locationStatus(assets)] ?? NO_ASSETS_COLOR

// "Open" = anything not yet back to Operational (red or yellow).
export const hasOpenIssue = (assets = []) =>
  assets.some((a) => a.status === STATUS.ISSUE || a.status === STATUS.PROGRESS)

# Exterior Maintenance Map

Mobile-first React + Vite + Tailwind + Mapbox GL JS + Supabase.

## Run it
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase URL, anon key, and Mapbox public token.
3. `npm run dev` (opens on your LAN so you can test on a phone; camera capture needs HTTPS on a real device, so deploy to Vercel/Netlify/Cloudflare Pages to test photos).

Users are created in the Supabase dashboard (Authentication > Users). There is no sign-up screen.

## Schema this app expects
| Table | Columns used |
|---|---|
| `locations` | `id`, `name`, `property_tag`, `lat`, `lng` |
| `assets` | `id`, `location_id` (FK to locations), `name`, `device_type`, `serial_number`, `service_address`, `status` |
| `asset_logs` | `id`, `asset_id` (FK to assets), `log_type`, `notes`, `photo_url`, `created_at` |

- `status` values: `Operational`, `In Progress`, `Issue Reported`.
- `log_type` values: `Issue Reported`, `Progress Note`, `Resolved`.
- Different coordinate column names? Change `LAT` / `LNG` in `src/lib/constants.js`.
- `asset-photos` should be a **public** bucket (photos are stored by public URL in `photo_url`). If it is private, switch to `createSignedUrl` in `AssetView.jsx`.
- Row Level Security: allow `select/insert/update` on all three tables, and `insert` on `storage.objects` for bucket `asset-photos`, to the `authenticated` role only.

## Behavior notes
- Log type sets asset status: Issue Reported -> Issue Reported, Progress Note -> In Progress, Resolved -> Operational.
- Pin color: red if any asset is Issue Reported, else yellow if any is In Progress, else green. A location with no assets yet is grey.
- "Open issues only" shows locations with any asset that is red or yellow.
- Photos are resized to 1600px JPEG in the browser before upload.

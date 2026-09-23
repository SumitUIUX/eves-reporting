# EVES Reporting

A React 19 / TypeScript dashboard using Next.js App Router conventions. Sites runs the app through Vinext on Cloudflare Workers; the included Vercel configuration builds it with Next.js 16.

## Routes

- `/reports/project-tags`: persistent project tag CRUD, site and charger mappings, search, filtering and CSV export.
- `/reports/regulatory`: agency/report/funding selection; quarter, month and custom periods; real XLSX and CSV/ZIP downloads.
- `/reports/charging-sessions`: sessions, metrics, filters, chart, exports and record details.
- `/reports/interval-load-profile`: interval data, weighted power metrics and chart.
- `/reports/throughput`: infrastructure and throughput snapshot.
- `/`: uptime summary and downtime event details.

## Architecture

- `app/globals.css`: EVES semantic tokens and responsive product styles.
- `components/ui`: existing accessible UI primitives.
- `components/eves`: shell, reusable reporting UI and feature components.
- `lib/eves`: types, validation, report logic, exports, reference data and storage adapter.
- `app/api/tags/route.ts`: validated persistent tag operations, origin checks and optimistic concurrency.
- `db/schema.ts`, `drizzle/`: schema and generated migrations.

## Data provenance and limits

Report records were read from the user-provided original UI on September 7, 2026. They are explicitly labeled reference data; there is no live charger, OCPP, billing, email or agency-submission integration. The original sample values are preserved even when internally inconsistent. Summary metrics in the new UI are recomputed from the included rows and describe their calculation.

Snapshot sizes: 25 charging sessions, 42 intervals, 48 infrastructure rows, 48 uptime rows, and 21 downtime events. The three original tags and their mapped site capacities are initial reference records. Workspace tag changes persist in D1; report snapshots are immutable. Mapping charger numbers are selection labels, not inferred live OCPP IDs.

Project Tagging also offers a separate, clearly labeled sample workspace with 12 fictional tags. It opens automatically if the tag service is unavailable, or can be selected from the data source menu. Sample CRUD and mappings persist only in browser local storage; they never write to the workspace API or feed Generate Reports. Sample CSV exports include a data-source column and a sample filename. Switching back to Workspace data retries the existing API. The compact toolbar combines search and tag type with a popover for agency and mapped/unmapped status; applied filters can be removed individually or cleared together.

The original interval column labeled `Energy Delivered (kW)` is displayed as `Energy delivered (kWh)`, with a visible disclosure. No numeric conversion is performed. Operational summary snapshots are included in regulatory exports only when the complete September 1–7, 2026 period is selected. Events missing a year are interpreted within the captured 2026 reference year. Site/chart averages are explicitly labeled as unweighted where applicable.

Regulatory files are working exports, not certified agency submissions. Contact records and official agency templates were not provided. Excel files contain a Read me sheet with scope and limitations. Multiple CSVs include the same metadata in a ZIP. No email is sent or simulated.

### Generate Reports delivery rules

The horizontal report builder uses searchable multi-selects for reports, funding IDs, months and quarters, plus calendar date pickers. The supplied reporting reference table retains its agency names, report labels, frequency, format and submission mechanism. Existing exported column order, sheet names, snapshot filtering, CSV encoding, XLSX packaging and ZIP metadata remain unchanged.

Calendar days are counted inclusively in UTC. Downloads are available for at most 31 days within one calendar month. Any selection crossing a calendar-month boundary, or any quarterly selection, requires email delivery. The complete span from the earliest selected start through the latest end cannot exceed 93 days, including gaps. Overlapping selections are counted once. Q3 has 92 days; 93 is the maximum permitted span, not a fixed quarter length.

Funding IDs use saved workspace funding tags when the database is connected. If no database is configured, Generate Reports uses the two original funding tags bundled with the report snapshot (CEC-FND-110 and CIC-FND-204). This does not include fictional sample tags, enable workspace writes, replace an empty connected workspace, or conceal a configured database failure. Agencies without funding tags keep the optional All funding IDs selection and show the shared empty state in the picker.

Empty data tables share the message “No records have been found” and a small inbox illustration. Dropdowns and search pickers use compact text only. An unconfigured workspace shows the empty-table view; other loading and error states remain separate. Interval Load Profile uses a full-height right filter drawer at every screen size; other report and project filters retain their desktop popovers and mobile drawers.

**Email integration is still required.** This repository has no authenticated user profile, registered email source or email/report-job service. The Email Delivery dialog therefore shows an unavailable, read-only recipient and disables Send. It never substitutes an arbitrary address, sends mail, claims that a job was queued or falls back to downloading an email-only range. To activate delivery, connect the EVES authenticated profile and server-side report-job API; resolve the recipient from the authenticated account, enforce the same period limits on the server, and show success only after the service accepts the job. No new email configuration values or API contracts are assumed.

## Local development

## Local development

Install dependencies with `npm ci`. Configure the local DB binding and apply generated migrations to the local D1 database before exercising saved tag operations. Use `npm run dev` in a standard development environment.

Validation commands: `npm run typecheck`, `npm run build` (Sites), `npm run build:vercel` (Vercel).

Validation commands: `npm run typecheck`, `npm run build` (Sites), `npm run build:vercel` (Vercel).

## Deploy to Vercel

Import this source as a Next.js project. `vercel.json` chooses the Next.js build. Supply the three server-only values listed in `.env.example` to connect an existing Cloudflare D1 database over HTTPS, then apply the generated schema migrations to that database. Use a narrowly scoped D1 token. The HTTPS adapter sends the documented `{ batch: [{ sql, params }] }` request envelope and checks each statement result. Without a configured database, Project Tagging opens its labeled sample workspace and Generate Reports uses its original reference funding IDs. Selecting Workspace data still shows the storage connection error and retry control.

The Sites deployment is owner-private. When deploying elsewhere, configure deployment access protection or replace it with your organization's authentication before exposing stored records. This project does not implement user accounts or multi-tenant authorization. The top-right Super Admin profile is the requested workspace display label; it is not an authenticated role and grants no permissions. Replace it with the signed-in user’s role when authentication is integrated.

For production EVES data, replace the reference dataset adapter with your authenticated service client and validate existing report schemas/calculations against the actual business contract. The original application source and APIs were unavailable, so this new implementation cannot establish backend parity with that deployment.

Page title, category, and subtitle blocks are omitted across report screens. Existing filter, export, source and create controls remain at the top. The Project Tagging and Generate Reports cross-promotion callouts are removed.

# Performance & Insights filtering: data readiness

The six reports share `ReportFilterDrawer`. Report-specific field definitions live in `report-config.ts`; date presets, dependency rules, counts, and chart buckets live in `performance-filters.ts`. All displayed report outputs and exports use the same filtered row set. Executive Performance aggregates the existing recorded sessions by site after filtering; it does not borrow the separate Executive Overview totals.

## Existing source limitations

There is currently no workspace reporting API in this repository. Workspace mode explicitly reports that it cannot load reporting data. It does not fall back to sample rows or show zero KPIs.

| Report | Connected filtering | Missing source fields |
| --- | --- | --- |
| Executive Performance | Site, UTC session start date, state joined by site ID | Site status |
| Charging Performance | Site, UTC session start date, EVSE, connector, vehicle, payment, error flag/type | Session status; utilization denominator |
| Site Performance | Site, city, state | Reporting period or dated measures; site status |
| Charger Performance | Site, EVSE, port, connector | Reporting period or dated measures; charger status; error flag/type |
| Energy & Demand | Site, UTC interval start date, port, time of day, weekday | None for the requested filters |
| Uptime & Reliability | Site, EVSE, downtime reason, SLA derived from supplied uptime at 95% | Reporting period, dated downtime intervals; charger status; error type |

Undated snapshot reports keep their original data. Their Date Range control is explicitly unavailable, and no selected period is asserted for these totals. Other missing fields appear disabled with an explanation. Enabling controls without the required source fields would fabricate filtering behavior.

## Required integration to finish date coverage

Provide the actual reporting endpoint/schema, tenant scope, timezone, site and charger statuses, and either dated raw observations or server-computed aggregates for the requested period. Reliability requires available/eligible time and downtime intervals so overlap can be clipped to the reporting window. Do not prorate undated uptime or copy aggregate values into different date ranges. The existing 95% threshold must remain unchanged.

Default date range is the previous seven complete UTC days; presets use UTC because the existing session/interval records carry UTC timestamps. The supplied timestamped sample data covers September 1–8, 2026 (sessions) and September 1–7 (intervals). A current period outside this coverage correctly produces an empty result. The drawer displays the available date coverage.

Executive Overview remains at `/dashboard`, with its component, date display and refresh behavior unchanged. Revenue & Transaction retains its page outside the six-tab Performance & Insights group. Existing Executive Overview permission grants are migrated to Executive Performance; an explicitly denied permission is not expanded.

## Verification

`node --test tests/performance-filters.test.mjs` checks calendar boundaries, invalid ranges, dependency pruning, UTC time/weekday filters, aggregate totals, active counts, and chart granularity. `npm run typecheck` and `npm run build:vercel` validate integration.

# EVES design system

The interface uses one application stylesheet and accessible primitives under `components/ui`. Feature components should use `components/eves/shared.tsx` for page headings, metrics, form choices, search, pagination and asynchronous states. Report pages share `ReportPage`, column configuration and data transformations.

## Foundation

| Role | Value |
| --- | --- |
| Primary action | Indigo `#3D3AD3` |
| Brand blue | `#175CE5` |
| Page background | `#F7F8FB` |
| Surface | White |
| Main text | `#202333` |
| Secondary text | `#707586` |
| Border | `#E7E9F0` |
| Font | Inter when available, Arial/Helvetica fallback |
| Body / table text | 14–16px |
| Metadata | 12–13px |
| Page title | 24–28px, semibold |
| Spacing rhythm | 4, 8, 12, 16, 24, 32px |
| Radius | 6px controls, 10px cards, 14px large surfaces |

Semantic CSS variables are defined in `app/globals.css`. Components consume Tailwind tokens or shared product classes. Neutral borders define surfaces; shadows are reserved for overlays. Focus rings, hover states and disabled states remain consistent across modules. Status badges include words so color is not the only signal.

## Patterns

- Buttons: primary for the main task, outline for secondary actions, ghost for table tools. Standard height 40px.
- Forms: visible labels, explicit required fields, validation near the form, retained input after save failures.
- Tables: readable headers, row hover, explicit actions, column selection, pagination and CSV/XLSX exports. Full record sheets expose every field.
- Dialogs: Radix focus management and Escape behavior; save actions indicate progress and prevent duplicate submissions.
- Filters: draft selections apply together, with reset and active-filter counts. Mobile reports use a drawer.
- Charts: restrained color, clear units, accessible chart navigation, source scope and calculation notes. Empty results do not draw fabricated values.
- States: reusable empty, skeleton loading and retryable error components. No live status is inferred from reference data.
- Navigation: persistent desktop sidebar, mobile drawer that closes after navigation, active route labels and breadcrumb context.

## Responsive behavior

The shell changes below 768px. Metrics wrap into two columns, page actions wrap, forms become one column and report filters move into a drawer. Dense tables retain horizontal scrolling within their own panels, with the report identifier column pinned and a full-record sheet. At tablet widths, grids and filter controls reduce columns. Reduced-motion preferences disable UI transitions.

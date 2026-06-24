# Handoff: Plotypus Application Shell Redesign

## Overview
This package redesigns the **Plotypus** map-authoring tool's application shell. Plotypus lets users assemble a set of geographic project points, organize them into categories, choose included map regions, translate labels (EN/FR), and export a styled SVG/PNG map for federal-government publications.

The redesign solves one core problem: historical additions left **multiple competing control surfaces with no clear ownership** (a top ribbon, tabs, a near-empty permanent left sidebar, a right Properties panel, and summary chips). The new shell establishes:

- **One stable two-tier header** (brand + global commands on top, workspace tabs + readiness strip below) that never moves between workspaces.
- **No permanent left sidebar.** Categories & markers get a real workspace instead.
- **Six peer workspaces:** Map, Project points, Categories & markers, Map regions, Translate, Map quality check.
- **A contextual right Properties panel** that only ever shows controls for the active workspace / selected object.
- **A readiness system** that clearly separates *passive metrics* (counts) from *actionable issues* (clickable, route to the problem).
- Document-level concerns (bilingual title + text version) live in focused **dialogs**, not the Properties panel.

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive prototypes showing intended look and behavior. They are **not** production code to copy directly.

The implementation target is the **existing Plotypus repository**, which is plain, framework-free, offline-capable:
- `index.html` · `style.css` · `app.js` · `icons.js`
- No build system, no React/Vue/Tailwind, no external/remote runtime dependencies.

> ⚠️ **Important:** The prototype files here are authored as "Design Components" and load a `support.js` runtime + Google Fonts. That runtime is a **prototyping convenience only — do not port it.** Recreate the markup/styles/behavior as **vanilla HTML, CSS, and JS** in the existing repo, reusing its established patterns and IDs. Self-host the fonts (see Assets) so the app stays offline.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, layout, component states, and interactions are all specified. Recreate pixel-accurately using the repo's vanilla stack. Exact values are in the Design Tokens section and in the companion spec file.

## Files in This Bundle
| File | What it is | How to open |
|---|---|---|
| `Plotypus Shell Prototype.dc.html` | The interactive shell: live workspace switching, Properties panel, all dialogs, plus a static state gallery (empty/loading/warning/selected/disabled/hover/focus) and responsive frames at 1440 / 1280 / 1024. | Open directly in a browser (needs `support.js` beside it — included). |
| `Plotypus Shell - Spec & Handoff.dc.html` | The written spec: architecture audit, alternatives, tokens & measurements, component-state matrix, interaction contract, current→proposed mapping, DOM-hook mapping, icon spec, responsive behavior, implementation plan, acceptance criteria. | Open directly in a browser. |
| `support.js` | Prototype runtime. **Reference only — do not ship.** | — |

**Read the spec file first** — it is the source of truth and is more detailed than this README on the per-component state matrix and the current→proposed migration table.

## Workspaces / Views
The shell is a fixed two-tier header over a `body { workspace + right Properties panel }` split. Switching tabs swaps only the workspace body and the Properties contents; **the header never moves.**

1. **Map** — primary production destination. Centered "paper" canvas with floating zoom/fit control cluster (top) and a quality legend cluster (bottom). Properties: Map details & accessibility summary, Display toggles, Interaction settings.
2. **Project points** — the data-table workspace that sits between Map and "Categories & markers" (see detail below).
3. **Categories & markers** — legend/markers workspace; per-category shape picker + custom icon upload live in its Properties panel, plus a bilingual legend-label field.
4. **Map regions** — choose included boundaries; shows an included-count and a quiet "Add points from a source →" link (opens the point catalog, pre-scoped).
5. **Translate** — direction-aware EN↔FR translation table; respects the project-points authoring language.
6. **Map quality check** — grid of quality cards (bilingual-metadata, label overlaps, leader crossings, longest leader, labels near edge); each card distinguishes pass/warn/danger and offers a "Locate"/"Add French" action.

### Project points workspace
Sticky-header data table (sticky first column too) with a segmented filter (All / Missing coords / Callouts), an authoring-language EN/FR toggle (a **view setting** — never mutates stored data), and toolbar actions: **Add row**, **Add points** (opens point catalog), **Import CSV** (opens column-mapping dialog).

## Key Dialogs (modal over the shell, ~rgba(40,37,32,0.42) scrim)
1. **Import CSV → column mapping.** Auto-matches detected CSV columns to the Plotypus schema (incl. the bilingual `name_en`/`name_fr` pair). Per-field dropdowns to remap; required fields (`name_en`, `type`, `lon`, `lat`) block import until mapped; optional (`name_fr`, `priority`) don't. Shows live sample value per row, flags ignored columns, "First row is headers" toggle, "Save as preset". Confirm lands in Project points.
2. **Point catalog.** Presets (e.g. capital cities) + open-data sources. Homed in Project points (presets create rows). Also reachable from Map regions' quiet link.
3. **Map details (bilingual).** Title + text version, each in **English and Français**, both required. Cites Official Languages Act + WCAG 2.4.2 (title) and 1.1.1 (text alternative). This data goes to the HTML page and Word doc — **never embedded in the SVG/PNG export.** Opened from a "Map details" button in the top command bar; that button shows a **⚠ FR** warning badge (and a subtle red tint/border) whenever the French title or text version is empty, clearing once both are filled.

## Interactions & Behavior (contract)
The spec file's **Interaction Contract** section is authoritative. Core rules:
- **Lightweight vs. expensive:** tab switches, filter toggles, language toggles, opening dialogs, and Properties edits are **lightweight** — they must **not** trigger map re-rendering. Only explicit Fit/Export and canvas zoom touch rendering.
- **Passive vs. actionable readiness:** passive metrics are plain (non-interactive) counts; actionable issues are buttons that route to the relevant workspace/object and carry an accessible name/tooltip.
- **Authoring-language toggle** swaps which name column is editable; it is a view state, never a data mutation.
- **Translate direction** follows the project-points authoring language (start in FR → Translate is reversed).
- **Focus-visible** outline must always be present and visible on keyboard nav.
- **Bilingual-metadata validation** is live: empty FR fields → warning badge on Map details button + danger card in Map quality; both clear when filled.

## Responsive Behavior
Document at three widths (frames included in the prototype): **1440 desktop / 1280 working / ~1024 narrow.** Don't rely on fluid scaling alone — the spec lists exactly what changes at each breakpoint (nav behavior, Properties-panel behavior, toolbar wrapping, table overflow, status-summary behavior, canvas controls, labels that shorten/disappear).

## Design Tokens
Build on the existing repo tokens and extend. The prototype's concrete palette (warm-neutral + forest green, "Direction A"):

### Colors
| Token (suggested) | Value | Use |
|---|---|---|
| `--ink` | `#2A2520` | Primary text (existing repo value `#282a27` is equivalent — keep repo's). |
| `--ink-2` | `#4A4338` | Secondary text / button labels |
| `--ink-3` | `#6B6155` | Tertiary text |
| `--muted` | `#8E8576` | Table header text, captions |
| `--muted-2` | `#9A9183` | Mono captions |
| `--muted-3` | `#B0A795` | Eyebrow labels, faint mono |
| `--accent` | `#3F6B5E` | Forest green — primary actions, selected, "pass". (Repo `--accent:#5b6252`; reconcile — prototype uses the deeper `#3F6B5E`.) |
| `--accent-hover` | `#365E52` | Primary button hover |
| `--accent-soft` | `#E8EFEA` | Green tint fills (repo `--accent-soft:#e2e4da`) |
| `--accent-soft-border` | `#CFE0D8` | Green tint borders |
| `--app-bg` | `#FBFAF6` | App/shell background |
| `--page-bg` | `#E9E6DD` | Outer page behind the shell |
| `--surface` | `#FFFFFF` | Cards, table, dialogs |
| `--surface-subtle` | `#F5F2EB` | Sticky header fill, subtle panels (repo `--surface:#f3f1ea`) |
| `--surface-hover` | `#F0EDE5` | Hover fill, segmented-control track |
| `--border` | `#D4CCBD` | Default control borders (repo `--surface-strong:#ddd9ce`) |
| `--border-soft` | `#E2DCD0` | Card/divider borders |
| `--border-softer` | `#ECE7DC` / `#EFEAE0` | Dialog dividers, table row lines |
| `--warn` | `#9A7B2E` | Amber — warnings/"review" |
| `--warn-bg` | `#F3ECD8` | Warning pill fill |
| `--warn-border` | `#E6D8B4` | Warning pill border |
| `--danger` | `#9A4B3F` | Red — required-missing/error |
| `--danger-bg` | `#F3E4E0` | Danger pill fill |
| `--danger-tint` | `#FBF3F1` / `#FDF6F4` | Subtle danger field/button tint |
| `--danger-border` | `#E3C9C3` | Danger border |

### Typography
- **Body / UI:** `Lato` (weights 400, 700, 900), fallback `'Segoe UI', Arial, sans-serif`.
- **Mono / labels / numbers:** `'IBM Plex Mono'` (400, 500, 600) — used for eyebrow labels, table headers, metric numbers, coordinates.
- Common sizes: H1 24/900; tab & body 13; secondary 12–12.5; table cells ~13; mono eyebrows 8–10 with `letter-spacing:0.08–0.16em; text-transform:uppercase`; metric numbers 14/600 mono.

### Geometry, spacing, elevation
- **Radii:** controls 6–8px; cards/dialogs 9–14px; pills 5–7px; small badges 4–5px.
- **Heights:** primary button 38px; secondary/toolbar button 34px; segmented button 28px; control inputs 30–34px; table header 38px; table rows ~ per spec; tier-2 nav 48px.
- **Borders:** 1px hairlines throughout; 2px for canvas corner ticks and warning-icon strokes.
- **Spacing scale (px):** 2, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 26 — gaps via flex/grid `gap`.
- **Shadows:** card `0 1px 3px rgba(0,0,0,.08)`; floating clusters `0 6px 18px -…`; primary button `0 6px 16px -9px rgba(47,80,71,.7)`; dialog `0 40px 90px -40px rgba(40,37,32,.7)`; canvas paper `0 12px 34px -16px rgba(47,43,39,.45)`.
- **Transitions:** keep subtle (background/color on hover); spinner `@keyframes` for loading, shimmer for skeletons.

## Icons
Single-color line icons, `stroke-width` ~1.7–2, 24×24 viewBox, rendered 12–20px. Use **Lucide** equivalents where possible (the prototype hand-rolls simple paths). Key icons: upload (Import CSV), map-pin (Add points), file-text (Map details), triangle-alert (FR warning badge), shield-check (WCAG note), x (dialog close), plus (Add row), search/locate (quality actions). The repo's `icons.js` should remain the icon source — map these names into it; don't introduce a second icon system.

## Existing DOM Hooks — keep stable
Do **not** rename internal IDs for visual consistency. Preserve the existing behavior hooks: the five tab targets (project points, map regions, translate, map, map quality check), Add row, Import CSV, Load sample, Export SVG/PNG, map-language selector, Fit map + labels, Labels only, Properties panel, workspace summary metrics, project-row filters. New IDs/classes needed (suggested): `mapDetailsBtn`, `mapDetailsDialog`, `csvMapDialog`/`csvMapRow`, `pointCatalogDialog`, `frMetaWarning`. Full mapping table is in the spec file (current → proposed: retained/moved/merged/renamed/removed + reason).

## Assets
| Asset | Format | Notes |
|---|---|---|
| `assets/plotypus-pin.png` | PNG (40×40 & 30×30 render) | Brand pin/logo, already in repo's `assets/`. Bundle locally. |
| Lato + IBM Plex Mono | woff2 | Prototype loads from Google Fonts; **self-host** for offline use. |
| Map canvas art | — | The prototype uses a striped placeholder; the real map is generated by existing export code — **do not change generated output.** |

No remote/copyrighted assets. Everything must work offline.

## Reference Screenshots
In `screenshots/` — captured directly from `Plotypus Shell Prototype.dc.html`, so they match the source exactly. The shell is 1440px wide; captures show the left/main region at the preview width (the right Properties panel is off-frame on some shots — see the prototype for the full width).

| File | Shows |
|---|---|
| `01-map.png` | Map workspace — canvas, zoom/fit cluster |
| `02-project-points.png` | Project points table + filters + EN/FR authoring toggle |
| `03-categories-markers.png` | Categories & markers workspace |
| `04-map-regions.png` | Map regions (included count + "Add points from a source" link) |
| `05-translate.png` | Translate workspace |
| `06-map-quality.png` | Map quality check cards |
| `07-dialog-map-details.png` | Bilingual Map details dialog |
| `08-dialog-csv-mapping.png` | CSV column-mapping dialog |

> Note: in `08`, the column dropdowns render as "Not mapped" in the static capture — that's a screenshot artifact of native `<select>` elements. In the live prototype they auto-match (`Project→name_en`, etc.). Open the HTML to see real behavior.

## Implementation Order (file-oriented)
The spec file has the full plan; in brief — separate structural, styling, behavioral, and risky changes:
1. **Structure** — update the two-tier shell in `index.html`; remove the permanent left sidebar.
2. **Styling** — add layout/nav/token styles in `style.css` (define the custom properties above first).
3. **Behavior** — readiness rendering (passive vs. actionable) in `app.js`.
4. Move category controls into their workspace; wire tab activation.
5. Contextual Properties behavior (show only active-workspace controls).
6. Dialogs: Map details (bilingual + live validation), CSV column mapping, point catalog.
7. Responsive handling for 1440/1280/1024.
8. Accessibility: focus-visible, dialog roles/`aria-modal`, accessible names.
9. Visual regression vs. the prototype screenshots.

## Acceptance Criteria
From the spec (verifiable):
- Navigation stays stationary between workspaces; no permanent left sidebar.
- Categories & markers fully accessible; Map remains the primary workspace.
- Properties never show controls irrelevant to the active workspace.
- Readiness clearly separates passive metrics from actionable issues.
- Tables retain adequate width; no control overlap at supported widths.
- Keyboard focus always visible.
- Existing map rendering and export output unchanged.
- Lightweight actions never trigger expensive rendering.
- App remains usable offline.
- Bilingual metadata incomplete state is surfaced (Map details warning badge + Map quality card) and clears when both FR fields are filled.

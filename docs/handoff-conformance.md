# Plotypus Shell Handoff Conformance

Status: implemented and verified on 2026-06-22.

## Implementation Order

| Handoff requirement | Status | Evidence |
|---|---|---|
| Two-tier command bar and workspace navigation | Complete | Stable `.command-bar` and `.workspace-nav` shell. |
| Map first and selected by default | Complete | Map markup is active initially and `init()` activates `preview`. |
| Categories moved out of the former sidebar | Complete | Categories and markers is a peer workspace; no permanent sidebar remains. |
| Workspace and Properties context hooks | Complete | Every pane has `data-workspace`; Properties groups use `data-props-context` and one contextual renderer. |
| Handoff tokens and deep forest accent | Complete | Shell uses `#3F6B5E` and the specified neutral, warning, and danger families. |
| Passive readiness metrics and actionable review control | Complete | Passive values render as spans; `#workspaceReviewBtn` routes to Map quality check. |
| Numeric typography, sticky names, zebra rows, danger separation, focus rings | Complete | Table and focus states are covered by shell smoke assertions and visual baselines. |
| Contextual Properties | Complete | Map, project row, category, region, translation, and quality contexts are rendered from active workspace and selection. |
| Map details, CSV mapping, and point catalog dialogs | Complete | Dialog semantics, focus trapping, Escape, and focus restoration are browser-tested. |
| 1440, 1280, and 1024 responsive behavior | Complete | Docked widths and 1024 slide-over behavior are browser-tested. |
| Offline runtime | Complete | D3, Papa Parse, Lato, IBM Plex Mono, boundaries, icons, and configuration are bundled. Remote boundary URLs have local fallbacks. |
| Visual regression | Complete | Ten approved baselines cover all desktop workspaces and responsive Map/Project sentinels; a full 18-case matrix is available. |

## Acceptance Criteria

All twelve handoff acceptance criteria pass:

1. Navigation remains stationary between workspaces.
2. No permanent left sidebar remains.
3. Categories and markers has its own keyboard-accessible workspace.
4. Map is the primary default workspace.
5. Properties only shows controls relevant to the current workspace or selection.
6. Passive metrics and actionable issues are visually and semantically distinct.
7. Tables preserve a minimum working width of 760px.
8. Supported widths have no incoherent control overlap.
9. Keyboard focus is visible; dialogs, rows, cards, tabs, and the narrow Properties drawer are keyboard operable.
10. Map rendering and export paths were not changed by the shell redesign.
11. Tab, filter, language, selection, and Properties interactions do not re-plot the map.
12. The app remains usable offline.

## Deliberate Product Decisions

- The prototype's **Fit** wording was superseded by the clearer **Map + labels** and **Labels only** controls requested during implementation.
- Properties uses a single renderer keyed by workspace and selection rather than duplicating static controls for every context.
- The proposed custom-marker file input was removed because it had no safe export implementation. Supporting user artwork requires SVG sanitization, raster embedding limits, project-file schema changes, and explicit export tests. Standard marker shapes remain fully supported.

## Verification Commands

```powershell
node --check app.js
node --check icons.js
node tests\label-geometry.test.cjs
node tests\config-parity.test.cjs
node tests\validate-config.cjs
.\tests\run-shell-smoke.ps1 -Workspace preview -LoadSample
.\tests\run-visual-regression.ps1
.\tests\run-smoke.ps1
```

Use `run-visual-regression.ps1 -FullMatrix` before a release and only update baselines after reviewing every changed image.

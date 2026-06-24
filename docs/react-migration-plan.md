# Plotypus React Migration Plan

## Goal

Move Plotypus from a vanilla HTML/CSS/JS application to a React-based UI in small, reversible slices while preserving:

- Offline-capable local use, including `file://`-friendly export assumptions until deliberately changed.
- Generated SVG/PNG/map output.
- Existing DOM IDs where tests, exports, or user workflows depend on them.
- Current project file compatibility.
- Existing geometry, label layout, project validation, and export behavior.

This should be a UI architecture migration, not a rewrite of the map engine.

## Recommended Stack

### Preferred: React + Vite + TypeScript

Use this if Plotypus remains an offline-first client app.

- `React`: component model for state-driven UI.
- `Vite`: simple local dev server, static build output, low overhead.
- `TypeScript`: catches state-shape and prop drift as the UI grows.
- `Vitest`: unit tests for React utility logic and pure functions.
- `Playwright`: browser smoke and visual regression, replacing or wrapping current PowerShell/Chrome harness over time.
- `Testing Library`: component-level tests for forms, dialogs, tabs, and table interactions.

Why this stack fits:

- Plotypus does not need server rendering.
- Static output can remain deployable on an internal static host.
- Existing pure modules can be imported without forcing a full rewrite.
- Vite can produce a single static bundle while still allowing offline assets.

### Not Recommended Initially: Next.js

Next.js is useful for routed websites, server rendering, API routes, authentication, and deployment conventions. Plotypus is an offline editor with no server dependency, so Next.js would add complexity without much benefit.

Consider Next.js later only if Plotypus becomes a hosted multi-user product with accounts, saved projects, or server-side data integrations.

### Not Recommended Unless Team Standard: Angular

Angular would provide strong form and module conventions, but it is heavier than needed for this app. It may be reasonable only if the maintenance team already prefers Angular and wants a stricter enterprise framework.

## Migration Principles

1. Keep the map renderer stable.
   The SVG drawing, label layout, geometry helpers, project validation, CSV parsing, and export code should stay in plain modules first.

2. Migrate UI shells before rendering internals.
   React should take over buttons, panels, forms, dialogs, tables, and state synchronization before it touches map drawing.

3. Keep existing IDs during transition.
   Current tests and workflows rely on stable IDs such as `#projectTable`, `#mapSvg`, `#propertiesPanel`, and toolbar controls.

4. Treat React state as the source of truth only after each surface is migrated.
   During hybrid phases, React can read/write the existing DOM-backed state. Avoid two competing sources of truth for the same control.

5. Keep every phase shippable.
   Each migration slice should pass syntax, unit, smoke, and visual checks before moving on.

## Target Architecture

```text
src/
  app/
    App.tsx
    app-state.ts
    app-reducer.ts
    selectors.ts
  components/
    shell/
      CommandBar.tsx
      WorkspaceTabs.tsx
      StatusSummary.tsx
    project-points/
      ProjectPointsView.tsx
      ProjectToolbar.tsx
      ProjectTable.tsx
      CoordinateCell.tsx
    properties/
      PropertiesPanel.tsx
      DocumentProperties.tsx
      MapBaselayerProperties.tsx
      RowProperties.tsx
    dialogs/
      MapDetailsDialog.tsx
      CsvMappingDialog.tsx
      PointCatalogDialog.tsx
    map/
      MapCanvasHost.tsx
      CanvasToolbar.tsx
  core/
    geometry.ts
    label-layout.ts
    project-file.ts
    project-io.ts
    map-renderer.ts
  styles/
    tokens.css
    components.css
```

The `core/` modules should remain mostly framework-independent. React should call into them, not absorb them.

## Phase 0: Baseline and Guardrails

Create a migration branch and freeze current behavior with tests.

Tasks:

- Run the full current validation suite and save results.
- Confirm visual baselines are current.
- Document browser support and offline constraints.
- Add a short Architecture Decision Record: "React + Vite, not Next.js, for offline-first static app."
- Identify hard runtime globals currently used by `app.js`, `properties.js`, `workspace.js`, and `project-io.js`.

Acceptance criteria:

- Existing vanilla app still builds/runs unchanged.
- Full smoke and visual regression status is known before migration starts.
- No React code has replaced runtime behavior yet.

## Phase 1: Tooling Scaffold Without UI Migration

Add build tooling while keeping the current app working.

Tasks:

- Add `package.json`, Vite, React, TypeScript, Vitest, ESLint, and Prettier.
- Keep `index.html` able to load the current classic scripts.
- Add a separate `react-entry.html` or feature-flagged entry for early React work.
- Configure static asset handling for `assets/`, `themes/`, local fonts, and vendor libraries.
- Add `npm` scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run test`
  - `npm run lint`
  - `npm run preview`

Acceptance criteria:

- Existing app behavior is unchanged.
- React dev server can render a placeholder shell.
- Static build output contains local assets and does not require network access.

## Phase 2: Extract More Core Logic From `app.js`

Before moving UI to React, isolate logic that should not belong to components.

Candidate modules:

- `map-renderer.js`: SVG drawing, D3 projection, legend/callout drawing, export rendering.
- `project-table-model.js`: row normalization, authoring language conversion, coordinate formatting.
- `map-details-model.js`: missing fields, publish-readiness state.
- `settings-model.js`: layout settings, defaults, preference migration.
- `quality-model.js`: map quality issue aggregation.

Acceptance criteria:

- `app.js` becomes mainly orchestration and event wiring.
- New modules are unit tested.
- Generated map output remains unchanged.

## Phase 3: Design System Components

Build React components that match current UI but do not yet own app state.

Start with low-risk primitives:

- `Button`
- `IconButton`
- `SegmentedControl`
- `Switch`
- `Select`
- `ToolbarGroup`
- `Dialog`
- `PropertySection`
- `TableCell`

Important design rules:

- Components should consume design tokens from `style.css` or a future `tokens.css`.
- Avoid one-off button styles.
- Preserve larger type and spacing preferences.
- Use existing icon system or migrate it as a dedicated React `Icon` component.

Acceptance criteria:

- Story/test page renders each component.
- Component dimensions match current CSS.
- No production UI is replaced yet.

## Phase 4: Replace the Command Bar and Workspace Tabs

Move the top shell into React first because it is broad but relatively shallow.

Components:

- `CommandBar`
- `WorkspaceTabs`
- `ReadinessSummary`
- `LanguageSelector`
- `ExportMenu`

State to bridge:

- Active workspace tab.
- Current map language.
- Export menu open state.
- Map details warning state.
- Undo availability.

Approach:

- Mount React into a new `#appShellRoot`.
- Keep existing content panes managed by vanilla JS.
- React command buttons can call existing functions exposed through a small adapter.

Acceptance criteria:

- Top shell looks the same or better.
- Existing keyboard behavior remains.
- No generated map output changes.

## Phase 5: Migrate Map Details Dialog

This is a good first full React-owned feature because it has clear state and limited side effects.

Components:

- `MapDetailsDialog`
- `BilingualFieldGroup`
- `PublishReadinessBadge`

State:

- `titleEn`
- `titleFr`
- `textEn`
- `textFr`
- missing field summary

Rules:

- Save must allow partial details.
- Warnings remain in Map details and Map quality.
- No native `required` attributes for these fields.

Acceptance criteria:

- Dialog behavior matches current smoke tests.
- Partial save works.
- Warning state updates correctly.

## Phase 6: Migrate Project Points Toolbar

Move the toolbar controls before the table.

Components:

- `ProjectToolbar`
- `ProjectFilters`
- `AuthoringLanguageToggle`
- `AddActions`
- `MultiSelectActions`

State:

- Project filter.
- Authoring language.
- Selected cell fields.
- Selected rows.
- Bulk priority availability.
- Bulk coordinate clear availability.

Acceptance criteria:

- Active language segment is clear.
- `Add > Row`, `Add > From source`, and `Multi select` groups render consistently.
- Ctrl-click table behavior is not affected.

## Phase 7: Migrate Project Points Table

This is the most valuable and highest-risk UI migration.

Components:

- `ProjectTable`
- `ProjectRow`
- `ProjectNameCell`
- `TypeCell`
- `PriorityCell`
- `CoordinateCell`
- `StatusCell`
- `RowSelectCell`

State:

- Rows.
- Active row.
- Selected cells.
- Selected rows.
- Authoring language.

Required behavior:

- Excel-like multi-cell selection.
- Ctrl-click and Shift-click selection.
- Bulk priority changes.
- Bulk coordinate clearing.
- Inline coordinate clear buttons.
- English/French type labels and comma decimals.
- Undo support.

Implementation note:

Use React state for selection, but keep row data updates flowing through a single reducer/action layer. Avoid direct DOM reads once this table is migrated.

Acceptance criteria:

- Existing Project workspace smoke tests pass.
- Keyboard navigation remains usable.
- Paste/import behavior still works.
- CSV export is unchanged.

## Phase 8: Migrate Properties Panel

The Properties panel is currently a large source of repeated UI patterns. Migrating it will reduce drift.

Components:

- `PropertiesPanel`
- `DocumentProperties`
- `MapDisplayProperties`
- `MapBaselayerProperties`
- `ProjectDataProperties`
- `RowProperties`
- `CategoryProperties`
- `RegionProperties`
- `TranslationProperties`
- `QualityProperties`

State:

- Current properties context.
- Panel width.
- Collapsed/open state.
- Active selected object.

Acceptance criteria:

- Resize/collapse behavior is preserved.
- Display controls disable/enable correctly, such as Compact boxes.
- No duplicate bottom guidance text returns.

## Phase 9: Migrate Map Baselayer and Categories Views

Move the remaining data-management tables/cards.

Map Baselayer:

- Boundary selector.
- Region preset selector.
- Region inclusion table.
- Region colour preview and hex display.
- Immediate UI updates before background render.

Categories:

- Category cards.
- Custom marker icon upload.
- Marker styling controls.
- Reorder/remove behavior.

Acceptance criteria:

- Region preset state remains visible after applying.
- Region inclusion/colour order updates immediately.
- Custom icons remain PNG/WebP-only and project-file portable.

## Phase 10: Migrate Translate and Map Quality

Translate:

- Translation direction.
- Missing filter.
- Translation rows.
- Paste column behavior.

Map Quality:

- Quality cards.
- Render telemetry.
- Remediation actions.

Acceptance criteria:

- Typography is consistent with Project points.
- Missing French strings and map details warnings are accurate.
- Quality remediation opens the right dialog/panel.

## Phase 11: Move Map Canvas Host Last

Only migrate the canvas host after the UI shell and data panels are stable.

Recommended approach:

- React owns the container and toolbar.
- Existing D3 renderer owns the SVG content.
- Renderer receives a plain `settings + rows + categories + regions` object.
- D3 should not mutate React-owned DOM outside `#mapSvg`.

Acceptance criteria:

- SVG output is byte-level or visually equivalent.
- Exported SVG/PNG dimensions and styling remain unchanged.
- Label placement and manual positions are preserved.

## Phase 12: Remove Legacy DOM Wiring

After React owns all major UI surfaces:

- Remove obsolete direct DOM event listeners.
- Delete replaced HTML from `index.html`.
- Convert remaining modules to TypeScript if useful.
- Keep core modules framework-independent.
- Update tests to use Playwright/component tests where appropriate.

Acceptance criteria:

- `app.js` is retired or reduced to a small bootstrap.
- No duplicate source of truth remains.
- Full validation suite passes.

## State Management Recommendation

Start with `useReducer` and React context. Do not add Redux immediately.

Use actions such as:

- `setWorkspace`
- `setAuthoringLanguage`
- `updateProjectRow`
- `selectProjectCell`
- `clearCoordinateCell`
- `setMapDisplaySetting`
- `setMapDetails`
- `setPropertiesContext`
- `applyRegionPreset`

Consider Zustand later if reducer/context becomes too noisy. Avoid introducing a large state library before the app state boundaries are understood.

## CSS Strategy

Short term:

- Keep `style.css`.
- Add component class names that reuse existing tokens.
- Avoid CSS-in-JS.

Medium term:

- Split `style.css` into:
  - `tokens.css`
  - `base.css`
  - `components.css`
  - `workspaces.css`
  - `map-output.css`

Critical rule:

Map output CSS must remain separate from app UI CSS so UI changes do not alter exported map output.

## Testing Strategy

Keep current tests during migration. Add React-specific tests gradually.

For each migrated slice:

- `node --check` for unchanged JS modules.
- `npm run test` for React/module tests.
- Existing shell smoke for the affected workspace.
- Visual regression for UI-heavy changes.

Recommended Playwright coverage:

- Project points toolbar and table.
- Map details partial save.
- Properties panel resize/collapse.
- Map baselayer preset and region toggles.
- Custom marker icon upload validation.
- Export smoke for SVG/PNG.

## Risks

- Re-rendering D3-managed SVG from React could alter output.
- Hybrid state can drift if React and vanilla code both own the same setting.
- Build tooling may affect offline deployment if assets are not bundled carefully.
- A full rewrite would likely break many details that are currently covered only by smoke/visual tests.
- CSS migration could accidentally change exported map styling.

## Recommended First Milestone

Do not start by rewriting the whole app.

First practical milestone:

1. Add Vite + React + TypeScript scaffold.
2. Build design-system primitives.
3. Replace Map details dialog.
4. Replace Project points toolbar.
5. Leave Project table and map rendering untouched until the shell pattern is proven.

This gives useful architecture benefits quickly while keeping the highest-risk map/table behavior stable.

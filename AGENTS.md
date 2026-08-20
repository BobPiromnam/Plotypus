# Plotypus Agent Guide

This file is the repository-level operating guide for coding agents and humans making assisted changes to Plotypus. It applies to the entire repository. If a future subdirectory needs genuinely different rules, add a smaller `AGENTS.md` there and keep this file as the common contract.

## 1. Product intent

Plotypus is a local-first, bilingual browser application that turns spreadsheet data into publication-ready static maps. It is designed for policy, research, and communications teams, including Government of Canada internal users, who may not know GIS software.

Protect these product qualities in every change:

- The app works as static HTML, CSS, JavaScript, and bundled assets. Normal offline use needs no build, account, database, hosted service, or network connection.
- Project data stays on the user's computer unless the user explicitly saves, exports, copies, or shares it.
- English and French are equal product surfaces.
- The primary output is a fixed-layout, editable or printable map, not an interactive web map.
- Automation should assist the user without erasing deliberate manual placement.
- Automated QA supports editorial review; it does not replace inspection of the final export.
- The interface should feel like a professional commercial application: calm, legible, spacious, predictable, and task-focused.

Government context is a usability and trust requirement, not permission to reintroduce a Government of Canada Design System skin. The current Plotypus visual system is the source of truth. Do not add GCDS styling, Canada.ca chrome, or a new colour scheme unless the user explicitly requests it.

## 2. Ground rules

Before editing:

1. Read the user's full request and inspect the affected rendered state, source, tests, and current `git diff`.
2. Treat the worktree as shared and potentially dirty. Preserve unrelated changes and never reset, discard, or overwrite work you did not create.
3. Search for the existing component, token, translation key, and test before inventing a new pattern.
4. Identify the smallest coherent change that fixes the underlying component or class contract, not only the screenshot symptom.
5. If a requested change conflicts with current code or another current requirement, show the exact conflict and ask. Otherwise proceed without unnecessary confirmation.

During implementation:

- Keep changes in scope. Do not add dependencies, introduce a framework, migrate architecture, or change project-file compatibility as an incidental cleanup.
- Prefer focused, reversible patches. Use existing modules and class contracts.
- Add or update a regression test for every bug fix when the repository has a suitable test layer.
- Never claim a visual issue is fixed from CSS inspection alone. Render and inspect the affected state.
- Do not commit, push, publish, or update visual baselines unless the user explicitly asks.

When instructions disagree, current user intent and observable repository behaviour outrank stale prose. Update this file when a repeated correction reveals a durable repository rule.

## 3. Repository map and architecture

Important files:

| Path | Responsibility |
| --- | --- |
| `index.html` | Static shell, workspaces, dialogs, semantic structure, script order |
| `style.css` | Canonical application tokens, components, responsive behaviour, and states |
| `app.js` | Main application state, orchestration, rendering, import/export, and interaction wiring |
| `properties.js` | Contextual Properties renderers and document/object controls |
| `workspace.js` | Workspace summary and shell helpers |
| `i18n.js` | English and French UI dictionaries |
| `config.js` | File-mode defaults used when the app opens directly from `file://` |
| `plotypus.config.json` | Editable hosted/local-server configuration |
| `project-file.js`, `project-io.js` | Project validation, migration, snapshots, and exchange formats |
| `geometry.js`, `label-layout.js` | Geometry and label-layout policy |
| `reference-cities.js`, `city-integration.js`, `src/lib/city-search*` | Bundled city catalogue and Markers city workflow |
| `icons.js` | Shared icon paths and rendering |
| `tests/*.test.cjs` | Fast Node contract and unit tests |
| `tests/shell-interactions.html` | Browser interaction, layout, accessibility, and smoke assertions |
| `tests/run-*.ps1` | Windows Chromium/Edge smoke, accessibility, responsive, and visual workflows |
| `tests/visual-baselines/` | Reviewed reference screenshots |
| `tools/css-selector-audit.cjs` | CSS duplicate-selector, duplicate-declaration, and `!important` audit |

The runtime uses ordered browser scripts and `window.PLOTYPUS_*` APIs so direct-file mode continues to work. Preserve script order and exported global contracts. Do not convert one file to ESM or add a bundler in isolation.

`config.js` and `plotypus.config.json` are paired sources for file and server modes. When changing shared configuration, update both and run the parity test. Arrays replace defaults; objects merge with defaults.

Do not hand-edit generated city runtime data without checking the relevant builders in `tools/`. Preserve project schema migrations and stable category, row, layout, and city IDs.

## 4. User workflow and product language

The interface teaches the order of operations through the non-modal workflow guide, contextual empty states, and one relevant next action. Do not add a forced first-run tour unless the user requests one.

The established five-step guide is:

1. **Markers** — add, paste, import, or locate project data.
2. **Map baselayer** — choose the boundary, included regions, visibility, and fills.
3. **Translate** — complete and review the French content.
4. **Map** — arrange the document, legend, labels, furniture, and map output.
5. **QA** — resolve automated issues, inspect the output, and export.

Keep the existing workflow icons. “Markers” and “QA” are compact workflow labels; longer workspace or explanatory labels may remain where clarity requires them. Do not rename internal keys or persisted data merely to match display copy.

Reference-city UI has one home: **Markers**, and only while the user chooses **Locate by City**. Do not expose it in startup, Map baselayer, Map Document Properties, settings, or a generic catalogue entry point. City data is bundled and offline. A chosen city creates or locates a project marker; it is not independent baselayer decoration.

Use plain, task-oriented copy. A first-time user should be able to answer: what should I do next, where do I do it, and what will happen? Avoid unexplained numbers, icon-only meaning, technical implementation terms, and instructional paragraphs that duplicate visible controls.

## 5. UI and interaction design contract

### Hierarchy and density

- Each workspace has one obvious primary action. Secondary actions are outlined/default; utilities are quiet or icon buttons; destructive actions use the shared danger treatment and usually live in an overflow menu.
- Do not duplicate the same command in the workspace and Properties unless both placements serve distinct contexts.
- Use progressive disclosure. Keep frequent, required controls visible and move advanced or infrequent controls into a clearly labelled section or overflow menu.
- Properties is contextual. Open object-specific controls when a row, label, legend item, callout, or map object is selected; do not repeat entire workspace toolbars in the inspector.
- Empty states should explain the next decision and offer a compact, visually balanced primary/secondary/tertiary action group.
- Preserve persistent save feedback such as Saved or Unsaved changes.
- Prefer read-first tables and focused editing over a permanently dense spreadsheet of active fields.

### Button and control classes

Use the established shared classes and the inventory in `docs/button-inventory.html`:

- `.btn-primary`
- `.btn-default`
- `.btn-danger`
- `.btn-quiet`
- `.btn-icon`
- `.btn-toggle`
- `.btn-card`

Frequent controls use `--control-h` (44px), compact controls use `--control-h-compact` (36px), and passive chips use `--chip-h` (28px). Do not invent additional height scales or locally resize a shared button. Buttons with icons need a deliberate, shared icon; do not leave an accidental empty icon slot. Icon-only buttons require an accessible name and tooltip where useful.

### Typography

Use semantic type classes and tokens rather than element-specific font overrides. The current application scale is:

| Role | Token | Size / line height |
| --- | --- | --- |
| Display | `--type-display-*` | 30 / 36px |
| Page title | `--type-page-title-*` | 28 / 34px |
| Dialog title | `--type-dialog-title-*` | 24 / 30px |
| Panel title | `--type-panel-title-*` | 22 / 28px |
| Card title | `--type-card-title-*` | 18 / 24px |
| Accordion summary | `--type-summary-*` | 16 / 22px, bold |
| Control, field, button | `--type-control-*` | 15 / 20px |
| Supporting copy | `--type-supporting-*` | 14 / 20px |
| Metadata and caption | `--type-caption-*` | 13 / 18px |
| Eyebrow | `--type-eyebrow-*` | 12 / 16px |

The hierarchy matters more than making everything small. If adjacent levels look indistinguishable in a rendered view, enlarge the higher-level role through the shared token rather than adding a local override. Accordion summaries must look like headings and must not appear smaller or weaker than their children. Use IBM Plex Mono only for coordinates, measurements, metrics, and other genuinely tabular data.

### Properties accordions

All Document Properties expand/collapse sections are instances of one component, using `.properties-accordion`, `.properties-accordion-summary`, and shared content wrappers. They must have:

- the same collapsed summary height, padding, border, type role, chevron, hover, focus, and open state;
- a summary that is visually stronger than labels and control text below it;
- content spacing based on shared tokens, not section-name selectors;
- no taller one-off row such as Boxes, no smaller headings such as Boxes or Interaction, and no section-specific typography fixes;
- predictable focus and keyboard operation from native `details`/`summary` semantics.

When improving one accordion, inspect every Document Properties accordion in both collapsed and expanded states. Fix the reusable class if the issue is shared. A content-specific layout class is acceptable for its inner grid; it must not redefine the summary component.

### Icons

Icons must be distinct, intuitive, and consistent with the existing stroke family. Preserve the approved navigation icons. A marker should read as a pin; Map and Map baselayer must not be visually interchangeable; combined concepts may exaggerate a pin hovering above a map. Do not replace approved icons during unrelated work.

### Layering, scrolling, and geometry

- Menus, popovers, tooltips, and dialog content must appear above following cards and must not be clipped by an unintended overflow ancestor.
- Sticky/frozen table columns need an opaque background, a clear divider, and a complete selected-cell outline. Horizontally scrolled cells must never show through or render above them.
- Keep both table scroll axes inside the workspace. Do not let the page become the accidental horizontal scroll container.
- Floating QA, canvas, or status controls must not cover the map, legend, callout, scrollbars, or selected object. Prefer reserved layout space or collision-aware placement over arbitrary `z-index` escalation.
- Resizable callouts may become narrow. Let their text and controls wrap/reflow; do not preserve an unnecessary minimum width that blocks the user's resize.
- Popovers should remain visible when another legend item or card follows them.

### Numeric presentation

Display project longitude and latitude at a consistent two-decimal precision. Use a decimal point in English and a decimal comma in French. Keep full numeric values in data/state when appropriate; formatting is a presentation concern.

Display map and canvas scale as whole percentages. The map-scale control uses one-percent steps, so resize interactions must normalize committed values to that step and must never expose raw floating-point tails in inputs, badges, status text, saved projects, or exports.

## 6. CSS architecture

`style.css` is a design system, not an append-only patch log.

- Reuse root colour, type, spacing, radius, icon, and control-size tokens. Add a token only when it represents a repeated semantic decision.
- Prefer a single low-specificity class for a component and explicit modifier/state classes such as `.is-open`, `.is-selected`, or `[data-state]`.
- Do not style reusable components through IDs, long ancestry chains, section names, positional selectors, or a later duplicate rule.
- Do not add inline presentation styles from HTML or JavaScript when a class/state can express the same result. Dynamic map geometry is an exception; UI component styling is not.
- Do not add new `!important` declarations. Existing narrowly documented accessibility, visibility, or SVG presentation exceptions are legacy contracts, not examples to copy or expand.
- Do not add a second rule for an existing selector in the same scope. Edit or consolidate the canonical rule.
- Keep declarations that define a component together. Do not rely on a surprising late source-order override.
- Use media queries only at the four documented shell boundaries: 1280, 1080, 840, and 620px. Prefer container queries for component behaviour that depends on workspace width.
- Use `:where()` when a precise structural match needs deliberately zero specificity. Do not escalate selector weight to win a cascade dispute.
- Run the CSS audit after every stylesheet change.

The only acceptable targeted override is one that expresses a real semantic variant, uses a named class or data state, and cannot be represented by the base component. It must not change shared typography or control metrics accidentally.

## 7. Responsive and visual quality gate

Visual acceptance is part of implementation, not a final optional check.

For every affected screen, tab, dialog, Properties state, popover, or empty state:

1. Render representative data and the empty state when both exist.
2. Inspect default, hover, keyboard focus, active/selected, expanded, menu-open, error, loading, and disabled states that the change can affect.
3. Inspect English and French. French is a required long-copy stress case.
4. Test at 1440×1000, 1280×900, and 1024×900; also cross the relevant 1280/1080/840/620 boundaries when layout behaviour changes.
5. Check the full viewport, not only the edited component. Look for collisions, accidental whitespace, uneven alignment, clipped focus rings, hidden content, scrollbars, menu stacking, and changes in visual rhythm.
6. Inspect in greyscale when hierarchy or disabled/active states rely heavily on colour.
7. Compare before and after screenshots. Run a second skeptical pass specifically looking for what now looks odd.

A browser test saying “no overflow” does not prove the layout looks professional. Automated geometry and screenshots supplement human visual review; neither replaces the other.

Do not update a visual baseline simply to make a failing test green. Review every changed image, confirm the difference is intentional, and update baselines only when the user authorized the resulting design.

## 8. Accessibility contract

Target WCAG 2.2 AA across every workspace, dialog, popover, menu, Properties panel, and exported accessible text path.

- Normal text contrast: at least 4.5:1. Large text: at least 3:1. Meaningful UI boundaries, focus indicators, and graphical controls: at least 3:1 against adjacent colours.
- Information and state cannot depend on colour alone.
- All functions must be keyboard operable with a visible focus indicator. Focus must not be clipped, obscured, or trapped outside a modal.
- Use native elements and semantics first. Add ARIA only where native HTML does not express the relationship.
- Every control needs an accessible name. Visible button text and the accessible name should agree.
- Dialogs need an accessible name, initial focus, focus containment, Escape handling when dismissal is allowed, and focus restoration.
- Menus and popovers must close predictably without making their triggers unreachable.
- Text must survive 200% zoom and user text-spacing changes. Content must reflow without two-dimensional page scrolling at narrow widths except for intentionally scrollable data tables and map canvases.
- Touch/pointer targets should normally use the 44px frequent-control size; compact 36px controls are for dense desktop contexts with sufficient separation.
- Automated axe results are a floor. Manually test reading order, keyboard order, focus, instructions, error recovery, zoom, and colour-independent meaning.

## 9. Bilingual content and data

- Add every new user-facing string to both `en` and `fr` dictionaries in `i18n.js` in the same change.
- Keep interpolation variables identical between languages and use the existing translation functions rather than hard-coded UI strings.
- Use proper accents, apostrophes, multiplication signs, en/em dashes, non-breaking characters, and locale-aware decimal formatting where appropriate.
- Do not shrink French text to force it into an English-sized box. Make the component reflow.
- Keep user-facing copy plain and task-focused. Preserve stable internal IDs even when labels change.
- Treat imported project data as untrusted. Escape text inserted into HTML and preserve existing file-size, row-count, image-type, and schema validation.
- Custom marker artwork remains bounded PNG/WebP embedded as data; do not add remote image URLs or arbitrary SVG upload without an explicit security design.

## 10. Offline, privacy, export, and performance

- Do not add runtime CDN dependencies, web fonts, analytics, telemetry transmission, remote city lookup, or network-only functionality.
- Boundary sources may have configured remote URLs, but bundled local fallbacks must continue to support offline/direct-file use.
- A feature is not complete until it works when `index.html` is opened from `file://` where the current architecture supports it.
- Saved projects and exports must remain portable and self-contained. Test a save/open round trip when changing persisted state.
- Preserve manual label, marker, map, legend, and callout placement through ordinary renders. Only an explicit auto-place action may recalculate deliberate layout.
- Avoid unnecessary map re-plots for tab, filter, language, selection, or Properties-only interactions. Use the existing render scheduler and performance diagnostics.
- Dragging or resizing an already-rendered label, marker, legend, or callout should patch that SVG object and refresh QA separately. Do not show the map loading state or schedule a full render when the edited object can be updated locally.
- Respect the configured budgets: 200ms ordinary render, 1500ms auto-place, 800ms export, 30-sample window, unless configuration intentionally changes.
- Inspect SVG and PNG output after changes to typography, geometry, colours, markers, leader lines, furniture, image embedding, or export code.

## 11. Testing and verification

Choose checks in proportion to risk, but never skip the fastest relevant contract test.

### Fast cross-platform checks

```text
node --check app.js
node --check properties.js
node tests/run-unit-tests.cjs
node tools/css-selector-audit.cjs
node tests/validate-config.cjs
node tests/validate-runtime-assets.cjs
node tests/validate-workflows.cjs
node tools/build-reference-city-runtime.cjs --check
node src/lib/city-search.js
git diff --check
```

Run the syntax check for every JavaScript file you modify, not only the examples above. `node tests/run-unit-tests.cjs` discovers all root `*.test.cjs` files.

Useful focused tests include:

```text
node --test tests/css-contracts.test.cjs
node --test tests/typography.test.cjs
node --test tests/test-suite-contracts.test.cjs
node --test tests/reference-cities.test.cjs
node --test tests/config-parity.test.cjs
node --test tests/label-geometry.test.cjs
node --test tests/render-scheduling.test.cjs
```

### Browser and Windows quality checks

The PowerShell runners expect Windows Chrome or Edge; use them on a compatible host:

```powershell
.\tests\run-shell-smoke.ps1 -Workspace preview -LoadSample -StrictDiagnostics
.\tests\run-accessibility-smoke.ps1
.\tests\run-responsive-matrix.ps1
.\tests\run-translation-hardening.ps1
.\tests\run-visual-regression.ps1
.\tests\run-smoke.ps1
```

Use `run-visual-regression.ps1 -FullMatrix` before a release. For a focused visual change, narrow with `-Workspace` or `-Case`, inspect the produced screenshot and diff, then run the broader matrix appropriate to the affected shared component.

When the Windows harness is unavailable, still run Node tests, serve the repository locally, inspect it with an available browser at the required viewports, and state exactly which Windows-only checks remain unrun.

### Change-to-test routing

| Change | Minimum verification |
| --- | --- |
| CSS or component markup | CSS audit, CSS/typography/UX tests, rendered before/after inspection, affected visual cases |
| Properties | Properties tests, every accordion state, keyboard/focus, responsive inspector |
| Dialog/menu/popover | Shell scenario, focus/Escape/restoration, stacking and clipping, accessibility scan |
| i18n/copy | Unit suite, translation hardening, English and French visual states |
| Config | Config parity, config validator, direct-file fallback |
| Project schema/state | Focused tests, migration compatibility, save/open round trip |
| Import/export/map geometry | Focused unit tests, sample smoke, QA checks, final SVG/PNG inspection |
| City workflow | Reference-city tests, Markers City mode only, offline/direct-file smoke |
| Shared shell/responsive CSS | Full workspace visual matrix and boundary crossings |

## 12. Definition of done and handoff

Before reporting completion:

- Re-read the user request and verify every requested item.
- Review `git diff --stat`, `git diff`, and `git status --short`; confirm no unrelated file was changed.
- Confirm tests cover the regression and are not merely matching implementation text without behaviour where a behavioural check is possible.
- Inspect the final UI at the stated viewports and languages.
- Report the outcome first, then the important files changed, tests run, visual states/viewports inspected, and any remaining risk or unavailable check.
- Do not say “WCAG compliant” based only on axe. Say which automated and manual checks passed.
- Do not say “pixel-perfect,” “professional,” or “fixed” unless the rendered evidence supports it.

## 13. Maintaining these instructions

Keep this guide concrete and current. Commands, paths, values, and component names must exist in the repository. Remove stale rules when the product changes. Prefer one enforceable rule plus a test over repeated prose. If this file becomes too large, move specialized guidance into scoped `AGENTS.md` files close to the relevant code rather than duplicating it.

This guide was informed by:

- [OpenAI: Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) — scope, precedence, concise review rules, and verification.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — contrast, reflow, focus, input, and accessibility requirements.
- [Canada.ca design principles](https://design.canada.ca/designing-content.html) and [Content Style Guide](https://design.canada.ca/style-guide/) — task completion, trust, plain language, accessibility, and equivalent official-language content.
- [MDN: CSS specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity) — low-specificity component CSS, `:where()`, and avoiding specificity escalation.
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots) and [accessibility testing](https://playwright.dev/docs/accessibility-testing) — stable screenshot environments and combining automation with manual assessment.
- Public AGENTS.md files in [OpenAI Agents Python](https://github.com/openai/openai-agents-python/blob/main/AGENTS.md), [OpenHands](https://github.com/OpenHands/OpenHands/blob/main/AGENTS.md), and other open-source projects — repository maps, exact commands, change-to-test routing, and explicit skip conditions.

Community articles and forum discussions reinforce two cautions adopted here: generic “follow best practices” prose is weak compared with exact repository commands, and a long instruction file must be periodically tested and pruned so it does not drift from the code.

# Changelog

Notable user-facing changes to Plotypus are recorded here. Changes are grouped
by Added, Changed, Fixed, and Removed, and released versions use the app's
date-based `YYYY.MM.DD` version format.

This changelog begins with work that was still unreleased on 2026-08-18.
Earlier project history remains available in the Git commit log.

## Unreleased

### Added

- Added fictional city and province/territory CSV datasets alongside the
  existing longitude/latitude sample, with automated import validation for all
  three location modes.
- Added dominant-colour detection for uploaded PNG and WebP marker icons.
- Added category controls to match leader lines to a custom icon colour, turn
  matching off, or adjust the detected colour for multicolour icons and opaque
  backgrounds.
- Added a five-step, non-modal workflow guide that directs first-time users
  through Markers, Map baselayer, Translate, Map, and QA.
- Added repository-level `AGENTS.md` guidance, a canonical button inventory,
  CSS selector auditing, and test-suite contract checks.
- Added rendered regression coverage for workspace headings, responsive
  layouts, Properties components, City editing, sticky table headers, and
  bilingual UI states.
- Added an animated documentation demo of dragging labels, moving unlocked
  markers, and resizing the baselayer, backed by a reusable real-interaction
  capture mode in the headless screenshot harness.

### Changed

- Leader-line colour resolution now uses a point's manual override first, then
  an enabled custom-icon category colour, and finally the document-wide colour.
- Custom-icon leader-line settings are preserved in saved projects and SVG
  exports. Existing project files keep their previous appearance until matching
  is enabled.
- Standardized application typography around reusable semantic classes and the
  shared display, page, dialog, panel, card, summary, control, supporting,
  caption, and eyebrow tokens.
- Restored concise headings across all five workspaces and reduced excessive
  introductory whitespace.
- Consolidated Document Properties accordions, descriptions, draft editors,
  labels, control spacing, and typography into shared component contracts.
- Refined the Markers toolbar and table with content-aware column sizing, an
  opaque frozen Project name column, complete selected-cell outlines, contained
  scrolling, and clearer responsive command priorities.
- Restricted bundled offline city selection to Markers while **Locate by City**
  is active; legacy baselayer reference-city state is removed during project
  normalization.
- Simplified Map canvas controls, QA presentation, empty states, and callout
  editing while preserving deliberate manual layout.
- Reworked callout resizing to update the affected SVG furniture and QA state
  without scheduling an unnecessary full map render.
- Pruned obsolete overlapping tests and aligned the Windows smoke,
  accessibility, translation, and responsive matrices with the current
  workspaces and CSS boundaries.
- Refreshed every repository documentation screenshot and visual-regression
  baseline from the current Markers, Baselayer, Translate, Map, and QA views.
- Reorganized the repository into clear runtime, style, branding, data, sample,
  script, test, tool, and documentation directories while preserving direct
  `file://` use and the existing ordered-script architecture.

### Fixed

- Custom marker upload failures now show the exact validation error inside the
  category's upload panel and move keyboard focus to the message.
- Kept inline City search interactions in the Markers table from opening
  contextual Properties; intentional row selection still opens the updated row
  in Properties.
- Kept sticky Markers table headings above scrolled City inputs, selected-cell
  outlines, and autocomplete results.
- Normalized displayed map scale values to whole percentages so drag feedback
  no longer exposes floating-point tails.
- Allowed narrow no-coordinate callouts to reflow and wrap their heading and row
  text.
- Prevented floating QA controls and compact table/editor states from obscuring
  primary content.
- Corrected inconsistent Properties typography, control alignment, spacing, and
  disabled-state hierarchy.

### Removed

- Removed superseded design handoffs, completed audit and migration plans,
  unused branding exports, and an obsolete standalone loading fixture. Current
  guidance and reviewed screenshots remain in `docs/`; historical tracked
  material remains available through Git history.

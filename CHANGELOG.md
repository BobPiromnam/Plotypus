# Changelog

Notable user-facing changes to Plotypus are recorded here. Changes are grouped
by Added, Changed, Fixed, and Removed, and released versions use the app's
date-based `YYYY.MM.DD` version format.

This changelog begins with work that was still unreleased on 2026-08-18.
Earlier project history remains available in the Git commit log.

## Unreleased

### Added

- Added a visual gallery of six map styles with separate actions to apply a
  style to existing data or load an editable example.
- Added the **Numbered projects** style and a **Names / Numbers** choice for
  every style. Stable, editable map numbers replace dense project names;
  movable badges retain their geographic locations and use connectors when
  displaced. Several locations of one project can share a number.
- Added a bilingual project-title table preview with printable/copyable HTML
  and CSV exports, plus QA warnings for conflicting numbers and titles.
- Added the **Regional briefing** style with six region colours, editable
  bilingual briefing blocks, coloured connectors, bundled equipment
  illustrations, and a landscape page preset. Saved projects and SVG/PNG
  exports include the artwork.
- Added regression coverage for style selection, numbered badges, companion
  tables, illustrated examples, thumbnail fidelity, and save/open round trips.
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

- Made style selection optional during new-map setup, which now continues to
  **Markers**. Later changes live in **Document Properties → Map style →
  Change style**; the collapsed section shows the current style and selected
  map objects offer **Back to Document**.
- Improved **Fit: map + labels** for the Canada sample by placing names around
  the perimeter to leave more room for the map, while preserving manual layout
  through ordinary renders.
- Simplified number cells, QA instructions, and next-step guidance by removing
  repeated wording and redundant actions.
- Renamed the generic QA “Locate first” action to “Review on map” so its
  destination and purpose are clear before users leave the QA workspace.
- Replaced the global Markers location mode with a per-marker Province or
  territory → City → Exact coordinates hierarchy. More precise values now
  override broader fallbacks without deleting them, and the toolbar only
  changes which location columns are visible for editing.
- Reworked marker Properties to show all three location levels together with a
  clear “Marker positioned using” status, while preserving legacy project data
  through the version 10 project format.
- Leader-line colour resolution now uses a point's manual override first, then
  an enabled custom-icon category colour, and finally the document-wide colour.
- Custom-icon leader-line settings are preserved in saved projects and SVG
  exports. Existing project files keep their previous appearance until matching
  is enabled.
- Standardized application typography around reusable semantic classes and the
  shared display, page, dialog, panel, card, summary, control, supporting,
  caption, and eyebrow tokens.
- Standardized control, group, surface, and dialog corner geometry; aligned
  composed toolbar controls; and introduced restrained shared menu, dialog,
  feedback, and reduced-motion transition contracts.
- Restored concise headings across all five workspaces and reduced excessive
  introductory whitespace.
- Standardized the page-heading and first-content gutters across all five
  workspaces, and replaced accidental Markers toolbar wrapping with deliberate
  container-responsive command rows.
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
  without scheduling an unnecessary full map render, while reflowing callout
  text continuously as the resize handle moves.
- Pruned obsolete overlapping tests and aligned the Windows smoke,
  accessibility, translation, and responsive matrices with the current
  workspaces and CSS boundaries.
- Refreshed every repository documentation screenshot and visual-regression
  baseline from the current Markers, Baselayer, Translate, Map, and QA views.
- Reorganized the repository into clear runtime, style, branding, data, sample,
  script, test, tool, and documentation directories while preserving direct
  `file://` use and the existing ordered-script architecture.

### Fixed

- Made gallery thumbnails reflect each example's palette, category symbols,
  label treatment, and distinctive coloured illustrations in both languages.
- Kept canvas controls in reserved space so they wrap without covering the map
  or document caption.
- Preserved separate English/French name and numbered-badge placements when
  switching label modes, changing styles, and saving or reopening projects.
- Reworked the narrow workflow rail's QA warning into a balanced, single-row
  shield-and-count action while retaining its full accessible description.
- Centred the compact save-state dot inside a square passive status chip at
  narrower toolbar widths.
- Kept missing-location **Fix** actions in the Markers Status column instead of
  allowing them to float over long project names when location modes change.
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
- Vertically centred the Compact and Rich choices in the Extra info Properties
  control.

### Removed

- Removed style selection from the canvas toolbar and the duplicate startup
  card in favour of the setup and Document Properties routes.
- Removed the empty Note and Source placeholders from the document-page preview.
- Removed superseded design handoffs, completed audit and migration plans,
  unused branding exports, and an obsolete standalone loading fixture. Current
  guidance and reviewed screenshots remain in `docs/`; historical tracked
  material remains available through Git history.

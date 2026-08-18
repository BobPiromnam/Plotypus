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

### Changed

- Leader-line colour resolution now uses a point's manual override first, then
  an enabled custom-icon category colour, and finally the document-wide colour.
- Custom-icon leader-line settings are preserved in saved projects and SVG
  exports. Existing project files keep their previous appearance until matching
  is enabled.

### Fixed

- Custom marker upload failures now show the exact validation error inside the
  category's upload panel and move keyboard focus to the message.

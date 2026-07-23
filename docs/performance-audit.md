# Plotypus performance audit

Date: 2026-07-22

## Implemented

- Rich-label text, title, border, image-size, and content changes use a targeted SVG patch. The map loader is painted before the patch, focus remains in Properties, and the map boundary, markers, legend, and unrelated labels are not rebuilt.
- Collision and leader-quality checks after a targeted patch reuse the existing time-sliced idle analyzer. Repeated edits coalesce instead of starting parallel analyses.
- File-based CSV parsing uses Papa Parse's worker mode for files of 256 KB or larger when Workers and an HTTP(S) origin are available. Small files avoid Worker startup overhead, and local `file:` use retains the synchronous compatibility path.
- Boundary bundles are loaded and normalized on demand, then cached for the session. The default Canada workspace no longer downloads or parses the 689 KB world bundle until World is selected, and repeated boundary switching does not repeat normalization.
- The 6.6 KB XLSX reader is loaded only after an XLSX file is selected.
- The map host uses layout/paint containment so a map repaint does not invalidate unrelated workspace layout.

## Audit findings

| Area | Current behaviour | Recommendation |
| --- | --- | --- |
| Rich-label editing | Targeted and non-blocking after this change | Keep the full render fallback for projection or layout-setting changes. |
| Quality analysis | Already split into roughly 7 ms idle slices | Keep on the main thread for now. A Worker becomes worthwhile only for very large maps or if telemetry shows repeated quality overruns. |
| Automatic placement | CPU-heavy candidate scoring and optimization remain synchronous | Best next Worker candidate. First extract a serializable layout request containing projected points, category sizes, obstacles, manual positions, and settings so the main thread and Worker do not duplicate policy code. |
| SVG construction | D3 DOM creation must run on the main thread | Prefer targeted layer updates. Chunked full drawing is possible for hundreds of markers, but it needs an atomic swap so exports never capture a half-rendered map. |
| Project table | Every project is represented by live DOM and the DOM is the current data source | For hundreds of rows, move to a state-backed model and virtualize off-screen rows. This will outperform a Worker because the cost is DOM/layout rather than computation. |
| XLSX import | Reader is now lazy, but large workbook XML is still parsed on the main thread | If large workbooks become common, replace DOMParser with a Worker-safe streaming XML reader and move ZIP/XML parsing to a Worker. |
| PNG export | Image loading and `canvas.toBlob` are asynchronous, but SVG raster drawing happens on the main thread | Consider OffscreenCanvas in a Worker only if large PNG exports exceed the configured export budget; confirm font and SVG-image consistency first. |
| Undo snapshots | Rich image data URLs can be repeated across up to 25 snapshots | Introduce an asset registry keyed by content hash and store references in rows/history. This is a larger persistence migration but offers the biggest memory reduction for image-heavy projects. |
| Boundary data | Bundles and normalized geometry are loaded and cached on demand | Keep the two-boundary session cache; revisit eviction only if many more large boundary sets are added. |

## Suggested order for future work

1. Add row-count and long-task telemetry around auto-placement.
2. Extract auto-placement into a serializable, testable Worker job.
3. Move project data out of table DOM and virtualize large imports.
4. Deduplicate embedded assets across rows and undo history.
5. Revisit Worker-based XLSX and OffscreenCanvas export only if real files cross the existing performance budgets.

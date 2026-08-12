# Plotypus performance audit

Updated: 2026-08-12

## Implemented

- Rich-label text, title, border, image-size, and content changes use a targeted SVG patch. The map loader is painted before the patch, focus remains in Properties, and the map boundary, markers, legend, and unrelated labels are not rebuilt.
- Translation edits use a single-scale layout refresh instead of re-running the full multi-scale fit search. The refresh is queued with a navigation grace period, canceled when the user leaves Map or Map quality, and resumed on return so workspace tabs remain responsive.
- Full web-map renders enter one idle-priority scheduler. The scheduler coalesces repeated requests, waits for two paints before requesting idle time, cancels queued work when the user leaves Map or Map quality, and retains one pending refresh for the next visit.
- Map-style changes, boundary changes, and project loading no longer call the renderer synchronously from their interaction handlers. Edits made outside Map update their workspace immediately and defer the map until Map or Map quality is opened.
- Compact and rich label title, footnote, wrapping, content, border, and leader-style edits patch the selected SVG label and leader in place rather than rebuilding the map.
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

## Interaction render inventory

| Interaction family | Map work | Scheduling |
| --- | --- | --- |
| Workspace navigation, selection, filtering, dialogs, Properties resizing, and canvas zoom | None | Immediate UI-only update |
| Project, region, translation, category, map-style, boundary, and project-load edits outside Map | Full render when next needed | Retained offscreen and coalesced until Map or Map quality opens |
| Map settings, category geometry, region geometry, reset actions, and undo while Map is visible | Full render | Two paints, then idle-priority execution with a timeout fallback |
| Label text, width, rich content, border, and leader style while Map is visible | Selected-label SVG patch plus quality analysis | Animation frame for the patch; time-sliced idle quality analysis |
| Label, marker, legend, and callout dragging | Live element patch during drag; reconciliation only where geometry requires it | Drag updates are immediate; reconciliation is queued after drag end |
| Map quality after a geometry patch | No map render | Coalesced, time-sliced idle analysis |
| SVG print export | Print render and web-render restoration | Intentionally synchronous because the downloaded artifact must reflect one consistent print layout |
| Application startup | Initial full render | Intentionally direct before the workspace is handed to the user |

## Suggested order for future work

1. Add row-count and long-task telemetry around auto-placement.
2. Extract auto-placement into a serializable, testable Worker job.
3. Move project data out of table DOM and virtualize large imports.
4. Deduplicate embedded assets across rows and undo history.
5. Revisit Worker-based XLSX and OffscreenCanvas export only if real files cross the existing performance budgets.

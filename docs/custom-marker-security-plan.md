# Custom Marker Security and Export Plan

Step 3 starts with design only. Plotypus should not add arbitrary marker uploads until a department has a concrete publishing need, approved file rules, and a clear export requirement.

## Current State

- Categories use configured marker shape names such as `circle`, `square`, `diamond`, `triangle-up`, `triangle-down`, `star`, `plus`, and `cross`.
- Marker shapes are rendered as SVG nodes inside the map SVG.
- SVG export serializes a cloned `#mapSvg`.
- PNG export rasterizes a cloned SVG through an `Image` and canvas.
- Project files save category shape, colour, marker size, and line width. They do not save custom marker image data.
- Plotypus is offline-capable. Any approved marker asset must remain available after saving, reopening, exporting, and sharing a project folder or project file.

## Threat Model

Custom marker files are untrusted user input.

Primary risks:

- Script execution through SVG, HTML, XML, or malformed image payloads.
- External network references inside uploaded assets.
- Export breakage when rasterizing SVG that references local blobs, object URLs, or files unavailable later.
- Oversized files causing slow renders, memory pressure, or large project files.
- Tracking or metadata leakage through embedded image metadata.
- Visual ambiguity from opaque, low-contrast, or oversized icons that obscure map geography or labels.

## Non-Goals

- Do not support arbitrary SVG uploads in the first version.
- Do not support remote image URLs.
- Do not support linked local files in saved projects.
- Do not execute or sanitize active XML/SVG content client-side as a first implementation.
- Do not add per-row uploaded markers until category-level custom markers are proven necessary.

## Safest First Version

If departments request custom markers, first support category-level raster markers only.

Allowed inputs:

- PNG: `image/png`
- WebP: `image/webp`

Rejected inputs:

- SVG, even if renamed or served as `image/svg+xml`
- GIF, APNG, AVIF, JPEG, BMP, TIFF, ICO
- HTML, XML, PDF, ZIP, Office files, or unknown binary files
- Any file whose detected bytes do not match the claimed MIME type

Storage model:

- Convert accepted files to data URLs.
- Store the data URL and validated metadata in the project file under the category.
- Render from the data URL so exports remain offline and portable.
- Do not persist object URLs or local file paths.

Recommended first-version limits:

- Maximum source file size: 128 KB.
- Maximum decoded dimensions: 256 x 256 px.
- Minimum decoded dimensions: 8 x 8 px.
- Maximum rendered marker size: keep the existing category marker-size bounds unless a separate design approves larger values.
- Require an alpha channel or transparent background guidance for map readability. If alpha validation is implemented, warn or reject fully opaque markers.
- Normalize rendered marker aspect ratio into a square fit box centered on the point.

## Validation Pipeline

Validation should happen before a marker is added to category state.

1. Read the selected file as `ArrayBuffer`.
2. Check byte size before decoding.
3. Verify magic bytes:
   - PNG starts with `89 50 4E 47 0D 0A 1A 0A`.
   - WebP starts with `RIFF`, has `WEBP` at bytes 8 through 11, and a known WebP chunk type.
4. Decode through `createImageBitmap` where available, falling back to `Image` with a blob URL.
5. Validate decoded width and height.
6. Draw onto an isolated canvas to normalize and optionally inspect transparency.
7. Re-encode through canvas to PNG or WebP, preferably PNG for broad SVG image compatibility.
8. Create the stored data URL only from the normalized canvas output.
9. Revoke any temporary object URLs.
10. Add metadata:
    - `kind: "raster"`
    - `mime`
    - `width`
    - `height`
    - `sourceBytes`
    - `dataUrl`

Important constraint: do not trust `file.type`, filename extension, or image dimensions from metadata alone.

## Rendering Design

Category state can evolve from `shape` only to a discriminated marker object while keeping old project files valid.

Proposed project shape:

```json
{
  "shape": "circle",
  "markerAsset": {
    "kind": "raster",
    "mime": "image/png",
    "width": 128,
    "height": 128,
    "sourceBytes": 9312,
    "dataUrl": "data:image/png;base64,..."
  }
}
```

Compatibility rules:

- If `markerAsset` is absent, use the existing `shape` path.
- If `markerAsset` exists but fails validation on project load, ignore it and fall back to `shape`.
- Keep `shape` in the file as a fallback for older app versions.
- Keep existing DOM IDs stable. Any new controls should be additive in the category editor and Properties panel.

SVG rendering:

- Render raster markers with SVG `<image>` elements.
- Set `href` and `xlink:href` to the validated data URL for compatibility.
- Set explicit `x`, `y`, `width`, `height`, and `preserveAspectRatio="xMidYMid meet"`.
- Keep pointer events and `data-*` attributes equivalent to current marker elements.

PNG rendering:

- Because the export SVG contains embedded data URLs, canvas rasterization should not need network, blob, or local file access.
- Add a smoke assertion that PNG export still succeeds with a sample embedded raster marker once implementation exists.

## User Experience

Controls should be category-level:

- Upload marker image
- Remove custom marker
- Preview marker swatch
- Fallback shape remains selectable

Validation messages should be direct:

- Unsupported file type
- File too large
- Image dimensions too large or too small
- Image could not be decoded
- Marker has no transparency or may obscure the map

The UI should not offer SVG upload. If users ask for SVG, explain that vector marker support needs a separate sanitizer and export compatibility decision.

## Test Plan

Before implementation is considered complete:

- Unit tests for magic-byte validation and rejected file types.
- Unit tests for project-file normalization:
  - valid raster marker is preserved
  - invalid marker asset is dropped
  - legacy projects without marker assets still load
- Browser smoke test with a tiny generated PNG data URL marker.
- SVG export test that verifies `<image href="data:image/png;base64,...">` is present.
- PNG export smoke test with the embedded marker.
- Visual regression for default projects must remain unchanged.
- Project save/load round trip preserves the marker data URL and fallback shape.

## Open Decisions

- Whether to store the normalized image as PNG always, or preserve WebP when originally supplied.
- Whether opaque images should be rejected or only warned.
- Whether the size limit should be 128 KB or lower for departments that email project files.
- Whether marker assets belong in project JSON only or can also be configured in `plotypus.config.json`.
- Whether a future SVG version is worth the sanitization burden.

## Future SVG Requirements

SVG marker upload should remain out of scope until all of these are defined:

- A strict SVG sanitizer that removes scripts, events, animations, foreignObject, external references, embedded styles with URL references, and unsafe namespaces.
- A policy for inline versus data URL storage.
- Export tests for browser SVG serialization and PNG rasterization.
- Accessibility and colour-contrast review.
- A maximum complexity policy for path count, node count, dimensions, and file size.


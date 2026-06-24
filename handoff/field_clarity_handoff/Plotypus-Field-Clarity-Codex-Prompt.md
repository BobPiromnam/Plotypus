# Codex prompt — Project points field clarity + bilingual Translate

Reference prototype (open in a browser to see target visuals & states):
**`Plotypus Field Clarity Prototype.dc.html`**

> The `.dc.html` prototype is a **visual reference**, not code to copy. It loads a prototyping runtime (`support.js`) and Google Fonts — ignore both. Implement everything below in the existing vanilla `index.html` / `style.css` / `app.js`. No build step, no framework, must stay offline.

---

## Context — the two problems

1. **Project points table** (`#projectTable`) renders 9 columns. Six are user-entered (Project name, Fnote, Type, Priority, Longitude, Latitude), **Status** is *computed* by `refreshProjectTableUx()` (the `.row-status-badge`, states `mapped` / `callout` / `missing` / `blank`), and Hide line / Select are controls. Today every cell looks like a white field, so users can't tell which cells they may edit and which the app derives.
2. **Translate tab** (`#translateTablePane`) renders one editable `textarea.translation-fr-input` next to a read-only `.translation-reference` div. The `data-translation-direction` toggle only swaps which side is editable — there is **no way to edit English and French together**. Editing a source-language typo requires flipping direction.

Do **not** change generated map output, the status-derivation logic, or existing DOM IDs / behavior hooks.

---

## Part A — Project points: editable vs. computed visual language

Goal: make column *type* legible at a glance without changing what any cell does, and **without changing the table's quiet borderless look**.

**Keep the table borderless and airy — do NOT box the cells.** The current table reads as plain text at rest (`#projectTable td input,#projectTable td select { border:1px solid transparent; background:transparent; border-radius:0; }`). The whole point is to add *signal* on top of that, not to wrap every value in a visible field. Three light touches only:

### A1. Header markers (`index.html`, no structural rows)
Do **not** add a grouping band. In the existing label `<tr>`, append a small muted **pencil** glyph after each *value* column label (Project name, Type, Priority, Longitude, Latitude) via `<span class="col-edit-hint" aria-hidden="true">` (reuse `icons.js` `pencil`, 11px, colour `#bcb4a3`). In the `.status-col` header, append a small **Auto** lock chip: `<span class="col-auto-chip">Auto</span>` (mono 8px, `border:1px solid var(--field-computed-border)`, lock glyph).

### A2. Styling (`style.css`) — new tokens + rules
```css
--field-computed-tint: #f0eee7;   /* faint persistent Status column tint */
--field-computed-border: #e7e1d4;
```
Scope under `body[data-workspace-view="projects"] #projectTable`:
- **Value cells** (name/type/priority/lon/lat): inputs stay borderless/transparent at rest — unchanged. Add a *hover-reveal* affordance on the cell: `td.vcell:hover{background:#fff;box-shadow:inset 0 0 0 1px var(--border);border-radius:var(--radius-md);cursor:text;}` and `td.vcell:focus-within{box-shadow:inset 0 0 0 2px var(--accent);background:#fff;border-radius:var(--radius-md);}`. (The existing `:focus` outline rule already covers keyboard focus — keep it.) No persistent border, no fill change at rest.
- **Computed Status cell**: `.status-cell{ background:var(--field-computed-tint); border-left:1px solid var(--field-computed-border); cursor:default; }`. No hover affordance, never focusable. The `.row-status-badge` pill stays exactly as today.
- The even-row striping, sticky name column, active-row accent bar, and `.is-row-*` states are all untouched.
- Add a slim one-line **legend** in the existing project toolbar area: `✎ You enter the value — hover any cell to edit  ·  🔒 Status is set automatically`. Match the prototype's legend row (no swatches/bands).

### A3. Accessibility
- Status `<td>` gets `aria-readonly="true"`; change its badge from `aria-hidden="true"` to a real accessible label so SR users hear "Status: Mapped".
- Value-column headers: pencil glyph is decorative (`aria-hidden`); inputs already labelled.

### A4. Behavior — none
This is **styling + header glyphs only**. `refreshProjectTableUx()`, `getProjectRowState()`, filters, and selection are untouched. Confirm the Status column never invites a click (`cursor:default`, not in tab order).

---

## Part B — Translate: edit English and French together

Goal: both languages editable in place, side by side; row status computed from both.

### B1. Markup (`app.js`, `renderTranslations()` ~line 2119)
Replace the per-row template so **both** sides are `<textarea>`s:
```html
<div class="translation-row" data-entry-id="…" tabindex="0">
  <span class="translation-index">N</span>
  <textarea class="translation-input translation-en-input" data-entry-lang="en"
            data-entry-id="…" placeholder="Add English source…">EN value</textarea>
  <textarea class="translation-input translation-fr-input" data-entry-lang="fr"
            data-entry-id="…" placeholder="Add French translation…">FR value</textarea>
  <span class="translation-status" data-state="…">Complete | Missing FR | Missing EN</span>
</div>
```
- Keep the class `.translation-fr-input` on the French box (existing listeners at lines 7728–7734 bind to it). Add the EN box with the new `.translation-en-input` class and wire the **same** input/focus/paste handlers to it (generalise the selector to `.translation-input`).
- `data-edit-language` already exists; keep it but stop using it to decide *which* box is editable — both always editable. The direction toggle (`data-translation-direction`) now controls only which column is visually emphasised / which "Missing" filter applies, not editability. Update `data-translation-direction` handler accordingly, or replace with the prototype's `Edit both / EN focus / FR focus` view control (optional — `Edit both` is the new default).
- Status is computed: `done` only when **both** EN and FR are non-empty; otherwise `missing` with a label naming the empty side. Update `renderTranslationProgressOnly()` and `#translationProgressText` if you want it to count complete *pairs*.

### B2. Persistence
Writing the EN box must update the underlying English string source (project row name / category label) the same way the FR box updates the French value today — route through the existing translation-entry update path (`handleTranslationInput`), keyed by `data-entry-lang`. Do **not** silently fork EN edits away from the project rows; an EN edit here is the same data as the Project points name.

### B3. Styling (`style.css`)
- `.translation-input{ /* shared editable well */ background:#fff;border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 10px;font:500 var(--text-body)/var(--line-body) var(--font-content);min-height:44px;resize:vertical; }` hover/focus = accent (reuse `.translation-fr-input:focus`).
- Remove the read-only `.translation-reference` grey treatment; the EN column is now a real input.
- Grid columns: `36px 1fr 1fr 116px` (index, EN, FR, status). Update `.translation-row` grid.
- Missing side gets `border-color:var(--danger-border);background:#fdf6f4;`.
- Status pill states reuse `mapped`→Complete (`--accent-soft`), `missing`→`--danger-bg`.

### B4. Accessibility
- Each textarea labelled (`aria-label="English source"` / `"French translation"`).
- Keep `.translation-row` keyboard nav (arrow up/down, Enter) from `handleTranslationKeydown`; ensure focus moves between the two boxes with Tab in reading order EN→FR.

---

## Existing hooks — keep stable
`#projectTable`, `.status-cell`, `.row-status-badge[data-state]`, `getProjectRowState`, `refreshProjectTableUx`, `#translateTablePane`, `#translationGroups`, `.translation-fr-input`, `handleTranslationInput`, `handleTranslationKeydown`, `handleTranslationPaste`, `data-translation-direction`, `data-translation-filter`. New names introduced: `.column-group-row`, `.col-group*`, `.col-type-note`, `.translation-input`, `.translation-en-input`, `.translation-index`.

## Implementation order
1. `index.html` — add Project points thead group row + Status sub-label + legend container (structure only).
2. `style.css` — field-type tokens + Project points rules + Translate `.translation-input` rules.
3. `app.js` — `renderTranslations()` dual-textarea markup; generalise translation listeners to `.translation-input`; both-filled status + progress; route EN edits to the shared source.
4. A11y passes (aria-readonly, labels, scope).
5. Regression: status derivation, filters, selection, CSV import, and **map output** unchanged.

## Acceptance criteria
- A user can tell editable from computed columns in Project points without interacting (distinct fill, border, header band, AUTO·READ-ONLY label).
- The Status column is never focusable or editable; its values still come only from `refreshProjectTableUx()`.
- Translate shows English and French as two editable wells; editing either persists; row status is "Complete" only when both are filled.
- No existing IDs renamed; map rendering/export byte-identical; app works offline.

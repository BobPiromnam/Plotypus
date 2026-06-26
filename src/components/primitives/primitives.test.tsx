import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BilingualFieldGroup, Button, Dialog, DialogActions, SegmentedControl, Switch, TableHeaderCell } from ".";

describe("React primitives", () => {
  it("renders button variants with icons", () => {
    const html = renderToStaticMarkup(
      <Button icon="save" variant="primary">
        Save
      </Button>
    );

    expect(html).toContain("pt-button-primary");
    expect(html).toContain("Save");
    expect(html).toContain("pt-icon");
  });

  it("marks the active segmented option", () => {
    const html = renderToStaticMarkup(
      <SegmentedControl
        ariaLabel="Language"
        options={[
          { label: "EN", value: "en" },
          { label: "FR", value: "fr" }
        ]}
        value="fr"
        onChange={vi.fn()}
      />
    );

    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("FR");
  });

  it("renders switch state and hint copy", () => {
    const html = renderToStaticMarkup(<Switch checked hint="Map furniture visibility" label="Legend" onChange={vi.fn()} />);

    expect(html).toContain("checked");
    expect(html).toContain("Map furniture visibility");
  });

  it("uses pencil and wand origin icons for table headings", () => {
    const editable = renderToStaticMarkup(<TableHeaderCell origin="editable">Project name</TableHeaderCell>);
    const automatic = renderToStaticMarkup(<TableHeaderCell origin="automatic">Status</TableHeaderCell>);

    expect(editable).toContain("pt-origin-editable");
    expect(editable).toContain("Project name");
    expect(automatic).toContain("pt-origin-automatic");
    expect(automatic).toContain("Status");
  });

  it("renders dialog structure with actions", () => {
    const html = renderToStaticMarkup(
      <Dialog actions={<DialogActions />} icon="table" subtitle="Subtitle" title="Map details">
        Body
      </Dialog>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain("Map details");
    expect(html).toContain("Save");
  });

  it("renders bilingual field groups with language chips", () => {
    const html = renderToStaticMarkup(
      <BilingualFieldGroup
        english="Project map"
        french="Carte du projet"
        label="Map title"
        onEnglishChange={vi.fn()}
        onFrenchChange={vi.fn()}
      />
    );

    expect(html).toContain("Map title");
    expect(html).toContain("EN");
    expect(html).toContain("FR");
    expect(html).toContain("Carte du projet");
  });
});

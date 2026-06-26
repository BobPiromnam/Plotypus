import { TableCell, TableHeaderCell } from "../../components/primitives";
import type { MapBaselayerPreviewRow } from "../../core/plotypusStateAdapter";

type MapBaselayerPreviewTableProps = {
  boundary: string;
  includedCount: number;
  regionCount: number;
  rows: MapBaselayerPreviewRow[];
};

export function MapBaselayerPreviewTable({
  boundary,
  includedCount,
  regionCount,
  rows
}: MapBaselayerPreviewTableProps) {
  return (
    <div className="project-preview-table-wrap">
      <table className="pt-demo-table project-preview-table map-baselayer-preview-table">
        <caption>
          Map baselayer preview
          <span>{boundary} · {includedCount}/{regionCount} included</span>
        </caption>
        <thead>
          <tr>
            <TableHeaderCell origin="editable">Region</TableHeaderCell>
            <TableHeaderCell origin="editable">Included</TableHeaderCell>
            <TableHeaderCell origin="automatic">Points</TableHeaderCell>
            <TableHeaderCell origin="editable">Colour order</TableHeaderCell>
            <TableHeaderCell origin="editable">Colour</TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row.regionId}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.included ? "Included" : "Hidden"}</TableCell>
              <TableCell>{row.pointCount}</TableCell>
              <TableCell>{row.colourOrder}</TableCell>
              <TableCell>
                <span className="map-baselayer-preview-colour">
                  <span style={{ background: row.colour }} />
                  {row.colour}
                </span>
              </TableCell>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="project-preview-empty">No baselayer rows in the read-only snapshot.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

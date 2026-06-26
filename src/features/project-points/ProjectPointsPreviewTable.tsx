import type { ProjectPointPreviewRow } from "../../core/plotypusStateAdapter";
import { TableCell, TableHeaderCell } from "../../components/primitives";

type ProjectPointsPreviewTableProps = {
  rows: ProjectPointPreviewRow[];
};

const statusLabels: Record<ProjectPointPreviewRow["status"], string> = {
  blank: "Blank",
  callout: "No coord.",
  mapped: "Mapped",
  missing: "Missing"
};

export function ProjectPointsPreviewTable({ rows }: ProjectPointsPreviewTableProps) {
  return (
    <div className="project-preview-table-wrap">
      <table className="pt-demo-table project-preview-table">
        <caption>Project points preview</caption>
        <thead>
          <tr>
            <TableHeaderCell origin="editable">Project name</TableHeaderCell>
            <TableHeaderCell origin="editable">Type</TableHeaderCell>
            <TableHeaderCell origin="editable">Priority</TableHeaderCell>
            <TableHeaderCell origin="automatic">Coordinates</TableHeaderCell>
            <TableHeaderCell origin="automatic">Status</TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row.rowId}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>{row.priority}</TableCell>
              <TableCell>{coordinateLabel(row)}</TableCell>
              <TableCell>
                <span className={`project-preview-status is-${row.status}`}>{statusLabels[row.status]}</span>
              </TableCell>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="project-preview-empty">No project rows in the read-only snapshot.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function coordinateLabel(row: ProjectPointPreviewRow) {
  if (row.hasLatitude && row.hasLongitude) return "Lon + lat";
  if (row.hasLongitude) return "Longitude only";
  if (row.hasLatitude) return "Latitude only";
  return "No coordinates";
}

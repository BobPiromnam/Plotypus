import type { WorkspaceSummarySnapshot } from "../../core/plotypusStateAdapter";

type WorkspaceSummaryPreviewProps = {
  summary: WorkspaceSummarySnapshot;
};

export function WorkspaceSummaryPreview({ summary }: WorkspaceSummaryPreviewProps) {
  return (
    <section className="workspace-summary-preview" aria-labelledby="workspaceSummaryPreviewTitle">
      <div>
        <p className="react-migration-kicker">Workspace summary</p>
        <h3 id="workspaceSummaryPreviewTitle">{summary.activeLabel}</h3>
        {summary.qualityLabel ? <p>{summary.qualityLabel}</p> : null}
      </div>
      <dl>
        {summary.metrics.map((metric) => (
          <div className={`workspace-summary-metric is-${metric.state}`} key={metric.key}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

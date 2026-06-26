import { Icon } from "../../components/primitives";
import type { PropertiesPreviewSection } from "../../core/plotypusStateAdapter";

type PropertiesFactsPreviewProps = {
  sections: PropertiesPreviewSection[];
};

export function PropertiesFactsPreview({ sections }: PropertiesFactsPreviewProps) {
  if (!sections.length) {
    return <p className="properties-facts-empty">No Properties facts in the read-only snapshot.</p>;
  }

  return (
    <div className="properties-facts-preview">
      {sections.map((section) => (
        <section className="properties-facts-section" key={section.title}>
          <h4>{section.title}</h4>
          <dl>
            {section.rows.map((row) => (
              <div key={`${section.title}-${row.label}`}>
                <dt>
                  <span>{row.label}</span>
                  <span className={`properties-facts-origin is-${row.origin}`} aria-label={row.origin}>
                    <Icon name={row.origin === "automatic" ? "wand" : "pencil"} />
                  </span>
                </dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

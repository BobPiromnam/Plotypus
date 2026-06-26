import type { ReactNode } from "react";

export function PropertySection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="pt-property-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

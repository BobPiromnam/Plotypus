# Architecture Decision: React + Vite Migration

## Status

Accepted for the `react-conversion` branch.

## Context

Plotypus is an offline-first static web app. It currently runs as a vanilla HTML/CSS/JS application with classic script loading, local assets, and export behavior that must remain stable during migration.

## Decision

Use React, Vite, and TypeScript for the UI migration.

Do not use Next.js for the initial migration because Plotypus does not need server rendering, API routes, or framework-managed deployment. Do not use Angular unless the future maintenance team standardizes on it.

## Consequences

- React work starts from a separate `react-entry.html` so the current production `index.html` remains unchanged.
- Core geometry, label layout, project-file, and map rendering logic should stay framework-independent.
- The map renderer and high-risk table behavior should migrate later, after lower-risk shell and dialog patterns are proven.
- Static build output must keep local assets and offline use in mind.

# Claude Agent Configuration

## Role & Responsibilities
- **Role**: Lead Architect & Systems Designer.
- **Focus**: System architecture, high-level reasoning, design systems definition, core UX planning, and large-scale refactors.

---

## Primary Skills & When to Use

- **`impeccable`**:
  - *When to use*: Designing, redesigning, shaping, auditing, simplifying, hardening, and establishing design system truth (`DESIGN.md`, product tokens). Enforces the craft floor, prevents UI slop, and structures design intent across Persuade, Operate, Read, and Experience modes.
- **`design-taste-frontend`**:
  - *When to use*: Art direction and curated visual design for web interfaces and application dashboards. Applies researched compositions, distinct typographic hierarchy, and real-browser inspection loops to eliminate generic, templated AI aesthetics.
- **`web-design-guidelines`**:
  - *When to use*: Auditing UI against Web Interface Guidelines, accessibility (contrast, keyboard navigation, aria-labels), responsive boundaries, and usability best practices.
- **`ui-ux-pro-max`**:
  - *When to use*: Accessing searchable UX intelligence: font pairings, color palettes, UI layout archetypes, accessibility benchmarks, and stack-specific interface guidelines.

---

## Secondary Skills & When to Use

- **`tailwind`**:
  - *When to use*: Structuring utility-first CSS architectures, mapping design tokens to Tailwind configurations, and implementing scalable styling layers. *(Note: pending repository upstream availability; apply standard Tailwind v3/v4 conventions).*

---

## Hand-off Recommendations

- **Hand off to Gemini** for:
  - Rapid visual exploration, creative director ideation, award-level visual benchmarking (`awwwards`, `jury`), and fast iteration on layout variations.
- **Hand off to ChatGPT** for:
  - Detailed component-level animations, gestures, spring-physics transitions (`framer-motion-animator`), and Emil Kowalski choreography skills.

---

## Rules for Preserving Stack, Conventions & Tokens

1. **Preserve Foundations**: Do not alter underlying frameworks, package managers, or project directory structures without explicit request.
2. **Honor Tokens**: All new components must adhere strictly to established design tokens (colors, font scales, radii, elevations, and spacing units). Never introduce arbitrary hardcoded values where tokens exist.
3. **No Unnecessary Dependencies**: Refactor within the existing dependency manifest; avoid pulling in redundant third-party libraries.

---

## Mandatory Quality Gate

> **CRITICAL**: You must complete a thorough `web-design-guidelines` review on all modified and newly created interface components before declaring any UI work finished. Resolve all flagged issues for contrast, touch targets, keyboard navigation, and responsive scaling.


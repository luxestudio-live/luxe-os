# LuxeOS Design System & Brand Tokens

## Brand Identity & Aesthetic Principles
LuxeOS is an exclusive, bespoke client experience and project operations platform built for **LuxeStudio** (`https://theluxestudio.in`).
It embodies:
- **Quiet Luxury & Restraint**: Deep blacks, warm charcoals, and brushed rich gold accents used intentionally, never gaudily.
- **Precision Typography**: Editorial headings, generous letter-spacing on micro-labels, and crisp tabular figures for milestone dates and statistics.
- **Architectural Composition**: Layered dark and light surfaces, subtle 1px borders (`border-white/10` or `border-gold/20`), backdrop blurs, and deliberate negative space.
- **Signature Visuals**: Bespoke interactive project journey timeline, dedicated prototype preview studio with device framing, and clarity-first client action centers.

---

## Color System & Design Tokens

### Primary Palette
| Token | Hex | Tailwind Utility | Role / Purpose |
|---|---|---|---|
| `--color-deep-black` | `#0B0B0D` | `bg-[#0B0B0D]` | Base background for dark mode, login, and executive surfaces |
| `--color-charcoal` | `#171719` | `bg-[#171719]` | Primary surface, elevated cards, sidebar, and container panels |
| `--color-charcoal-light`| `#222226` | `bg-[#222226]` | Secondary surface, active hover states, input backgrounds |
| `--color-rich-gold` | `#C9A56A` | `text-[#C9A56A]`, `border-[#C9A56A]` | Primary brand accent, active milestones, signature highlights |
| `--color-gold-hover` | `#B89355` | `hover:bg-[#B89355]` | Interactive gold hover state |
| `--color-muted-champagne`| `#E6D0A5` | `text-[#E6D0A5]` | Secondary gold tone, badges, subtle glow accents |
| `--color-warm-ivory` | `#F7F5F1` | `bg-[#F7F5F1]`, `text-[#F7F5F1]` | Primary text in dark mode, light mode background |
| `--color-soft-white` | `#FFFFFF` | `text-white` | High-contrast headings, icons, crisp callouts |
| `--color-neutral-grey` | `#8E8E93` | `text-[#8E8E93]` | Secondary body text, timestamps, helper labels |

### Semantic Status Tokens
| State | Light / Dark Token | Tailwind Color Class | Usage |
|---|---|---|---|
| **Success** | Restrained Emerald | `#10B981` / `emerald-400` | Completed milestones, approved deliverables, resolved defects |
| **Warning / Action**| Sophisticated Amber | `#F59E0B` / `amber-400` | Items awaiting client action, pending approvals, upcoming due dates |
| **Error / Blocked** | Muted Crimson | `#EF4444` / `rose-400` | Blocked milestones, critical UAT issues, failed SMTP delivery |
| **In Progress** | Rich Gold / Indigo | `#C9A56A` / `gold-400` | Active stages, current sprint, testing in progress |
| **Scheduled / Info**| Slate / Champagne | `#94A3B8` / `champagne` | Upcoming milestones, scheduled meetings, notes |

---

## Typography Hierarchy

- **Display & Section Headers**: Elegant, high-tracking editorial headings (`tracking-tight font-serif` or `font-semibold tracking-[-0.02em]`).
- **Interface / Body**: Sans-serif system (`Inter`, `system-ui`) with clear hierarchy (`text-sm` for data density, `text-base` for editorial reading).
- **Numeric & Data**: Monospace / tabular figures (`font-mono text-xs tracking-wider uppercase`) for milestone IDs, dates, version badges, and monetary amounts.

---

## Signature Component Guidelines

1. **Project Journey Timeline**:
   - Continuous vertical and horizontal milestone paths with animated progress pulses.
   - Distinct glowing nodes for current stage, solid gold checkmarks for completed, muted badges for upcoming, amber warning rings for blocked.
   - Expandable milestone drawer with tasks, dependencies, linked deliverables, and sign-off records.
2. **Prototype Preview Studio**:
   - Device frame simulation (Desktop / Tablet / Mobile viewports).
   - Direct launch with security-compliant iframe fallback and structured feedback modal (URL, screenshot annotation, priority, category).
3. **Action Required Centre**:
   - Urgent client blockers grouped by priority and deadline with single-click action triggers.
4. **Super Admin SMTP & Security**:
   - Real-time connection testing indicator, encrypted secret storage notices, and delivery logs with status pills.


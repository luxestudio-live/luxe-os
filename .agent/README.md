# Agent Routing & Multi-Agent Collaboration Guide

This directory configures role specializations, skill assignments, and collaboration protocols across agents working in this repository.

## Golden Rule

> Read your own agent file first, then load only the skills it lists for the task at hand.

---

## Agent Roster & Specializations

| Agent | Config | Primary Responsibility | Primary Skills | Secondary Skills |
|---|---|---|---|---|
| **Claude** | [.agent/claude.md](claude.md) | Architecture, reasoning, design systems, large refactors | `impeccable`, `design-taste-frontend`, `web-design-guidelines`, `ui-ux-pro-max` | `tailwind` |
| **Gemini** | [.agent/gemini.md](gemini.md) | Visual design, references, rapid iteration | `ui-ux-pro-max`, `awwwards`, `jury`, `tailwind` | `design-taste-frontend` |
| **ChatGPT** | [.agent/chatgpt.md](chatgpt.md) | Precise implementation, animation, micro-interactions, polish | `framer-motion-animator`, installed Emil Kowalski skills, `tailwind` | `web-design-guidelines` |

---

## Shared Engineering Conventions

1. **Stack & Convention Preservation**: Never swap frameworks, replace established styling architectures, or invent unapproved dependencies without explicit alignment.
2. **Design Token Integrity**: Respect existing color palettes, typography scales, spacing tokens, and border-radius rules.
3. **Mandatory Quality Gate**: Run and satisfy a `web-design-guidelines` review before declaring any UI task completed.
4. **Context Handoff**: When passing tasks between agents, document active state, modified files, decisions made, and outstanding items.


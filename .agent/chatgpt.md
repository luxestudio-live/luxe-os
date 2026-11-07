# ChatGPT Agent Configuration

## Role & Responsibilities
- **Role**: Design Engineer & Motion Implementation Specialist.
- **Focus**: Precise code implementation, micro-interactions, spring physics, animation choreography, and interaction polish.

---

## Primary Skills & When to Use

- **`framer-motion-animator`**:
  - *When to use*: Implementing declarative animations, page transitions, drag/gesture interactions, scroll-driven effects, and shared layout morphs using Framer Motion.
- **Installed Emil Kowalski Skills**:
  - `animate`: Applying motion principles (duration, easing, purpose) to interactive elements.
  - `choreograph`: Sequencing multi-stage animations, staggered entrances, and parent-child transitions.
  - `improve-animations`: Tuning easing curves, damping, and springs to turn mechanical animations into natural physics.
  - `find-animation-opportunities`: Identifying high-value micro-interactions that elevate user feedback.
  - `animation-performance`: Eliminating layout thrashing, ensuring 60+ FPS on mid-range devices, leveraging GPU-accelerated transforms (`transform`, `opacity`).
  - `remove-animations`: Pruning superfluous motion to keep the interface fast, uncluttered, and purposeful.
  - `review-animations`: Auditing existing transitions against motion design rubrics.
  - `break-ui`: Stress-testing components against extreme viewports, dynamic content overflows, and network delays.
  - `emil-design-eng`: Applying design engineering principles that blend visual taste with robust code architecture.
  - `ask-sonner`: Polishing notification feedback, toast interactions, and transient messaging.
  - `apple-design`: Aligning mobile and desktop interfaces with Apple Human Interface Guidelines.
  - `animate-expo` & `mobile-native` & `write-swift`: Mobile-specific native gestures and animation patterns.
  - `pick-ui-library` & `prototype`: Selecting optimal interaction primitives and testing micro-prototypes.
- **`tailwind`**:
  - *When to use*: Implementing pixel-perfect layouts, responsive utility classes, and transitions. *(Note: pending repository upstream availability).*

---

## Secondary Skills & When to Use

- **`web-design-guidelines`**:
  - *When to use*: Auditing keyboard navigation, contrast, touch targets (≥44px), and especially ensuring `prefers-reduced-motion` compliance across all animations.

---

## Hand-off Recommendations

- **Hand off to Claude** for:
  - System architecture, refactoring large component trees, domain modeling, and state management refactoring.
- **Hand off to Gemini** for:
  - Initial art direction, aesthetic benchmarking (`jury`, `awwwards`), and creative concept ideation.

---

## Rules for Preserving Stack, Conventions & Tokens

1. **Stack Fidelity**: Do not introduce unapproved animation runtimes or utility libraries; stick to the existing project toolchain.
2. **Token Integrity**: Utilize established design tokens for animation durations, easing curves, colors, and dimensions.
3. **Reduced Motion**: Every animated component MUST include a zero-motion or subtle fade alternative when `prefers-reduced-motion: reduce` is active.
4. **Code Quality**: Write clean, typed, modular code matching the project's formatting and linting rules.

---

## Mandatory Quality Gate

> **CRITICAL**: Complete a full `web-design-guidelines` review on all modified components before marking any implementation or animation task complete. Verify accessibility, focus management, touch targets, and motion suppression.


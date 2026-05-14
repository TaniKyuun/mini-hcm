# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs in React.

## What you should do — IMPORTANT

**Read `mini-hcm/project/Mini HCM Wireframes.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**Read `DESIGN.md` before writing any code.** It defines the full design system: color tokens, typography scale, spacing grid, component rules, and anti-patterns. Every component you build must conform to it.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## Technology

Implement all UI in **React**. Match the visual output of the prototypes pixel-perfectly; do not copy the prototype's internal HTML/CSS structure unless it happens to fit React conventions.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source and in `DESIGN.md`. Read the HTML and CSS directly.

## Component folder structure

Organize React components into the following folders under `src/components/`:

```
src/
└── components/
    ├── ui/          # Primitives: Button, Input, Badge, Avatar, etc.
    ├── layout/      # Shell, Sidebar, Header, PageWrapper, etc.
    ├── dashboard/   # Dashboard-specific widgets and stat cards
    ├── attendance/  # Attendance tracking views and forms
    └── shared/      # Cross-feature components reused in 2+ sections
```

Rules:
- One component per file, named in PascalCase matching the filename.
- Keep domain logic out of `ui/` — primitives receive only props.
- Co-locate a component's styles and types with the component file unless a shared token file already covers it.
- Import design tokens (colors, spacing, typography) from a single source of truth — do not hardcode hex values inline.

## Design system

All visual decisions are governed by [`DESIGN.md`](.design/DESIGN.md). Key constraints:

- **Colors** — use only the defined tokens (Primary `#0C5CAB`, Surface `#09090B`, Text `#FAFAFA`, etc.). No off-palette values.
- **Typography** — IBM Plex Sans at the defined scale (12/14/16/20/24/32px). No ad-hoc sizes.
- **Spacing** — 8pt baseline grid. No ad-hoc offsets.
- **Motion** — 150–250ms transitions, Primary color as the interaction signal.
- See `DESIGN.md` §9 Anti-patterns for what to avoid.

## Bundle contents

- `.design/README.md` — this file
- `.design/DESIGN.md` — design system reference (colors, typography, spacing, components, motion)
- `mini-hcm/project/` — the `mini hcm` project files (HTML prototypes, assets, components)

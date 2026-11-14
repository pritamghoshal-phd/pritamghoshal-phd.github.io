# Blueprint — design system

The site is an academic portfolio about structures that buckle, snap and
compute. The visual language is an engineering drawing: cool paper, a
drafting blue, hairline rules, and data ink that reads the same on a chart
as it does in a sentence.

Every value below is a CSS custom property on `:root`. The live simulations
read the same properties through `getComputedStyle`, so changing a token
re-colours the figures as well as the page. Never write a raw colour into a
stylesheet or a canvas call — add a token.

Tokens live in two places, because `index.html` carries its own copy of the
theme inline and the other pages take it from `site.css`. Change both.

## Color

Roles first; the value is the consequence.

| Token | Role | Light | Dark |
|---|---|---|---|
| `--bg` | page | `#f2f5f9` | `#0c1119` |
| `--bg-alt` | alternating sections | `#e4eaf2` | `#121926` |
| `--bg-card` | panels, figure surfaces | `#ffffff` | `#151d2b` |
| `--border` | hairline separation | `#c6d1e0` | `#26324a` |
| `--border-2` | figure axes and strokes | `#7a8fab` | `#53698b` |
| `--ink` | body and headings | `#0b1526` | `#e9eef6` |
| `--muted` | secondary prose | `#45546a` | `#aab8cb` |
| `--sub` | small labels, captions | `#5c6a7f` | `#8d9fb6` |
| `--accent` | links, buttons, primary data | `#1344d0` | `#7aa5ff` |
| `--accent-dk` | accent hover | `#0a2d94` | `#a8c4ff` |
| `--accent-2` | the second data series; state changes | `#bc3f0b` | `#ff9159` |
| `--accent-3` | the third data series | `#0b7573` | `#4ad4ce` |
| `--flag` | annotation: the thing being pointed at | `#cd1a41` | `#ff6b8a` |
| `--on-accent` | label on an accent fill | `#ffffff` | `#0c1119` |

Three accents is the ceiling for data, and the second and third exist because
the figures plot three things at once, not for decoration. `--flag` is not a
fourth series: it is the annotation colour, for the one thing a figure is
pointing at — a damaged node, the unit cell picked out of a chain — and it
never encodes data. `--accent-2` marks a
changed state — a buckled cell, a crossed barrier, a live value.

Channel tokens (`--accent-rgb`, `--shadow-rgb`, `--card-rgb`, `--bg-rgb`,
`--bg-alt-rgb`, `--accent-2-rgb`, `--accent-3-rgb`, `--sub-rgb`) hold the
same colours as bare `r,g,b` triples so translucent fills can be written
`rgba(var(--accent-rgb),.08)` and still follow the theme.

**Contrast is a constraint, not a preference.** Body text and small labels
clear 4.5:1 against every surface they sit on; figure strokes clear 3:1.
Both themes are audited against the rendered pages, not the palette in the
abstract — a token that passes on `--bg` can still fail on `--bg-alt`, and
`--accent-2` did. Re-run the audit after changing any colour.

## Themes

`:root` is light. Dark arrives two ways:

- `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`
- `:root[data-theme="dark"]`, set by the control in the nav

so a reader who has expressed no preference follows their system with no
JavaScript at all, and an explicit choice always wins. The choice is stored
in `localStorage` under `theme` and applied by a short inline script in
`<head>` before first paint, so there is no white flash on a dark setup.

## Typography

Two families, clearly distinct, no third.

- **Cormorant Garamond** — display only: page titles, section titles, card
  headings, the lead paragraph. Italic is the emphatic form.
- **Outfit** — all body text and UI.
- **JetBrains Mono** — not a third voice but a signal: numbers, parameters,
  units, axis labels, anything the reader might compare digit by digit.

Body is 0.94–1rem at 1.6–1.85 line-height, measure held under 75 characters
by `--narrow` (860px) for prose and 1120px for layout.

## Shape and depth

One radius family: 100px for pills, ~1.1–1.6rem for panels, 10px for small
controls. Three shadows (`--sh-sm`, `--sh-md`, `--sh-lg`) and nothing else;
in dark they deepen rather than disappear, because a light shadow on a dark
ground reads as fog.

## Motion

The figures animate because they are simulations, not because motion is
decorative. Anything that moves can be held: a control in the corner pauses
every `requestAnimationFrame` loop on the page, and readers who ask their
system for reduced motion get one settled frame automatically. The control
only appears while a figure is on screen.

## Components

- **Buttons** — `.btn--solid` (accent fill, `--on-accent` label),
  `.btn--ghost` (hairline). Both lift 1–2px on hover.
- **Nav** — sticky, condenses past the hero. Below 900px it collapses into
  a menu; the résumé pill and the theme control stay reachable.
- **Figures** — a titled panel with a live status dot, the canvas, inline
  parameter controls, then a caption that states the governing equation.
  The caption is part of the figure, not a label under it.
- **Focus** — a 2px accent ring on `:focus-visible`, never removed.

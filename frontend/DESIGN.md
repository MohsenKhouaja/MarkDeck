---
name: MarkDeck
description: A softly chromatic, focused workspace for turning markdown into presentations.
colors:
  primary: oklch(0.47 0.105 250)
  primary-hover: oklch(0.41 0.105 250)
  primary-soft: oklch(0.93 0.025 250)
  neutral-bg: oklch(0.975 0.008 250)
  neutral-surface: oklch(0.995 0.003 250)
  neutral-muted: oklch(0.945 0.012 250)
  neutral-border: oklch(0.875 0.018 250)
  neutral-foreground: oklch(0.22 0.025 250)
  neutral-muted-foreground: oklch(0.46 0.035 250)
  sage: oklch(0.63 0.075 155)
  sage-soft: oklch(0.93 0.025 155)
  coral: oklch(0.62 0.12 30)
  coral-soft: oklch(0.94 0.025 30)
typography:
  ui:
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif'
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: '"Geist Mono", ui-monospace, monospace'
    fontWeight: 400
    lineHeight: 1.55
rounded:
  sm: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.25rem
---

# Design System: MarkDeck

## Creative North Star: The Working Notebook

MarkDeck feels like a crisp digital workspace with the clarity of a well-organized notebook. It is structured, readable, and practical, but not anonymous. Muted mineral blue establishes the product identity; sage supports collaborative and successful states; coral adds carefully rationed attention.

The metaphor is organizational, not decorative. There are no paper textures or nostalgic academic props. Notebook cues appear through clear sections, deliberate rhythm, useful annotations, and a strong relationship between text and preview.

## Color Strategy

The application uses a **restrained polychromatic** strategy. It is never monochrome, but high-chroma color is also avoided.

- **Mineral blue** is the dominant brand color. Use it for primary actions, active navigation, current selection, focus, and links.
- **Sage** communicates collaboration, connected status, completion, and positive confirmation.
- **Coral** communicates destructive actions, errors, warnings, or a rare moment requiring attention.
- **Blue-tinted neutrals** create cohesion across backgrounds, panels, borders, and typography.
- Presentation theme colors remain inside slide canvases. The surrounding application palette does not adapt to the current slide theme.

Color must carry meaning consistently. Large saturated decorative fields, rainbow palettes, purple-blue gradients, and gray text on colored backgrounds are prohibited.

## Surfaces and Hierarchy

- The page background is a pale blue-tinted neutral, not white or cream.
- Primary content surfaces are near-white with a faint blue cast.
- Sidebars and toolbars use stronger blue-tinted layers for wayfinding.
- Borders are quiet separators, not the default means of defining every section.
- Use shadows only for floating or interactive elevation. Resting workspace panels use tonal separation.
- Cards are reserved for discrete objects. Page introductions, forms, and navigation should not become generic bordered cards.

## Typography

Inter is the application typeface across navigation, labels, forms, headings, and data. Geist Mono is used for markdown editing and code-like annotations. Presentation themes may choose their own title typefaces inside slide canvases.

- Page title: 1.75rem, 650 weight, tight but readable line height.
- Section heading: 1.125rem, 600 weight.
- UI title: 0.9375rem, 600 weight.
- Body: 0.875rem to 1rem, 400 weight.
- Metadata: 0.75rem to 0.8125rem, 450–500 weight.

Avoid uppercase tracked labels as a repeated scaffold. Use sentence case and hierarchy through weight, placement, and color.

## Density

- Dashboard, authentication, and empty states use a relaxed 24–32px sectional rhythm.
- Editor toolbars use 8–12px gaps and compact 32–36px controls.
- Interactive targets remain at least 36px where practical and never fall below accessible pointer dimensions without a larger hit area.
- Mobile layouts collapse structurally; typography remains on a fixed product scale.

## Component Vocabulary

### Buttons

- Primary: mineral blue fill with a pale foreground.
- Secondary: pale mineral surface with dark blue text.
- Outline: subtle blue-tinted border on a surface background.
- Ghost: transparent, gaining a pale mineral tint on hover.
- Destructive: coral fill or coral-soft treatment depending on consequence.
- Focus rings use mineral blue and remain clearly visible.

### Navigation

- Desktop sidebar uses a pale mineral surface distinct from the content background.
- Active destinations use a mineral-blue tint plus strong blue text and icon; avoid a black active block.
- The brand mark is compact, geometric, and color-led.
- Mobile navigation becomes a horizontal top region rather than disappearing.

### Forms

- Inputs sit on near-white surfaces with blue-tinted borders.
- Focus uses a mineral-blue ring and stronger border.
- Placeholder contrast meets WCAG AA.
- Errors combine coral color with explanatory text or an icon; color is never the only signal.

### Editor

- The editor is the densest surface in the product.
- Slide selection uses mineral-blue tint and a visible selected marker contained within the full item surface.
- Collaboration and save status use sage plus a text label.
- Markdown and preview are visually paired but remain distinct: source is a quiet editing surface, preview has intentional physical elevation.
- Slide theme controls explicitly identify that they affect the canvas only.

## Motion

Use 150–220ms ease-out transitions to communicate hover, selection, disclosure, saving, and view changes. Avoid choreographed application page loads. Landing-page entrance motion may be slightly slower but must remain subtle and include a `prefers-reduced-motion` alternative.

## Non-negotiables

- No monochromatic application shell.
- No high-saturation inactive states.
- No gradient text, decorative glassmorphism, thick side-stripe accents, or nested card stacks.
- No identical icon-heading-description card grids as page scaffolding.
- No display typefaces in application labels or controls.
- No theme color leakage from slide canvas to editor chrome.
- No decorative motion in task-focused screens.
- No text or control state that relies on color alone.

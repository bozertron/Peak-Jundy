# Design System Reference

> Complete guide to the Peak "Sophisticated Ski Chalet" aesthetic.

---

## Philosophy

**"Sophisticated Ski Chalet"** — the warmth of a mountain lodge meets precision design.

Five principles:
1. **Warmth over coldness** — wood tones, cream backgrounds, soft charcoal-tinted shadows
2. **Framed objects** — items appear curated, like art on a wall (the `peak-frame` shadow)
3. **Generous breathing room** — luxury is space, not density
4. **Natural-material vocabulary** — wood, brass, stone, glass
5. **Confident restraint** — one accent at a time, never busy

---

## Color Palette

### Primary Colors

| Name | Hex | Tailwind Class | Usage |
|------|-----|---------------|-------|
| Forest Green | `#2D5A47` | `peak-forest-500` | Primary — buttons, links, focus rings, trust indicators |
| Brass | `#B8860B` | `peak-brass-500` | Accent — CTAs, highlights, equipment card left stripe |
| Burgundy | `#722F37` | `peak-burgundy-500` | Secondary — availability badges, secondary buttons |
| Navy | `#1E3A5F` | `peak-navy-500` | Depth — metadata, tertiary elements, information |

### Neutral Colors

| Name | Hex | Tailwind Class | Usage |
|------|-----|---------------|-------|
| Cream | `#FAF7F2` | `peak-cream` | Page backgrounds |
| Stone | `#E7E5E4` | `peak-stone` | Borders, dividers, subtle separators |
| Charcoal | `#2C3E50` | `peak-charcoal` | Body text, headings |
| Snow | `#FFFFFF` | `peak-snow` | Card backgrounds, elevated surfaces |
| Slate | `#64748B` | `peak-slate` | Placeholder text, secondary text |

### Wood Tones

| Name | Hex | Tailwind Class | Usage |
|------|-----|---------------|-------|
| Light Oak | `#D4A574` | `peak-wood-light` | Gradient start for wood accent bar |
| Wood | `#8B6914` | `peak-wood` | Mid-tone accent |
| Dark Mahogany | `#5D4037` | `peak-wood-dark` | Gradient end for wood accent bar |
| Copper | `#B87333` | `peak-copper` | Occasional warm accent |

### Color Scale (each primary has 50–950 shades)

```
peak-forest-50   #F4F7F5   (very light green tint)
peak-forest-100  #EAEFEC
peak-forest-200  #D5DEDA
peak-forest-300  #B5C5BE
peak-forest-400  #8BA499
peak-forest-500  #2D5A47   ← Main
peak-forest-600  #264C3C
peak-forest-700  #1F3F32
peak-forest-800  #193127
peak-forest-900  #12241C
peak-forest-950  #0B1711
```

Same pattern exists for `peak-brass-*`, `peak-burgundy-*`, `peak-navy-*`.

### Usage Rules

- **Never use raw hex** — always use Tailwind `peak-*` classes
- **One accent per element** — don't combine brass + burgundy on the same component
- **Forest green for all interactive elements** — buttons, links, focus states
- **Cream backgrounds only** — never pure white for page bg (cards can be white)
- **Charcoal for text** — never pure black

---

## Typography

| Role | Font | Tailwind | Usage |
|------|------|----------|-------|
| Display/Headers | Libre Baskerville (serif) | `font-display` or `font-heading` | Page titles, section headings, hero text |
| Body | Inter (sans-serif) | `font-body` or `font-sans` | Paragraphs, labels, buttons, navigation |
| Code/Specs | JetBrains Mono (monospace) | `font-mono` | Equipment specs, technical data, code |

### Font Weights
- `font-normal` (400) — body text
- `font-medium` (500) — buttons, labels
- `font-semibold` (600) — emphasis
- `font-bold` (700) — headings

### Size Scale
```
text-xs    0.75rem  (12px)
text-sm    0.875rem (14px)
text-base  1rem     (16px)
text-lg    1.125rem (18px)
text-xl    1.25rem  (20px)
text-2xl   1.5rem   (24px)
text-3xl   1.875rem (30px)
text-4xl   2.25rem  (36px)
text-5xl   3rem     (48px)
```

---

## Shadows

| Class | Effect | Usage |
|-------|--------|-------|
| `shadow-peak-sm` | Very subtle elevation | Buttons, small elements |
| `shadow-peak-md` | Standard card shadow | Cards, panels |
| `shadow-peak-lg` | Elevated element | Dropdowns, popovers |
| `shadow-peak-frame` | Framed object (border + shadow) | Featured items, gallery frames |
| `shadow-peak-lift` | Hover-state lift | Cards on hover |
| `shadow-peak-card` | Equipment card signature | Equipment listings |

All shadows use **charcoal-tinted** rgba (not black) for warmth:
```css
/* Example: peak-md */
0 4px 6px -1px rgba(44, 62, 80, 0.1), 0 2px 4px -2px rgba(44, 62, 80, 0.1)
```

### Shadow Hierarchy (visual depth layers)

1. `shadow-peak-sm` — flush with surface (buttons, inputs)
2. `shadow-peak-md` — slightly raised (standard cards)
3. `shadow-peak-card` — distinctly raised (equipment cards)
4. `shadow-peak-lg` — floating (dropdowns, modals)
5. `shadow-peak-lift` — hover animation target

---

## Border Radius

| Class | Size | Usage |
|-------|------|-------|
| `rounded-peak-sm` | 4px (0.25rem) | Subtle — inputs, small badges |
| `rounded-peak-md` | 8px (0.5rem) | Standard — buttons, small cards |
| `rounded-peak-lg` | 12px (0.75rem) | Cards — main content cards |
| `rounded-peak-xl` | 16px (1rem) | Modals — large containers |

**Key rule**: Never use `rounded-full` on cards. The signature Peak look is `rounded-peak-lg` (12px).

---

## Hover & Interaction

### Hover Lift
```tsx
// Subtle lift for buttons
className="hover:-translate-y-0.5"

// Pronounced lift for cards
className="hover:-translate-y-1"
```

### Transitions
```tsx
// Standard (all interactions)
className="transition-all duration-250 ease-out"

// Fast (button press feedback)
className="transition-all duration-150 ease-out"

// Slow (page-level animations)
className="transition-all duration-300 ease-out"
```

**Never use bounce/spring easing.** Peak aesthetic is smooth and understated.

### Focus States
```tsx
className="focus:outline-none focus:ring-2 focus:ring-peak-forest-500/50 focus:ring-offset-2 focus:ring-offset-peak-cream"
```

---

## Component Token Presets

### Button (primary)
```
bg: peak-forest-500
text: white
hover: peak-forest-600 + translateY(-2px)
active: peak-forest-700
shadow: peak-sm → peak-md on hover
border-radius: rounded-peak-md
```

### Card (equipment)
```
bg: white (snow)
border: 1px peak-stone
border-left: 4px peak-brass-500 (signature accent stripe)
shadow: peak-card
border-radius: rounded-peak-lg
hover: translateY(-4px) + shadow-peak-lift
```

### Card (stats)
```
bg: peak-forest-50 (light green tint)
border: 1px peak-forest-200
shadow: peak-sm
border-radius: rounded-peak-lg
```

### Input
```
bg: white
border: 1px peak-stone (neutral-300)
border-focus: peak-forest-500
shadow: inset (inner)
border-radius: rounded-peak-md
placeholder: peak-slate
```

---

## Wood Accent Pattern

The signature visual element — a 4px gradient bar:

```tsx
// Bottom border on cards
<div className="h-1 w-full rounded-b-peak-lg"
     style={{ background: "linear-gradient(90deg, #D4A574, #B8860B, #5D4037)" }} />
```

Colors: Light Oak (#D4A574) → Brass (#B8860B) → Mahogany (#5D4037)

Used on:
- Equipment card bottom borders
- Section dividers
- Hero section accents
- Navigation active indicator

---

## Quick Reference: Tailwind Classes

```tsx
// Complete card example
<div className="
  bg-white
  border border-peak-stone
  border-l-4 border-l-peak-brass-500
  rounded-peak-lg
  shadow-peak-card
  p-6
  transition-all duration-250 ease-out
  hover:-translate-y-1
  hover:shadow-peak-lift
">
  <h3 className="font-display text-xl text-peak-charcoal">Title</h3>
  <p className="font-body text-sm text-peak-slate mt-2">Description</p>
  <button className="
    mt-4 px-4 py-2
    bg-peak-forest-500 text-white
    font-sans font-medium text-sm
    rounded-peak-md
    shadow-peak-sm
    transition-all duration-250 ease-out
    hover:bg-peak-forest-600
    hover:-translate-y-0.5
    hover:shadow-peak-md
    focus:ring-2 focus:ring-peak-forest-500/50 focus:ring-offset-2
  ">
    Action
  </button>
</div>
```

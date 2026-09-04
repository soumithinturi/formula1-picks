# Product Design System Blueprint

This guide combines the "Four Layers of Color Theory" for functional depth and the "6 High-Impact Polish Techniques" for premium UI.

## Layer 1: The Neutral Foundation & Hierarchy

Neutrals are the "anchor" of your application. Use them to create depth and focus.

### Background & Surface Hierarchy

- **Background (The Frame):** Use 98%–99% white (e.g., `#F9F9FB`) for the main frame.
- **The Sidebar/Anchor:** Use a color 2% darker than the main background to anchor navigation.
- **Cards & Elevated Surfaces:** Use pure white (`#FFFFFF`) on off-white backgrounds.
- **Strokes & Borders:** Use ~85% white (light grey) to define edges without adding visual noise.

### Text & Opacity Hierarchy

Don't rely solely on color for text hierarchy; use **Opacity** to guide the eye.

- **High Emphasis (Headlines):** 100% opacity. ~11% white (near black).
- **Medium Emphasis (Body/Subheadings):** 70%–87% opacity.
- **Low Emphasis (Subtext/Captions):** 40%–60% opacity.

## Layer 2: Functional Accents & The "Star"

### Brand Scale

Treat your brand color as a scale (50–950), not a single hex code.

- **Primary (600):** Main brand actions.
- **Hover (700):** Darker step for interaction.
- **Link (400/500):** Lighter for inline text.

### The "Star of the Show"

Every page needs one "Seed"—a visual element connected to the brand story that anchors attention.

- **SaaS Tip:** Abstracted dashboards, glass-morphism charts, or high-quality noise-textured gradients often serve as the "Star."

## Layer 3: Dark Mode Strategy

### The "Double the Distance" Rule

Dark colors look more similar to the human eye.

- **Light Mode:** 2% distance between layers is sufficient.
- **Dark Mode:** Use **4–6% distance** between layers.
- **Elevation Rule:** Surfaces get **lighter** as they elevate (get "closer" to the light source).

## Layer 4: Typography Strategy

Move beyond just "picking a font." Anchor the personality around the Headline.

### Font Levels

- **Level 1:** One font family.
- **Level 2:** Super Families (Families with Sans, Serif, and Mono included).
- **Level 3:** Font Combos (High contrast).
- **Strategy:** Start with the **Headline Anchor** to set personality (Technical, Modern, or Warm). Choose a supporting font with width contrast (e.g., Condensed Headline + Spread-out Subheading).

| Level    | Size (rem) | Weight  | Use Case                 |
| :------- | :--------- | :------ | :----------------------- |
| **H1**   | 2.25rem+   | 700/800 | Page Titles (The Anchor) |
| **H2**   | 1.5rem     | 700     | Section Headers          |
| **Body** | 1.0rem     | 400     | Primary Reading          |

## Layer 5: Visual Rhyming & Depth

To make code feel like a "real world" product, use rhyming and tangible details.

- **Visual Rhyming:** Repeat subtle design choices (a specific corner radius, a shape from the logo, or a gradient style) across buttons, icons, and card masks to create a cohesive universe.
- **Subtle Depth:** Use subtle textures (Noise), "Glass" effects, or soft shadows to bridge the gap between pixels and the physical world. _Note: Depth should never compete with the "Star of the Show."_

## Layer 6: Antigravity Implementation (Developer Rulebook)

### 1. Tailwind Configuration (`tailwind.config.ts`)

Map your design layers to Tailwind tokens.

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        background: "var(--bg-main)",
        surface: "var(--bg-surface)",
        anchor: "var(--bg-anchor)",
        border: "var(--border-subtle)",
        text: {
          heading: "var(--text-heading)",
          body: "var(--text-body)",
        },
        brand: {
          DEFAULT: "var(--brand-primary)",
          hover: "var(--brand-hover)",
        },
      },
      opacity: {
        high: "0.87",
        medium: "0.60",
        low: "0.38",
      },
    },
  },
};
```

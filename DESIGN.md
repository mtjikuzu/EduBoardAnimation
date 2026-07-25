---
name: "EduWhiteboard"
colors:
  primary: "#5B51D8"
  secondary: "#F59E0B"
  neutral: "#F3F4F6"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#EF4444"
  surface: "#FFFFFF"
  text: "#1F2937"
  muted: "#9CA3AF"
  background: "#FAFAF9"
typography:
  h1:
    fontFamily: "DM Serif Display, Georgia, serif"
    fontSize: 2.25rem
  h2:
    fontFamily: "DM Serif Display, Georgia, serif"
    fontSize: 1.5rem
  h3:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 1.125rem
    fontWeight: 600
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 0.875rem
  small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 0.75rem
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: 0.8125rem
  sourceScale: "desktop-first with 1.25 modular scale"
  weights: "400, 500, 600, 700"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  sourceScale: "4px baseline grid"
---

## Overview

EduWhiteboard is a consumer SaaS for producing educational whiteboard videos from a conversational lesson brief. The UI should feel warm, focused, and professional — like a teacher's workspace, not a video editor.

## Style Foundations

- **Visual style:** clean, warm, confident, minimal — like a well-designed classroom whiteboard. Generous whitespace, card-based layout, subtle shadows.
- **Typography:** DM Serif Display for display/serif headings (warm editorial feel), Inter for body/UI (clean readability), JetBrains Mono for code/math
- **Color palette:** Purple primary (#5B51D8 — creative/educational), amber accent (#F59E0B — warm highlight), warm gray neutrals. High contrast for accessibility.
- **Spacing:** 4px baseline grid. Components use consistent padding tiers.

## Accessibility

WCAG 2.1 AA minimum. Focus indicators on all interactive elements. Color not used as sole indicator. Sufficient contrast on all text/background combinations.

## Writing Tone

confident, encouraging, clear. Use active voice. Address the creator directly ("you"). Avoid jargon. Error messages explain what happened and what to do next.

## Rules: Do

- Use card-based layouts with consistent border-radius (xl for modals, lg for cards, md for inputs)
- Keep one primary action per view — make it visually prominent (filled button)
- Show loading states as skeleton screens or clean spinners, never throbbers
- Use the serif font for page titles and section headings to establish warmth
- Group form inputs with clear labels, help text, and error states
- Use the warm gray background (#FAFAF9) for page-level containers
- Toast notifications for success/error feedback, positioned top-right

## Rules: Don't

- Don't use pure black text on white — use #1F2937 for body text
- Don't stack more than two primary buttons in one view
- Don't use icon-only buttons without aria-labels
- Don't mix border-radius levels within the same component
- Don't let content exceed 1280px width on desktop
- Don't disable browser default focus styles without replacing them
- Don't use placeholder text as a substitute for form labels

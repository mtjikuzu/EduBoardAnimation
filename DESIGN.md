---
name: "EduWhiteboard"
colors:
  primary: "#5B51D8"
  secondary: "#F59E0B"
  tertiary: "#F59E0B"
  neutral: "#FFFFFF"
  success: "#10B981"
  warning: "#D97706"
  danger: "#EF4444"
  surface: "#FFFFFF"
  text: "#1F2937"
typography:
  h1:
    fontFamily: "DM Serif Display"
    fontSize: 3rem
  body-md:
    fontFamily: "Inter"
    fontSize: 1rem
  label-caps:
    fontFamily: "JetBrains Mono"
    fontSize: 0.75rem
  sourceScale: "desktop-first"
  weights: "400, 500, 600, 700"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  sourceScale: "4/8/12/16/24/32/48"
---

## Overview
EduWhiteboard is a consumer SaaS that lets educational creators produce beautiful whiteboard videos from a conversational brief — no editing skills required. Warm, focused, and professional: like a well-designed classroom whiteboard.

## Style Foundations
- **Visual style:** clean, warm, confident, minimal, educational
- **Typography scale:** desktop-first | Fonts: primary=Inter, display=DM Serif Display, mono=JetBrains Mono | weights=400, 500, 600, 700
- **Color palette:** primary, secondary, neutral, success, warning, danger | Tokens: primary=#5B51D8, secondary=#F59E0B, success=#10B981, warning=#D97706, danger=#EF4444, surface=#FFFFFF, text=#1F2937
- **Spacing scale:** 4/8/12/16/24/32/48

## Accessibility
WCAG 2.1 AA minimum. Focus indicators on all interactive elements. Color not used as sole indicator. Sufficient contrast on all text/background combinations.

## Writing Tone
confident, encouraging, clear, active voice. Address the creator directly. Avoid jargon.

## Rules: Do
- Use card-based layouts with consistent border-radius
- Keep one primary action per view — make it a filled button with the primary token
- Show loading states as skeleton screens or clean spinners
- Use serif font (DM Serif Display) for page titles and section headings
- Group form inputs with clear labels, help text, and error states
- Use warm gray background (#FAFAF9) for page-level containers
- Use toast notifications for success/error feedback, positioned top-right
- Prefer semantic tokens over raw values
- Preserve visual hierarchy

## Rules: Don't
- Don't use pure black text on white — use #1F2937 for body text
- Don't stack more than two primary buttons in one view
- Don't use icon-only buttons without aria-labels
- Don't mix border-radius levels within the same component
- Don't let content exceed 1280px width on desktop
- Don't disable browser default focus styles without replacing them
- Don't use placeholder text as a substitute for form labels
- Avoid low contrast text or inconsistent spacing rhythm

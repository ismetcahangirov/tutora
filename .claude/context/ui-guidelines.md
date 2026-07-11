# Tutora — UI / UX Guidelines

## Design Principles

1. **Minimal.** Remove anything that does not serve a clear user goal. Every element earns its place.
2. **Premium.** High-quality typography, tight spacing, deliberate use of white space. The app should feel expensive.
3. **Trustworthy.** Consistent, predictable interactions. No dark patterns. Clear affordances. Honest feedback states.
4. **No gradients — ever.** Flat solid fills only. Gradients are explicitly banned in all layers (backgrounds, buttons, cards, icons, illustrations).
5. **Accessible.** WCAG AA minimum. Tap targets ≥ 44 × 44 pt. Dynamic Type supported. Screen reader labels on all interactive elements.

---

## Color Palette

### Light Mode

| Token | HEX | Usage |
|---|---|---|
| Primary | `#4F46E5` | Primary actions, active states, links |
| Primary Dark | `#4338CA` | Primary button pressed state |
| Primary Light | `#EEF2FF` | Primary tinted backgrounds, chips |
| Secondary | `#0EA5E9` | Secondary actions, info chips |
| Accent | `#F59E0B` | Ratings (stars), highlights, badges |
| Background | `#FFFFFF` | App / screen background |
| Surface | `#F8FAFC` | Page sections, list backgrounds |
| Card | `#FFFFFF` | Card backgrounds |
| Border | `#E2E8F0` | Card borders, dividers, input borders |
| Divider | `#EEF2F6` | Subtle separators within lists |
| Text Primary | `#0F172A` | Headings, primary body copy |
| Text Secondary | `#64748B` | Labels, secondary descriptors |
| Muted | `#94A3B8` | Placeholder text, disabled labels |
| Success | `#16A34A` | Confirmed, accepted, verified |
| Warning | `#F59E0B` | Pending, attention needed |
| Danger | `#DC2626` | Errors, destructive actions |
| Info | `#2563EB` | Informational banners |
| Disabled | `#CBD5E1` | Disabled control fills |
| Overlay | `rgba(15, 23, 42, 0.5)` | Modal / sheet backdrop |

### Dark Mode

| Token | HEX | Usage |
|---|---|---|
| Background | `#0B1120` | App background |
| Surface | `#111827` | Section backgrounds |
| Card | `#1E293B` | Card backgrounds |
| Border | `#334155` | Borders and dividers |
| Text Primary | `#F8FAFC` | Headings, primary body copy |
| Text Secondary | `#94A3B8` | Secondary descriptors |
| Primary | `#6366F1` | Primary actions (lighter for dark bg) |

All other semantic tokens (Success, Warning, Danger, etc.) remain the same in dark mode unless contrast ratio falls below 4.5:1, in which case a lighter tint is used.

---

## Typography

**Primary font:** Plus Jakarta Sans  
**Fallback:** Inter  
**Import:** Load via `@expo-google-fonts/plus-jakarta-sans` (mobile) or `@fontsource/plus-jakarta-sans` (web/admin).

### Type Scale

| Style | Size (px) | Line Height (px) | Weight | Usage |
|---|---|---|---|---|
| Display | 32 | 40 | 700 | Hero headlines, onboarding titles |
| Headline | 28 | 36 | 700 | Screen headings (H1) |
| Title | 22 | 28 | 600 | Section headings (H2), card titles |
| Subtitle | 18 | 26 | 600 | Sub-section headings, modal titles |
| Body | 16 | 24 | 400 | Primary body copy |
| Body Small | 14 | 20 | 400 | Secondary descriptions, helper text |
| Caption | 12 | 16 | 400 | Timestamps, metadata, footnotes |
| Label | 13 | 16 | 500 | Form labels, tab labels, tags |
| Button | 15 | 20 | 600 | Button text only |

**Rules:**
- Never render body text below 12 px.
- Headings use weight 600–700. Body copy uses 400. Emphasis uses 500–600 (never bold on body).
- Letter spacing: Headlines −0.5px, Display −1px, Body/Caption 0.
- Text color for body copy: `Text Primary` on white/surface. `Text Secondary` for helper/secondary.

---

## Border Radius Scale

| Token | Value (px) | Usage |
|---|---|---|
| xs | 6 | Tags, badges, tooltips |
| sm | 8 | Input fields, small chips |
| md | 12 | Buttons, smaller cards, search bars |
| lg | 16 | Standard card (default) |
| xl | 20 | Modals, large cards |
| 2xl | 24 | Bottom sheets, profile cards |
| full | 999 | Pills, avatar bubbles, toggles |

Default card radius is **16 px** (lg).

---

## Spacing (4pt Grid)

All spacing values must align to the 4pt grid. Allowed values:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64` (px / pt)

- Screen horizontal padding: **16 px** (compact) or **24 px** (comfortable).
- Section vertical gap: **24 px**.
- Card internal padding: **16 px**.
- List item vertical padding: **12 px**.
- Form field gap: **16 px**.
- Icon-to-label gap: **8 px**.

---

## Elevation / Shadow

No heavy drop shadows. Use soft, low-elevation shadows only.

| Level | Usage | iOS Shadow | Android Elevation |
|---|---|---|---|
| 0 | Flat surface (no elevation) | none | 0 |
| 1 | Cards on white background | `0 1px 3px rgba(15,23,42,0.06)` | 2 |
| 2 | Floating action buttons, active sheets | `0 4px 12px rgba(15,23,42,0.08)` | 4 |
| 3 | Modals, bottom sheets | `0 8px 24px rgba(15,23,42,0.12)` | 8 |

Dark mode shadows are invisible — use `Card` border (`#334155`) to separate surfaces instead.

---

## Icon Sizes

| Context | Size |
|---|---|
| Navigation tab icons | 24 × 24 pt |
| List item leading icons | 20 × 20 pt |
| Inline / body icons | 16 × 16 pt |
| Button leading icons | 18 × 18 pt |
| FAB icon | 24 × 24 pt |
| Header action icons | 24 × 24 pt |

Icon library: `react-native-svg` with custom icon components. Never use emoji as icons in UI.

---

## Animation

Library: **React Native Reanimated 3** + **React Native Gesture Handler**.

| Motion Type | Duration | Easing |
|---|---|---|
| Micro-interactions (press, toggle) | 100–150 ms | `Easing.out(Easing.quad)` |
| Screen transitions | 280–350 ms | `Easing.inOut(Easing.cubic)` |
| Bottom sheet open/close | 300 ms | Spring (`damping: 20, stiffness: 300`) |
| Skeleton shimmer loop | 1200 ms | Linear |
| Toast in/out | 200 ms | `Easing.out(Easing.ease)` |
| FAB expansion | 200 ms | Spring (`damping: 15, stiffness: 200`) |
| List item enter (staggered) | 250 ms | `Easing.out(Easing.cubic)` |

**Rules:**
- All animations respect `useReducedMotion`. If reduced motion is on, snap to final state with zero duration.
- Never block interaction while an animation is running.
- Use `withSpring` for natural feel on gesture-driven transitions; use `withTiming` for explicit UI state changes.

---

## Component Patterns

### Buttons

| Variant | Fill | Text Color | Border | Usage |
|---|---|---|---|---|
| Primary | `#4F46E5` | White | none | Main CTA |
| Primary Outline | Transparent | `#4F46E5` | `#4F46E5` 1.5 px | Secondary CTA |
| Ghost | Transparent | `#4F46E5` | none | Tertiary / text action |
| Danger | `#DC2626` | White | none | Destructive action |
| Disabled | `#CBD5E1` | `#94A3B8` | none | Any disabled state |

- Height: **48 pt** (standard), **40 pt** (compact), **56 pt** (large / hero).
- Border radius: **md (12 px)** for standard, **full (999)** for pill variant.
- Font: Button scale (15/20, weight 600).
- Pressed state: `opacity: 0.85` + scale `0.98` via Reanimated.
- Loading state: replace label with `ActivityIndicator` (white) at same size; button remains disabled.
- Icon + label: icon left, 8 px gap.

### Inputs

- Height: **52 pt**.
- Border: `1.5 px solid #E2E8F0`.
- Focused border: `1.5 px solid #4F46E5`.
- Error border: `1.5 px solid #DC2626`.
- Border radius: **sm (8 px)**.
- Padding: `12 px vertical, 16 px horizontal`.
- Label: Label scale (13/16, weight 500), `Text Primary`, 8 px above input.
- Helper text: Caption scale (12/16), `Text Secondary`, 4 px below input.
- Error text: Caption scale, `Danger`, 4 px below input.
- Placeholder: Muted color (`#94A3B8`).

### Cards

- Background: `Card` (`#FFFFFF` light / `#1E293B` dark).
- Border: `1 px solid #E2E8F0` (light) / `1 px solid #334155` (dark).
- Border radius: **lg (16 px)**.
- Padding: **16 px** all sides.
- Shadow: Level 1.
- Pressed state: `opacity: 0.94` + scale `0.99`.

### Loading & Skeletons

- Use skeleton shimmer placeholders (never spinner) for list content loading.
- Skeleton color: `#E2E8F0` (light) / `#334155` (dark), animated shimmer left-to-right.
- Match skeleton shape to the actual content it replaces (same height, same radius).
- For action-triggered loading (button tap), show inline spinner inside the button.
- Full-screen loading only for initial auth state resolution.

### Bottom Sheet

Library: `@gorhom/bottom-sheet`.

- Backdrop: `Overlay` (`rgba(15,23,42,0.5)`).
- Sheet background: `Card` color.
- Border radius: **2xl (24 px)** top corners only.
- Handle indicator: 4 × 32 px, `Border` color, centered, 8 px from top.
- Snap points: define explicit snaps; avoid dynamic height unless content is truly variable.
- Close on backdrop tap: always enabled.
- Keyboard aware: use `BottomSheetScrollView` when form fields inside.

### Toast / Snackbar

- Position: top (below status bar, 16 px margin) for success/info; bottom (above tab bar) for errors.
- Max width: screen width minus 32 px padding.
- Border radius: **lg (16 px)**.
- Background: `Text Primary` for dark toast; variant colors for semantic toasts.
- Duration: 3 000 ms auto-dismiss (errors: 5 000 ms, persist until dismissed).
- Never stack more than one toast — queue them.

### Modals

- Backdrop: `Overlay`.
- Modal container: `Card` background, **xl (20 px)** radius, 24 px padding.
- Width: `min(screen - 48px, 400px)`.
- Always include a close action (X icon or swipe).
- Avoid nested modals.

### FAB (Floating Action Button)

- Size: **56 × 56 pt**.
- Border radius: **full (999)**.
- Background: `Primary` (`#4F46E5`).
- Shadow: Level 2.
- Icon: 24 × 24 pt, white.
- Position: bottom-right, 24 px from edges (above tab bar safe area).

### Search Bar

- Height: **48 pt**.
- Background: `Surface` (`#F8FAFC`).
- Border: `1 px solid #E2E8F0`.
- Border radius: **full (999)** for pill-search style.
- Leading icon: search (magnifier) 20 × 20 pt, `Muted`.
- Trailing: clear (X) icon when input has value.

### Filter Chips

- Height: **34 pt**.
- Border radius: **full (999)**.
- Inactive: `Surface` background, `Border` border, `Text Secondary` text.
- Active: `Primary Light` (`#EEF2FF`) background, `Primary` border, `Primary` text.
- Font: Label scale (13/16, weight 500).
- Horizontal scroll when more than 4 chips.

---

## States Every Screen Must Handle

Every data-driven screen must implement all five states:

| State | UI |
|---|---|
| **Loading** | Skeleton shimmer matching content layout |
| **Empty** | Illustration + headline + helper text + optional CTA |
| **Error** | Error icon + message + "Retry" button |
| **Success / Populated** | The actual content |
| **Partial / Pagination loading** | Inline spinner at bottom of list (FlashList footer) |

---

## Dark Mode

- All components must respond to the system color scheme via `useColorScheme()`.
- Never hardcode colors — always reference design tokens.
- Test every screen in both modes before marking work done.
- Dark mode surface colors must not be pure black; use the specified `#0B1120` / `#111827` / `#1E293B` hierarchy.

---

## Accessibility (WCAG AA)

| Rule | Requirement |
|---|---|
| Color contrast — body text | ≥ 4.5 : 1 |
| Color contrast — large text (≥ 18 pt bold) | ≥ 3 : 1 |
| Tap target size | Minimum 44 × 44 pt |
| Focus indicators | Visible on all interactive elements |
| Screen reader labels | `accessibilityLabel` on every icon button, image, and non-text element |
| Hints | `accessibilityHint` for non-obvious interactions |
| Dynamic Type | All text scales with system font size (use `allowFontScaling`) |
| Motion | Respect `useReducedMotion` — disable or simplify all animations |
| Error messages | Announced to screen reader on form validation failure |
| Loading states | Announce "Loading" then "Loaded" via `accessibilityLiveRegion` |

**Never convey information through color alone.** Always pair color with an icon or text label.

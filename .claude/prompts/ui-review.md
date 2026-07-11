# UI Review Prompt Template

Use this checklist when reviewing any UI change — whether in a PR, a design implementation, or a self-review before marking work done. Apply it against the Tutora design system defined in `.claude/context/ui-guidelines.md`.

---

## How to Use This Template

1. Open the screen or component to be reviewed.
2. Work through each section in order.
3. Note any violation with: **file path + line number + what is wrong + what it should be**.
4. For PR reviews: post violations as inline comments on the relevant lines.
5. Do not approve a UI change that has unresolved violations in the "Must Fix" categories.

---

## Section 1 — Design Tokens (Must Fix)

Verify that no values are hardcoded that should reference design tokens.

**Colors:**

- [ ] No hardcoded color hex values in styles (e.g., `color: '#4F46E5'` should be `colors.primary`)
- [ ] No gradients used anywhere (background, button fill, text, icon, illustration)
- [ ] All color references map to a token in the palette (check `.claude/context/ui-guidelines.md`)
- [ ] Danger/Success/Warning/Info colors only used for their semantic meaning

**Spacing:**

- [ ] All padding and margin values are multiples of 4 pt (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- [ ] No arbitrary spacing values (e.g., `paddingTop: 7`, `marginLeft: 13`)
- [ ] Screen horizontal padding is 16 px (compact) or 24 px (comfortable)
- [ ] Card internal padding is 16 px

**Border Radius:**

- [ ] All `borderRadius` values come from the radius scale: 6, 8, 12, 16, 20, 24, or 999
- [ ] Cards use radius 16 (lg)
- [ ] Buttons use radius 12 (md) for standard or 999 (full) for pill
- [ ] Inputs use radius 8 (sm)
- [ ] Bottom sheets use radius 24 (2xl) on top corners only

**Typography:**

- [ ] Font family is Plus Jakarta Sans (not system default, not another font)
- [ ] Font sizes come from the type scale: 12, 13, 14, 15, 16, 18, 22, 28, 32
- [ ] Font weights are correct per role: Display/Headline = 700, Title/Subtitle = 600, Body = 400, Label = 500, Button = 600
- [ ] No text below 12 px

**Shadows:**

- [ ] Shadow values match one of the four defined elevation levels (0–3)
- [ ] No heavy drop shadows with large blur or spread
- [ ] In dark mode: borders used instead of shadows for surface separation

---

## Section 2 — Component Patterns (Must Fix)

**Buttons:**

- [ ] Primary button fill is `#4F46E5` (Primary), not a gradient
- [ ] Disabled button uses `#CBD5E1` fill and `#94A3B8` text
- [ ] Button text uses Button type scale (15 px / 600 weight)
- [ ] Button has a pressed state (opacity 0.85 + scale 0.98 via Reanimated)
- [ ] Loading state replaces label with ActivityIndicator (not spinner overlay on top of text)
- [ ] Minimum button height: 48 pt (standard), 40 pt (compact)

**Inputs:**

- [ ] Input has a visible label (not just placeholder)
- [ ] Border changes to `#4F46E5` (Primary) on focus
- [ ] Border changes to `#DC2626` (Danger) on error
- [ ] Error message appears below the input in Caption style, Danger color
- [ ] Placeholder text uses Muted color (`#94A3B8`)

**Cards:**

- [ ] Card background is `Card` token (white in light, `#1E293B` in dark)
- [ ] Card border is 1 px `Border` token
- [ ] Card radius is 16 px
- [ ] Card padding is 16 px
- [ ] Card has Level 1 shadow (light mode only)

**Lists:**

- [ ] Uses FlashList, not FlatList or ScrollView with map()
- [ ] List item has correct vertical padding (12 px)
- [ ] Dividers use the `Divider` color token (`#EEF2F6`)

**Bottom Sheet:**

- [ ] Uses `@gorhom/bottom-sheet`
- [ ] Backdrop uses `Overlay` color
- [ ] Has a visible handle indicator (4 × 32 px)
- [ ] Snap points are explicitly defined (not dynamic height without justification)
- [ ] Dismisses on backdrop tap

---

## Section 3 — All Five UI States (Must Fix)

For every data-driven screen or list component:

- [ ] **Loading state:** Skeleton shimmer shown (not blank screen, not spinner over content)
  - Skeleton shape matches the actual content layout
  - Shimmer animation loops correctly
- [ ] **Empty state:** Illustration + headline + helper text shown
  - If user can take an action to resolve the emptiness, include a CTA button
  - Message is localized (uses i18n key)
- [ ] **Error state:** Error message + Retry button shown
  - Error message is user-friendly (not a raw API error string)
  - Retry triggers a re-fetch
- [ ] **Success / populated state:** Content renders correctly
- [ ] **Pagination loading:** Inline spinner appears at bottom of list when fetching the next page
  - Not a full-screen overlay
  - FlashList `ListFooterComponent` used correctly

---

## Section 4 — Dark Mode (Must Fix)

- [ ] All colors respond to `useColorScheme()` — no hardcoded light-only colors
- [ ] Screen tested in dark mode manually
- [ ] Text is readable on dark backgrounds (contrast checked)
- [ ] Card surfaces use `#1E293B`, not pure black
- [ ] Borders use `#334155` in dark mode
- [ ] Shadows replaced with borders for surface separation in dark mode
- [ ] Images/icons with light backgrounds do not look broken on dark backgrounds (use transparent PNGs or adaptive assets)

---

## Section 5 — Accessibility (Must Fix)

- [ ] All icon-only buttons have `accessibilityLabel`
- [ ] All images have `accessibilityLabel` describing the content
- [ ] Form inputs have associated labels (not just placeholder)
- [ ] All interactive elements have a minimum tap target of 44 × 44 pt
  - Check: if the visual element is smaller, wrap it in a Pressable with `hitSlop`
- [ ] Error messages are announced to screen reader: `accessibilityLiveRegion="polite"`
- [ ] Loading/loaded state transitions announced: `accessibilityLiveRegion`
- [ ] Color is not the sole means of conveying information (always paired with icon or text)
- [ ] `allowFontScaling={true}` not overridden to `false` on any `<Text>` component

**Contrast check:**

- [ ] Body text: ≥ 4.5:1 contrast ratio against background
- [ ] Large text (≥ 18 pt or bold 14 pt): ≥ 3:1 contrast ratio
- [ ] Use the WebAIM Contrast Checker or Figma's built-in accessibility plugin to verify

---

## Section 6 — Animation (Should Fix)

- [ ] All animations use React Native Reanimated (not the Animated API)
- [ ] Animation durations match the defined scale (100–150 ms micro, 280–350 ms screen transition, 300 ms sheet)
- [ ] `useReducedMotion` is checked and animations are disabled/simplified when true
- [ ] No animations that block user interaction
- [ ] Spring animations used for gesture-driven transitions; timing used for discrete UI state changes

---

## Section 7 — Consistency (Should Fix)

Compare the new screen/component against existing screens that are already approved:

- [ ] Navigation header style is consistent (title weight, back button, action icons)
- [ ] Empty state illustration style is consistent with existing empty states
- [ ] Toast/snackbar position and style is consistent
- [ ] Loading skeleton style is consistent (same shimmer color and animation speed)
- [ ] Button hierarchy is consistent (not multiple primary buttons on the same screen)
- [ ] Icon library is consistent — only SVG icons from the approved icon set

---

## Section 8 — Localization (Must Fix)

- [ ] No hardcoded user-visible strings in the component
- [ ] All text uses `t('key')` from i18next
- [ ] i18n keys follow the naming convention: `<feature>.<component>.<key>`
- [ ] All three locale files (`az.json`, `en.json`, `ru.json`) have the new keys
- [ ] Long strings tested: does the layout break if the Azerbaijani or Russian translation is 50% longer?

---

## Section 9 — Performance (Nice to Have)

- [ ] No anonymous functions in JSX props that are inside a list (causes unnecessary re-renders)
- [ ] Pure display components used inside lists are wrapped in `React.memo`
- [ ] `useMemo` used for expensive computed values rendered in the component
- [ ] Images use `expo-image` (not the built-in `Image`) for caching and blurhash placeholder
- [ ] No layout animations applied to every list item (only to items entering/leaving the viewport)

---

## Review Decision

| Finding                             | Category     | Resolution Required Before Merge |
| ----------------------------------- | ------------ | -------------------------------- |
| Design token violation              | Must Fix     | Yes                              |
| Missing UI state                    | Must Fix     | Yes                              |
| Dark mode broken                    | Must Fix     | Yes                              |
| Accessibility missing               | Must Fix     | Yes                              |
| Wrong animation duration            | Should Fix   | Recommended; can follow up       |
| Inconsistency with existing screens | Should Fix   | Recommended; can follow up       |
| Performance concern                 | Nice to Have | Can create a ticket for later    |

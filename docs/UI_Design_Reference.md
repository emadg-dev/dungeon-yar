# UI Design Notes

## Source Reference
Project: `D:\Emad\Projects\jib-be-jib\jib-be-jib-web`
Type: Financial / Trip management app (Persian language)
Framework: React + TypeScript + Tailwind v4 + shadcn-style components

---

## 1. Design System (CSS Variables — HSL)

Jib-be-jib uses HSL-based CSS variables for consistent light/dark theming:

```css
:root {
  --background: 220 25% 97%;       /* very light cool blue-white */
  --foreground: 222 47% 11%;       /* near-black text */
  --card: 0 0% 100%;
  --primary: 243 75% 59%;         /* indigo/purple */
  --primary-foreground: 210 40% 98%;
  --muted: 220 14% 96%;
  --border: 220 13% 91%;
  --ring: 243 75% 59%;
  --radius: 1rem;
}
.dark {
  --background: 222 47% 7%;        /* very dark navy */
  --foreground: 210 40% 98%;
  --primary: 243 75% 65%;
  --card: 222 47% 11%;
  --muted: 217 33% 17%;
  --border: 217 33% 22%;
  --ring: 243 75% 65%;
}
```

**Recommendation for Zorvania:**
- Replace hard hex colors (`#0E0D0C`, `#171513`, `#2F2A23`) with a CSS-variable-based system.
- Define `--bg`, `--surface`, `--surface-card`, `--text`, `--accent`, `--accent-foreground`, `--border`, `--radius`.
- Keep Zorvania’s warm amber accent (`#E0A030`) as `--primary` but add a complementary muted surface palette.

---

## 2. Glass-Panel Component Pattern

Jib-be-jib defines `.glass-panel` in `index.css`:

```css
.glass-panel {
  border: border-white/30;
  shadow-sm;
  backdrop-blur-xl;
  backdrop-saturate-150;
  background: rgba(255,255,255,0.7);
  box-shadow:
    0 4px 24px rgba(0,0,0,0.06),
    inset 0 1px 0 rgba(255,255,255,0.6);
}
.dark .glass-panel {
  border: border-white/10;
  background: rgba(15,18,35,0.7);
}
```

Used on: sidebar (`aside`), mobile header (`header`), bottom dock.

**Recommendation:**
- Add a `.glass-card` / `.glass-panel` utility to Zorvania’s `index.css` to replace flat `#171513` cards.
- Apply to `StickyHeader`, character sheet cards, DM dashboard, and modals.
- Example for Zorvania dark glass:
  ```css
  background: rgba(23, 21, 19, 0.85);
  border: 1px solid rgba(255,255,255,0.06);
  backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.3);
  ```

---

## 3. Background Gradient

Jib-be-jib uses a subtle multi-stop gradient background, not flat:

```css
html {
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 25%, #f5f0ff 50%, #eef5ff 75%, #f0f4ff 100%);
  background-attachment: fixed;
}
.dark html {
  background: linear-gradient(135deg, #0a0e1a 0%, #0d1225 25%, #110d1f 50%, #0a1428 75%, #0a0e1a 100%);
}
```
Decorative soft radial orbs (`body::before`, `body::after`) add depth.

**Recommendation:**
- Replace Zorvania’s flat `#0E0D0C` with a very subtle warm gradient:
  ```css
  background: linear-gradient(135deg, #0E0D0C 0%, #12100F 40%, #0E0D0C 100%);
  ```
- Or add a very faint amber radial glow (`#E0A030` at 4-6% opacity) as a decorative orb behind the content area.

---

## 4. Component Design Patterns

### Card (`core.tsx`)
```tsx
<Card className="glass-panel overflow-hidden rounded-2xl shadow-sm">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```
- Always `rounded-2xl` (approx `1rem` radius).
- `shadow-sm`, never heavy drop shadows.
- No solid dark borders; borders are `border-border` (semi-transparent).

**Recommendation:** Update Zorvania `StickyHeader` and tab cards to use rounded-2xl with glass-panel styling instead of flat dark cards.

### Button (`core.tsx`)
- Base: `inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold`
- Focus ring: `focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40`
- Active: `active:scale-[.98]`
- Disabled: `disabled:pointer-events-none disabled:opacity-50`
- Variant styles: `primary` (indigo with shadow-lg), `secondary`, `outline` (transparent bg + border), `ghost` (hover bg only)

**Recommendation:** Apply button styling pattern to Zorvania action buttons (Save, Rest, Dice, etc.) — especially the `min-h-11`, `rounded-xl`, `focus-visible:ring`, and `active:scale-[.98]`.

### Input / Select / Textarea (`core.tsx`)
- `h-11` (44px touch-friendly height)
- `rounded-xl`
- `border border-input`
- Focus: `focus:border-ring focus:ring-4 focus:ring-ring/20`
- `backdrop-filter: blur(8px)` in `.select-control`

**Recommendation:** Ensure all Zorvania form inputs (character name, notes, etc.) have `min-h-11`, `rounded-xl`, and visible focus rings. Currently some inputs may be smaller.

### Skeleton (`Skeleton.tsx`)
- Uses `animate-pulse` with `rounded-xl bg-muted`.
- Component-level skeletons: `CardSkeleton`, `StatsCardSkeleton`, `ChartSkeleton`, `TableSkeleton`, `DashboardSkeleton`, `PageSkeleton`.

**Recommendation:** The `TabSkeleton` we created for Zorvania aligns well. Consider adding `CardSkeleton` and `StatsCardSkeleton` patterns for DM dashboard and character overview cards.

---

## 5. Mobile Navigation (Bottom Dock)

`AppLayout.tsx` has `.liquid-dock`:

```css
.liquid-dock { position: fixed; bottom: 0.75rem; left: 50%; z-index: 50; max-width: 28rem; transform: translateX(-50%); }
.liquid-dock__track {
  display: flex; align-items: center; justify-content: space-around;
  padding: 0.5rem 0.625rem; border-radius: 1.5rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.55) 0%, ...);
  backdrop-filter: blur(24px) saturate(180%);
}
.liquid-dock__item {
  width: 3.125rem; height: 3.125rem; border-radius: 1rem;
  transition: color 0.25s, background 0.25s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
}
.liquid-dock__item--active {
  color: white;
  background: linear-gradient(135deg, hsl(243,75%,62%), hsl(255,70%,60%));
  box-shadow: 0 2px 8px rgba(99,102,241,0.35), 0 4px 20px rgba(99,102,241,0.25);
  transform: scale(1.05);
}
```
- Glass track with inner glow (`::before` gradient top highlight) and edge (`::after` inset shadow).
- Active item has gradient pill + shadow + scale.
- Hover: `hover:color` change + subtle bg tint.

**Recommendation for Zorvania BottomNav:**
- Replace flat `bg-[#171513]/95` with a `glass-panel`-style bottom track using `backdrop-filter: blur(16px)`.
- Active state: gradient background (`#E0A030` → `#F2C265`) instead of just text color change.
- Add `scale(1.05)` on active, `scale(0.9)` on active press.
- Add inner glow (`::before`) and edge (`::after`) pseudo-elements.
- Keep the FAB (dice button) centered raised.

---

## 6. Dialog Patterns

### Alert Dialog (`alert-dialog.tsx`)
- Overlay: `fixed inset-0 bg-black/50 backdrop-blur-sm`
- Content: `fixed left-[50%] top-[50%] translate-[-50%, -50%] rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xl`
- Dark variant: `dark:border-slate-700/60 dark:bg-slate-900`
- Header: centered text (`flex flex-col items-center text-center`)
- Icon: `rounded-full bg-amber-100` (or indigo/emerald/rose based on variant)
- Footer: centered buttons with gap-2 (`flex justify-center gap-2`)

**Recommendation:** Update `ConfirmLeaveDialog` in Zorvania to use this pattern — rounded-2xl, centered header, icon container with amber bg (`bg-[#E0A030]/15` instead of flat), and centered footer buttons.

### Form Dialog (`FormDialog.tsx`)
- `max-w-lg`, `max-h-[85vh] flex flex-col`
- Header at top (`px-5 pt-5 pb-0`), body scrollable (`flex-1 overflow-y-auto px-5 py-4`), footer (`border-t border-border px-5 py-3`)
- Close button: absolute top-right (`end-3 top-3`)

**Recommendation:** Any multi-step forms in Zorvania could use this scrollable form-dialog layout (e.g., advanced rest modal, invite creation).

---

## 7. Typography & Font Stack

```css
font-family: "Shabnam", "IRANSans", Tahoma, Arial, sans-serif;
```
- `text-sm font-semibold` for card titles.
- `text-xs font-semibold uppercase tracking-wide text-slate-500` for table headers / labels.
- `text-2xl font-bold tracking-tight` for page titles.
- `text-sm text-muted-foreground` for subtitles.

**Recommendation:** Zorvania already uses Vazirmatn (good for Persian). Could add `"Shabnam",` as a secondary option in CSS `font-family`. Ensure `font-weight: 400/600/800` mapping works properly.

---

## 8. Layout Patterns

### App Layout (`AppLayout.tsx`)
- Main: `min-h-screen lg:flex`
- Sidebar: `hidden lg:flex` (fixed left sidebar, glass-panel, width 72)
- Main content: `min-w-0 flex-1 lg:ml-72`
- Mobile header: `fixed top-0 ... lg:hidden` (compact glass header with brand + controls)
- Footer: centered `text-xs text-muted-foreground/60`
- Responsive max-width: `max-w-7xl mx-auto`
- Mobile dock: `fixed bottom-0.75rem lg:hidden`

**Recommendation:** The current Zorvania app uses `Header` component. Consider:
- Making the desktop header more compact (like jib-be-jib mobile header) or creating a sidebar layout for desktop.
- Using `max-w-7xl mx-auto` for content areas.
- Adding a footer credit line (optional).

---

## 9. Theme Toggle & Preferences

`PreferencesContext.tsx` manages `theme` (`light`/`dark`).
- Toggle theme: `Sun`/`Moon` icons.
- Both buttons: `flex min-h-10 items-center gap-1 rounded-xl p-2 text-muted-foreground hover:bg-accent`

**Recommendation:** Zorvania could add a light theme option using the same CSS-variable approach (currently only dark). The amber accent (`#E0A030`) works well in both light and dark.

---

## 10. Accessibility Patterns

- All interactive elements: `aria-label`, `aria-pressed` on active nav items, `aria-busy` on loading buttons.
- Focus: always `focus-visible:ring-4 focus-visible:ring-ring/20` or `/40`.
- Touch targets: `min-h-11` (44px) minimum.
- Disabled state: `pointer-events-none opacity-50`.
- Dialog overlay: `backdrop-blur-sm` for depth.

**Recommendation:** Already partially implemented in Zorvania (added `min-h-[44px]`, `focus-visible:ring-2`, `aria-pressed`, `aria-label`). Consider upgrading `focus-visible:ring` intensity and adding `aria-busy` to the save/loading states.

---

## 11. Key Takeaways / Actionable Updates for Zorvania

| Area | Current State | Jib-be-jib Pattern | Action |
|---|---|---|---|
| Background | Flat `#0E0D0C` | Gradient + decorative orbs | Add gradient `bg-gradient-to-br` and radial glow |
| Glass panels | Flat `#171513` cards | `.glass-panel` with `backdrop-blur-xl` | Create `.glass-card` utility; apply to cards/modals/header |
| Buttons | Basic hover | `min-h-11 rounded-xl focus-visible:ring active:scale-[.98]` | Apply button component styles globally |
| Inputs | Basic styling | `h-11 rounded-xl focus:ring-4` | Ensure forms use consistent `min-h-[44px]` and ring focus |
| Mobile dock | Flat dark bar | `.liquid-dock` glass track + active gradient pill | Redesign `BottomNav` with glass + active gradient + scale |
| Skeletons | `TabSkeleton` only | Multiple skeleton types (`CardSkeleton`, `TableSkeleton`, `PageSkeleton`) | Add `CardSkeleton`, `StatsCardSkeleton` |
| Dialogs | Basic modal | `rounded-2xl` glass, centered icon, centered footer | Update `ConfirmLeaveDialog` and any other modals |
| Typography | Vazirmatn only | Shabnam / Iranian Sans stack | Add `font-family: "Vazirmatn", "Shabnam", Tahoma, Arial, sans-serif` |
| CSS System | Hard hex values | HSL variables (`--primary`, `--card`, etc.) | Define CSS variables in `index.css` for colors, radii, borders |
| Theme | Dark only | Light + Dark with HSL variables | Add light-theme CSS variables (optional) |

---

## 12. Sample Design Token Updates for Zorvania

Proposed `index.css` additions:

```css
@layer base {
  :root {
    --bg: 222 47% 7%;          /* #0E0D0C */
    --surface: 222 47% 9%;     /* #171513 */
    --surface-card: 222 47% 11%;
    --text: 45 25% 90%;        /* #EDE6D8 */
    --text-muted: 45 15% 55%;  /* #8A8374 */
    --accent: 36 95% 54%;      /* #E0A030 */
    --accent-foreground: 222 47% 7%;
    --border: 222 47% 16%;     /* #2F2A23 */
    --radius-card: 1.25rem;
    --radius-sm: 0.75rem;
  }

  body {
    background: linear-gradient(135deg, #0E0D0C, #12100F 40%, #0A0A09 100%);
    background-attachment: fixed;
  }
}

@layer components {
  .glass-card {
    @apply rounded-2xl border border-[rgba(255,255,255,0.06)]
      bg-[rgba(23,21,19,0.85)] backdrop-blur-xl
      shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_24px_rgba(0,0,0,0.35)];
  }
}
```

---

*Notes compiled from exploration of `jib-be-jib-web` source (`AppLayout.tsx`, `core.tsx`, `Skeleton.tsx`, `index.css`, `tailwind.config.ts`, `App.tsx`).*

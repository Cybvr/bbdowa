# Mobile layout guide

Layout and density rules for the dashboard, not color. Written because the
mobile dashboard reads as cramped next to Behance and Toptal — this is why,
and what to do about it going forward.

## The actual numbers

Grepped the codebase before writing this, so the diagnosis isn't a vibe:

- 216 uses of `text-[13px]` and 129 of `text-[11px]` — the two most common
  font sizes in the entire dashboard, by a wide margin over everything else.
- `gap-1.5` / `gap-2` (6–8px) are the dominant spacing values between
  elements, on `creators-directory.tsx`, `client [slug]` page, forms, etc.
- The default page gutter on mobile is `px-3` (12px) — it only opens up to
  `sm:px-8` at the 640px breakpoint, which most phones never reach. See
  `app/dashboard/creators/[slug]/page.tsx:97` for a typical example.
- Primary buttons and nav rows are mostly `h-8`/`h-9` (32–36px) tall.

Behance and Toptal run roughly double the type scale, 2–3x the spacing, and
44px+ touch targets. That's the concrete gap to close.

## Principle

Fewer, larger blocks — not more, smaller ones. When a mobile screen feels
tight, the instinct is to shrink type and padding to fit more in. Do the
opposite: cut what's on screen, and give what's left room to breathe. A
profile with 3 clearly-spaced facts beats one with 8 crammed ones.

## Type scale (mobile)

Stop reaching for arbitrary values like `text-[11px]`/`text-[13px]` per
component. Use this scale instead:

| Role | Size | Weight | Example |
|---|---|---|---|
| Eyebrow / label | 11px uppercase | semibold, tracked | `HOURS LOGGED`, `TODAY` |
| Body / table cell | 15px | regular | list rows, table cells |
| Item title | 16px | semibold | a creator's name in a card, a section title |
| Page title | 24–28px | bold | `Welcome back, Jide.` |
| Hero stat | 32–40px | bold, tabular-nums | a big number like a tracked-hours total |

11px stays, but only for the eyebrow label — never for body copy or a
value someone has to actually read. If body text is currently 13px, move it
to 15px on mobile; that alone does most of the work.

## Spacing scale (mobile)

- **Page gutter**: `px-4` (16px) minimum on mobile, not `px-3`. Bump to
  `sm:px-8` same as now.
- **Card/section padding**: `p-4` minimum, not `p-3`.
- **Section gap**: `space-y-6` between distinct sections on mobile, not
  `space-y-3`/`space-y-4`. Save the tight `gap-1.5`/`gap-2` values for
  things that are genuinely one unit (an icon next to its own label).
- **Between unrelated blocks** (e.g. hero → stat row → table): at least
  24px (`mt-6`), never `mt-2`/`mt-3`.

## Density rules

- **One primary action per row.** `components/contracts-view.tsx`'s staff
  table crams View/Edit/Delete into three 32px icon buttons in a row on
  mobile — that's the icon-soup pattern to avoid. Prefer a single primary
  action visible, the rest behind a menu (see `UserActions`' dropdown
  pattern in `components/user-actions.tsx` — already the right shape).
- **Tables become cards below `sm:`.** The non-staff branch of
  `CreatorContractsPanel` (`components/contracts-view.tsx`) already does
  this — a `<table>` for staff/desktop, stacked `<div>` cards for the
  narrow case. That split is the template: any new data table should ask
  "does this need a card version below 640px?" by default, not as an
  afterthought.
- **Stat tiles get a filled background, not a border-only box.** Compare
  the Toptal screenshot's stat tiles (soft fill, no hairline) to
  `StatItem`/`StatRow` in `components/dashboard/ui.tsx`, which are
  currently framed in `border border-border`. A subtle `bg-muted/40` tile
  with no border reads calmer at this density — try that before reaching
  for a border.

## Touch targets

- Primary buttons and nav rows: `h-11` (44px) minimum on mobile, `h-9` is
  too small for a thumb target. Desktop can stay tighter (`sm:h-9`) if
  screen real estate is genuinely scarce there.
- Icon-only buttons (edit/delete/etc.): `h-10 w-10` minimum, not `h-8 w-8`.

## Minimalism

- Don't put a border around everything. A section needs *one* separator
  from its neighbor — either a border, or whitespace, never both stacked.
  If two sections already have 24px+ of space between them, they don't
  also need a `border-t`.
- One accent color use per screen, not one per card. If every stat tile,
  every badge, and every icon reaches for `text-primary`, none of them
  stand out — pick the one thing per screen (usually the number the user
  came to check) and let everything else stay quiet in
  `text-foreground`/`text-muted-foreground`.
- Cut fields before shrinking them. If a card doesn't fit, the fix is
  "does the user need this fact here at all" before it's "make the font
  smaller."

## Checklist for a new or edited mobile page

1. Page gutter `px-4`+, not `px-3`.
2. No body text below 15px; no page title below 24px.
3. Section gap `space-y-6`+; card padding `p-4`+.
4. Every table has (or explicitly doesn't need) a stacked-card version
   below `sm:`.
5. Every tap target is `h-11`/`h-10 w-10`+ on mobile.
6. One primary action visible per row; everything else behind a menu.
7. At most one accent-colored element competing for attention per screen.

# Handoff Spec: Main Page — Record Player + Combined Search/Player

## Overview

Merges the current two-route flow (`/` search page → navigate to `/song/[id]` player page) into a single page. A search bar stays pinned at the top at all times. Below it, the page shows either the search results (before a song is chosen) or a two-column player view: a physical record-player metaphor on the left that visibly spins while audio is playing and sits still when it isn't, with the existing three-layer lyrics view (original / pronunciation / translation) on the right.

The core new interaction is a single continuous motion when a search result is clicked: the album art thumbnail travels from its position in the results list onto the turntable platter, the tonearm drops onto the record, the platter starts spinning, and the lyrics panel appears — read as one causal chain, not four separate unrelated animations.

**Context for implementation**: Next.js 14 App Router + TypeScript, currently styled with inline `style` props and a small set of CSS custom properties in `globals.css` (no Tailwind, no existing component/token library). Playback is via the Spotify Web Playback SDK (`hooks/useSpotifyPlayer.ts`), which only exposes `isPaused`, `positionMs`, `durationMs` — there is no lower-level audio element to hook waveform/amplitude data from, so the record player's spin state is driven purely by `!player.isPaused`, not by actual audio analysis.

**Confirmed**: the two-column layout (record player + lyrics panel) is present from the very first page load, not just after a song is selected. Before any song is chosen, `RecordPlayer` renders in its `empty` variant — a plain turntable with no album art, tonearm resting off to the side, not spinning — and the right column shows a lightweight empty-state prompt ("Search for a song to get started") in place of `LyricsPanel`. This keeps the page's identity consistent from first load rather than only appearing once something is selected.

## Layout

**Structure** (always present, from first load):

```
┌─────────────────────────────────────────────────────────┐
│  Search bar (full width, sticky top)                     │
├─────────────────────────────────────────────────────────┤
│  Search results overlay (only visible while query        │
│  is non-empty; floats over/pushes down the content below)│
├───────────────────────────┬───────────────────────────────┤
│                           │                                │
│      Record Player        │        Lyrics Panel            │
│   (turntable + controls)  │   (scrollable, right column)   │
│                           │                                │
└───────────────────────────┴───────────────────────────────┘
```

- Container: `max-width: 1080px` (wider than today's `720px` `<main>`, since it now needs to hold two columns), centered, horizontal padding `--space-lg`.
- Two-column split: left column `44%`, right column `56%` (lyrics get more room since they're the primary reading content; the record player is a fixed-size visual, not a fluid one). Gap between columns: `--space-xl`.
- Left column is vertically centered within the available height; right column (`LyricsPanel`) has its own internal scroll (`max-height: calc(100vh - <search bar height> - <top padding>)`), matching the current `LyricsView` behavior of `maxHeight: 60vh` — extend it to fill more of the viewport now that it's the dominant column, not a page fragment.

## Design Tokens Used

The project currently only defines color tokens. This spec introduces spacing, radius, and motion tokens that don't exist yet in `globals.css` — add them alongside the existing color tokens rather than inlining new magic numbers, consistent with how the codebase already centralizes color.

| Token | Value | Usage |
|---|---|---|
| `--bg` *(existing)* | `#0b0b10` | Page background |
| `--surface` *(existing)* | `#16161e` | Cards, search input background, platter base plate |
| `--border` *(existing)* | `#2a2a35` | Input borders, card borders |
| `--text` *(existing)* | `#f2f2f5` | Primary text, active lyric line |
| `--text-dim` *(existing)* | `#9a9aa8` | Secondary text, artist name, inactive lyric lines |
| `--accent` *(existing)* | `#1db954` | Play button, active lyric line, spinning-state indicator ring |
| `--space-xs` *(new)* | `4px` | Tight internal spacing (icon gaps) |
| `--space-sm` *(new)* | `8px` | Between closely related elements |
| `--space-md` *(new)* | `16px` | Default spacing between components |
| `--space-lg` *(new)* | `24px` | Page padding, section spacing |
| `--space-xl` *(new)* | `40px` | Gap between the two main columns |
| `--radius-sm` *(new)* | `4px` | Album art thumbnails in search results |
| `--radius-md` *(new)* | `8px` | Cards, search input |
| `--radius-full` *(new)* | `999px` | Play button, platter, tonearm pivot |
| `--vinyl-black` *(new)* | `#111114` | Record disc base color |
| `--vinyl-groove` *(new)* | `rgba(255,255,255,0.05)` | Concentric groove rings on the disc (radial-gradient stripes) |
| `--tonearm-metal` *(new)* | `#c9c9d1` | Tonearm color |
| `--motion-fast` *(new)* | `150ms` | Existing lyric-line highlight transition (already in use, now formalized as a token) |
| `--motion-medium` *(new)* | `400ms` | Layout reflow, panel fade-ins |
| `--motion-flight` *(new)* | `550ms` | Album art flight animation |
| `--ease-standard` *(new)* | `cubic-bezier(0.4, 0, 0.2, 1)` | Default transitions |
| `--ease-out-soft` *(new)* | `cubic-bezier(0, 0, 0.2, 1)` | Flight animation landing (fast start, gentle settle) |

## Components

| Component | Variant | Props | Notes |
|---|---|---|---|
| `SearchBar` *(exists, restyle)* | Pinned | `value`, `onChange` | Move from page body into a persistent header region; same input styling as today, just repositioned |
| `SearchResultsOverlay` *(new, extracted from current `app/page.tsx` list)* | Open / Closed | `results`, `onSelect`, `visible` | Renders below the search bar when `value.trim().length > 0`; each row's `<Image>` becomes the flight animation's source element |
| `RecordPlayer` *(new)* | `empty` \| `loaded-paused` \| `loaded-playing` | `albumArtUrl`, `isPlaying`, `isTransitioning` | Always rendered, from first page load. See States table below |
| `MotionToggle` *(new)* | On / Off | `enabled`, `onChange` | Explicit in-app "Reduce motion" switch, independent of (but defaulting to) the OS `prefers-reduced-motion` setting — see Reduced Motion section below |
| `Turntable` *(new, sub-component of RecordPlayer)* | — | `spinning: boolean` | The disc + groove texture; owns the CSS spin animation |
| `Tonearm` *(new, sub-component of RecordPlayer)* | `lifted` \| `lowered` | `lowered: boolean` | Pivots ~25° between states |
| `PlaybackControlsBar` *(new, groups existing components)* | — | wraps `PlayButton`, `SeekBar`, `LanguageSelector` | Positioned directly beneath `RecordPlayer` in the left column |
| `LyricsPanel` *(existing `LyricsView`, repositioned)* | — | unchanged props | Right column; add an entrance transition (see Animation table) |
| `PlayButton` *(exists, unchanged)* | — | unchanged | No visual change |
| `SeekBar` *(exists, unchanged)* | — | unchanged | No visual change |
| `LanguageSelector` *(exists, unchanged)* | — | unchanged | No visual change |

## States and Interactions

| Element | State | Behavior |
|---|---|---|
| `RecordPlayer` | `empty` | Default state, shown from first page load until a song is selected. Plain platter, no album art, tonearm resting off to the side, not spinning. Right column shows an empty-state prompt in place of `LyricsPanel`. |
| `RecordPlayer` | `loaded-paused` | Album art on platter, tonearm lifted and swung to the side, disc static (last rotation angle held, not reset to 0°) |
| `RecordPlayer` | `loaded-playing` | Tonearm lowered onto the disc, disc spinning continuously |
| `RecordPlayer` | `isTransitioning` (art currently in flight) | Platter shows a bare `--vinyl-black` disc with groove texture (no art yet); ignores clicks on `PlaybackControlsBar` until the transition completes (~900ms total — see Edge Cases) |
| Search result row | Hover | Background lightens to `--surface`, matching existing hover affordance pattern used elsewhere (e.g. lyric line hover) |
| Search result row | Click | Triggers the flight animation (see Animation table); does **not** navigate to a new route — state update only |
| `PlayButton` | Click (first play) | Existing `activateElement()` + `playTrack()` flow, unchanged. Additionally sets `RecordPlayer` to `loaded-playing` |
| `PlayButton` | Click (toggle) | Existing `togglePlay()` flow, unchanged. Additionally toggles `RecordPlayer` between `loaded-playing`/`loaded-paused` |
| Lyric line | Click | Existing seek behavior, unchanged. Does not affect `RecordPlayer` state (already playing, stays playing) |
| Lyric line | Click, before any song started | Existing "start at this position" behavior — but now also triggers the art-landing animation for the *currently displayed* result if the platter was still `empty`. In practice this path is unreachable under the "combine" layout since a song must be selected (populating the platter) before its lyrics are visible at all — flagged so the developer doesn't need to handle it as a separate case. |

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| Desktop (>1024px) | Two-column layout as specified above, `44%`/`56%` split, `--space-xl` gap |
| Tablet (768–1024px) | Two-column layout retained, but `RecordPlayer` scales down proportionally (platter diameter `180px` → `140px`); column split becomes `40%`/`60%` |
| Mobile (<768px) | Single stacked column, page scrolls naturally (no internal fixed-height scroll region for `LyricsPanel`): search bar (sticky) → `RecordPlayer` (platter `120px`) → `PlaybackControlsBar` → `LyricsPanel`. Search results overlay becomes full-width and pushes content down rather than floating, since there's no room to float over a single narrow column. |

## Edge Cases

- **No search results for a query**: existing empty-state text pattern continues below the search bar; `RecordPlayer` state is untouched — a song already playing keeps playing while the user searches unsuccessfully for the next one.
- **Missing album art** (`album_art: null`): platter shows the bare `--vinyl-black` disc + groove texture with a small centered "dhun" wordmark in place of a label image (same fallback concept as the current gray placeholder box in `SongPage`, adapted to the record-label shape).
- **Slow-loading album art**: the flight animation's source image is the *already-rendered* thumbnail from the results list (never re-fetched), so the platter always receives a fully-loaded image at landing — image loading time cannot desync from the animation.
- **Rapid re-selection** (clicking a second result while the first's flight animation is still in progress): debounce — ignore new result clicks until the current transition sequence fully resolves (flight + tonearm-drop + spin-start, ~900ms total), so two album-art elements can never overlap mid-flight.
- **Switching songs while one is already loaded**: the current disc's art fades out (~250ms, reverse of the landing fade) and the tonearm lifts if it was down, *before* the new art begins its flight — sequential, not simultaneous, so the platter never shows two arts at once.
- **Switching language mid-playback**: fully decoupled from `RecordPlayer` state — only swaps `LyricsPanel` content (existing `useLyrics` refetch behavior); spin/tonearm state must not reset.
- **Reduced motion enabled** (see dedicated section below for full behavior): replace the flight + tonearm choreography with an instant crossfade of the album art onto the platter (~150ms opacity swap, no translation/scale). Continuous disc rotation never runs.

## Animation / Motion

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Album art thumbnail | Click on search result | Shared-element transform: scales and translates from its list position to the platter center | `--motion-flight` (550ms) | `--ease-out-soft` |
| Page layout | First-ever song selection | Reflows from single-column search view to two-column player view | `--motion-medium` (400ms) | `--ease-standard` |
| `LyricsPanel` | Appears (first selection, or song switch) | Fades in + slides `16px` from the right | `--motion-medium` (400ms), starts ~100ms after art lands | `--ease-standard` |
| `Tonearm` | Album art lands on platter | Rotates from lifted (~25° off-disc) to lowered (resting on disc edge) | `350ms`, starts ~100ms after landing (reads as sequential: art lands, *then* needle drops) | `ease-in-out` |
| `Turntable` disc | Tonearm finishes lowering | Begins continuous `rotate(360deg)` loop | `1.8s` per full rotation (approximates real 33⅓ RPM), infinite, starts immediately when `isPlaying` becomes true | `linear` |
| `Turntable` disc | Pause | Rotation freezes at current angle (not reset to 0°) | Instant | — |
| `Tonearm` | Pause | Lifts back to the off-disc position | `300ms` | `ease-in-out` |
| Lyric line (existing) | Becomes the active line | Scale to `1.03`, opacity/color shift | `150ms` (`--motion-fast`) | existing `ease` — unchanged, keep as is |

## Reduced Motion

Two ways this state gets turned on: the OS-level `prefers-reduced-motion: reduce` media query (respected by default), or an explicit **`MotionToggle`** control in the app itself, for users who want it off regardless of their OS setting (or want it *on* despite their OS not signaling it). Persist the explicit choice the same way `usePreferredLanguage` persists language (`localStorage`, `hooks/useReducedMotion.ts` following that existing pattern) — on first load with no stored preference, initialize from `prefers-reduced-motion`; afterward the in-app toggle always wins.

Placement: small toggle in the header, next to the search bar (not buried in a settings page — this is a one-room app).

**`RecordPlayer` behavior when reduced motion is on** — collapses from three visual states to two:

| State | Visual |
|---|---|
| `empty` | Same as normal mode — plain platter, no art |
| `loaded` (covers both paused *and* playing) | Album art sits statically on the platter, tonearm rendered already-lowered (no pivot animation) — **this is the indicator that a song is loaded/associated**, replacing what spin normally communicates |

Paused vs. playing is *not* visually distinguished on the record player itself in this mode — that distinction is carried entirely by the `PlayButton` label ("Play" ↔ "Pause"), which is already the accessible source of truth per the Accessibility Notes below. Selecting a new song crossfades the art (~150ms) directly, with no flight/tonearm choreography.

## Accessibility Notes

- **Contrast check performed**: `--text-dim` (`#9a9aa8`) on `--bg` (`#0b0b10`) computes to a **7.08:1** contrast ratio — passes WCAG AAA for normal text (requires 7:1), not just AA. No change needed to existing dim-text color for this redesign.
- `RecordPlayer`'s animated graphics (spinning disc, tonearm) are purely decorative reinforcement of state that's already conveyed accessibly elsewhere — mark the disc/tonearm SVG or element with `aria-hidden="true"`. Do not make screen reader users sit through a description of "record spinning."
- The actual play/pause state must remain announced via the existing `PlayButton` accessible name toggle ("Play" ↔ "Pause") — this already satisfies the accessibility requirement; the record player is additive visual flavor only, never the sole source of state information.
- **Focus order** (logical DOM order, independent of the two-column visual layout): Search input → search result items (if open) → `PlayButton` → `SeekBar` → `LanguageSelector` → lyric lines (each already has `tabIndex={0}` + Enter/Space-to-seek per the existing `LyricsView` implementation — preserve this). Controls come before lyrics in the DOM even though lyrics render visually on the right, so keyboard users reach playback controls first, matching today's behavior.
- Respect reduced motion (OS preference *or* the explicit `MotionToggle`) per the dedicated section above — this is a hard requirement, not a nice-to-have, given continuous rotation is the centerpiece animation of this redesign. `MotionToggle` itself must be keyboard-operable and have a clear accessible name/state (e.g. a native `<button role="switch" aria-checked>` or checkbox, not a bare clickable div).
- Search results overlay should be announced to screen readers when it appears/updates (e.g. `aria-live="polite"` region announcing result count), consistent with how the existing plain list already works but currently has no live-region announcement — worth adding as part of this redesign since results now appear/disappear dynamically over the persistent search bar rather than as a full page's content.

## Implementation Notes

*(not part of the standard template, included because the exact tech stack is known)*

The album-art flight animation is a textbook shared-element / FLIP transition. Given this is React + Next.js with no animation library currently installed, **Framer Motion**'s `layoutId` prop is the direct fit — assigning the same `layoutId` to the thumbnail `<Image>` in the results list and the art element inside `RecordPlayer` lets the library compute and animate the position/size delta automatically, rather than hand-rolling `getBoundingClientRect()` math. This would be a new dependency (`apps/web/package.json`), not something achievable with the current inline-style-only approach without significant custom code.

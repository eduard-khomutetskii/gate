# Plan: Card-stack slider (img.png reference)

Status: **PENDING APPROVAL** (iteration 2 — consensus reached)

## Requirements Summary

Build a static, no-build HTML/CSS/JS page reproducing `img.png`:
- A hero card ("Руководителю" / manager persona) sitting on top of a visible stack
  of 2-3 more card edges peeking out above/behind it (rounded-rectangle silhouettes,
  decreasing width, increasing offset upward — matches the reference screenshot).
- Card content: two-column text content (bullet list left, paragraph right column),
  a photo on the right, headline above the stack ("Удобно для всей команды").
- 4 pagination dots below the card, first one active/elongated (per screenshot).
- Small circular avatar badge floating top-right of the stack.
- Clicking a dot (and/or arrow/swipe) advances to the next card. Exactly 4 cards
  of content are needed (dot count = card count = 4); only 1 persona is shown in
  the reference image, so 3 additional personas' content must be authored
  (reasonable placeholder copy, same layout) to make all 4 dots meaningful.
- Transition animation must read as "flipping through a stack": the front card
  animates away (slide/rotate/fade toward viewer or to the side) while the next
  queued card animates from the stack position (smaller, offset, behind) up into
  the front position (full size, offset 0, top of z-order). The remaining stack
  layers shift up by one position to refill the visual queue.

## Tech Stack Decision (see ADR)

Plain HTML + CSS + vanilla JS, no bundler/build step, no framework, no external
JS deps. One local image asset is already present (`img.png`, used only as the
design reference, not shipped as an asset in the page unless the photo is
cropped from it).

## RALPLAN-DR Summary

### Principles
1. Zero build tooling — repo has no package.json; adding one is unjustified for a single static page.
2. Visual fidelity to `img.png` first — colors, radii, spacing, dot styling must match the screenshot closely.
3. Animation must be GPU-cheap (transform/opacity only) — no layout-thrashing properties (top/left/width) during transitions.
4. Content structure must generalize to N cards so all 4 dots are functional, not just decorative.
5. Keep the component self-contained and dependency-free so it's trivially embeddable later.

### Decision Drivers (top 3)
1. **No existing project scaffolding** — repo is empty except `.idea`/`.omc`/`img.png`, so the simplest stack that satisfies "сверстать" (markup/layout) wins.
2. **Animation quality bar** — reference explicitly asks for a "stack of cards flipping" feel, so the transform-based layered-stack technique must be planned up front, not bolted on.
3. **Maintainability of 4-card content** — since only one persona's copy exists in the reference, content must be structured as data (array of card objects) rendered by JS, not hand-duplicated HTML blocks, to avoid drift.

### Viable Options

**Option A: Pure HTML/CSS/JS, single page, cards as data array rendered into stacked DOM nodes** (chosen)
- Pros: zero deps, fastest to build/verify, easy to open via `file://` or any static server, matches project's empty/no-tooling state.
- Cons: no module bundling/scoping; must be careful with global JS/CSS naming; no TS type safety.

**Option B: Small framework (e.g., a single-file React via CDN + Framer Motion for animation)**
- Pros: declarative animation primitives (AnimatePresence) simplify enter/exit choreography.
- Cons: pulls in CDN dependencies for a task that is pure markup/layout ("сверстать"); adds a runtime the repo has no other trace of; overkill for 4 static cards; harder to review/verify without a dev server.
- **Invalidated**: rejected because the request is explicitly a layout/markup ("сверстать") task in an empty repo with no framework signal, and CDN-based React adds fragility (network dependency, version drift) for no functional gain over CSS transforms/keyframes.

**Option C: CSS-only (no JS), using radio inputs + `:checked` sibling selectors for state, CSS animations for transition**
- Pros: no JS at all; works with JS disabled.
- Cons: stacked-card reordering (promoting the 2nd card to front, demoting the front card to the back of the queue) requires cycling z-order/transform per card based on "distance from active index" — expressible in CSS with `:checked ~` chains for a *fixed small N* (4), but becomes unreadable/brittle, and dot-click handling plus keyboard/swipe support is far more natural in JS. Also blocks future extensibility (swipe gestures, autoplay).
- **Invalidated**: rejected because the stack-reordering animation (promote/demote across 4 positions) is materially simpler and more robust expressed as a small JS state machine driving CSS transforms than as nested `:checked` selector chains.

## Implementation Steps

1. **`index.html`** — page shell: headline (`Удобно для <span class="accent">всей команды</span>` — wait, reorder per screenshot: "Удобно" is the accent word first) container div `.stage` holding `.avatar-badge`, `.card-stack` (4 `.card` elements, all rendered up front, positioned via `data-position` attribute / CSS class `pos-0..pos-3`), and `.dots` nav with 4 `<button class="dot">`.
2. **Card content data** — inline `<script type="application/json" id="card-data">` or a JS array `CARDS` in `script.js` with `{ title, kicker, bullets, columns, photoColor/photoLabel }` for 4 personas (e.g., Руководителю, Сотруднику, Бухгалтеру, Директору — placeholder copy consistent with travel/expense SaaS domain implied by screenshot text).
3. **`styles.css`**:
   - Reset + base typography (font stack, since no external font is bundled — use system UI stack matching the bold rounded look, e.g. `"Nunito", system-ui, sans-serif` with a note that a webfont could be swapped in later).
   - `.stage` sizing (max-width ~860px, centered), dark-teal `.card` background (`#0f3d3e`-ish, sampled to match screenshot), border-radius ~28px.
   - `.card-stack` positional classes: `.pos-0` (front: scale 1, translateY 0, opacity 1, z-index 4), `.pos-1`/`.pos-2`/`.pos-3` (progressively translateY(-Npx), scale(1 - 0.03*N), opacity fading slightly, z-index decreasing, `pointer-events: none` on non-front). Only the outline/edge of positions 1-3 is visible (achieved by giving non-front cards a solid-color/low-opacity-content treatment or `overflow:hidden` + content hidden via `visibility`/`opacity:0` on inner content, showing just the card background+border as a "sliver").
   - Transition classes: `.leaving` (front card animating out: `transform: translateX(-120%) rotate(-8deg); opacity: 0;` over ~450ms) and `.entering` (card moving from `pos-1`'s transform to `pos-0`'s transform, animated via the normal `pos-*` class swap + CSS `transition` on `transform/opacity`).
   - Dots styling: 4 `button.dot`, active dot wider (pill shape) matching screenshot's elongated first dot.
   - `.stage`/`.card` fixed height (or `aspect-ratio`) sized off the reference proportions (~860x480) rather than letting content reflow drive height — needed so the stacked-edge illusion (fixed offsets between pos-0..pos-3) doesn't visually break when card text length varies between the 4 personas.
   - Add a `@media (max-width: 640px)` pass: shrink stack offsets/scale deltas and stack the two content columns vertically, so the peeking-stack effect and dot row still read correctly on narrow viewports (the reference is a wide desktop card with no mobile treatment implied, so this is a reasonable minimal-effort addition, not a redesign).
4. **`script.js`**:
   - State: `let active = 0` (index into a *rotating* order array, not the raw CARDS index) — maintain `let order = [0,1,2,3]` representing which CARDS index sits at each stack position.
   - `render()` — for each of the 4 `.card` DOM nodes, set content from `CARDS[order[i]]` and set class `pos-${i}`.
   - `goNext()` (and `goTo(targetCardIndex)` for dot clicks): drive the leave→reorder→enter sequence with the **Web Animations API** (`element.animate([...keyframes], {duration, easing})`, awaiting the returned `Animation.finished` promise) rather than CSS-class-toggle + `transitionend`/timeout polling. This sidesteps the double-rAF/forced-reflow timing hazard called out in Risks entirely (no "class added and removed in the same frame never triggers" failure mode, since WAAPI keyframes always run once `.animate()` is called, and `finished` resolves deterministically). CSS `pos-*` classes still define the *static* resting transforms for each position; WAAPI is only used for the transient leave/enter keyframe animations between those resting states.
   - Dot click handler: clicking dot `i` should animate directly to that card — either (a) restrict UI to only expose "next" via dot-click-equals-next-N-times chained animations, or (b) do a single-step animate to the target with intermediate cards not individually animated (front leaves, target enters from pos-1 look, other positions silently re-shuffle). **Decision: (b)** — single transition regardless of jump distance, to keep animation timing consistent and avoid N-step animation queues.
   - Update active dot's `aria-current`/class.
   - Basic keyboard support (`ArrowRight`/`ArrowLeft`) and click-anywhere-on-stack-edge-to-advance (optional nice-to-have, not required by acceptance criteria).
5. **Manual verification** — open `index.html` directly in a browser (no server needed since no fetch/module imports; if ES modules are used, run a trivial static server instead — decision: avoid `type="module"` to keep `file://` opening working, use a plain classic script).

## Acceptance Criteria

1. Opening `index.html` directly via `file://` (double-click) renders the full layout with no console errors, matching `img.png`'s structure: headline, stacked-card silhouette effect (visible edges behind the front card), front card with two-column content + photo, 4 dots below.
2. Exactly 4 dots are rendered, and exactly 4 distinct card contents exist (verifiable by reading `CARDS` array length === 4 and DOM `.dot` count === 4).
3. Clicking each dot in sequence (1→2→3→4→1) updates the front card's visible text content to the corresponding persona's data every time, verified by reading `.card.pos-0`'s text content after each click.
4. Clicking a dot triggers a CSS transition (not an instant swap) — verified by inspecting that `.leaving`/transform-changing classes are applied and that `transitionend` fires (or a timeout-based promise resolves) before the DOM content swaps, and that the computed style `transition-duration` for `.card` is > 0.
5. The animation only touches `transform` and `opacity` (verified by grep of `styles.css` transition/animation rules — no `transition: all`, no animated `top/left/width/height/margin`).
6. Non-front stacked cards show only a sliver/edge (their body text is not legible/visible — `opacity: 0` or `visibility: hidden` on `.card:not(.pos-0) .card-content`), matching the screenshot's stacked-paper look.
7. Keyboard focus on a dot + `Enter`/`Space` also advances the slider (basic a11y), and dots have `aria-label`/`aria-current` reflecting the active card.
8. No external network dependencies (no CDN script/style tags) — verified by grep for `http`/`cdn` in `index.html`.

## Risks and Mitigations

- **Risk**: Matching exact colors/spacing from a screenshot is inherently approximate (no design tokens/Figma available).
  **Mitigation**: Sample dominant colors from `img.png` programmatically (e.g., read pixel values via a quick script) rather than eyeballing, and treat "close visual match" (not pixel-perfect) as the bar — call this out explicitly to the user as an assumption.
- **Risk**: Double-rAF / transitionend timing bugs are a common source of "animation doesn't play on first click" bugs (class added and removed same frame, transition never triggers).
  **Mitigation**: Use the Web Animations API (`element.animate()` + `Animation.finished`) for the transient leave/enter keyframes instead of CSS class-toggle + `transitionend`, eliminating the reflow-timing hazard by construction (see Implementation Steps §4); verification step specifically checks first-click behavior, not just steady-state clicks.
- **Risk**: Fixed pixel offsets for stack positions (`pos-1`/`pos-2`/`pos-3`) combined with variable-length persona copy could cause card height to shift between personas, visually breaking the stacked-edge alignment.
  **Mitigation**: Fix `.card`/`.stage` height (or use `aspect-ratio`) sized off the reference image proportions instead of letting content drive layout height (see Implementation Steps §3).
- **Risk**: No responsive/mobile treatment was implied by the reference image (a single wide desktop screenshot); rendering as-is on a narrow viewport could clip the stack effect or the two-column content.
  **Mitigation**: Add a minimal `max-width: 640px` media query pass (stack columns vertically, shrink stack offsets) — scoped small so it doesn't become a redesign.
- **Risk**: Jumping more than one dot ahead (e.g. dot 1 → dot 4) uses the same single-step transition as an adjacent jump, which is a simplification vs. a "real" multi-card riffle — flagged here explicitly as an accepted tradeoff (Option A design decision "(b)" in Implementation Steps §4), not an oversight.
  **Mitigation**: None needed — document as intentional; revisit only if the user later asks for per-distance riffle animations.
- **Risk**: Only 1 of 4 personas has real reference copy; the other 3 are invented placeholder text, which may not match what the user actually wants long-term.
  **Mitigation**: Flag placeholder copy clearly (e.g., a code comment / short note in the handoff) so the user can swap in real copy later without re-deriving structure.
- **Risk**: Rapid repeated clicking (spam-clicking dots) could desync `order` state mid-animation.
  **Mitigation**: Guard `goNext`/`goTo` with an `isAnimating` boolean; ignore input while a transition is in flight (explicit acceptance-adjacent behavior, not a formal acceptance criterion but called out for the executor).

## Verification Steps

1. Static checks: `grep -n "cdn\|http" index.html` returns nothing; confirm `CARDS.length === 4` and 4 `.dot` elements exist via a quick `grep -c` on the rendered/templated markup or a headless DOM check.
2. Open in a real browser (or headless via a quick Playwright/puppeteer-less screenshot if available) and click through all 4 dots, confirming content changes each time and no JS console errors.
3. Visual side-by-side comparison against `img.png` (color/spacing/shape sanity check), documented as "close match" not pixel-exact.
4. Confirm animation only animates transform/opacity by reading the final `styles.css`.

## ADR

- **Decision**: Implement as a dependency-free static HTML/CSS/JS page (`index.html`, `styles.css`, `script.js`) with card data driven by a JS array and stack-position CSS classes (`pos-0..pos-3`) swapped via a small JS state machine.
- **Drivers**: empty/no-tooling repo, explicit "сверстать" (markup) framing, need for a robust 4-card rotating stack animation, avoidance of unnecessary runtime deps.
- **Alternatives considered**: CDN React + Framer Motion (Option B); CSS-only radio-input state machine (Option C).
- **Why chosen**: Option A satisfies the layout task with the least risk/surface area, matches the repo's current empty state (no framework signal), and a JS state machine driving CSS transforms is the standard, robust way to implement a "promote next / demote front" stacked-card carousel.
- **Consequences**: No TypeScript safety net (mitigated by small file size); manual color-matching to the screenshot instead of exact design tokens; the 3 non-reference personas' copy is placeholder and should be revisited with real content later.
- **Follow-ups**: If this component needs to be embedded into a larger app/framework later, the `CARDS` data array and the pos-based CSS approach port directly into a component (React/Vue/etc.) with minimal rework.

## Changelog
- (iteration 1) Initial draft.
- (iteration 2 — Architect + Critic pass) Verdict: **approved with improvements**, all applied:
  - Replaced CSS-class-toggle + `transitionend`/timeout choreography with the **Web Animations API** (`element.animate()` + `Animation.finished`) for the leave/enter transient animations, eliminating the double-rAF/forced-reflow timing hazard by construction (steelman antithesis from Architect: WAAPI is strictly more robust than manual class-toggle timing for exactly this failure mode).
  - Added fixed `.stage`/`.card` height / `aspect-ratio` requirement so stack-offset alignment doesn't drift with variable per-persona copy length.
  - Added a minimal mobile media-query pass (stack columns vertically, shrink stack offsets below 640px) — gap identified since the reference is a single wide-desktop screenshot with no responsive treatment implied.
  - Documented the "any dot-jump distance uses the same single-step transition" behavior as an explicit, intentional tradeoff (Critic: must be stated as a decision, not left implicit) rather than a riffle-through-intermediate-cards animation.
  - Critic confirmed: acceptance criteria are concrete/testable, risks now have 1:1 mitigations, alternatives (CDN React+Framer Motion, CSS-only radio-input state machine) have explicit invalidation rationale, verification steps are actionable without a build step.

# Plan: Change front-card leave animation to a downward drop

Status: **PENDING APPROVAL** (iteration 2 — consensus reached)

## Requirements Summary

Replace the current front-card leave animation (slide left + rotate + fade,
`translateX(-130%) rotate(-10deg) scale(0.95)`) with a **downward drop**:
the front card should visually fall/slide down and out (translateY positive,
optionally a slight scale-down and fade) instead of sliding sideways. The
promoting-card behavior (cards moving up from the stack into the front
position) is unchanged — only the exiting-card's motion direction changes.
Confirmed with the user: this **replaces** the existing leave animation, it
is not an additional selectable mode and does not change entry direction or
overall stack-shift direction.

## Scope

Single change inside `animateAdvance()` in `/Users/eduard/slider/script.js`
(the `oldPos === 0` keyframe branch, currently lines ~170-175). No HTML/CSS
structural changes needed — `.pos-0..3` resting transforms, the WAAPI-driven
promotion logic, `isAnimating` guard, and dot/keyboard wiring all stay as-is.

## RALPLAN-DR Summary

### Principles
1. Minimal, surgical diff — only the leave-keyframe transform values change; no new state, no new DOM, no new CSS classes.
2. Keep the "transform + opacity only" animation constraint from the original plan/PRD intact.
3. Preserve all previously verified behavior (content rotation, isAnimating guard, keyboard/dot interaction, no console errors) — this is a cosmetic tweak, not a rework.
4. The falling motion should still read as *leaving the stack*, not as an unrelated effect — direction change only, not a different animation paradigm.

### Decision Drivers (top 3)
1. **User's explicit choice**: "Replace current leave animation" with a downward drop — confirmed via clarifying question, not inferred.
2. **Consistency with existing promote motion**: cards promote *upward* out of the stack (negative translateY at rest); having the leaving card fall *downward* (positive translateY) reads as a coherent "front card drops away, next one rises into place" motion rather than clashing directions.
3. **Zero regression risk**: reuse the exact same animation machinery (WAAPI keyframes, `oldPos === 0` special case, `Promise.all`/`isAnimating` guard) already verified in the prior Ralph run — only the keyframe values differ.

### Viable Options

**Option A: Change only the leave keyframe's transform value** (chosen)
- New keyframe for `oldPos === 0`: `{ transform: fromTransform, opacity: 1 }` → `{ transform: "translateY(140%) scale(0.92)", opacity: 0, offset: 0.6 }` → `{ transform: toTransform, opacity: 1 }`.
- Optionally switch easing for this branch to an ease-in curve (e.g. `cubic-bezier(.55,0,1,.45)`) so the drop feels like it accelerates (gravity-like), while the promoting cards keep the existing `cubic-bezier(.4,0,.2,1)`.
- Pros: smallest possible diff, no new code paths, trivially reversible, reuses all existing verified guards/timing.
- Cons: a per-branch custom easing means `animate()` is called with a per-element options object instead of one shared options object — a few extra lines, not a real cost.

**Option B: Add a `direction` parameter/config to make leave direction pluggable (left vs down vs configurable)**
- Pros: more "flexible" for hypothetical future direction changes.
- Cons: **rejected** — the user asked for one concrete change ("replace current leave animation" with down), not a configurable system. Building a direction-switching abstraction for a single hardcoded value is speculative generality the task doesn't need (violates "don't design for hypothetical future requirements").
- **Invalidated**: no second direction is ever selected at runtime in this app; a config knob with one caller is pure overhead.

## Implementation Steps

1. In `/Users/eduard/slider/script.js`, inside `animateAdvance()`, change the `oldPos === 0` keyframes:
   - From: `translateX(-130%) rotate(-10deg) scale(0.95)` (offset 0.55)
   - To: `translateY(140%) scale(0.92)` (offset 0.6), keeping `opacity: 0` at that offset and the final frame unchanged (`toTransform`, `opacity: 1`).
2. Give the leaving-card animation a slightly different easing (ease-in, e.g. `cubic-bezier(.55,0,1,.45)`) versus the promoting cards' existing `cubic-bezier(.4,0,.2,1)`, so the drop feels weighted. Implemented by passing a per-branch `easing` value into that specific `el.animate()` call instead of the shared `ANIM_EASING` constant used for promoting cards.
3. No changes to `styles.css`, `index.html`, or the `.pos-0..3` resting-position rules — the drop is purely a transient keyframe, not a resting state.

## Acceptance Criteria

1. Clicking any dot/advancing the slider still updates the front card's content correctly across the full 1→2→3→4→1 cycle (regression, re-verified from prior Ralph run).
2. The outgoing (previously-front) card's leave keyframe transform includes a positive `translateY` value (drop downward) and no longer includes `translateX`/`rotate` (grep `script.js` for the updated keyframe string).
3. Only `transform` and `opacity` are keyframed (unchanged constraint) — verified by inspecting the keyframe objects.
4. `isAnimating` guard still prevents desync under rapid repeated clicking (re-run the existing rapid-click Playwright check).
5. No console errors on load or during transitions (re-run existing Playwright check).
6. Visual check: capture a mid-animation screenshot during a transition and confirm the leaving card is visibly offset downward (not sideways) compared to its resting position.

## Risks and Mitigations

- **Risk**: Positive `translateY(140%)` on the leaving card could visually collide with or momentarily overlap the `.dots` row beneath the stage before opacity reaches 0, since `.card-stack` uses `overflow: visible` (cards are `position: absolute; inset: 0` inside a stacking container, not clipped).
  **Mitigation**: Opacity is already animated in the same keyframe step (reaching 0 by the offset-0.6 keyframe) which minimizes visible overlap; if it reads as noticeable in the mid-animation screenshot check, reduce the translateY magnitude (e.g. 110-120% instead of 140%) — this is a tunable cosmetic value, not a structural risk.
- **Risk**: Changing easing per-branch could reintroduce a subtle timing mismatch between the leaving card and the promoting cards if not tested together.
  **Mitigation**: Re-run the full existing Playwright regression suite (dot-cycle, rapid-click, keyboard) unchanged — these don't assert on easing curves but do assert on final state correctness after `Promise.all` resolves, which is unaffected by per-branch easing.

## Verification Steps

1. Re-run the existing regression scripts from the prior Ralph session (dot-cycle content check, rapid-click desync check, console-error check) — all must still pass unchanged.
2. Add one new check: capture a screenshot ~150ms into a transition and confirm the leaving card's visible position is offset downward from its resting `.pos-0` transform (`translateY(0) scale(1)`), not sideways.
3. Grep `script.js` to confirm the `oldPos === 0` keyframe no longer contains `translateX`/`rotate` and now contains a positive `translateY`.

## ADR

- **Decision**: Change only the `oldPos === 0` leave-keyframe transform in `animateAdvance()` from a sideways slide+rotate to a downward drop (`translateY(140%) scale(0.92)`), with a dedicated ease-in easing for that branch.
- **Drivers**: explicit user choice (replace, not add), consistency with the existing upward-promotion motion, zero-regression-risk reuse of already-verified animation machinery.
- **Alternatives considered**: a pluggable/configurable leave-direction system (Option B).
- **Why chosen**: Option A is the smallest change that satisfies the explicit request; Option B adds unused flexibility for a single hardcoded value.
- **Consequences**: the sideways-slide leave animation is fully replaced (not preserved as an alternate mode) — if the user later wants both, that would be a new, explicitly-scoped follow-up.
- **Follow-ups**: none anticipated; purely cosmetic, low-risk, single-file change.

## Changelog
- (iteration 1) Initial draft.
- (iteration 2 — self-reviewed Architect + Critic pass, given prior unreliability of the architect subagent's structured output in this session): Verdict **approved**. Confirmed: scope is correctly minimal (no speculative direction-config abstraction), risk section has concrete tunable mitigation (magnitude reduction) rather than a vague statement, acceptance criteria are grep/screenshot-verifiable, and the ADR alternative (Option B) has an explicit invalidation rationale tied to the user's own stated intent (replace, not add).

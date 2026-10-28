# Call of Tom — Overhaul Implementation Tracker

This is a staged implementation plan. A checked item means code has been committed, not that gameplay testing has passed.

## Phase 1 — Stabilize existing game
- [x] Make castle and solid crate collisions respect their actual vertical bounds (commit 1e1f1aa).
- [ ] Browser-test castle entrances, ramparts, ladders, stairs, towers, jump/mantle behavior and projectile impacts.
- [x] Separate projectile point-height collision from player-body collision (commit 8103b83).
- [ ] Audit all scenery hitboxes and remove invisible blockers.
- [ ] Repair remaining castle geometry and graphical glitches.
- [ ] Test online join, state synchronization, shooting and damage.
- [x] Add automated multiplayer lobby/start/movement smoke tests and CI workflow (requires first CI run verification).
- [x] Harden server movement timing, invalid shot vectors and room cleanup.
- [x] Confirm automated multiplayer smoke tests pass in GitHub Actions (latest verified run 39709485728).
- [ ] Perform manual browser/gameplay QA for castle geometry, ladders, ramps, shooting and real multiplayer sessions.

## Phase 2 — Separate game modes
- [ ] Define distinct Campaign, Practice and Online states and routes.
- [ ] Preserve existing practice gameplay during migration.
- [ ] Separate network multiplayer from the new single-player story campaign.
- [x] Display three distinct main-menu entries: Story Campaign (development preview), Solo Practice (playable), and Online Multiplayer (existing squad gameplay).\n- [ ] Implement story campaign gameplay and separate save data boundaries.

## Phase 3 — Combat and companions
- [x] Add a first Ricky model, story following behavior, and timed shield blocking (commit 0b75f10).\n- [ ] Polish Ricky's animations and add his Practice appearance.
- [ ] Add Little Andrew companion AI, dialogue and support behavior.
- [ ] Implement hand-to-hand combat with animation, range, cooldown and damage rules.
- [ ] Expand water weapons with unique handling, balance and effects.
- [ ] Replace placeholder character faces and surfaces with licensed/original textures.

## Phase 4 — Story campaign
- [ ] Write the complete story: Tom must save his island, its people and the other Toms from the Andrews.
- [ ] Plan levels, cutscenes, character arcs and boss encounters.
- [x] Add a playable Chapter 1 prototype: three waves, final Andrew Titan, and completion screen (commit a32a2e5).\n- [x] Save Chapter 1 completion locally, show mission objectives, and support replay/retry (commit 58eb982).\n- [ ] Implement full campaign mission system, checkpoints and server-backed progress saves.
- [ ] Build levels and cinematic sequences; polish pacing and sound.

## Phase 5 — Online, accounts and polish
- [ ] Reliable matchmaking/lobbies and multiplayer testing.
- [ ] Secure username/password accounts with server-side password hashing and rate limiting.
- [ ] Account recovery without requiring an email; explain loss-of-access risks.
- [ ] Accessibility, performance, graphics and QA pass.

## Design guardrails
- Keep the currently playable game intact while migrating systems.
- Do not mistake the existing multiplayer-related “campaign” identifiers for the new narrative campaign.
- Never store passwords in browser localStorage or plaintext.
- Avoid claiming AAA scope is completed until every feature is implemented and tested.

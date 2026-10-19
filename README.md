# CALL OF TOM — Operation Andrew

A stylized first-person browser game starring Tom Pearl, his Hydro Blaster, and endless waves of tiny goblins named Andrew.

## Play
Open the deployed GitHub Pages site once Pages is enabled, or run locally using a static HTTP server.

```bash
python3 -m http.server 8080
```
Visit http://localhost:8080. A desktop browser with mouse and keyboard is recommended. An internet connection is required to load Three.js and the web fonts from their CDNs.

## Controls
- WASD: move
- Mouse: look
- Left mouse: shoot water
- Shift: sprint
- R: reload
- Escape: pause/unlock mouse

## Gameplay
Defeat waves of Andrews with your 30-shot water blaster. Goblins chase and damage Tom. Each wave increases enemy count and speed, and later waves require multiple hits. Clearing a wave grants points and restores 15 health, up to 100. The game ends at zero health; redeploy to restart.

## Technical architecture
- `index.html`: self-contained Three.js application, UI, CSS, rendering, procedural environment and characters, movement, combat, waves, audio and particle effects.
- Three.js ES module loaded from esm.sh.
- Procedural geometry; no copyrighted game assets or external 3D model dependencies.
- Rendering: ACES tone mapping, physically based materials, fog, hemisphere/directional lights, shadow mapping.
- Gameplay: frame-rate-independent movement, axis-separated obstacle collisions, enemy pursuit, projectiles, reloads, wave spawning, health, score, pointer lock, pause.
- Audio: browser Web Audio synthesized effects.

## Publish with GitHub Pages
In repository Settings → Pages, choose **Deploy from a branch**, select `main` and `/ (root)`, then save. GitHub Pages may take a few minutes to publish.

## Known limitations and next steps
This is a first playable release, not a finished commercial-quality game. The scene uses procedural low-poly assets rather than artist-authored PBR models. Future quality passes should add custom character animations, collision against all environmental props, spatial audio, accessibility settings, quality presets, mobile controls, multiple maps, and automated browser testing. Enemy collision and projectile collisions are intentionally lightweight; enemies can occasionally slide against buildings. Sound requires user interaction due to browser audio restrictions.

## IP
This is an original water-blaster parody game, not affiliated with or endorsed by Call of Duty or Activision. Do not add Call of Duty logos, music, or proprietary assets.

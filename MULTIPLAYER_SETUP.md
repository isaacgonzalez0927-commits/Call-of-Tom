# Call of Tom multiplayer setup

The game includes Solo Practice and a three-mission squad campaign prototype. The multiplayer API is implemented in `api/squad.js` and uses Upstash Redis for shared squad codes and progression.

## Required deployment configuration

1. Create an Upstash Redis database.
2. In the Vercel project settings, add:
   - `UPSTASH_REDIS_REST_URL` (Upstash REST endpoint)
   - `UPSTASH_REDIS_REST_TOKEN` (Upstash REST token; server-side secret)
3. Redeploy. Do **not** put the token in `index.html` or expose it as a public environment variable.
4. Open the deployed site in two different browsers, select Online Multiplayer Campaign, create a squad, join with its six-character code, assign different Tom suits, and start when 2–5 players are present.

## Implemented

- Six-character squad codes; create, join, leave; 2–5 members
- Five unique selectable Tom suits (Silver, Gold, Diamond, Emerald, Ruby)
- Host starts campaign; three escalating combat missions; all players must individually clear each mission to advance
- Basic teammate position updates and visible Tom avatars, using ~1.7-second polling
- Shared squad progress and completion state with a two-hour squad expiration

## Limitations / next development phase

This is an **early co-op prototype**, not a fully authoritative real-time multiplayer shooter. Enemy spawns, hit detection, projectiles, damage, and score currently run locally per browser, so combat is not synchronized across teammates. Teammate positions update slowly, and reconnect/host-migration/retries are basic. To make a production co-op campaign, migrate combat simulation and movement to an authoritative WebSocket game server with a fixed tick rate, synchronization, and anti-cheat. Upstash configuration is required for squads to function on the live deployment.

## Testing

JavaScript syntax in `index.html` was checked programmatically. End-to-end multiplayer deployment, gameplay and performance were not tested.

# Recent Chats

Recent Chats is a Millennium plugin that adds a newest-first conversation list to Steam's desktop and in-game overlay Friends windows. It should feel native to Steam, preserve unread state, and never persist message content or extract credentials.

## Important context

- Valve exposes no supported Friends UI or conversation-list extension API. The plugin structurally discovers Steam's private `ChatStore`, so Steam updates can break compatibility.
- Target only `friendslist_uid<process-id>` popups: `uid0` is the desktop window and a nonzero ID is an in-game overlay. Steam replaces popup documents during startup; always follow the current `context.window.document` and wait for the Friends anchors.
- Keep the tab's click handling in the popup's native DOM. Cross-window React event handlers did not fire reliably.
- Steam represents invites as BBCode such as `gameinvite` and `lobbyinvite`. Parse special message types before generic BBCode cleanup.
- Base visual changes on Steam's desktop Friends styles, not its Gamepad/Big Picture components.

## Verify

```powershell
bun install
bun run typecheck
bun test
bun run build
```

For UI changes, test both tabs in the desktop and Shift+Tab Friends windows, and confirm conversation rows open chats in the originating context.

## Dependencies

Bun is the primary package manager, but PluginDatabase installs with pnpm. Keep both lockfiles synchronized whenever dependencies change.

- Add or remove packages with `bun add`, `bun add --dev`, or `bun remove` so `package.json` and `bun.lock` are updated.
- Run `pnpm install --lockfile-only` after every dependency change and commit the resulting `pnpm-lock.yaml`.
- If pnpm reports ignored build scripts, inspect the packages and run `pnpm approve-builds`. Approve only trusted packages whose scripts are required, and commit `pnpm-workspace.yaml` if it changes.
- Validate the pnpm path with `pnpm install --frozen-lockfile`, `pnpm run typecheck`, and `pnpm run build`.
- Restore Bun's installation with `bun ci`, then run the normal verification commands above.

## Package

Keep `package.json` and `plugin.json` versions synchronized. After a production build, release a zip with this layout:

```text
recent-chats/
  .millennium/Dist/index.js
  plugin.json
  README.md
  LICENSE
```

Run `bun run release` to verify the synchronized manifest versions, install locked dependencies, run all checks, build, and create that archive without overwriting an existing zip.

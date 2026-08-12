# Recent Chats

Recent Chats is a Millennium plugin that adds a newest-first conversation list to Steam's desktop Friends window. It should feel native to Steam, preserve unread state, and never persist message content or extract credentials.

## Important context

- Valve exposes no supported Friends UI or conversation-list extension API. The plugin structurally discovers Steam's private `ChatStore`, so Steam updates can break compatibility.
- Target only the `friendslist_uid0` popup. Steam replaces its document during startup; always follow the current `context.window.document` and wait for the Friends anchors.
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

For UI changes, also test both tabs in Steam and confirm conversation rows still open the correct chat.

## Package

Keep `package.json` and `plugin.json` versions synchronized. After a production build, release a zip with this layout:

```text
recent-chats/
  .millennium/Dist/index.js
  plugin.json
  README.md
  LICENSE
```

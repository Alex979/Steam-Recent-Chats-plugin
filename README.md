# Recent Chats for Millennium — proof of concept

This plugin adds a **Chats** tab to Steam's desktop Friends window. It reads the same in-memory `ChatStore.GetRecentChats()` model used by Steam's Gamepad/Deck UI, then displays direct and group conversations newest-first.

Version 0.1.3 follows the popup's current document while Steam initializes it, uses a native popup-window click listener for the Chats tab, and correctly switches the Friends content to the chat panel.

## Scope and safety

- Reads only Steam's current in-memory recent-chat metadata.
- Does not acknowledge messages or change unread state.
- Does not extract credentials, call undocumented HTTP endpoints, or write chat content to disk.
- Reads the `friends`/`chats` stores from the mounted Friends React tree, with structural webpack discovery as a fallback; it never hardcodes a minified module ID.
- Steam's private Friends UI may change, so this is deliberately labeled a proof of concept.

## Install after Millennium is installed

1. Run `bun install` and `bun run build` in this directory, or use the prebuilt package.
2. Copy this entire folder to `<Steam install>\millennium\plugins\recent-chats-poc`.
3. Restart Steam.
4. Enable **Recent Chats (PoC)** in Millennium if it is not already enabled.
5. Open **Friends & Chat**, then click **Chats** beside Steam's Friends heading.

On a typical Windows installation, the final path is:

```text
C:\Program Files (x86)\Steam\millennium\plugins\recent-chats-poc
```

## Diagnostics

The panel shows one of these states:

- `Live Steam ChatStore`: discovery worked and rows are reading live Steam data.
- `Steam ChatStore not found on this build`: Valve changed the internal store shape or the relevant chunk had not loaded.
- `Steam returned an unexpected chat shape`: the store was found but its returned objects changed.

Console messages are prefixed with `[Recent Chats PoC]`.

## Development

```powershell
bun install
bun run typecheck
bun test
bun run build
```

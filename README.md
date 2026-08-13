# Recent Chats

A Millenniuim plugin that adds a **Chats** tab to Steam's desktop Friends window. No more searching through your friends list to find that invite you missed or continue an old thread. Easily see all your latest invites and messages in one dedicated window.

<img width="404" height="465" alt="recent-chat-plugin-screenshot" src="https://github.com/user-attachments/assets/dce6df2c-fecb-496b-9112-867b9d6c969d" />

## Features

- Sorts conversations by their latest activity.
- Shows the latest message, including game, lobby, Steam Playtest, trade, and broadcast invites.
- Displays timestamps and unread counts without changing Steam's unread state.
- Searches names and message previews.
- Opens Steam's normal chat window when a conversation is selected.

## Install

1. Install [Millennium for Steam](https://steambrew.app/).
2. Download the [latest release](https://github.com/Alex979/Steam-Recent-Chats-plugin/releases) for this plugin
3. Extract the release archive into `<Steam install>\millennium\plugins`.
4. Confirm the resulting folder is `<Steam install>\millennium\plugins\recent-chats`.
5. Restart Steam and enable **Recent Chats** in Millennium's plugin settings (`Steam -> Millennium -> Plugins`).
6. Click **Save Changes** at the top of the menu and **restart Steam** one more time.
7. Open **Friends & Chat**, then select **Chats**.

On a typical Windows installation, the final path is:

```text
C:\Program Files (x86)\Steam\millennium\plugins\recent-chats
```

If upgrading from the early proof of concept, remove the old `recent-chats-poc` folder after installing `recent-chats` so Millennium does not load both copies.

## Privacy and compatibility

- Chat metadata stays in Steam's memory; this plugin does not persist message content.
- The plugin never acknowledges, sends, deletes, or archives messages.
- It does not extract credentials or call undocumented HTTP endpoints.
- Valve does not provide a supported Friends UI extension API. This plugin discovers Steam's chat store structurally, so a future Steam update may require a compatibility fix.

## Development

```powershell
bun install
bun run typecheck
bun test
bun run build
```

Useful console messages are prefixed with `[Recent Chats]`.

# Steam desktop Friends class mapping

This document records the native Steam classes and markup that Recent Chats should mirror. The source was inspected from disk only; Steam was not launched, modified, or debugged.

## Source and counting method

- Bundle: `C:\Program Files (x86)\Steam\steamui\chunk~2dcc5aaf7.js`
- File size: `14,273,812` bytes
- Modified: `2026-08-03T17:18:32-07:00`
- SHA-256: `E2E66D26DA900D406AAD17E4165B98E362AC7F8EF8EF566AD7D1EC27EAD79C68`
- The bundle contains 529 objects in the webpack CSS-export shape `moduleId:e=>{e.exports={...}}`. Filter counts below were computed by parsing those objects, extracting their case-sensitive keys, and counting objects containing every key in a candidate set.

Module IDs and current minified values are evidence only. Production code must resolve by semantic keys with `findClassModule`; it must never embed the IDs or minified values.

## Selection rules

Use native styling in this order:

1. Copy the classes from a live desktop-Friends sibling when one is necessarily present.
2. Use literal semantic class names emitted by Steam's JSX.
3. Resolve CSS-module classes with a multi-key `findClassModule` filter.
4. Retain an `rcp-*` layout/fallback class when Steam has no suitable desktop-Friends equivalent or a lookup misses.

The bundle also includes a Gamepad/Steam Deck Friends implementation. Its CSS modules are explicitly excluded below even when their names appear ideal for this plugin.

## Mapping summary

| Plugin element | Native source | Classes to apply | Resolution |
| --- | --- | --- | --- |
| Tab button | Desktop Friends sibling tab | copied sibling tokens, with `activeTab` toggled by Recent Chats; child `tabLabel` | live sibling first; `rcp-tab-button rcp-fallback` only on header fallback |
| Search input and clear | Desktop Friends tab search | `socialSearchContainer`, `socialInputContainer SearchActive`, `inputContainer no-drag`, `friendSearchInput`, `friendSearchClear`; `searchIconButton` is the collapsed search trigger | literal |
| Conversation row | Desktop friend and unread-chat row | `friend`, optional persona state, optional `unreadFriend` | literal |
| Avatar | Shared avatar component used by desktop friend rows | literal `avatarHolder no-drag Medium`, `avatarStatus`, `avatar`; corresponding module classes | mixed literal + `avatarModule` |
| Name | Desktop friend-row persona label | literal `labelHolder`; module `statusAndName` and `playerName` | mixed literal + `personaModule` |
| Snippet | Desktop friend row's `lastChat` rich-presence renderer | module `richPresenceContainer`, `richPresenceLabel`, and `LastMessage`; literal `no-drag` | `personaModule` + `friendsModule` |
| Unread badge | Desktop unread-friends group | `FriendMessageCount`; optional row/wrapper `unreadFriend` | literal |
| Panel/list | Desktop Friends content tree | `FriendsListContent`, `friendlistListContainer`, `listContentContainer` | literal; inherit the native background |

## Tab button

The desktop Friends header emits this shape:

```text
div.socialTabSearchContainer
  div.socialTabContainer
    div.friendTab.socialListTab.activeTab[.TabSearchActive]
      div.tabLabel
      div.friendsTabButtonsContainer
```

The exact desktop JSX starts from `i = "friendTab socialListTab activeTab"`, appends `TabSearchActive` while search is open, and renders the `tabLabel` as the first child.

Recent Chats should copy `className` from `.socialTabContainer .friendTab` at mount time. Split on whitespace and discard:

- `activeTab`
- every token containing `Search`, case-insensitively

The copied base is currently `friendTab socialListTab`. `setOpen` should toggle native `activeTab` on the injected button. Keep the existing `tabLabel` child and the native-DOM click listener. If mounting under `.friendListHeaderContainer` because the normal sibling is absent, apply `rcp-tab-button rcp-fallback` instead.

No CSS-module lookup is involved.

### Native-tab suppression limitation

Steam's React tree re-adds `activeTab` to its native Friends tab. While Recent Chats is open, the plugin must keep the narrow selector that neutralizes only that sibling's `background-color` and `box-shadow`. Do not force a text color: leaving a possible inactive-color mismatch is preferable to overriding theme colors.

## Search input and clear control

Desktop Friends renders:

```text
div.socialSearchContainer
  form.socialInputContainer.SearchActive
    div.inputContainer.no-drag
      input#friendSearchInputID.friendSearchInput
      div.friendSearchClear
        <Steam clear icon>

div.searchIconButton
  <Steam search icon>
```

`searchIconButton` is the separate collapsed-state trigger, not the input wrapper. The always-visible Recent Chats toolbar should mirror the inner input shape: an `inputContainer no-drag` wrapper containing `input.friendSearchInput` and a sibling clear control with `friendSearchClear`. `rcp-toolbar` can remain as a layout hook. The existing refresh action has no search-field equivalent; if retained, it can use the generic literal `friendListButton no-drag` while keeping its own layout/accessibility hook.

All selected classes here are literal semantic strings. There is no lookup to fail.

## Conversation row

The desktop friend-row component constructs its root as:

```text
friend <persona-state> [caller classes]
```

The desktop unread-chat group then renders:

```text
div.unreadFriend
  <FriendRow class="friend <persona-state>">
    ...
    div.FriendMessageCount
```

Use literal `friend` on every Recent Chats row and literal `unreadFriend` when the conversation is unread. The persona helper used by the row returns these exact tokens:

- `offline`
- `online`
- `ingame`
- `watchingbroadcast`
- any of the above plus `awayOrSnooze`

The helper used by the row says `ingame` (no hyphen); a separate model property returns `in-game`, but that is not the rendered class. Recent Chats does not currently normalize persona state, so omitting the modifier is safer than guessing. It may be added cheaply from the direct-chat persona later, provided group rows and missing personas degrade to bare `friend`.

Do not use the module-mapped `RecentChatElement` for this desktop panel. Its component is the Gamepad Recent Messages tab described under **Rejected modules**.

## Avatar

The Avatar component used by the native desktop friend row renders both module and literal classes:

```text
div.[avatarModule.avatarHolder].avatarHolder.no-drag.Medium[.<persona-state>]
  div.[avatarModule.avatarStatus].avatarStatus[.<status-position>]
  picture/img.[avatarModule.avatar].avatar
  [optional avatar frame/children]
```

Recent Chats should add an `avatarHolder` wrapper around the image instead of putting holder styling directly on a bare image. The image receives literal `avatar` and `avatarModule.avatar`; the wrapper receives literal `avatarHolder no-drag Medium` and `avatarModule.avatarHolder`. `avatarStatus` can be omitted when no reliable status is available. An initials placeholder remains plugin-specific but should live inside the same native holder wrapper.

Candidate resolver:

```ts
module.avatarHolder && module.avatarStatus && module.avatar && module.avatarFrameImg
```

Count: **1 of 529** CSS-export objects (bundle module `21045`). `avatarFrameImg` makes the filter identify the complete shared Avatar component rather than an unrelated object that happens to expose an avatar key.

## Name and snippet

The normal friend row passes literal `labelHolder` to Steam's persona-label component. When `lastChat` exists, that component renders this effective tree:

```text
div.labelHolder[.<persona-state>]
  div.[personaModule.statusAndName]
    div.[personaModule.playerName]
      <display name>
  div.[personaModule.richPresenceContainer]
    div.[personaModule.richPresenceLabel].no-drag
      div.[friendsModule.LastMessage]
        <last-message text>
```

Mirror this nesting around `rcp-name` and `rcp-snippet` while retaining those `rcp-*` hooks for grid placement and ellipsis. The resolved native classes provide typography and theme colors; the plugin should own only layout/truncation.

Candidate persona resolver:

```ts
module.statusAndName && module.playerName && module.richPresenceContainer && module.richPresenceLabel
```

Count: **1 of 529** (bundle module `66418`).

Candidate last-message resolver:

```ts
module.LastMessage && module.OfflineContainer && module.FriendListContainerPanel && module.RecentChatIcon
```

Count: **1 of 529** (bundle module `63958`). The companion keys tie `LastMessage` to the desktop Friends feature module.

The bundle's `personaName` and `personaNameLabel` keys belong to the hover mini-profile, whose native tree is `miniProfile > miniProfilePlayer/playerContent > playerAvatar + personaName/personaNameLabel`. That is not the list-row structure and should not be applied here.

## Unread badge

The desktop unread-friends group creates:

```text
div.FriendMessageCount
  <numeric unread count>
```

Use literal `FriendMessageCount` alongside `rcp-unread`. This class appears in the desktop Friends unread group and also in Steam's chat-related list-status indicators, so it is a better desktop match than module key `UnreadCount`.

No CSS-module lookup is needed for the chosen badge.

## Panel and list containers

The desktop Friends content tree is:

```text
FriendsListContent[.CompactFriendsList]
  friendlistListContainer
    listContentContainer
      <friend groups/rows>
      div.disconnectBlocker
```

These are all literal semantic classes. Apply `FriendsListContent` to the panel content root, `friendlistListContainer` to the scroll container, and `listContentContainer` to its inner list if the extra wrapper is introduced. Keep `rcp-panel`/`rcp-list` only for flex sizing, scroll containment, and mount hooks.

The plugin should not paint a panel background. In particular, remove the custom radial gradient so the native/theme background on these containers or their ancestors shows through.

## Rejected modules and collision checks

### Gamepad Recent Messages module

The tempting module containing `RecentChatsList`, `RecentChatElement`, `UnreadCount`, and `Time` is used as `tabContentElement` for `RecentMessages` inside a root constructed as `friendlist GamepadMode`. It is therefore not valid for desktop Friends.

Candidate identification filter:

```ts
module.RecentChatsList && module.RecentChatElement && module.UnreadCount && module.Time
```

Count: **1 of 529** (bundle module `97764`). This filter should be used in tests as a Gamepad-shaped rejection fixture, not as a runtime styling source.

Its current module-local `UnreadCount` value appears only in the export map and is not referenced by the component. That component renders literal `FriendMessageCount` for its badges anyway.

### Mini-profile persona module

The hover mini-profile module is uniquely identified by:

```ts
module.miniProfile && module.playerAvatar && module.personaName && module.personaNameLabel
```

Count: **1 of 529** (bundle module `24336`). It is a useful negative fixture for the desktop row-persona filter.

### Positive-filter counts

| Runtime module | Required keys | Matches |
| --- | --- | ---: |
| Avatar | `avatarHolder`, `avatarStatus`, `avatar`, `avatarFrameImg` | 1 |
| Desktop row persona | `statusAndName`, `playerName`, `richPresenceContainer`, `richPresenceLabel` | 1 |
| Desktop last-message/Friends feature | `LastMessage`, `OfflineContainer`, `FriendListContainerPanel`, `RecentChatIcon` | 1 |

Each runtime lookup should return `undefined` on a miss. Callers should add `rcp-fallback`, and the resolver should emit at most one `[Recent Chats]` warning per missing module rather than warning per row or render.

## Elements that remain plugin-owned

Steam has no close desktop-Friends equivalent for the preview skeleton, relative timestamp in this row shape, empty state, error banner, or initials fallback. Keep their `rcp-*` hooks, but make normal-path rules layout-only and inherit color/font from the native containers. Any visual approximation belongs in a clearly marked `.rcp-fallback`-gated section.

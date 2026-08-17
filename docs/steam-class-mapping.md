# Steam desktop Friends CSS mapping

This document records the native Steam classes retained by Recent Chats and the desktop CSS rules that actually match the injected DOM. The stylesheet, not the JavaScript export map, is the source of truth.

## Source and validation policy

- CSS: `C:\Program Files (x86)\Steam\steamui\css\chunk~2dcc5aaf7.css`
- Size: `4,878,054` bytes
- Modified: `2026-07-21T21:30:12Z`
- SHA-256: `0D06709DD5C72B9ED6760C7C383DD793899BE04CA97B61B8FBD11A8D11D66AE7`
- Excluded while auditing: selectors under `.GamepadMode`, `#QuickAccess-Menu`, and `.CompactFriendsList`.

A native class is kept only when a desktop rule matches the element's real tag, attributes, ancestors, and state. Layout that intentionally differs from Steam's 38px friend rows remains plugin-owned. When no suitable desktop rule exists, an `rcp-*` rule supplies the property directly.

## Effective injected structure

```text
div#recent-chats-poc-tab-host.friendTab.socialListTab.rcp-tab-button[.activeTab]
  span.tabLabel

div.rcp-panel.FriendsListContent
  div.rcp-toolbar
    form.rcp-search-form
      div.rcp-search-container.inputContainer
        input.rcp-search.friendSearchInput[type=text]
        button.rcp-search-clear.friendSearchClear
    button.rcp-refresh.friendListButton
  div.rcp-list.friendlistListContainer
    div.rcp-list-content.listContentContainer.friendGroup
      div.rcp-row-wrapper[.unreadFriend]
        div.rcp-row.friend.friendStatusHover.online
          span.rcp-avatar-holder.avatarHolder
            img.rcp-avatar.avatar
          span.rcp-copy.labelHolder
            span.rcp-name
            span.rcp-snippet.status
          span.rcp-meta
            span.rcp-time
            span.rcp-unread.FriendMessageCount
```

The tab's native classes are copied from the live sibling. The diagram shows the normal current tokens; a theme may add more.

## Tab

| Retained class | Matching desktop selector and required context | Native contribution |
| --- | --- | --- |
| `socialListTab` | `.socialListTab` | `flex-grow:1`, height `30px`, top margin `6px`, uppercase 13px/20px medium text, start padding `16px`, start alignment, inactive color, flex alignment, cursor, letter spacing, and transitions. Recent Chats neutralizes growth and adds matching end padding for a compact centered label. |
| `socialListTab` | `.compactView .socialListTab` | Height `24px` when the Friends window enters compact view. |
| `activeTab` | `.activeTab` | Active background `#434953`, top/side shadow, and text color `#b7ccd5`; the high-contrast media rule substitutes black/white with top and bottom borders. |
| `tabLabel` | `.socialListTab .tabLabel` | Opacity and the label transition. |
| `friendTab` | No rule in Valve's stylesheet | Deliberate exception: it is a native markup and Millennium-theme hook. It is copied from the live sibling even though Valve does not style it directly. |

The tab element is itself the host (`#recent-chats-poc-tab-host`) and mounts as a direct sibling of the native tab: a wrapper div changes the flex context, which let themes size the injected tab differently from the native one. Its inline padding is symmetric (`padding-inline`) so the label stays centered under any theme's start padding.

`copyNativeTabClassName` removes `activeTab` and every search-state token, then preserves the sibling's remaining tokens. Extra copied tokens may be supplied only by a Millennium theme; copying the live sibling preserves the exact native context even when Valve's base stylesheet has no corresponding rule. `rcp-tab-button` is always appended so the native-tab suppression rule can exclude the injected tab:

```css
html[data-recent-chats-poc-open]
  .socialTabContainer .friendTab.activeTab:not(.rcp-tab-button)
```

The injected tab is a `div[role=tab][tabindex="0"]`, matching Steam's element type and avoiding browser button chrome. Click, Enter, and Space handling stays in the popup's native DOM. If no sibling can be copied, `rcp-fallback` supplies the whole tab appearance.

Valve defines no desktop `.socialListTab:hover` rule and sets the base cursor to `default`. Recent Chats overrides the cursor to `pointer` and animates a `currentColor` overlay on hover and keyboard focus. The overlay is omitted for the active and fallback states, uses the copied tab's theme color, and disables its transition under `prefers-reduced-motion`.

## Search and refresh toolbar

| Retained class | Matching desktop selector and required context | Native contribution |
| --- | --- | --- |
| `inputContainer` | `.inputContainer` | Height `24px`, 2px radius, and overflow clipping. Recent Chats neutralizes the native outer margin because the toolbar owns spacing. |
| `friendSearchInput` | `.friendSearchInput[type=text]` — requires exactly `type="text"` | Full-size dark field (`#262930`), inset shadow, transparent border, text color, 12px font, letter spacing, 24px start padding, a 16px search glyph, and transitions. |
| `friendSearchInput` | `.friendSearchInput[type=text]:focus` | Dark focus background, tighter inset shadow, no outline, focus text color, and adjusted icon/padding position. |
| `friendSearchInput` | `.friendSearchInput::placeholder`; `.friendSearchInput:hover::placeholder,.friendSearchInput:focus::placeholder` | Italic 12px placeholder and its interaction color. High-contrast media rules provide white text, border, and placeholder. |
| `friendSearchClear` | `.friendSearchClear` | Absolute end positioning, `28px` by `26px` geometry, flex display, cursor, z-index, and opacity/transform transitions. |
| `friendSearchClear` | `.friendSearchClear:hover` | Full hover opacity once the plugin has enabled pointer events. |
| `friendListButton` | `.friendListButton`; `.friendListButton:last-child:not(.addFriendButton)` | `24px` square geometry, contained/no-repeat background setup, and native header-button margins. |

Steam normally reveals the clear control through `.SearchActive .friendSearchClear`, but Recent Chats has no collapsible search state. Plugin CSS therefore owns enabled/disabled opacity and pointer events. It also resets the accessible clear and refresh `<button>` elements because Steam renders these controls without browser button chrome and the native rules do not perform a button reset.

The toolbar itself is plugin-owned. No native always-open toolbar fits this DOM without side effects.

## List, rows, and text

| Retained class | Matching desktop selector and required context | Native contribution |
| --- | --- | --- |
| `friendGroup` | `.friendGroup` | Removes bottom padding. The wrapper supplies the required ancestor for desktop row rules. |
| `friendGroup` | `.FriendsListContent .friendlistListContainer>.friendGroup:first-child` — wrapper must be the list's first direct child | Transparent top border and zero top margin. |
| `friend` | `.friend` | Base friend color, flex display, neutral box shadow, and interaction transitions. |
| `friend` | `.friendGroup .friend` — requires the `friendGroup` ancestor | Native 38px height, margins, padding, and row direction. Recent Chats overrides only this geometry with an equal-specificity 58px grid rule. |
| `online` | `.friend.online` | Online color `#6dcff6`, inherited where a child has no more specific color. |
| `friendStatusHover` + `online` | `.friendStatusHover.online:hover,.friendStatusHover.online.Friend_ContextMenuActive` | Native online-row hover background `rgba(36,52,64,.3)`. |
| `labelHolder` | `.friend .labelHolder` — requires the `friend` ancestor | Growth, vertical alignment, `min-width:0`, and transitions. The native 28px height and 6px start margin are neutralized for the plugin's two-line grid and 8px grid gap. |
| `status` | `.currentUserContainer.online .status,.friend.online .status` — the second selector matches | Darker online detail color `#4c91ac` for the message snippet. |

Steam supplies no validated literal desktop rule for the near-white name treatment or the desired two-line typography. `.rcp-name` therefore owns its color, size, weight, and line height; `.rcp-snippet` owns only typography while `status` supplies its native/theme color.

The `friendGroup` ancestor is intentional, but Steam's `.friendGroup .friend` has higher specificity than a single `rcp-row` class. The plugin's `.friendGroup .rcp-row` explicitly restores the 58px height, grid columns, margins, and padding used by Recent Chats.

## Avatar

| Retained class | Matching desktop selector and required context | Native contribution |
| --- | --- | --- |
| `avatarHolder` | `.friendlistListContainer .friend .avatarHolder` | Relative positioning and 2px end padding. The plugin neutralizes the padding so its image remains a full 42px. |
| `avatar` | `.friend .avatarHolder img.avatar` — requires an `img` inside the holder inside `friend` | Native border width `.5px`. |

No literal desktop rule supplies the required 42px size, border style/color, radius, or fallback frame. Those properties remain on `rcp-avatar-holder`, `rcp-avatar`, and `rcp-avatar-fallback`.

## Unread badge

| Retained class | Matching desktop selector and required context | Native contribution |
| --- | --- | --- |
| `unreadFriend` | `.unreadFriend` | Relative flex wrapper used as the badge positioning context. |
| `unreadFriend` | `.unreadFriend .friend` | Makes the nested row full width. |
| `FriendMessageCount` | `.chatTab .chatTabUnreadBadge,.FriendMessageCount,.ChatUnreadMessageIndicator`; later `.FriendMessageCount` | Amber/yellow badge palette, height and line height, padding, alignment, and base animation properties. |
| `FriendMessageCount` | `.unreadFriend .FriendMessageCount` — requires the unread wrapper ancestor | 12px text, translucent amber background and glow, 4px radius, centered padding, and absolute top/end positioning. |

The badge remains nested under `unreadFriend`, so the state-scoped rule fires. Plugin CSS does not replace its native visual properties.

## Panel and background

| Retained class | Matching desktop selector and required context | Native contribution |
| --- | --- | --- |
| `FriendsListContent` | `.FriendsListContent` | Full-height flex column with `min-height:0`. |
| `friendlistListContainer` | `.friendlistListContainer` | Vertical scrolling, hidden horizontal overflow, smooth scrolling, flex growth, 32px minimum height, and Steam's radial dark Friends-list background. The high-contrast rule changes the background to black. |
| `friendlistListContainer` | later `.friendlistListContainer`; native scrollbar selectors | Relative positioning and Friends-list scrollbar interaction colors. |
| `listContentContainer` | `.listContentContainer` | Relative positioning for list content. |

The list container itself paints the Image 2 background. The panel remains transparent so Steam and Millennium themes can replace that rule.

## Removed and rejected classes

| Class or mechanism | CSS evidence and reason for removal |
| --- | --- |
| `socialSearchContainer` | `.socialSearchContainer { background-color:#434953; display:flex; flex-direction:row; flex-grow:1 }`; growth created the large dead toolbar area. |
| `socialInputContainer SearchActive` | `.socialInputContainer` is intentionally collapsed (`opacity:0`, `max-height:3px`, scaled vertically); `.socialInputContainer.SearchActive` opens it. A permanently open plugin form should not impersonate this state machine. |
| `no-drag` | No matching rule exists in the audited stylesheet. Plugin CSS uses `-webkit-app-region:no-drag` directly where needed. |
| `Medium` | Only `.currentUserAvatar .avatarHolder.Medium` or a minified avatar-module selector matches. Neither context exists after module removal. |
| `statusAndName` | Only dialog/voice-scoped literal rules exist; none match the recent-chat row. |
| `playerName` | Literal rules are quick-access-scoped; none match the recent-chat row. |
| `richPresenceContainer` | The literal rule requires `.AvatarAndUser .labelHolder`; that ancestor is absent. |
| `richPresenceLabel` | Literal rules require one-on-one voice or `ChatRoomListGroupItem`; those ancestors are absent. |
| `LastMessage` | No exact literal `.LastMessage` selector exists. `.LastMessageBlock` is a different class. |
| `findClassModule` persona/avatar/Friends lookups | Removed. The resolved minified rules impose foreign 36px avatar geometry, masks, compact typography, and a `LastMessage` color that overrides the desired online snippet color. A successful lookup did not prove that its component context was correct. |

## Plugin-owned properties

The plugin always owns the 58px row grid, 42px avatar box, ellipsis, timestamp/meta placement, keyboard focus outline, row divider, toolbar layout, tab hover feedback, and skeleton animation. It also owns visuals with no suitable native source: toolbar background/shadow (a translucent neutral so it blends with themed backgrounds), neutral name treatment, avatar frame and initials fallback, relative timestamp, empty state, error banner, and the text glyphs/button resets for clear and refresh. The list keeps `scrollbar-gutter: stable` because themes that mirror the native list may zero the container's scrollbar-side padding; the reserved gutter keeps rows visually inset either way.

The only resolver-style fallback that remains is the tab sibling copy. It can genuinely fail when the normal header is absent; all other retained native classes are literal and validated above.

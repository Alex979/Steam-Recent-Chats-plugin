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
    form.rcp-search-form.MemberListOptionsContainer
      div.rcp-search-container.inputContainer
        input.rcp-search.friendSearchInput[type=text]
        button.rcp-search-clear.friendSearchClear
    button.rcp-refresh.friendListButton
  div.rcp-list.friendlistListContainer
    div.rcp-list-content.listContentContainer.friendGroup
      div.rcp-row-wrapper[.unreadFriend]
        div.rcp-row.friend.friendStatusHover.(online|ingame|watchingbroadcast|offline)[.awayOrSnooze]
          span.rcp-avatar-holder.avatarHolder
            img.rcp-avatar.avatar
          span.rcp-copy
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

The tab element is itself the host (`#recent-chats-poc-tab-host`) and mounts as a direct sibling of the native tab: a wrapper div changes the flex context, which let themes size the injected tab differently from the native one. Its inline padding is symmetric (`padding-inline`) so the label stays centered under any theme's start padding, and it is explicitly `box-sizing: content-box` to match the native tab — a theme's vertical padding must add to the shared 30px height on both tabs equally.

The label carries `opacity: 1 !important` at ID specificity: single-tab theme designs blank all native tab labels (`.socialListTab .tabLabel { opacity: 0 !important }`) because a lone FRIENDS label is redundant, but the label is the only thing identifying the Chats tab. Every other inherited theme style still applies to it.

`copyNativeTabClassName` removes `activeTab` and Steam's known search-state tokens (`TabSearchActive`, `SearchActive`) via an explicit stop-list — Steam's bundle assembles exactly `friendTab socialListTab activeTab` plus `TabSearchActive`, so substring heuristics would risk dropping theme tokens — then preserves the sibling's remaining tokens. Extra copied tokens may come from a Millennium theme or a future Steam update; copying the live sibling preserves the exact native context even when Valve's base stylesheet has no corresponding rule. `rcp-tab-button` is always appended to distinguish the injected tab from its live native sibling.

When Chats opens, the plugin removes `activeTab` from the native Friends tab and records whether that state must be restored. Closing Chats or dismounting restores the class, and the reconcile loop removes it again if Steam replaces or updates the native element while Chats is open. Toggling the actual state class, rather than overriding a subset of its CSS, ensures high-contrast borders and arbitrary theme-provided active treatments apply only to the selected tab.

The injected tab is a `div[role=tab][tabindex="0"]`, matching Steam's element type and avoiding browser button chrome. Click, Enter, and Space handling stays in the popup's native DOM. If no copy containing `socialListTab` (the class that carries all of Valve's tab styling) is available, `rcp-fallback` supplies the whole tab appearance; while mounted, the plugin re-checks the sibling on each reconcile tick so a native tab that renders after a startup-churn mount is adopted instead of pinning the fallback.

Valve defines no desktop `.socialListTab:hover` rule and sets the base cursor to `default`. Recent Chats overrides the cursor to `pointer` and animates a `currentColor` overlay on hover and keyboard focus. The overlay is omitted for the active and fallback states, uses the copied tab's theme color, and disables its transition under `prefers-reduced-motion`.

## Search and refresh toolbar

| Retained class | Matching desktop selector and required context | Native contribution |
| --- | --- | --- |
| `inputContainer` | `.inputContainer` | Height `24px`, 2px radius, and overflow clipping. Recent Chats neutralizes the native outer margin because the toolbar owns spacing. |
| `friendSearchInput` | `.friendSearchInput[type=text]` — requires exactly `type="text"` | Full-size dark field (`#262930`), inset shadow, transparent border, text color, 12px font, letter spacing, 24px start padding, a 16px search glyph, and transitions. |
| `friendSearchInput` | `.friendSearchInput[type=text]:focus` | Dark focus background, tighter inset shadow, no outline, focus text color, and adjusted icon/padding position. |
| `friendSearchInput` | `.friendSearchInput::placeholder`; `.friendSearchInput:hover::placeholder,.friendSearchInput:focus::placeholder` | Italic 12px placeholder and its interaction color. High-contrast media rules provide white text, border, and placeholder. |
| `friendSearchClear` | `.friendSearchClear` | Absolute end positioning, `28px` width, flex display, cursor, z-index, and opacity/transform transitions. The plugin overrides Valve's `26px`/`-2px` vertical geometry, which the 24px `overflow:hidden` container would clip. |
| `friendListButton` | `.friendListButton`; `.friendListButton:last-child:not(.addFriendButton)` | `24px` square geometry, contained/no-repeat background setup, and native header-button margins. |
| `MemberListOptionsContainer` (on the form) | `.MemberListOptionsContainer .friendSearchInput::placeholder`; its `:hover/:focus` variant | Valve's brighter always-visible-search placeholder (`rgba(90,92,97,.7)`, hover `#686a70`) instead of the near-invisible header-search placeholder. The class's own bar geometry (`height:42px`, `justify-content:flex-end`) is neutralized on `.rcp-search-form`; its other rules target descendants Recent Chats does not render. |

Steam normally reveals the clear control through `.SearchActive .friendSearchClear`, but Recent Chats has no collapsible search state. Plugin CSS therefore owns enabled/disabled opacity, pointer events, and the hover/focus brightening — Valve's `.friendSearchClear:hover` loses its specificity tie to the plugin's enabled-state rule by source order, so it never applies. It also resets the accessible clear and refresh `<button>` elements because Steam renders these controls without browser button chrome and the native rules do not perform a button reset. Under default Steam only, the plugin corrects the persistent query text from Valve's transient `#555` to `#d6d7d8`; themed documents get a translucent neutral fallback that any theme's own `friendSearchInput` rules override — see "Millennium theme adaptation" below.

The toolbar itself is plugin-owned. No native always-open toolbar fits this DOM without side effects. Its background is the one deliberate dual treatment: default Steam keeps the original strip, while `html.rcp-themed` switches it to a translucent neutral — see "Millennium theme adaptation" below.

## List, rows, and text

| Retained class | Matching desktop selector and required context | Native contribution |
| --- | --- | --- |
| `friendGroup` | `.friendGroup` | Removes bottom padding. The wrapper supplies the required ancestor for desktop row rules. |
| `friendGroup` | `.FriendsListContent .friendlistListContainer>.friendGroup:first-child` — wrapper must be the list's first direct child | Transparent top border and zero top margin. |
| `friend` | `.friend` | Base friend color, flex display, neutral box shadow, and interaction transitions. |
| `friend` | `.friendGroup .friend` — requires the `friendGroup` ancestor | Native 38px height, margins, padding, and row direction. Recent Chats overrides only this geometry with an equal-specificity 58px grid rule. |
| `online`, `ingame`, `offline` | `.friend.online`, `.friend.ingame`, `.friend.offline` | Persona-aware row color inherited by the title and presence-specific hover backgrounds. Offline also activates Valve's avatar dimming, which `friendStatusHover` restores on hover. Group conversations deliberately use `online`; unresolved direct-chat presence deliberately uses `offline`. |
| `watchingbroadcast` | `.friend.watchingbroadcast` | Purple broadcast foreground. Valve defines no matching hover background, and Recent Chats adds none: broadcast rows behave exactly like Steam's native friend rows and will inherit any future Steam or theme rule automatically. |
| `awayOrSnooze` | `.friend.awayOrSnooze .labelHolder` targets markup Recent Chats deliberately omits | Preserves Steam's semantic state token. Plugin CSS mirrors the native 50% label opacity and transition on `rcp-copy`, including for in-game-away friends. |
| `friendStatusHover` + presence | Valve's online, in-game, and offline hover selectors | Native presence-appropriate hover background and offline-avatar hover restoration. |
| `status` | `.friend.online .status`, `.friend.ingame .status` | Darker native presence color for the message snippet. |

Resolved direct rows mirror Valve's own classifier: in-game, then watching a broadcast, then online, otherwise offline; `awayOrSnooze` is appended independently. Missing, empty, or explicitly uninitialized persona objects remain `unknown` in the data model so later polls can resolve them, but render with the native `offline` class. Group conversations retain their group data model while rendering with `online`, giving them the same established Steam and theme foreground, detail, and hover treatment as an online friend. Steam supplies no validated literal desktop rule for the desired two-line typography. `.rcp-name` therefore owns only its size, weight, and line height while inheriting the native/theme row color; `.rcp-snippet` likewise owns only typography while `status` supplies its native/theme color.

The `friendGroup` ancestor is intentional, but Steam's `.friendGroup .friend` has higher specificity than a single `rcp-row` class. The plugin's `.friendGroup .rcp-row` explicitly restores the 58px height, grid columns, margins, padding, and `width:auto` used by Recent Chats. The width reset also overrides `.unreadFriend .friend { width:100% }`, so themes that force row margins (`margin: 2px 16px !important` floating-row designs) inset both read and unread rows instead of pushing them past the card edge. Because Steam makes `.unreadFriend` a flex container, unread rows also flex-grow to fill its available width instead of shrinking to their content.

## Avatar

| Retained class | Matching desktop selector and required context | Native contribution |
| --- | --- | --- |
| `avatarHolder` | `.friendlistListContainer .friend .avatarHolder` | Relative positioning and 2px end padding. The plugin neutralizes the padding so its image remains a full 42px. |
| `avatar` | `.friend .avatarHolder img.avatar` — requires an `img` inside the holder inside `friend`; active only from `1.5dppx` through `2dppx` | Native border width `.5px` within that resolution range. |

No literal desktop rule supplies the required 42px size, base border width/style/color, radius, fallback frame, or filter transition. Those properties remain on `rcp-avatar-holder`, `rcp-avatar`, and `rcp-avatar-fallback`; the plugin uses a 1px base border, mirrors Steam's `.5px` rule from `1.5dppx` through `2dppx`, and copies the native avatar component's `filter 0.24s ease-in-out` timing so offline dimming animates in both directions. Fallback initials inherit the row's presence color and have plugin equivalents of Valve's image-only offline dim/hover selectors.

## Unread badge

| Retained class | Matching desktop selector and required context | Native contribution |
| --- | --- | --- |
| `unreadFriend` | `.unreadFriend` | Relative flex wrapper used as the badge positioning context. |
| `unreadFriend` | `.unreadFriend .friend` | Makes the nested row full width. |
| `FriendMessageCount` | `.chatTab .chatTabUnreadBadge,.FriendMessageCount,.ChatUnreadMessageIndicator`; later `.FriendMessageCount` | Amber/yellow badge palette, height and line height, padding, alignment, and base animation properties. |
| `FriendMessageCount` | `.unreadFriend .FriendMessageCount` — requires the unread wrapper ancestor | 12px text, translucent amber background and glow, 4px radius, centered padding, and absolute top/end positioning. |

The badge remains nested under `unreadFriend`, so the state-scoped rule fires for its palette and typography. Plugin CSS overrides only the rule's absolute positioning (the row's `.friendStatusHover` transform makes the row the containing block, which would paint the badge over the timestamp) and returns the badge to the meta column flow.

## Panel and background

| Retained class | Matching desktop selector and required context | Native contribution |
| --- | --- | --- |
| `FriendsListContent` | `.FriendsListContent` | Full-height flex column with `min-height:0`. |
| `friendlistListContainer` | `.friendlistListContainer` | Flex growth, 32px minimum height, and Steam's radial dark Friends-list background. The high-contrast rule changes the background to black. |
| `friendlistListContainer` | later `.friendlistListContainer`; native scrollbar selectors | Relative positioning and Friends-list scrollbar interaction colors. |
| `listContentContainer` | `.listContentContainer` | Relative positioning for list content. |

The list container paints Steam's native Friends-list background. The panel remains transparent so Millennium themes can replace that rule.

Scrolling is deliberately moved off the container onto the rows card (`.rcp-list` is `overflow: hidden`; `.rcp-list-content` scrolls): themes drop the container's scrollbar-side padding when the container owns a scrollbar (mirroring the native list, where the scrollbar takes that edge), which pushed the card flush against the right edge. With the card scrolling internally, themed container padding stays symmetric. Because Valve scopes the Friends hover-reveal thumb to `.friendlistListContainer` pseudo-elements, the plugin mirrors those two rules (transparent thumb, `#434953` on hover) on `.rcp-list-content` so the card does not fall through to Steam's global always-visible 14px thumb.

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
| `labelHolder` (on the copy block) | Valve's `.friend .labelHolder` contributions were minor, and themes size this hook for native single-line rows — one ships `.friend .labelHolder { width: 10px !important }`, which collapsed the plugin's ellipsized two-line copy to one character. The copy block uses only `rcp-copy`. |
| `findClassModule` persona/avatar/Friends lookups | Removed. The resolved minified rules impose foreign 36px avatar geometry, masks, compact typography, and a `LastMessage` color that overrides the desired online snippet color. A successful lookup did not prove that its component context was correct. |

## Millennium theme adaptation

Themes cannot target `rcp-*` classes, so the plugin-owned toolbar strip would otherwise stay Steam-default under every theme. The plugin toggles `rcp-themed` on the popup's root element via the per-document `<link id="millennium-injected">` theme-stylesheet marker (id unchanged since Millennium v2) — present exactly when Millennium injected theme CSS into this document. Weaker signals are deliberately not used: the `MillenniumQuickCss` inline style exists in every popup even on default Steam, and global theme state does not prove this window was restyled. The check re-runs on each reconcile tick because themes can be toggled mid-session. Default Steam keeps the original `#282d33` strip; `html.rcp-themed` switches it to a translucent neutral (`rgba(0,0,0,.2)`) that darkens whatever background the theme paints.

The search field gets the same translucent treatment (`rgba(0,0,0,.25)`, `color:inherit`) through a separate fallback sheet that exists only in themed documents, with a `:focus` variant matching the specificity of Valve's `[type="text"]:focus` colors so the field does not revert to Steam's focus background. It is inserted immediately *before* the `millennium-injected` link rather than appended with the main sheet: at Steam-equal specificity (`.rcp-search.friendSearchInput`), source order makes it beat Valve's default `#262930` field while any theme rule that can restyle Steam's own field (at least `.friendSearchInput[type=text]` specificity, or `!important`) still wins. Themes that ignore the field get the neutral translucency instead of Steam's default colors.

Theme-hardening rules learned from live themes, encoded above: match the native tab's `box-sizing`, toggle its real active-state class, reset row width so forced margins inset rather than overflow, express every visual row state through a native presence class, avoid native hook classes whose themed sizing assumes native markup (`labelHolder`), scroll the card rather than the container, and pin only the Chats label's opacity against label-hiding designs.

## Plugin-owned properties

The plugin always owns the 58px row grid, 42px avatar box, ellipsis, timestamp/meta placement, keyboard focus outline, row divider, toolbar layout, tab hover feedback, and skeleton animation. It also owns visuals with no suitable native source: toolbar background/shadow, avatar frame and initials fallback, relative timestamp, empty state, error banner, and the text glyphs/button resets for clear and refresh.

The only resolver-style fallback that remains is the tab sibling copy. It can genuinely fail when the normal header is absent; all other retained native classes are literal and validated above.

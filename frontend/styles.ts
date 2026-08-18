export const FRIENDS_WINDOW_STYLES = `
/* The tab is its own host element, mounted as a direct sibling of the native
 * tab so Valve and theme rules size both identically. Symmetric inline padding
 * keeps the label centered whatever start padding a theme sets. */
#recent-chats-poc-tab-host {
	/* content-box like the native tab: a theme's vertical padding must add to
	 * the shared 30px height on both tabs equally. */
	box-sizing: content-box;
	cursor: pointer;
	flex-grow: 0;
	margin-inline-start: auto;
	overflow: hidden;
	padding-inline: 16px;
	position: relative;
}

#recent-chats-poc-tab-host.rcp-header-fallback {
	bottom: 8px;
	height: 30px;
	position: absolute;
	right: 8px;
	z-index: 20;
}

/* Valve has no desktop tab hover rule; currentColor keeps this theme-neutral. */
#recent-chats-poc-tab-host:not(.rcp-fallback)::before {
	background-color: currentColor;
	content: '';
	inset: 0;
	opacity: 0;
	pointer-events: none;
	position: absolute;
	transition: opacity 180ms ease-in-out;
	z-index: 0;
}

#recent-chats-poc-tab-host:not(.rcp-fallback):not(.activeTab):hover::before,
#recent-chats-poc-tab-host:not(.rcp-fallback):not(.activeTab):focus-visible::before {
	opacity: 0.32;
}

/* Single-tab theme designs blank native tab labels (opacity 0 !important on
 * .socialListTab .tabLabel) because FRIENDS alone is redundant — but our
 * label is the only thing identifying the Chats tab. The ID out-specifies
 * the theme rule; every other inherited theme style still applies. */
#recent-chats-poc-tab-host .tabLabel {
	opacity: 1 !important;
	position: relative;
	z-index: 1;
}

html[data-recent-chats-poc-open] .socialTabContainer .friendTab.activeTab:not(.rcp-tab-button) {
	background-color: transparent;
	box-shadow: none;
	/* Valve's .activeTab color survives the background suppression; restore the
	 * inactive label color so only the Chats tab reads as selected. */
	color: #40474a;
}

#recent-chats-poc-panel-host {
	display: none;
	flex: 1 1 auto;
	min-height: 0;
	overflow: hidden;
}

html[data-recent-chats-poc-open] #recent-chats-poc-panel-host {
	display: flex;
}

html[data-recent-chats-poc-open] #recent-chats-poc-panel-host ~ .FriendsListContent {
	display: none !important;
}

html[data-recent-chats-poc-open] #recent-chats-poc-panel-host.rcp-content-fallback ~ .friendlistListContainer,
html[data-recent-chats-poc-open] #recent-chats-poc-panel-host.rcp-content-fallback ~ .FriendsListChatSection {
	display: none !important;
}

.rcp-panel {
	display: flex;
	flex: 1 1 auto;
	flex-direction: column;
	min-height: 0;
}

/* Steam has no always-open desktop search-toolbar class without growth/state
 * side effects; default Steam gets the original toolbar strip, while a
 * Millennium theme gets a translucent neutral that blends with its palette. */
.rcp-toolbar {
	align-items: center;
	background: #282d33;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.22);
	display: flex;
	flex: 0 0 auto;
	gap: 6px;
	padding: 6px 8px;
	z-index: 1;
}

html.rcp-themed .rcp-toolbar {
	background: rgba(0, 0, 0, 0.2);
}

.rcp-search-form,
.rcp-search-container {
	display: flex;
	flex: 1 1 auto;
	min-width: 0;
}

/* Neutralize MemberListOptionsContainer's bar geometry (42px height,
 * flex-end): the class is only worn for its placeholder rules. */
.rcp-search-form {
	box-sizing: border-box;
	height: auto;
	justify-content: flex-start;
	margin: 0;
}

.rcp-search-container {
	-webkit-app-region: no-drag;
	margin: 0;
	position: relative;
}

.rcp-search {
	box-sizing: border-box;
	flex: 1 1 auto;
	min-width: 0;
	padding-inline-end: 25px;
}

/* Valve's transient search field types at #555 (focus #aaa) — illegible in a
 * field that stays open while its filter is applied. Keep the query readable
 * on default Steam; the themed rule below still overrides to inherit. */
.rcp-toolbar .rcp-search.friendSearchInput {
	color: #d6d7d8;
}

/* Valve hardcodes the field colors; themes cannot reach a standalone search
 * input, so under a Millennium theme (html.rcp-themed, detected from injected
 * theme stylesheets) neutral translucents adapt it while Valve keeps the
 * icon/shape. Default Steam keeps Valve's own field colors. */
html.rcp-themed .rcp-toolbar .rcp-search.friendSearchInput {
	background-color: rgba(0, 0, 0, 0.25);
	color: inherit;
}


/* Steam renders friendSearchClear as a div; reset the accessible button wrapper.
 * Valve's 26px-tall, -2px-offset geometry is clipped by the 24px overflow-hidden
 * container, so the plugin pins the button to the container box. */
.rcp-search-clear {
	align-items: center;
	appearance: none;
	background: transparent;
	border: 0;
	color: inherit;
	height: 100%;
	inset-inline-end: 0;
	justify-content: center;
	padding: 0;
}

.rcp-search-clear:not(:disabled) {
	opacity: 0.4;
	pointer-events: auto;
}

/* Valve's .friendSearchClear:hover loses the specificity tie to the enabled
 * rule above by source order, so the plugin owns the hover/focus brightening. */
.rcp-search-clear:not(:disabled):hover,
.rcp-search-clear:not(:disabled):focus-visible {
	opacity: 1;
}

.rcp-search-clear:disabled {
	opacity: 0;
}

.rcp-search-clear span {
	font-size: 18px;
	line-height: 1;
}

.rcp-refresh {
	-webkit-app-region: no-drag;
	appearance: none;
	background: transparent;
	border: 0;
	color: inherit;
	cursor: pointer;
	flex: 0 0 auto;
	font: 18px/24px Arial, sans-serif;
	padding: 0;
}

.rcp-refresh:hover,
.rcp-refresh:focus-visible {
	background-color: rgba(255, 255, 255, 0.08);
	outline: none;
}

/* Error state has no native Friends-list equivalent. */
.rcp-error-banner {
	background: rgba(120, 45, 36, 0.65);
	border-bottom: 1px solid rgba(219, 116, 91, 0.28);
	color: #e6b4a8;
	font-size: 11px;
	line-height: 16px;
	padding: 5px 10px;
}

/* The rows card scrolls, not the themed container: themes drop the
 * container's scrollbar-side padding when it owns a scrollbar (matching the
 * native list), which pushed our card flush against the right edge. */
.rcp-list {
	display: flex;
	flex: 1 1 auto;
	flex-direction: column;
	min-height: 0;
	overflow: hidden;
}

.rcp-list-content {
	box-sizing: border-box;
	flex: 0 1 auto;
	min-height: 0;
	overflow-x: hidden;
	overflow-y: auto;
}

/* Valve scopes the Friends hover-reveal thumb to .friendlistListContainer,
 * which no longer owns a scrollbar here; mirror it on the scrolling card so
 * the list doesn't fall through to Steam's global always-visible thumb. */
.rcp-list-content::-webkit-scrollbar-thumb {
	background-color: rgba(67, 73, 83, 0);
}

.rcp-list-content:hover::-webkit-scrollbar-thumb {
	background-color: #434953;
}

.rcp-list-content,
.rcp-row-wrapper {
	min-width: 0;
	width: 100%;
}

/* Native rows are 38px; Recent Chats owns its 58px three-column geometry. */
/* No explicit width: the row auto-stretches so theme row margins (e.g.
 * floating-row designs) inset it instead of pushing it past the card edge. */
.friendGroup .rcp-row {
	-webkit-app-region: no-drag;
	align-items: center;
	border-bottom: 1px solid rgba(0, 0, 0, 0.22);
	box-sizing: border-box;
	cursor: pointer;
	display: grid;
	gap: 8px;
	grid-template-columns: 42px minmax(0, 1fr) max-content;
	height: auto;
	margin: 0;
	min-height: 58px;
	padding: 7px 9px;
	text-align: left;
}

.rcp-row:focus-visible {
	outline: 1px solid currentColor;
	outline-offset: -1px;
}

.friendlistListContainer .friend .rcp-avatar-holder {
	box-sizing: border-box;
	height: 42px;
	padding-inline-end: 0;
	width: 42px;
}

.rcp-avatar,
.rcp-avatar-fallback {
	box-sizing: border-box;
	height: 100%;
	object-fit: cover;
	width: 100%;
}

/* Literal avatar rules provide position and border width, but not the image frame. */
.rcp-avatar {
	background: #252a30;
	border-color: #4f6168;
	border-radius: 2px;
	border-style: solid;
}

.rcp-avatar-fallback {
	align-items: center;
	background: #252a30;
	border: 1px solid #4f6168;
	border-radius: 2px;
	color: #6dcff6;
	display: flex;
	font-size: 17px;
	font-weight: 500;
	justify-content: center;
}

.friend .rcp-copy {
	align-self: center;
	display: grid;
	grid-template-rows: auto auto;
	height: auto;
	margin: 0;
	min-width: 0;
}

.rcp-name,
.rcp-snippet {
	display: block;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* No desktop literal class produces the neutral recent-chat name treatment. */
.rcp-name {
	color: #d6d7d8;
	font-size: 14px;
	font-weight: 500;
	line-height: 19px;
}

.rcp-snippet {
	font-size: 12px;
	font-weight: 400;
	line-height: 17px;
}

.rcp-snippet-text {
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
}

.rcp-snippet-skeleton {
	animation: rcp-preview-pulse 2s ease-in-out infinite;
	background-color: currentColor;
	border-radius: 2px;
	display: block;
	height: 9px;
	margin: 4px 0;
	max-width: 280px;
	width: 60%;
}

@keyframes rcp-preview-pulse {
	0%,
	100% {
		opacity: 0.5;
	}

	50% {
		opacity: 1;
	}
}

@media (prefers-reduced-motion: reduce) {
	#recent-chats-poc-tab-host:not(.rcp-fallback)::before {
		transition: none;
	}

	.rcp-snippet-skeleton {
		animation: none;
		opacity: 0.75;
	}
}

.rcp-meta {
	align-items: flex-end;
	align-self: stretch;
	display: flex;
	flex-direction: column;
	gap: 3px;
	justify-content: center;
	max-width: 58px;
	min-width: 0;
}

/* Relative time and empty-state copy are plugin-only information. */
.rcp-time {
	color: #7a848d;
	font-size: 11px;
	line-height: 16px;
	white-space: nowrap;
}

/* Valve's .unreadFriend .FriendMessageCount pins the badge absolutely against
 * the transformed row, painting it over the timestamp; keep the native palette
 * but return the badge to the meta column flow. */
.rcp-meta .rcp-unread {
	inset-inline-end: auto;
	margin: 0;
	position: static;
	top: auto;
}

.rcp-empty {
	color: #7a848d;
	font-size: 12px;
	line-height: 18px;
	padding: 28px 22px;
	text-align: center;
}

/* The tab fallback is used only when no live desktop sibling can be copied. */
#recent-chats-poc-tab-host.rcp-fallback {
	align-items: center;
	background: transparent;
	border: 0;
	box-sizing: border-box;
	color: #40474a;
	cursor: pointer;
	display: flex;
	font: 500 13px/20px Motiva Sans, Arial, sans-serif;
	height: 30px;
	justify-content: center;
	letter-spacing: 0.3px;
	margin-top: 6px;
	padding: 0 16px;
	text-align: left;
	text-transform: uppercase;
	transition: background-color 233ms ease-in-out, box-shadow 233ms ease-in-out, color 233ms ease-in-out;
}

.compactView #recent-chats-poc-tab-host.rcp-fallback {
	height: 24px;
}

#recent-chats-poc-tab-host.rcp-fallback:hover {
	background-color: rgba(67, 73, 83, 0.55);
	color: #b7ccd5;
}

#recent-chats-poc-tab-host.rcp-fallback.activeTab {
	background-color: #434953;
	box-shadow: 0 -2px 3px rgba(0, 0, 0, 0.05), 4px -1px 1px rgba(0, 0, 0, 0.05);
	color: #b7ccd5;
}
`;

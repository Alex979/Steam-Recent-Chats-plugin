/* Injected only into themed documents, positioned before Millennium's theme
   stylesheet: source order lets it beat Steam's default field colors while any
   theme rule of at least Steam's own specificity still overrides it. */
export const THEMED_FALLBACK_STYLES = `
.rcp-search.friendSearchInput {
	background-color: rgba(0, 0, 0, 0.25);
	color: inherit;
}

.rcp-search.friendSearchInput:focus {
	background-color: rgba(0, 0, 0, 0.25);
	color: inherit;
}
`;

export const FRIENDS_WINDOW_STYLES = `
#recent-chats-poc-tab-host {
	/* Match the native tab when themes add vertical padding. */
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

/* Some single-tab themes hide native labels, but this label identifies Chats. */
#recent-chats-poc-tab-host .tabLabel {
	opacity: 1 !important;
	position: relative;
	z-index: 1;
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

/* There is no native always-open search toolbar without layout side effects. */
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

/* MemberListOptionsContainer is used only for its placeholder rules. */
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

/* Valve's transient field color is too dark for a persistent default-Steam query. */
html:not(.rcp-themed) .rcp-toolbar .rcp-search.friendSearchInput {
	color: #d6d7d8;
}

/* Reset the button and keep it inside Steam's clipped input container. */
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

.rcp-error-banner {
	background: rgba(120, 45, 36, 0.65);
	border-bottom: 1px solid rgba(219, 116, 91, 0.28);
	color: #e6b4a8;
	font-size: 11px;
	line-height: 16px;
	padding: 5px 10px;
}

/* Keep themed container padding symmetric by scrolling the inner card. */
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

/* Mirror Steam's hover-reveal scrollbar on the scrolling element. */
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

/* An implicit width lets theme-added margins inset the row without overflow. */
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
	width: auto;
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

.rcp-avatar {
	background: #252a30;
	border-color: #4f6168;
	border-radius: 2px;
	border-style: solid;
	border-width: 1px;
}

@media only screen and (min-resolution: 1.5dppx) and (max-resolution: 2dppx) {
	.rcp-avatar {
		border-width: 0.5px;
	}
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

.rcp-name {
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

.rcp-time {
	color: #7a848d;
	font-size: 11px;
	line-height: 16px;
	white-space: nowrap;
}

/* Keep the native badge style, but return it to the meta column flow. */
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

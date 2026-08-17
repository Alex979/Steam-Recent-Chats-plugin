export const FRIENDS_WINDOW_STYLES = `
#recent-chats-poc-tab-host {
	align-self: stretch;
	display: flex;
	flex: 0 0 auto;
	margin-left: auto;
}

#recent-chats-poc-tab-host.rcp-header-fallback {
	bottom: 8px;
	height: 30px;
	position: absolute;
	right: 8px;
	z-index: 20;
}

html[data-recent-chats-poc-open] .socialTabContainer .friendTab.activeTab {
	background-color: transparent;
	box-shadow: none;
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

.rcp-toolbar {
	align-items: center;
	display: flex;
	gap: 6px;
	padding: 6px 8px;
	z-index: 1;
}

.rcp-search-form,
.rcp-search-container {
	display: flex;
	flex: 1 1 auto;
	min-width: 0;
}

.rcp-search-form {
	margin: 0;
}

.rcp-search {
	box-sizing: border-box;
	flex: 1 1 auto;
	min-width: 0;
}

.rcp-search-clear {
	appearance: none;
	flex: 0 0 auto;
}

.rcp-refresh {
	flex: 0 0 auto;
}

.rcp-error-banner {
	padding: 5px 10px;
}

.rcp-list {
	flex: 1 1 auto;
	min-height: 0;
	overflow-x: hidden;
	overflow-y: auto;
}

.rcp-row-wrapper {
	min-width: 0;
	width: 100%;
}

.rcp-row {
	align-items: center;
	box-sizing: border-box;
	cursor: pointer;
	display: grid;
	gap: 8px;
	grid-template-columns: 42px minmax(0, 1fr) max-content;
	min-height: 58px;
	padding: 7px 9px;
	text-align: left;
	width: 100%;
}

.rcp-avatar-holder {
	box-sizing: border-box;
	height: 42px;
	width: 42px;
}

.rcp-avatar,
.rcp-avatar-fallback {
	box-sizing: border-box;
	height: 100%;
	object-fit: cover;
	width: 100%;
}

.rcp-avatar-fallback {
	align-items: center;
	display: flex;
	justify-content: center;
}

.rcp-copy {
	align-self: center;
	display: grid;
	grid-template-rows: auto auto;
	min-width: 0;
}

.rcp-status-and-name,
.rcp-rich-presence-label,
.rcp-name,
.rcp-snippet {
	min-width: 0;
}

.rcp-name,
.rcp-snippet,
.rcp-snippet-text {
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
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
	white-space: nowrap;
}

.rcp-unread {
	align-items: center;
	display: flex;
	height: 18px;
	justify-content: center;
	min-width: 18px;
	padding: 0 3px;
}

.rcp-empty {
	padding: 28px 22px;
	text-align: center;
}

/*
 * Fallback visuals are intentionally scoped to resolver misses. Native Steam
 * classes own all colors, typography, borders, and interaction states above.
 */
#recent-chats-poc-tab-host .rcp-tab-button.rcp-fallback {
	align-items: center;
	appearance: none;
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

.compactView #recent-chats-poc-tab-host .rcp-tab-button.rcp-fallback {
	height: 24px;
}

#recent-chats-poc-tab-host .rcp-tab-button.rcp-fallback:hover {
	background-color: rgba(67, 73, 83, 0.55);
	color: #b7ccd5;
}

#recent-chats-poc-tab-host .rcp-tab-button.rcp-fallback.activeTab {
	background-color: #434953;
	box-shadow: 0 -2px 3px rgba(0, 0, 0, 0.05), 4px -1px 1px rgba(0, 0, 0, 0.05);
	color: #b7ccd5;
}

.rcp-avatar-holder.rcp-fallback,
.rcp-fallback .rcp-avatar-holder {
	background-color: #252a30;
	border: 1px solid #4f6168;
	border-radius: 2px;
}

.rcp-avatar.rcp-fallback,
.rcp-avatar-fallback.rcp-fallback,
.rcp-fallback .rcp-avatar,
.rcp-fallback .rcp-avatar-fallback {
	border-radius: 2px;
}

.rcp-avatar-fallback.rcp-fallback,
.rcp-fallback .rcp-avatar-fallback {
	color: #6dcff6;
	font-size: 17px;
	font-weight: 500;
}

.rcp-name.rcp-fallback,
.rcp-fallback .rcp-name {
	color: #d6d7d8;
	font-size: 14px;
	font-weight: 500;
	line-height: 19px;
}

.rcp-snippet.rcp-fallback,
.rcp-fallback .rcp-snippet {
	color: #4f91ac;
	font-size: 12px;
	font-weight: 400;
	line-height: 17px;
}
`;

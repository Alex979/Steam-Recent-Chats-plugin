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

#recent-chats-poc-tab-host .rcp-tab-button {
	appearance: none;
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

.compactView #recent-chats-poc-tab-host .rcp-tab-button {
	height: 24px;
}

#recent-chats-poc-tab-host .rcp-tab-button:hover {
	background-color: rgba(67, 73, 83, 0.55);
	color: #b7ccd5;
}

#recent-chats-poc-tab-host .rcp-tab-button.rcp-active {
	background-color: #434953;
	box-shadow: 0 -2px 3px rgba(0, 0, 0, 0.05), 4px -1px 1px rgba(0, 0, 0, 0.05);
	color: #b7ccd5;
}

html[data-recent-chats-poc-open] .socialTabContainer .friendTab.activeTab {
	background-color: transparent;
	box-shadow: none;
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

html[data-recent-chats-poc-open] .FriendsListContent {
	display: none !important;
}

html[data-recent-chats-poc-open] #recent-chats-poc-panel-host.rcp-content-fallback ~ .friendlistListContainer,
html[data-recent-chats-poc-open] #recent-chats-poc-panel-host.rcp-content-fallback ~ .FriendsListChatSection {
	display: none !important;
}

.rcp-panel {
	background: radial-gradient(ellipse farthest-corner at 50% 30%, #212329 0%, #1e2025 50%, #1c1d22 100%);
	color: #d6d7d8;
	display: flex;
	flex: 1 1 auto;
	flex-direction: column;
	font-family: Motiva Sans, Arial, sans-serif;
	min-height: 0;
}

.rcp-toolbar {
	align-items: center;
	background: #282d33;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.22);
	display: flex;
	gap: 6px;
	padding: 6px 8px;
	z-index: 1;
}

.rcp-search {
	appearance: none;
	background: #1d2025;
	border: 1px solid #101216;
	border-radius: 2px;
	box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.35);
	box-sizing: border-box;
	color: #d6d7d8;
	flex: 1 1 auto;
	font: 13px/18px Motiva Sans, Arial, sans-serif;
	height: 28px;
	min-width: 0;
	outline: none;
	padding: 4px 8px;
}

.rcp-search::placeholder {
	color: #6f777f;
	font-style: italic;
}

.rcp-search:focus {
	border-color: #3f5968;
}

.rcp-search::-webkit-search-cancel-button {
	filter: grayscale(1);
	opacity: 0.6;
}

.rcp-refresh {
	appearance: none;
	background: transparent;
	border: 0;
	border-radius: 2px;
	color: #b7ccd5;
	cursor: pointer;
	font: 18px/28px Arial, sans-serif;
	height: 28px;
	padding: 0;
	width: 30px;
}

.rcp-refresh:hover,
.rcp-refresh:focus-visible {
	background-color: rgba(255, 255, 255, 0.08);
	color: #fff;
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

.rcp-list {
	flex: 1 1 auto;
	min-height: 0;
	overflow-x: hidden;
	overflow-y: auto;
	scrollbar-color: #434953 transparent;
	scrollbar-width: thin;
}

.rcp-list::-webkit-scrollbar {
	width: 8px;
}

.rcp-list::-webkit-scrollbar-thumb {
	background: #434953;
}

.rcp-list::-webkit-scrollbar-track {
	background: transparent;
}

.rcp-row {
	align-items: center;
	appearance: none;
	background: transparent;
	border: 0;
	border-bottom: 1px solid rgba(0, 0, 0, 0.22);
	box-sizing: border-box;
	color: inherit;
	cursor: pointer;
	display: grid;
	gap: 8px;
	grid-template-columns: 42px minmax(0, 1fr) max-content;
	min-height: 58px;
	padding: 7px 9px;
	text-align: left;
	width: 100%;
}

.rcp-row:hover,
.rcp-row:focus-visible {
	background: linear-gradient(to right, rgba(67, 73, 83, 0.72), rgba(58, 62, 70, 0.38));
	outline: none;
}

.rcp-avatar,
.rcp-avatar-fallback {
	background: #252a30;
	border: 1px solid #4f6168;
	border-radius: 2px;
	box-sizing: border-box;
	height: 42px;
	object-fit: cover;
	width: 42px;
}

.rcp-avatar-fallback {
	align-items: center;
	color: #6dcff6;
	display: flex;
	font-size: 17px;
	font-weight: 500;
	justify-content: center;
}

.rcp-copy {
	align-self: center;
	display: grid;
	grid-template-rows: auto auto;
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
	color: #d6d7d8;
	font-size: 14px;
	font-weight: 500;
	line-height: 19px;
}

.rcp-snippet {
	color: #4f91ac;
	font-size: 12px;
	font-weight: 400;
	line-height: 17px;
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

.rcp-unread {
	align-items: center;
	background: #1a9fff;
	border-radius: 2px;
	color: #fff;
	display: flex;
	font-size: 11px;
	font-weight: 600;
	height: 18px;
	justify-content: center;
	min-width: 18px;
	padding: 0 3px;
}

.rcp-empty {
	color: #7a848d;
	font-size: 12px;
	line-height: 18px;
	padding: 28px 22px;
	text-align: center;
}
`;

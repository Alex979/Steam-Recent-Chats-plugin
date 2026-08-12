export const FRIENDS_WINDOW_STYLES = `
#recent-chats-poc-tab-host {
	display: flex;
	align-items: stretch;
	height: 100%;
	margin-left: auto;
}

#recent-chats-poc-tab-host.rcp-header-fallback {
	bottom: 8px;
	height: 34px;
	position: absolute;
	right: 8px;
	z-index: 20;
}

#recent-chats-poc-tab-host .rcp-tab-button {
	appearance: none;
	border: 0;
	border-left: 1px solid rgba(255, 255, 255, 0.08);
	background: rgba(39, 53, 66, 0.72);
	color: #8f98a0;
	cursor: pointer;
	font: 600 14px Motiva Sans, Arial, sans-serif;
	letter-spacing: 0.025em;
	min-height: 40px;
	padding: 0 15px;
	text-transform: uppercase;
}

#recent-chats-poc-tab-host .rcp-tab-button:hover,
#recent-chats-poc-tab-host .rcp-tab-button.rcp-active {
	background: linear-gradient(180deg, #31495d, #263b4d);
	box-shadow: inset 0 -2px 0 #66c0f4;
	color: #dfeaf5;
}

html[data-recent-chats-poc-open] .socialTabContainer .friendTab.activeTab {
	background: rgba(24, 36, 49, 0.7);
	color: #7d8994;
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
	background: linear-gradient(180deg, #172331 0%, #111a23 100%);
	color: #d6d7d8;
	display: flex;
	flex: 1 1 auto;
	flex-direction: column;
	font-family: Motiva Sans, Arial, sans-serif;
	min-height: 0;
}

.rcp-toolbar {
	align-items: center;
	background: rgba(47, 66, 82, 0.66);
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	display: flex;
	gap: 8px;
	padding: 8px;
}

.rcp-search {
	background: #101923;
	border: 1px solid #30465a;
	border-radius: 3px;
	box-sizing: border-box;
	color: #dfe8f1;
	flex: 1 1 auto;
	font: 13px Motiva Sans, Arial, sans-serif;
	min-width: 0;
	outline: none;
	padding: 7px 9px;
}

.rcp-search:focus {
	border-color: #66c0f4;
	box-shadow: 0 0 0 1px rgba(102, 192, 244, 0.2);
}

.rcp-refresh {
	appearance: none;
	background: #29445a;
	border: 0;
	border-radius: 3px;
	color: #c7d5e0;
	cursor: pointer;
	font-size: 17px;
	height: 31px;
	width: 34px;
}

.rcp-status {
	align-items: center;
	background: rgba(8, 14, 19, 0.34);
	color: #7f98aa;
	display: flex;
	font-size: 11px;
	gap: 6px;
	padding: 5px 10px;
}

.rcp-status-dot {
	background: #66c0f4;
	border-radius: 50%;
	box-shadow: 0 0 7px rgba(102, 192, 244, 0.75);
	height: 6px;
	width: 6px;
}

.rcp-status-dot.rcp-error {
	background: #d67b69;
	box-shadow: none;
}

.rcp-list {
	flex: 1 1 auto;
	min-height: 0;
	overflow-x: hidden;
	overflow-y: auto;
}

.rcp-row {
	align-items: center;
	background: transparent;
	border: 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.055);
	box-sizing: border-box;
	color: inherit;
	cursor: pointer;
	display: grid;
	grid-template-columns: 46px minmax(0, 1fr) auto;
	gap: 10px;
	padding: 10px;
	text-align: left;
	width: 100%;
}

.rcp-row:hover,
.rcp-row:focus-visible {
	background: linear-gradient(90deg, rgba(55, 87, 112, 0.55), rgba(43, 65, 82, 0.28));
	outline: none;
}

.rcp-avatar,
.rcp-avatar-fallback {
	background: #263b4d;
	border: 1px solid rgba(102, 192, 244, 0.35);
	border-radius: 3px;
	box-sizing: border-box;
	height: 46px;
	object-fit: cover;
	width: 46px;
}

.rcp-avatar-fallback {
	align-items: center;
	color: #8fc7e8;
	display: flex;
	font-size: 19px;
	font-weight: 600;
	justify-content: center;
}

.rcp-copy {
	min-width: 0;
}

.rcp-name {
	color: #e5eff8;
	font-size: 15px;
	line-height: 20px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.rcp-snippet {
	color: #6f92aa;
	font-size: 13px;
	line-height: 18px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.rcp-meta {
	align-items: flex-end;
	display: flex;
	flex-direction: column;
	gap: 5px;
}

.rcp-time {
	color: #8494a3;
	font-size: 12px;
	white-space: nowrap;
}

.rcp-unread {
	align-items: center;
	background: #0d82a4;
	border-radius: 3px;
	color: white;
	display: flex;
	font-size: 12px;
	font-weight: 600;
	height: 22px;
	justify-content: center;
	min-width: 22px;
	padding: 0 4px;
}

.rcp-empty {
	color: #8395a5;
	font-size: 13px;
	line-height: 1.45;
	padding: 28px 22px;
	text-align: center;
}
`;

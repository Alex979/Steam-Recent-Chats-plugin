import { findModuleExport, getReactInstance, Millennium, modules, definePlugin } from '@steambrew/client';
import { createRoot, Root } from 'react-dom/client';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { normalizeRecentChats, RecentConversation, SteamRootStore, steamId64FromAccountId } from './chat-adapter';
import { FRIENDS_WINDOW_STYLES } from './styles';

const LOG_PREFIX = '[Recent Chats]';
const FRIENDS_POPUP_NAME = 'friendslist_uid0';
const TAB_HOST_ID = 'recent-chats-poc-tab-host';
const PANEL_HOST_ID = 'recent-chats-poc-panel-host';
const STYLE_ID = 'recent-chats-poc-styles';
const OPEN_ATTRIBUTE = 'data-recent-chats-poc-open';

interface PopupContext {
	m_strName?: string;
	window?: Window;
}

interface MountedWindow {
	document: Document;
	root: Root;
	tabHost: HTMLElement;
	panelHost: HTMLElement;
	closeFromFriendsTab?: () => void;
	friendsTab?: HTMLElement;
}

interface FriendsAnchors {
	document: Document;
	header: HTMLElement;
	content: HTMLElement;
	contentIsFallback: boolean;
}

const mountedWindows = new Set<MountedWindow>();
const attachingWindows = new WeakSet<Window>();
let pluginActive = true;

function isSteamRootStore(candidate: unknown): candidate is SteamRootStore {
	if (!candidate || typeof candidate !== 'object') return false;
	try {
		return typeof (candidate as SteamRootStore).ChatStore?.GetRecentChats === 'function';
	} catch {
		return false;
	}
}

function findStoreFromFriendsReactTree(document: Document): SteamRootStore | undefined {
	const host = document.querySelector<HTMLElement>('#friendslist-container .friendlist');
	let fiber = host ? getReactInstance(host) : undefined;
	const visited = new Set<unknown>();

	// The desktop Friends component already receives `friends` and `chats` as
	// props. Walking upward from its host element avoids depending on a webpack
	// export name and is therefore the preferred discovery path.
	while (fiber && !visited.has(fiber)) {
		visited.add(fiber);
		const props = fiber.memoizedProps ?? fiber.stateNode?.props;
		if (typeof props?.chats?.GetRecentChats === 'function') {
			return {
				ChatStore: props.chats,
				FriendStore: props.friends,
			};
		}
		fiber = fiber.return;
	}

	return undefined;
}

function findSteamRootStore(document: Document): SteamRootStore | undefined {
	const direct = findModuleExport((candidate) => isSteamRootStore(candidate));
	if (isSteamRootStore(direct)) return direct;

	// Diagnostic fallback for bundles where the root store is nested one level deeper.
	for (const module of modules.values()) {
		for (const container of [module, module?.default]) {
			if (!container || typeof container !== 'object') continue;
			for (const candidate of Object.values(container)) {
				if (isSteamRootStore(candidate)) return candidate;
			}
		}
	}

	return findStoreFromFriendsReactTree(document);
}

function relativeTime(timestamp: number): string {
	const elapsed = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
	if (elapsed < 60) return 'now';
	if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
	if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h`;
	if (elapsed < 172800) return 'Yesterday';
	if (elapsed < 604800) return `${Math.floor(elapsed / 86400)}d`;

	return new Date(timestamp * 1000).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	});
}

function openConversation(store: SteamRootStore, conversation: RecentConversation, popupWindow: Window): void {
	const steamClient = (globalThis as any).SteamClient;

	try {
		if (conversation.kind === 'friend' && conversation.accountId) {
			const steamId64 = steamId64FromAccountId(conversation.accountId);
			if (steamId64 && typeof steamClient?.WebChat?.ShowFriendChatDialog === 'function') {
				steamClient.WebChat.ShowFriendChatDialog(steamId64);
				return;
			}

			if (typeof store.UIStore?.ShowFriendChatDialog === 'function') {
				store.UIStore.ShowFriendChatDialog(popupWindow, conversation.accountId);
				return;
			}
		}

		if (conversation.kind === 'group') {
			if (typeof store.UIStore?.ShowAndOrActivateChatRoomGroup === 'function') {
				store.UIStore.ShowAndOrActivateChatRoomGroup(popupWindow, conversation.raw, true);
				return;
			}

			const groupId = conversation.raw.GetGroupID?.();
			const chatId = conversation.raw.GetDefaultChatID?.();
			if (typeof steamClient?.WebChat?.ShowChatRoomGroupDialog === 'function' && groupId !== undefined && chatId !== undefined) {
				steamClient.WebChat.ShowChatRoomGroupDialog(groupId, chatId);
				return;
			}
		}
	} catch (error) {
		console.error(LOG_PREFIX, 'Failed to open conversation.', error);
		return;
	}

	console.warn(LOG_PREFIX, 'No compatible chat-opening method was found.', conversation);
}

function ConversationAvatar({ conversation }: { conversation: RecentConversation }) {
	const [failed, setFailed] = useState(false);
	if (!conversation.avatarUrl || failed) {
		return <div className="rcp-avatar-fallback">{conversation.name.slice(0, 1).toUpperCase()}</div>;
	}

	return <img className="rcp-avatar" src={conversation.avatarUrl} alt="" draggable={false} onError={() => setFailed(true)} />;
}

interface RecentChatsAppProps {
	document: Document;
	popupWindow: Window;
}

function RecentChatsPanel({ document, popupWindow }: RecentChatsAppProps) {
	const [query, setQuery] = useState('');
	const [store, setStore] = useState<SteamRootStore>();
	const [conversations, setConversations] = useState<RecentConversation[]>([]);
	const [error, setError] = useState<string>();

	const refresh = useCallback(() => {
		const activeStore = store ?? findSteamRootStore(document);
		if (!activeStore) {
			setError('Steam ChatStore not found on this build');
			return;
		}

		try {
			setStore(activeStore);
			setConversations(normalizeRecentChats(activeStore));
			setError(undefined);
		} catch (refreshError) {
			console.error(LOG_PREFIX, 'Failed to read recent chats.', refreshError);
			setError('Steam returned an unexpected chat shape');
		}
	}, [document, store]);

	useEffect(() => {
		refresh();
		const interval = popupWindow.setInterval(refresh, 2000);
		return () => popupWindow.clearInterval(interval);
	}, [popupWindow, refresh]);

	const filteredConversations = useMemo(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase();
		if (!normalizedQuery) return conversations;
		return conversations.filter(
			(conversation) =>
				conversation.name.toLocaleLowerCase().includes(normalizedQuery) ||
				conversation.snippet.toLocaleLowerCase().includes(normalizedQuery),
		);
	}, [conversations, query]);

	return (
		<div className="rcp-panel">
			<div className="rcp-toolbar">
				<input
					className="rcp-search"
					type="search"
					value={query}
					onChange={(event) => setQuery(event.currentTarget.value)}
					placeholder="Search recent chats"
					aria-label="Search recent chats"
				/>
				<button className="rcp-refresh" type="button" onClick={refresh} title="Refresh recent chats">
					↻
				</button>
			</div>
			{error && <div className="rcp-error-banner">Recent chats are temporarily unavailable. Try refreshing.</div>}
			<div className="rcp-list">
				{filteredConversations.map((conversation) => (
					<button
						className="rcp-row"
						type="button"
						key={conversation.id}
						onClick={() => store && openConversation(store, conversation, popupWindow)}
					>
						<ConversationAvatar conversation={conversation} />
						<span className="rcp-copy">
							<span className="rcp-name">{conversation.name}</span>
							<span className="rcp-snippet">{conversation.snippet}</span>
						</span>
						<span className="rcp-meta">
							<span className="rcp-time">{relativeTime(conversation.timestamp)}</span>
							{conversation.unread > 0 && <span className="rcp-unread">{conversation.unread}</span>}
						</span>
					</button>
				))}
				{filteredConversations.length === 0 && (
					<div className="rcp-empty">
						{error
							? 'Steam’s chat data could not be read on this build.'
							: query
								? 'No recent conversations match that search.'
								: 'Steam did not return any recent conversations. Try opening a chat once, then refresh.'}
					</div>
				)}
			</div>
		</div>
	);
}

function ensureStyle(document: Document): void {
	if (document.getElementById(STYLE_ID)) return;
	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = FRIENDS_WINDOW_STYLES;
	document.head.append(style);
}

function delay(milliseconds: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function findFriendsAnchors(document: Document): FriendsAnchors | undefined {
	const root = document.querySelector<HTMLElement>('#friendslist-container') ?? document.querySelector<HTMLElement>('.friendlist');
	if (!root) return undefined;

	const header =
		root.querySelector<HTMLElement>('.socialTabContainer') ??
		root.querySelector<HTMLElement>('.friendListHeaderContainer');
	const primaryContent = root.querySelector<HTMLElement>('.FriendsListContent');
	const fallbackContent = root.querySelector<HTMLElement>('.friendlistListContainer');
	const content = primaryContent ?? fallbackContent;

	if (!header || !content) return undefined;
	return { document, header, content, contentIsFallback: !primaryContent };
}

async function waitForFriendsAnchors(context: PopupContext, timeoutMs: number): Promise<FriendsAnchors> {
	const startedAt = Date.now();
	let latestDocument: Document | undefined;

	while (pluginActive && Date.now() - startedAt < timeoutMs) {
		latestDocument = context.window?.document;
		if (latestDocument) {
			const anchors = findFriendsAnchors(latestDocument);
			if (anchors) return anchors;
		}
		await delay(250);
	}

	const bodySummary = latestDocument?.body
		? Array.from(latestDocument.body.children)
				.slice(0, 8)
				.map((element) => `${element.tagName.toLowerCase()}#${element.id}.${element.className}`)
				.join(', ')
		: 'no body';
	throw new Error(
		`Friends anchors not found; readyState=${latestDocument?.readyState ?? 'unknown'}, url=${latestDocument?.URL ?? 'unknown'}, body=${bodySummary}`,
	);
}

async function attachToFriendsWindow(context: PopupContext): Promise<void> {
	if (!pluginActive || context.m_strName !== FRIENDS_POPUP_NAME || !context.window) return;
	if (attachingWindows.has(context.window)) return;
	attachingWindows.add(context.window);

	try {
		const anchors = await waitForFriendsAnchors(context, 30_000);
		const { document, header, content, contentIsFallback } = anchors;
		if (!pluginActive || document.getElementById(TAB_HOST_ID)) return;

		ensureStyle(document);

		const tabHost = document.createElement('div');
		tabHost.id = TAB_HOST_ID;
		if (!header.classList.contains('socialTabContainer')) tabHost.classList.add('rcp-header-fallback');
		header.append(tabHost);

		const tabButton = document.createElement('button');
		tabButton.className = 'rcp-tab-button';
		tabButton.type = 'button';
		tabButton.setAttribute('role', 'tab');
		tabButton.setAttribute('aria-selected', 'false');
		tabButton.setAttribute('aria-controls', PANEL_HOST_ID);
		const tabLabel = document.createElement('span');
		tabLabel.className = 'tabLabel';
		tabLabel.textContent = 'Chats';
		tabButton.append(tabLabel);
		tabHost.append(tabButton);

		const panelHost = document.createElement('div');
		panelHost.id = PANEL_HOST_ID;
		panelHost.setAttribute('role', 'tabpanel');
		if (contentIsFallback) panelHost.classList.add('rcp-content-fallback');
		content.parentElement?.insertBefore(panelHost, content);

		const setOpen = (open: boolean) => {
			if (open) document.documentElement.setAttribute(OPEN_ATTRIBUTE, 'true');
			else document.documentElement.removeAttribute(OPEN_ATTRIBUTE);
			tabButton.classList.toggle('rcp-active', open);
			tabButton.setAttribute('aria-selected', String(open));
			console.info(LOG_PREFIX, open ? 'Opened Chats panel' : 'Closed Chats panel');
		};
		tabButton.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			setOpen(!document.documentElement.hasAttribute(OPEN_ATTRIBUTE));
		});

		const friendsTab = header.querySelector<HTMLElement>('.friendTab');
		const closeFromFriendsTab = () => setOpen(false);
		friendsTab?.addEventListener('click', closeFromFriendsTab);

		const root = createRoot(panelHost);
		root.render(<RecentChatsPanel document={document} popupWindow={context.window} />);
		mountedWindows.add({ document, root, tabHost, panelHost, closeFromFriendsTab, friendsTab });
		console.info(LOG_PREFIX, 'Attached to', context.m_strName, `using ${contentIsFallback ? 'fallback' : 'primary'} anchors`);
	} catch (error) {
		console.error(LOG_PREFIX, 'Could not attach to the Friends window.', error);
	} finally {
		attachingWindows.delete(context.window);
	}
}

function cleanup(): void {
	pluginActive = false;
	for (const mounted of mountedWindows) {
		mounted.document.documentElement.removeAttribute(OPEN_ATTRIBUTE);
		if (mounted.closeFromFriendsTab) mounted.friendsTab?.removeEventListener('click', mounted.closeFromFriendsTab);
		mounted.root.unmount();
		mounted.tabHost.remove();
		mounted.panelHost.remove();
		mounted.document.getElementById(STYLE_ID)?.remove();
	}
	mountedWindows.clear();
}

function SettingsContent() {
	return (
		<div style={{ padding: '12px 16px', lineHeight: 1.45 }}>
			<p>Adds a recent-conversations tab to Steam’s desktop Friends window.</p>
			<p>It reads Steam’s in-memory recent-chat store and never acknowledges, sends, deletes, or archives messages.</p>
		</div>
	);
}

export default definePlugin(() => {
	pluginActive = true;
	Millennium.AddWindowCreateHook?.((context) => void attachToFriendsWindow(context as PopupContext));

	return {
		title: 'Recent Chats',
		icon: <span aria-hidden="true">💬</span>,
		content: <SettingsContent />,
		onDismount: cleanup,
	};
});

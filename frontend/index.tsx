import { findModuleExport, getReactInstance, Millennium, modules, definePlugin } from '@steambrew/client';
import { createRoot, Root } from 'react-dom/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { openConversation } from './chat-actions';
import {
	applyPreviewLoadingTimeout,
	normalizeRecentChats,
	PendingPreviewTiming,
	RecentConversation,
	SteamRootStore,
} from './chat-adapter';
import { classifyFriendsWindow, FriendsWindowTarget } from './friends-window';
import {
	copyNativeTabClassName,
	createNativeTabActiveController,
	NativeTabActiveController,
} from './steam-class-logic';
import { FRIENDS_WINDOW_STYLES, THEMED_FALLBACK_STYLES } from './styles';

const LOG_PREFIX = '[Recent Chats]';
const TAB_HOST_ID = 'recent-chats-poc-tab-host';
const PANEL_HOST_ID = 'recent-chats-poc-panel-host';
const STYLE_ID = 'recent-chats-poc-styles';
const THEME_FALLBACK_STYLE_ID = 'recent-chats-poc-theme-fallback';
const OPEN_ATTRIBUTE = 'data-recent-chats-poc-open';
const DOCUMENT_RECONCILE_INTERVAL_MS = 500;
const STARTUP_RECONCILE_INTERVAL_MS = 50;
const STARTUP_RECONCILE_DURATION_MS = 5_000;
const CHAT_REFRESH_INTERVAL_MS = 2_000;
const PENDING_PREVIEW_REFRESH_INTERVAL_MS = 200;
const PENDING_PREVIEW_TIMEOUT_MS = 5_000;
const STORE_DISCOVERY_MAX_DELAY_MS = 30_000;

interface PopupContext {
	m_strName?: string;
	window?: Window;
	browser_info?: unknown;
}

interface MountedWindow {
	generation: number;
	popupWindow: Window;
	document: Document;
	root: Root;
	tabHost: HTMLElement;
	panelHost: HTMLElement;
	header: HTMLElement;
	closeFromNativeHeader: EventListener;
	nativeTabActive: NativeTabActiveController;
}

interface FriendsAnchors {
	document: Document;
	header: HTMLElement;
	content: HTMLElement;
	contentIsFallback: boolean;
}

const mountedWindows = new Map<Window, MountedWindow>();
const monitoringWindows = new WeakMap<Window, number>();
let pluginActive = true;
let lifecycleGeneration = 0;

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

function relativeTime(timestamp: number, now: number): string {
	if (timestamp <= 0) return '';
	const elapsed = Math.max(0, Math.floor(now / 1000) - timestamp);
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

function sameConversations(left: RecentConversation[], right: RecentConversation[]): boolean {
	if (left.length !== right.length) return false;
	return left.every((conversation, index) => {
		const other = right[index];
		return (
			conversation.id === other.id &&
			conversation.kind === other.kind &&
			conversation.name === other.name &&
			conversation.snippet === other.snippet &&
			conversation.previewState === other.previewState &&
			conversation.timestamp === other.timestamp &&
			conversation.unread === other.unread &&
			conversation.avatarUrl === other.avatarUrl &&
			conversation.accountId === other.accountId &&
			conversation.presence === other.presence &&
			conversation.awayOrSnooze === other.awayOrSnooze &&
			conversation.raw === other.raw
		);
	});
}

function getPopupMutationObserver(popupWindow: Window): typeof MutationObserver {
	return (popupWindow as Window & { MutationObserver?: typeof MutationObserver }).MutationObserver ?? MutationObserver;
}

function joinClasses(...classes: Array<string | false | null | undefined>): string {
	return classes.filter((className): className is string => Boolean(className)).join(' ');
}

function isActivationKey(key: string): boolean {
	return key === 'Enter' || key === ' ';
}

function ConversationAvatar({ conversation }: { conversation: RecentConversation }) {
	// Remember the failed URL so a newly fetched avatar URL still gets a retry.
	const [failedAvatarUrl, setFailedAvatarUrl] = useState<string>();
	const failed = !!conversation.avatarUrl && conversation.avatarUrl === failedAvatarUrl;

	return (
		<span className="rcp-avatar-holder avatarHolder">
			{!conversation.avatarUrl || failed ? (
				<span className="rcp-avatar-fallback">
					{conversation.name.slice(0, 1).toUpperCase()}
				</span>
			) : (
				<img
					className="rcp-avatar avatar"
					src={conversation.avatarUrl}
					alt=""
					draggable={false}
					onError={() => setFailedAvatarUrl(conversation.avatarUrl)}
				/>
			)}
		</span>
	);
}

interface RecentChatsAppProps {
	document: Document;
	popupWindow: Window;
	browserContext?: unknown;
}

function RecentChatsPanel({ document, popupWindow, browserContext }: RecentChatsAppProps) {
	const [query, setQuery] = useState('');
	const [store, setStore] = useState<SteamRootStore>();
	const [conversations, setConversations] = useState<RecentConversation[]>([]);
	const [error, setError] = useState<string>();
	const [isOpen, setIsOpen] = useState(() => document.documentElement.hasAttribute(OPEN_ATTRIBUTE));
	const [now, setNow] = useState(() => Date.now());
	const storeRef = useRef<SteamRootStore | undefined>(undefined);
	const pendingPreviewStartsRef = useRef(new Map<string, PendingPreviewTiming>());

	const refresh = useCallback((): { succeeded: boolean; hasPendingPreviews: boolean } => {
		try {
			const activeStore = storeRef.current ?? findSteamRootStore(document);
			if (!activeStore) {
				setError('Steam ChatStore not found on this build');
				return { succeeded: false, hasPendingPreviews: false };
			}

			storeRef.current = activeStore;
			setStore((current) => (current === activeStore ? current : activeStore));
			const nextConversations = applyPreviewLoadingTimeout(
				normalizeRecentChats(activeStore),
				pendingPreviewStartsRef.current,
				Date.now(),
				PENDING_PREVIEW_TIMEOUT_MS,
			);
			setConversations((current) => (sameConversations(current, nextConversations) ? current : nextConversations));
			setError(undefined);
			return {
				succeeded: true,
				hasPendingPreviews: nextConversations.some((conversation) => conversation.previewState === 'pending'),
			};
		} catch (refreshError) {
			console.error(LOG_PREFIX, 'Failed to read recent chats.', refreshError);
			setError('Steam returned an unexpected chat shape');
			return { succeeded: false, hasPendingPreviews: false };
		}
	}, [document]);

	useEffect(() => {
		const syncOpenState = () => setIsOpen(document.documentElement.hasAttribute(OPEN_ATTRIBUTE));
		const PopupMutationObserver = getPopupMutationObserver(popupWindow);
		const observer = new PopupMutationObserver(syncOpenState);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: [OPEN_ATTRIBUTE] });
		syncOpenState();
		return () => observer.disconnect();
	}, [document, popupWindow]);

	useEffect(() => {
		let cancelled = false;
		let timeout: number | undefined;
		let retryDelay = CHAT_REFRESH_INTERVAL_MS;

		const poll = () => {
			const result = refresh();
			if (cancelled) return;

			if (result.hasPendingPreviews) {
				retryDelay = CHAT_REFRESH_INTERVAL_MS;
				timeout = popupWindow.setTimeout(poll, PENDING_PREVIEW_REFRESH_INTERVAL_MS);
				return;
			}

			if (!result.succeeded) {
				timeout = popupWindow.setTimeout(poll, retryDelay);
				retryDelay = Math.min(retryDelay * 2, STORE_DISCOVERY_MAX_DELAY_MS);
				return;
			}

			// The first poll runs while Friends is still showing its native tab, which
			// prewarms Steam's lazy chat logs. Normal polling remains active only while
			// this panel is visible.
			if (isOpen) timeout = popupWindow.setTimeout(poll, CHAT_REFRESH_INTERVAL_MS);
		};

		poll();
		return () => {
			cancelled = true;
			if (timeout !== undefined) popupWindow.clearTimeout(timeout);
		};
	}, [isOpen, popupWindow, refresh]);

	useEffect(() => {
		if (!isOpen) return undefined;
		setNow(Date.now());
		const interval = popupWindow.setInterval(() => setNow(Date.now()), 60_000);
		return () => popupWindow.clearInterval(interval);
	}, [isOpen, popupWindow]);

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
		<div className="rcp-panel FriendsListContent">
			<div className="rcp-toolbar">
				<form className="rcp-search-form MemberListOptionsContainer" onSubmit={(event) => event.preventDefault()}>
					<div className="rcp-search-container inputContainer">
						<input
							className="rcp-search friendSearchInput"
							type="text"
							value={query}
							onChange={(event) => setQuery(event.currentTarget.value)}
							placeholder="Search recent chats"
							aria-label="Search recent chats"
						/>
						<button
							className="rcp-search-clear friendSearchClear"
							type="button"
							onClick={() => setQuery('')}
							disabled={!query}
							aria-label="Clear recent chat search"
						>
							<span aria-hidden="true">×</span>
						</button>
					</div>
				</form>
				<button
					className="rcp-refresh friendListButton"
					type="button"
					onClick={() => refresh()}
					title="Refresh recent chats"
				>
					↻
				</button>
			</div>
			{error && <div className="rcp-error-banner">Recent chats are temporarily unavailable. Try refreshing.</div>}
			<div className="rcp-list friendlistListContainer">
				<div className="rcp-list-content listContentContainer friendGroup">
					{filteredConversations.map((conversation) => (
						<div
							className={joinClasses('rcp-row-wrapper', conversation.unread > 0 && 'unreadFriend')}
							key={conversation.id}
						>
							<div
								className={joinClasses(
									'rcp-row',
									'friend',
									'friendStatusHover',
									conversation.kind === 'group'
										? 'rcp-group'
										: conversation.presence === 'unknown'
											? 'rcp-presence-unknown'
											: conversation.presence,
									conversation.kind === 'friend' && conversation.awayOrSnooze && 'awayOrSnooze',
								)}
								role="button"
								tabIndex={0}
								onClick={() => store && openConversation(store, conversation, popupWindow, browserContext)}
								onKeyDown={(event) => {
									if (!isActivationKey(event.key)) return;
									event.preventDefault();
									if (store) openConversation(store, conversation, popupWindow, browserContext);
								}}
							>
								<ConversationAvatar conversation={conversation} />
								<span className="rcp-copy">
									<span className="rcp-name">{conversation.name}</span>
									<span
										className="rcp-snippet status"
										aria-label={conversation.previewState === 'pending' ? 'Loading message preview' : undefined}
									>
										{conversation.previewState === 'pending' ? (
											<span className="rcp-snippet-skeleton" aria-hidden="true" />
										) : (
											<span className="rcp-snippet-text">{conversation.snippet}</span>
										)}
									</span>
								</span>
								<span className="rcp-meta">
									{conversation.timestamp > 0 && (
										<span className="rcp-time">{relativeTime(conversation.timestamp, now)}</span>
									)}
									{conversation.unread > 0 && (
										<span className="rcp-unread FriendMessageCount">{conversation.unread}</span>
									)}
								</span>
							</div>
						</div>
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
	// The injected panel wears these native classes too; never self-match.
	const primaryContent = root.querySelector<HTMLElement>('.FriendsListContent:not(.rcp-panel)');
	const fallbackContent = root.querySelector<HTMLElement>('.friendlistListContainer:not(.rcp-list)');
	const content = primaryContent ?? fallbackContent;

	if (!header || !content) return undefined;
	return { document, header, content, contentIsFallback: !primaryContent };
}

function waitForFriendsAnchors(
	document: Document,
	popupWindow: Window,
	timeoutMs: number,
): Promise<FriendsAnchors | undefined> {
	const initialAnchors = findFriendsAnchors(document);
	if (initialAnchors) return Promise.resolve(initialAnchors);

	return new Promise((resolve) => {
		let settled = false;
		let timeout: ReturnType<typeof setTimeout> | undefined;
		let observer: MutationObserver | undefined;

		const finish = (anchors: FriendsAnchors | undefined) => {
			if (settled) return;
			settled = true;
			observer?.disconnect();
			if (timeout !== undefined) clearTimeout(timeout);
			resolve(anchors);
		};

		try {
			const PopupMutationObserver = getPopupMutationObserver(popupWindow);
			observer = new PopupMutationObserver(() => {
				try {
					const anchors = findFriendsAnchors(document);
					if (anchors) finish(anchors);
				} catch {
					finish(undefined);
				}
			});
			observer.observe(document, { childList: true, subtree: true });
			timeout = setTimeout(() => finish(undefined), timeoutMs);

			// Close the small race between the first query and observer registration.
			const anchorsAfterObserve = findFriendsAnchors(document);
			if (anchorsAfterObserve) finish(anchorsAfterObserve);
		} catch {
			finish(undefined);
		}
	});
}

const THEMED_CLASS = 'rcp-themed';

// This per-document link distinguishes themed popups from Millennium's Quick
// CSS marker, which is also present with Steam's default theme.
function updateThemeDetection(document: Document): void {
	let themeLink: Element | null = null;
	try {
		themeLink = document.querySelector('link#millennium-injected');
	} catch {
		themeLink = null;
	}
	document.documentElement.classList.toggle(THEMED_CLASS, themeLink !== null);

	// The fallback sheet must precede the theme stylesheet so theme rules win by
	// source order; the main plugin sheet is appended after it and cannot do this.
	const fallback = document.getElementById(THEME_FALLBACK_STYLE_ID);
	if (!themeLink) {
		fallback?.remove();
		return;
	}
	if (fallback) return;
	const style = document.createElement('style');
	style.id = THEME_FALLBACK_STYLE_ID;
	style.textContent = THEMED_FALLBACK_STYLES;
	themeLink.before(style);
}

function removeOrphanedInjection(document: Document): void {
	document.documentElement.removeAttribute(OPEN_ATTRIBUTE);
	document.documentElement.classList.remove(THEMED_CLASS);
	document.getElementById(TAB_HOST_ID)?.remove();
	document.getElementById(PANEL_HOST_ID)?.remove();
	document.getElementById(STYLE_ID)?.remove();
	document.getElementById(THEME_FALLBACK_STYLE_ID)?.remove();
}

function applyTabClasses(tabHost: HTMLElement, nativeClassName: string | null | undefined): void {
	const copied = copyNativeTabClassName(nativeClassName);
	const hasNativeStyles = copied?.split(' ').includes('socialListTab') ?? false;
	const isHeaderFallback = tabHost.classList.contains('rcp-header-fallback');
	const isActive = tabHost.classList.contains('activeTab');
	tabHost.className = joinClasses(
		copied,
		'rcp-tab-button',
		!hasNativeStyles && 'rcp-fallback',
		isHeaderFallback && 'rcp-header-fallback',
		isActive && 'activeTab',
	);
}

function refreshFallbackTabClasses(mounted: MountedWindow): void {
	if (!mounted.tabHost.classList.contains('rcp-fallback')) return;
	const nativeTab = mounted.header.querySelector<HTMLElement>('.friendTab:not(.rcp-tab-button)');
	if (nativeTab) applyTabClasses(mounted.tabHost, nativeTab.className);
}

function mountFriendsDocument(
	popupWindow: Window,
	anchors: FriendsAnchors,
	generation: number,
	target: FriendsWindowTarget,
	browserContext?: unknown,
): MountedWindow {
	const { document, header, content, contentIsFallback } = anchors;
	const contentParent = content.parentElement;
	if (!contentParent) throw new Error('Friends content has no parent element');

	removeOrphanedInjection(document);
	ensureStyle(document);
	updateThemeDetection(document);

	// A wrapper would give the injected tab a different flex context from its sibling.
	const nativeTab = header.querySelector<HTMLElement>('.friendTab:not(.rcp-tab-button)');
	const tabHost = document.createElement('div');
	tabHost.id = TAB_HOST_ID;
	applyTabClasses(tabHost, nativeTab?.className);
	if (!header.classList.contains('socialTabContainer')) tabHost.classList.add('rcp-header-fallback');
	tabHost.setAttribute('role', 'tab');
	tabHost.tabIndex = 0;
	tabHost.setAttribute('aria-selected', 'false');
	tabHost.setAttribute('aria-controls', PANEL_HOST_ID);
	const tabLabel = document.createElement('span');
	tabLabel.className = 'tabLabel';
	tabLabel.textContent = 'Chats';
	tabHost.append(tabLabel);
	(nativeTab?.parentElement ?? header).append(tabHost);

	const panelHost = document.createElement('div');
	panelHost.id = PANEL_HOST_ID;
	panelHost.setAttribute('role', 'tabpanel');
	if (contentIsFallback) panelHost.classList.add('rcp-content-fallback');
	contentParent.insertBefore(panelHost, content);
	const nativeTabActive = createNativeTabActiveController(
		() => header.querySelector<HTMLElement>('.friendTab:not(.rcp-tab-button)')?.classList,
	);

	const setOpen = (open: boolean) => {
		const wasOpen = document.documentElement.hasAttribute(OPEN_ATTRIBUTE);
		if (open) document.documentElement.setAttribute(OPEN_ATTRIBUTE, 'true');
		else document.documentElement.removeAttribute(OPEN_ATTRIBUTE);
		if (open) nativeTabActive.suppress();
		else nativeTabActive.restore();
		tabHost.classList.toggle('activeTab', open);
		tabHost.setAttribute('aria-selected', String(open));
		if (wasOpen !== open) console.info(LOG_PREFIX, open ? 'Opened Chats panel' : 'Closed Chats panel');
	};

	tabHost.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		setOpen(!document.documentElement.hasAttribute(OPEN_ATTRIBUTE));
	});
	tabHost.addEventListener('keydown', (event) => {
		if (!isActivationKey(event.key)) return;
		event.preventDefault();
		event.stopPropagation();
		setOpen(!document.documentElement.hasAttribute(OPEN_ATTRIBUTE));
	});

	const closeFromNativeHeader: EventListener = (event) => {
		const target = event.target as Node | null;
		if (!target || tabHost.contains(target)) return;
		setOpen(false);
	};
	header.addEventListener('click', closeFromNativeHeader);

	const root = createRoot(panelHost);
	root.render(<RecentChatsPanel document={document} popupWindow={popupWindow} browserContext={browserContext} />);
	console.info(
		LOG_PREFIX,
		'Attached to',
		target.name,
		`(${target.kind}) using ${contentIsFallback ? 'fallback' : 'primary'} anchors`,
	);

	return {
		generation,
		popupWindow,
		document,
		root,
		tabHost,
		panelHost,
		header,
		closeFromNativeHeader,
		nativeTabActive,
	};
}

function cleanupStep(description: string, action: () => void): void {
	try {
		action();
	} catch (error) {
		console.warn(LOG_PREFIX, `Could not ${description}.`, error);
	}
}

function disposeMountedWindow(mounted: MountedWindow): void {
	cleanupStep('clear the open state', () => mounted.document.documentElement.removeAttribute(OPEN_ATTRIBUTE));
	cleanupStep('restore the native tab state', () => mounted.nativeTabActive.restore());
	cleanupStep('clear the theme marker', () => mounted.document.documentElement.classList.remove(THEMED_CLASS));
	cleanupStep('remove the native-header listener', () =>
		mounted.header.removeEventListener('click', mounted.closeFromNativeHeader),
	);
	cleanupStep('unmount the Chats panel', () => mounted.root.unmount());
	cleanupStep('remove the Chats tab', () => mounted.tabHost.remove());
	cleanupStep('remove the Chats panel host', () => mounted.panelHost.remove());
	cleanupStep('remove the Chats styles', () => mounted.document.getElementById(STYLE_ID)?.remove());
	cleanupStep('remove the themed fallback styles', () =>
		mounted.document.getElementById(THEME_FALLBACK_STYLE_ID)?.remove(),
	);
}

function currentPopupDocument(popupWindow: Window): Document | undefined {
	try {
		return popupWindow.document;
	} catch {
		return undefined;
	}
}

function popupIsClosed(popupWindow: Window): boolean {
	try {
		return popupWindow.closed;
	} catch {
		return true;
	}
}

function mountIsCurrent(mounted: MountedWindow, document: Document | undefined): boolean {
	try {
		return mounted.document === document && mounted.tabHost.isConnected && mounted.panelHost.isConnected;
	} catch {
		return false;
	}
}

async function monitorFriendsWindow(context: PopupContext, generation: number): Promise<void> {
	if (!pluginActive || !context.window) return;
	const target = classifyFriendsWindow(context.m_strName);
	if (!target) return;
	const popupWindow = context.window;
	if (monitoringWindows.get(popupWindow) === generation) return;
	monitoringWindows.set(popupWindow, generation);
	let fastReconcileUntil = Date.now() + STARTUP_RECONCILE_DURATION_MS;

	try {
		while (pluginActive && generation === lifecycleGeneration && !popupIsClosed(popupWindow)) {
			const document = currentPopupDocument(popupWindow);
			const mounted = mountedWindows.get(popupWindow);
			const reconcileInterval =
				Date.now() < fastReconcileUntil ? STARTUP_RECONCILE_INTERVAL_MS : DOCUMENT_RECONCILE_INTERVAL_MS;

			if (mounted && !mountIsCurrent(mounted, document)) {
				mountedWindows.delete(popupWindow);
				disposeMountedWindow(mounted);
				fastReconcileUntil = Date.now() + STARTUP_RECONCILE_DURATION_MS;
			}

			if (document && !mountedWindows.has(popupWindow)) {
				const anchors = await waitForFriendsAnchors(document, popupWindow, reconcileInterval);
				if (!pluginActive || generation !== lifecycleGeneration) break;
				let attachmentFailed = false;
				if (anchors && currentPopupDocument(popupWindow) === document && !mountedWindows.has(popupWindow)) {
					try {
						mountedWindows.set(
							popupWindow,
							mountFriendsDocument(popupWindow, anchors, generation, target, context.browser_info),
						);
					} catch (error) {
						attachmentFailed = true;
						console.error(LOG_PREFIX, 'Could not attach to the Friends window.', error);
					}
				}
				if (attachmentFailed) await delay(reconcileInterval);
				continue;
			}

			const activeMount = mountedWindows.get(popupWindow);
			if (activeMount) {
				refreshFallbackTabClasses(activeMount);
				updateThemeDetection(activeMount.document);
				if (activeMount.document.documentElement.hasAttribute(OPEN_ATTRIBUTE)) {
					activeMount.nativeTabActive.suppress();
				}
			}

			await delay(reconcileInterval);
		}
	} catch (error) {
		if (pluginActive && generation === lifecycleGeneration) {
			console.warn(LOG_PREFIX, 'Stopped monitoring the Friends window after it became unavailable.', error);
		}
	} finally {
		if (monitoringWindows.get(popupWindow) === generation) monitoringWindows.delete(popupWindow);
		const mounted = mountedWindows.get(popupWindow);
		if (mounted?.generation === generation) {
			mountedWindows.delete(popupWindow);
			disposeMountedWindow(mounted);
		}
	}
}

function cleanup(): void {
	pluginActive = false;
	lifecycleGeneration += 1;
	for (const mounted of mountedWindows.values()) disposeMountedWindow(mounted);
	mountedWindows.clear();
}

export default definePlugin(() => {
	pluginActive = true;
	const generation = ++lifecycleGeneration;
	Millennium.AddWindowCreateHook?.((context) => void monitorFriendsWindow(context as PopupContext, generation));

	return {
		title: 'Recent Chats',
		icon: <span aria-hidden="true">💬</span>,
		onDismount: cleanup,
	};
});

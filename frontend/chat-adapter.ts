export type UnknownRecord = Record<string, any>;

export interface SteamRootStore extends UnknownRecord {
	ChatStore: UnknownRecord & {
		GetRecentChats: () => unknown[];
	};
	AppInfoStore?: UnknownRecord;
	FriendStore?: UnknownRecord;
	UIStore?: UnknownRecord;
}

export type ConversationKind = 'friend' | 'group';

export interface RecentConversation {
	id: string;
	kind: ConversationKind;
	name: string;
	snippet: string;
	timestamp: number;
	unread: number;
	avatarUrl?: string;
	accountId?: number;
	raw: UnknownRecord;
}

function safely<T>(read: () => T, fallback: T): T {
	try {
		const value = read();
		return value ?? fallback;
	} catch {
		return fallback;
	}
}

function asFiniteNumber(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'bigint') return Number(value);
	if (typeof value === 'string') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function asTimestamp(value: unknown): number {
	const numericValue =
		Object.prototype.toString.call(value) === '[object Date]'
			? safely(() => (value as Date).getTime(), 0)
			: asFiniteNumber(value);
	if (numericValue <= 0) return 0;
	return Math.floor(numericValue > 10_000_000_000 ? numericValue / 1000 : numericValue);
}

function stringifyId(value: unknown): string {
	if (value === undefined || value === null) return '';
	return safely(() => String(value), '');
}

export function cleanSteamText(value: unknown): string {
	if (typeof value !== 'string') return '';

	return value
		.replace(/\[img\][\s\S]*?\[\/img\]/gi, 'Sent an image')
		.replace(/\[url(?:=[^\]]+)?\]([\s\S]*?)\[\/url\]/gi, '$1')
		.replace(/\[[^\]]+\]/g, '')
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

interface MessagePreviewContext {
	store?: SteamRootStore;
	isDirect?: boolean;
	isOutgoing?: boolean;
}

function tagAttributes(source: string): Record<string, string> {
	const attributes: Record<string, string> = {};
	const pattern = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/g;
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(source))) {
		attributes[match[1].toLocaleLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
	}

	return attributes;
}

function getAppName(store: SteamRootStore | undefined, appId: number): string {
	if (!appId) return '';
	const appInfo = safely(() => store?.AppInfoStore?.GetAppInfo?.(appId), undefined);
	return (
		safely(() => appInfo?.name, '') ||
		safely(() => appInfo?.strName, '') ||
		safely(() => appInfo?.GetName?.(), '') ||
		''
	);
}

function invitePreview(tagName: string, attributes: Record<string, string>, context: MessagePreviewContext): string {
	const appId = asFiniteNumber(attributes.appid ?? attributes.app_id);
	const appName = getAppName(context.store, appId);
	const forApp = appName ? ` for ${appName}` : '';
	const playApp = appName ? ` ${appName}` : '';
	const remotePlay = attributes.remoteplay === '1' || attributes.remoteplay?.toLocaleLowerCase() === 'true';

	if (tagName === 'playtestinvite') {
		if (context.isDirect === false) return `Steam Playtest invite${forApp}`;
		return context.isOutgoing ? `You sent a Steam Playtest invite${forApp}` : `Invited you to a Steam Playtest${playApp}`;
	}

	if (tagName === 'gameinvite' || tagName === 'lobbyinvite') {
		if (context.isDirect === false) return `${remotePlay ? 'Remote Play invite' : 'Game invite'}${forApp}`;
		if (context.isOutgoing) return `You sent a ${remotePlay ? 'Remote Play' : 'game'} invite${forApp}`;
		return remotePlay ? `Invited you to Remote Play${playApp}` : `Invited you to play${playApp}`;
	}

	return context.isOutgoing ? 'You sent a chat invite' : 'Sent you a chat invite';
}

export function steamMessagePreview(value: unknown, context: MessagePreviewContext = {}): string {
	if (typeof value !== 'string') return '';

	const invite = value.match(/\[(gameinvite|lobbyinvite|playtestinvite|invite)\b([^\]]*)\]/i);
	if (invite) return invitePreview(invite[1].toLocaleLowerCase(), tagAttributes(invite[2]), context);

	if (/\[tradeoffer\b/i.test(value)) {
		if (context.isDirect === false) return 'Trade offer';
		return context.isOutgoing ? 'You sent a trade offer' : 'Sent you a trade offer';
	}
	if (/\[broadcastinvite\b/i.test(value)) {
		if (context.isDirect === false) return 'Broadcast invite';
		return context.isOutgoing ? 'You sent a broadcast invite' : 'Invited you to watch a broadcast';
	}

	return cleanSteamText(value);
}

function latestLoadedMessage(chat: UnknownRecord): UnknownRecord | undefined {
	const messages = safely(() => chat.chat_messages, [] as UnknownRecord[]);
	if (!Array.isArray(messages) || messages.length === 0) return undefined;
	return messages[messages.length - 1];
}

function rawLastMessage(chat: UnknownRecord, loadedMessage: UnknownRecord | undefined): unknown {
	return safely(
		() => chat.GetLastMessage?.(),
		safely(() => chat.last_message, safely(() => loadedMessage?.strMessage ?? loadedMessage?.message, '')),
	);
}

function lastMessageTimestamp(chat: UnknownRecord, loadedMessage: UnknownRecord | undefined): number {
	return (
		asTimestamp(safely(() => chat.time_last_message, 0)) ||
		asTimestamp(safely(() => chat.last_message_time, 0)) ||
		asTimestamp(safely(() => loadedMessage?.rtTimestamp, 0)) ||
		asTimestamp(safely(() => loadedMessage?.rtTime, 0)) ||
		asTimestamp(safely(() => loadedMessage?.server_timestamp, 0)) ||
		asTimestamp(safely(() => loadedMessage?.timestamp, 0))
	);
}

function getDirectAccountId(chat: UnknownRecord): number {
	return asFiniteNumber(
		safely(
			() =>
				chat.accountid_partner ??
				chat.chat_partner?.accountid ??
				chat.chat_partner?.persona?.m_steamid?.GetAccountID?.(),
			0,
		),
	);
}

function isDirectChat(chat: UnknownRecord): boolean {
	return getDirectAccountId(chat) > 0 || typeof safely(() => chat.GetLastMessage, undefined) === 'function';
}

function directConversation(chat: UnknownRecord, store: SteamRootStore, selfAccountId: number): RecentConversation {
	const accountId = getDirectAccountId(chat);
	const friend = safely(() => chat.chat_partner, {} as UnknownRecord);
	const persona = safely(() => friend.persona, {} as UnknownRecord);
	const loadedMessage = latestLoadedMessage(chat);
	const senderAccountId = asFiniteNumber(
		safely(() => loadedMessage?.unAccountID ?? loadedMessage?.accountid_sender ?? chat.accountid_last_message, 0),
	);
	const lastMessage = rawLastMessage(chat, loadedMessage);

	return {
		id: `friend:${accountId || stringifyId(chat.unique_id)}`,
		kind: 'friend',
		name: safely(() => friend.display_name, '') || safely(() => persona.m_strPlayerName, '') || 'Unknown friend',
		snippet:
			steamMessagePreview(lastMessage, {
				store,
				isDirect: true,
				isOutgoing: senderAccountId > 0 && senderAccountId === selfAccountId,
			}) || 'No message preview',
		timestamp: lastMessageTimestamp(chat, loadedMessage),
		unread: Math.max(0, asFiniteNumber(safely(() => chat.unread_message_count, 0))),
		avatarUrl: safely(() => persona.avatar_url_medium, '') || safely(() => friend.avatar_url_medium, '') || undefined,
		accountId: accountId || undefined,
		raw: chat,
	};
}

function getGroupLastRoom(group: UnknownRecord): UnknownRecord {
	return safely(
		() => group.GetRoomWithLastMessageForUser?.() ?? group.room_with_last_message,
		{} as UnknownRecord,
	);
}

function getGroupUnread(group: UnknownRecord): number {
	const rooms = safely(() => group.chatRoomList, [] as UnknownRecord[]);
	const exactCount = Array.isArray(rooms)
		? rooms.reduce((total, room) => total + Math.max(0, asFiniteNumber(safely(() => room.unread_message_count, 0))), 0)
		: 0;

	if (exactCount > 0) return exactCount;
	return safely(() => (group.hasUnreadChatMessage ? 1 : 0), 0);
}

function groupConversation(group: UnknownRecord, store: SteamRootStore, selfAccountId: number): RecentConversation {
	const room = getGroupLastRoom(group);
	const loadedMessage = latestLoadedMessage(room);
	const senderAccountId = asFiniteNumber(
		safely(() => loadedMessage?.unAccountID ?? loadedMessage?.accountid_sender ?? room.accountid_last_message, 0),
	);
	const sender = senderAccountId ? safely(() => group.GetMember?.(senderAccountId), undefined) : undefined;
	const isOutgoing = senderAccountId > 0 && selfAccountId > 0 && senderAccountId === selfAccountId;
	const senderName = isOutgoing ? 'You' : safely(() => sender?.display_name, '');
	const message = steamMessagePreview(rawLastMessage(room, loadedMessage), {
		store,
		isDirect: false,
		isOutgoing,
	});
	const prefix = senderName && message ? `${senderName}: ` : '';
	const groupId = safely(() => group.GetGroupID?.(), group.chat_group_id ?? group.unique_id);

	return {
		id: `group:${stringifyId(groupId)}`,
		kind: 'group',
		name: safely(() => group.name, '') || 'Group chat',
		snippet: `${prefix}${message || 'No message preview'}`,
		timestamp: lastMessageTimestamp(room, loadedMessage) || asTimestamp(safely(() => group.time_last_activity, 0)),
		unread: getGroupUnread(group),
		avatarUrl: safely(() => group.avatar_url_medium, '') || undefined,
		raw: group,
	};
}

export function normalizeRecentChats(store: SteamRootStore): RecentConversation[] {
	const rawChats = safely(() => store.ChatStore.GetRecentChats(), [] as unknown[]);
	const selfAccountId = asFiniteNumber(safely(() => store.FriendStore?.self?.accountid, 0));

	if (!Array.isArray(rawChats)) return [];

	return rawChats
		.filter((chat): chat is UnknownRecord => Boolean(chat && typeof chat === 'object'))
		.map((chat) =>
			isDirectChat(chat) ? directConversation(chat, store, selfAccountId) : groupConversation(chat, store, selfAccountId),
		)
		.filter((chat) => chat.timestamp > 0 || chat.unread > 0)
		.sort((left, right) => right.timestamp - left.timestamp);
}

export function steamId64FromAccountId(accountId: number): string | undefined {
	if (!Number.isSafeInteger(accountId) || accountId <= 0) return undefined;
	return (76561197960265728n + BigInt(accountId)).toString();
}

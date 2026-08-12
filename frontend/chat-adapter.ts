export type UnknownRecord = Record<string, any>;

export interface SteamRootStore extends UnknownRecord {
	ChatStore: UnknownRecord & {
		GetRecentChats: () => unknown[];
	};
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

function directConversation(chat: UnknownRecord): RecentConversation {
	const accountId = getDirectAccountId(chat);
	const friend = safely(() => chat.chat_partner, {} as UnknownRecord);
	const persona = safely(() => friend.persona, {} as UnknownRecord);
	const lastMessage = safely(() => chat.GetLastMessage?.(), safely(() => chat.last_message, ''));

	return {
		id: `friend:${accountId || stringifyId(chat.unique_id)}`,
		kind: 'friend',
		name: safely(() => friend.display_name, '') || safely(() => persona.m_strPlayerName, '') || 'Unknown friend',
		snippet: cleanSteamText(lastMessage) || 'No message preview',
		timestamp: asFiniteNumber(safely(() => chat.time_last_message, 0)),
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

function groupConversation(group: UnknownRecord, selfAccountId: number): RecentConversation {
	const room = getGroupLastRoom(group);
	const senderAccountId = asFiniteNumber(safely(() => room.accountid_last_message, 0));
	const sender = senderAccountId ? safely(() => group.GetMember?.(senderAccountId), undefined) : undefined;
	const senderName = senderAccountId === selfAccountId ? 'You' : safely(() => sender?.display_name, '');
	const message = cleanSteamText(safely(() => room.GetLastMessage?.(), safely(() => room.last_message, '')));
	const prefix = senderName && message ? `${senderName}: ` : '';
	const groupId = safely(() => group.GetGroupID?.(), group.chat_group_id ?? group.unique_id);

	return {
		id: `group:${stringifyId(groupId)}`,
		kind: 'group',
		name: safely(() => group.name, '') || 'Group chat',
		snippet: `${prefix}${message || 'No message preview'}`,
		timestamp:
			asFiniteNumber(safely(() => room.time_last_message, 0)) ||
			asFiniteNumber(safely(() => group.time_last_activity, 0)),
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
		.map((chat) => (isDirectChat(chat) ? directConversation(chat) : groupConversation(chat, selfAccountId)))
		.filter((chat) => chat.timestamp > 0)
		.sort((left, right) => right.timestamp - left.timestamp);
}

export function steamId64FromAccountId(accountId: number): string | undefined {
	if (!Number.isSafeInteger(accountId) || accountId <= 0) return undefined;
	return (76561197960265728n + BigInt(accountId)).toString();
}

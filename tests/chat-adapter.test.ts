import { describe, expect, test } from 'bun:test';

import {
	applyPreviewLoadingTimeout,
	cleanSteamText,
	normalizeRecentChats,
	steamId64FromAccountId,
	SteamRootStore,
} from '../frontend/chat-adapter';

describe('chat adapter', () => {
	test('normalizes and sorts direct and group conversations', () => {
		const friend = {
			accountid_partner: 42,
			chat_partner: {
				display_name: 'Ada',
				persona: { avatar_url_medium: 'https://example.test/ada.jpg' },
			},
			GetLastMessage: () => 'Newest message',
			time_last_message: 200,
			unread_message_count: 2,
		};
		const room = {
			GetLastMessage: () => 'Older message',
			time_last_message: 100,
			accountid_last_message: 7,
			unread_message_count: 1,
		};
		const group = {
			name: 'Squad',
			GetGroupID: () => '123',
			GetRoomWithLastMessageForUser: () => room,
			GetMember: () => ({ display_name: 'Grace' }),
			chatRoomList: [room],
		};
		const store = {
			ChatStore: { GetRecentChats: () => [group, friend] },
			FriendStore: { self: { accountid: 99 } },
		} as SteamRootStore;

		expect(normalizeRecentChats(store)).toEqual([
			expect.objectContaining({ id: 'friend:42', name: 'Ada', unread: 2, timestamp: 200 }),
			expect.objectContaining({ id: 'group:123', name: 'Squad', snippet: 'Grace: Older message', unread: 1, timestamp: 100 }),
		]);
	});

	test('sanitizes Steam markup without rendering it', () => {
		expect(cleanSteamText('[b]hello[/b] <script>bad()</script>')).toBe('hello bad()');
		expect(cleanSteamText('[img]https://example.test/a.png[/img]')).toBe('Sent an image');
	});

	test('turns Steam game and lobby invites into useful previews', () => {
		const incomingInvite = {
			accountid_partner: 42,
			accountid_last_message: 42,
			chat_partner: { display_name: 'Ada', persona: {} },
			GetLastMessage: () => '[gameinvite appid="730" connect="+connect_lobby 123"][/gameinvite]',
			time_last_message: 300,
		};
		const outgoingInvite = {
			accountid_partner: 43,
			accountid_last_message: 99,
			chat_partner: { display_name: 'Grace', persona: {} },
			GetLastMessage: () => '[lobbyinvite appid=440 lobbyid=123][/lobbyinvite]',
			time_last_message: 200,
		};
		const store = {
			ChatStore: { GetRecentChats: () => [outgoingInvite, incomingInvite] },
			FriendStore: { self: { accountid: 99 } },
			AppInfoStore: {
				GetAppInfo: (appId: number) => ({ name: appId === 730 ? 'Counter-Strike 2' : 'Team Fortress 2' }),
			},
		} as SteamRootStore;

		expect(normalizeRecentChats(store)).toEqual([
			expect.objectContaining({ snippet: 'Invited you to play Counter-Strike 2' }),
			expect.objectContaining({ snippet: 'You sent a game invite for Team Fortress 2' }),
		]);
	});

	test('preserves app and sender context for group invite previews', () => {
		const incomingRoom = {
			GetLastMessage: () => '[gameinvite appid=730][/gameinvite]',
			time_last_message: 300,
			accountid_last_message: 7,
		};
		const outgoingRoom = {
			GetLastMessage: () => '[tradeoffer tradeofferid=123][/tradeoffer]',
			time_last_message: 200,
			accountid_last_message: 99,
		};
		const groups = [
			{
				name: 'Squad',
				GetGroupID: () => '1',
				GetRoomWithLastMessageForUser: () => incomingRoom,
				GetMember: () => ({ display_name: 'Grace' }),
			},
			{
				name: 'Trading',
				GetGroupID: () => '2',
				GetRoomWithLastMessageForUser: () => outgoingRoom,
			},
		];
		const store = {
			ChatStore: { GetRecentChats: () => groups },
			FriendStore: { self: { accountid: 99 } },
			AppInfoStore: { GetAppInfo: () => ({ name: 'Counter-Strike 2' }) },
		} as SteamRootStore;

		expect(normalizeRecentChats(store)).toEqual([
			expect.objectContaining({ snippet: 'Grace: Game invite for Counter-Strike 2' }),
			expect.objectContaining({ snippet: 'You: Trade offer' }),
		]);
	});

	test('does not infer You from missing sender IDs', () => {
		const room = { GetLastMessage: () => 'Unknown sender', time_last_message: 100 };
		const group = {
			name: 'Squad',
			GetGroupID: () => '1',
			GetRoomWithLastMessageForUser: () => room,
		};
		const store = {
			ChatStore: { GetRecentChats: () => [group] },
			FriendStore: {},
		} as SteamRootStore;

		expect(normalizeRecentChats(store)[0].snippet).toBe('Unknown sender');
	});

	test('keeps unread chats without a top-level timestamp and uses loaded-message time when available', () => {
		const withoutTimestamp = {
			accountid_partner: 42,
			chat_partner: { display_name: 'Ada', persona: {} },
			GetLastMessage: () => 'Unread message',
			unread_message_count: 1,
		};
		const withLoadedTimestamp = {
			accountid_partner: 43,
			chat_partner: { display_name: 'Grace', persona: {} },
			GetLastMessage: () => 'Loaded message',
			chat_messages: [{ strMessage: 'Loaded message', rtTimestamp: 250 }],
		};
		const store = {
			ChatStore: { GetRecentChats: () => [withoutTimestamp, withLoadedTimestamp] },
			FriendStore: { self: { accountid: 99 } },
		} as SteamRootStore;

		expect(normalizeRecentChats(store)).toEqual([
			expect.objectContaining({ name: 'Grace', timestamp: 250 }),
			expect.objectContaining({ name: 'Ada', timestamp: 0, unread: 1 }),
		]);
	});

	test('marks an empty cold-start preview with a known timestamp as pending', () => {
		let reads = 0;
		const chat = {
			accountid_partner: 42,
			chat_partner: { display_name: 'Ada', persona: {} },
			GetLastMessage: () => {
				reads += 1;
				return '';
			},
			time_last_message: 200,
		};
		const store = { ChatStore: { GetRecentChats: () => [chat] } } as SteamRootStore;

		expect(normalizeRecentChats(store)[0]).toEqual(
			expect.objectContaining({ snippet: '', previewState: 'pending', timestamp: 200 }),
		);
		expect(reads).toBe(1);
	});

	test('treats an empty preview without a timestamp as unavailable', () => {
		const chat = {
			accountid_partner: 42,
			chat_partner: { display_name: 'Ada', persona: {} },
			GetLastMessage: () => '',
			unread_message_count: 1,
		};
		const store = { ChatStore: { GetRecentChats: () => [chat] } } as SteamRootStore;

		expect(normalizeRecentChats(store)[0]).toEqual(
			expect.objectContaining({ snippet: 'No message preview', previewState: 'unavailable' }),
		);
	});

	test('bounds pending previews and clears their timer when Steam loads the message', () => {
		let message = '';
		const chat = {
			accountid_partner: 42,
			chat_partner: { display_name: 'Ada', persona: {} },
			GetLastMessage: () => message,
			time_last_message: 200,
		};
		const store = { ChatStore: { GetRecentChats: () => [chat] } } as SteamRootStore;
		const pendingTimings = new Map<string, { startedAt: number; timestamp: number }>();

		expect(applyPreviewLoadingTimeout(normalizeRecentChats(store), pendingTimings, 1_000, 5_000)[0].previewState).toBe(
			'pending',
		);
		expect(applyPreviewLoadingTimeout(normalizeRecentChats(store), pendingTimings, 5_999, 5_000)[0].previewState).toBe(
			'pending',
		);
		expect(applyPreviewLoadingTimeout(normalizeRecentChats(store), pendingTimings, 6_000, 5_000)[0]).toEqual(
			expect.objectContaining({ snippet: 'No message preview', previewState: 'unavailable' }),
		);

		chat.time_last_message = 300;
		expect(applyPreviewLoadingTimeout(normalizeRecentChats(store), pendingTimings, 6_100, 5_000)[0].previewState).toBe(
			'pending',
		);
		expect(pendingTimings.get('friend:42')).toEqual({ startedAt: 6_100, timestamp: 300 });

		message = 'Loaded message';
		expect(applyPreviewLoadingTimeout(normalizeRecentChats(store), pendingTimings, 6_200, 5_000)[0]).toEqual(
			expect.objectContaining({ snippet: 'Loaded message', previewState: 'ready' }),
		);
		expect(pendingTimings.size).toBe(0);
	});

	test('converts an account ID to an exact SteamID64 string', () => {
		expect(steamId64FromAccountId(42)).toBe('76561197960265770');
	});
});

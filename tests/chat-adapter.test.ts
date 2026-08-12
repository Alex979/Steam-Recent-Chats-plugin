import { describe, expect, test } from 'bun:test';

import {
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

	test('converts an account ID to an exact SteamID64 string', () => {
		expect(steamId64FromAccountId(42)).toBe('76561197960265770');
	});
});

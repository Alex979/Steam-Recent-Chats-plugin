import { describe, expect, test } from 'bun:test';

import { openConversation } from '../frontend/chat-actions';
import { RecentConversation, SteamRootStore } from '../frontend/chat-adapter';

function friendConversation(): RecentConversation {
	return {
		id: 'friend:42',
		kind: 'friend',
		name: 'Ada',
		snippet: 'Hello',
		previewState: 'ready',
		timestamp: 1,
		unread: 0,
		accountId: 42,
		raw: {},
	};
}

describe('chat actions', () => {
	test('opens a friend chat in the originating browser context', () => {
		const calls: unknown[][] = [];
		const browserContext = { m_unPID: 47128, m_nBrowserID: 37 };
		const store = {
			ChatStore: { GetRecentChats: () => [] },
			UIStore: { ShowFriendChatDialog: (...args: unknown[]) => calls.push(args) },
		} as SteamRootStore;
		const popupWindow = {
			SteamClient: {
				WebChat: { ShowFriendChatDialog: () => { throw new Error('fallback should not run'); } },
			},
		} as unknown as Window;

		openConversation(store, friendConversation(), popupWindow, browserContext);

		expect(calls).toEqual([[browserContext, 42]]);
	});

	test('falls back to the popup-scoped WebChat API without browser info', () => {
		const steamIds: string[] = [];
		const store = { ChatStore: { GetRecentChats: () => [] } } as SteamRootStore;
		const popupWindow = {
			SteamClient: { WebChat: { ShowFriendChatDialog: (steamId: string) => steamIds.push(steamId) } },
		} as unknown as Window;

		openConversation(store, friendConversation(), popupWindow);

		expect(steamIds).toEqual(['76561197960265770']);
	});

	test('opens a group chat in the originating browser context', () => {
		const calls: unknown[][] = [];
		const browserContext = { m_unPID: 47128, m_nBrowserID: 37 };
		const raw = { GetGroupID: () => 123, GetDefaultChatID: () => 456 };
		const conversation: RecentConversation = {
			id: 'group:123',
			kind: 'group',
			name: 'Squad',
			snippet: 'Hello',
			previewState: 'ready',
			timestamp: 1,
			unread: 0,
			raw,
		};
		const store = {
			ChatStore: { GetRecentChats: () => [] },
			UIStore: { ShowAndOrActivateChatRoomGroup: (...args: unknown[]) => calls.push(args) },
		} as SteamRootStore;

		openConversation(store, conversation, {} as Window, browserContext);

		expect(calls).toEqual([[browserContext, raw, true]]);
	});
});

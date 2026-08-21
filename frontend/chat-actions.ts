import { RecentConversation, SteamRootStore, steamId64FromAccountId } from './chat-adapter';

const LOG_PREFIX = '[Recent Chats]';

function getSteamClient(popupWindow: Window): any {
	try {
		return (popupWindow as Window & { SteamClient?: unknown }).SteamClient ?? (globalThis as any).SteamClient;
	} catch {
		return (globalThis as any).SteamClient;
	}
}

export function openConversation(
	store: SteamRootStore,
	conversation: RecentConversation,
	popupWindow: Window,
	browserContext?: unknown,
): void {
	const steamClient = getSteamClient(popupWindow);

	try {
		if (conversation.kind === 'friend' && conversation.accountId) {
			// UIStore's first argument selects the desktop or in-game browser
			// context. Prefer it so the chat opens beside the originating list.
			if (browserContext && typeof store.UIStore?.ShowFriendChatDialog === 'function') {
				store.UIStore.ShowFriendChatDialog(browserContext, conversation.accountId);
				return;
			}

			const steamId64 = steamId64FromAccountId(conversation.accountId);
			if (steamId64 && typeof steamClient?.WebChat?.ShowFriendChatDialog === 'function') {
				steamClient.WebChat.ShowFriendChatDialog(steamId64);
				return;
			}
		}

		if (conversation.kind === 'group') {
			if (browserContext && typeof store.UIStore?.ShowAndOrActivateChatRoomGroup === 'function') {
				store.UIStore.ShowAndOrActivateChatRoomGroup(browserContext, conversation.raw, true);
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

	console.warn(LOG_PREFIX, 'No compatible chat-opening method was found.', {
		id: conversation.id,
		kind: conversation.kind,
	});
}

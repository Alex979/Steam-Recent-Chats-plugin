import { describe, expect, test } from 'bun:test';

import {
	copyNativeTabClassName,
	isAvatarClassModule,
	isFriendsClassModule,
	isGamepadRecentChatsClassModule,
	isMiniProfilePersonaClassModule,
	isPersonaClassModule,
} from '../frontend/steam-class-logic';

const avatarFixture = {
	avatarHolder: 'nibodjvvrm86uCfnnAn4g',
	avatarStatus: '_3xUpb5DWXPFNcHHIcv-9pe',
	avatar: '_3h-QRJGxnVOIExtHD1R0f2',
	avatarFrameImg: '_3fM0F85j3aWVzr4RJM9-eu',
};

const personaFixture = {
	statusAndName: '_4ZTzGZ5TTgFyfw1DcXLXS',
	playerName: 'nOdcT-MoOaXGePXLyPe0H',
	richPresenceContainer: '_3sxE7F1LV2IcSX68YsH9dI',
	richPresenceLabel: '_2Ri005Wg_uXDTa71kdRbcN',
};

const friendsFixture = {
	LastMessage: '_2aS3Jemz6VGiLNz7gSXlK1',
	OfflineContainer: '_18bmBH7zyngCgHtgY3IEL_',
	FriendListContainerPanel: 'DTweUDZF7UEhll6ISmNG2',
	RecentChatIcon: '_1OKNG2o6mWU1qbgO-028X4',
};

const gamepadFixture = {
	RecentChatsList: '_3-PbkfKv5iI-_arCCwDSNK',
	RecentChatElement: '_356i2cRNfZnSGd79JSqaRr',
	UnreadCount: 'O8J-p7ynlL8hrnjHl8l_y',
	Time: '_3byyE0p-kKaYMsugunO-HP',
};

const miniProfileFixture = {
	miniProfile: '_2QPdq7GZ_03AD1ioPixVXW',
	playerAvatar: '_36eQg-jp1ebbdaE6PBniHu',
	personaName: 'qiP8aEgNz331tt6X4NMNW',
	personaNameLabel: '_2VUw8xyYCaD1WduLCK3nlW',
};

describe('Steam class mapping logic', () => {
	test('copies a native tab class list without active or search state classes', () => {
		expect(copyNativeTabClassName(' friendTab socialListTab activeTab TabSearchActive searchPending ')).toBe(
			'friendTab socialListTab',
		);
	});

	test('returns no copied classes when the sibling is absent or contains only state classes', () => {
		expect(copyNativeTabClassName(undefined)).toBeUndefined();
		expect(copyNativeTabClassName('activeTab TabSearchActive')).toBeUndefined();
	});

	test('matches the three desktop Friends class modules', () => {
		expect(isAvatarClassModule(avatarFixture)).toBe(true);
		expect(isPersonaClassModule(personaFixture)).toBe(true);
		expect(isFriendsClassModule(friendsFixture)).toBe(true);
	});

	test('rejects the Gamepad recent-chats module from desktop filters', () => {
		expect(isGamepadRecentChatsClassModule(gamepadFixture)).toBe(true);
		expect(isAvatarClassModule(gamepadFixture)).toBe(false);
		expect(isPersonaClassModule(gamepadFixture)).toBe(false);
		expect(isFriendsClassModule(gamepadFixture)).toBe(false);
	});

	test('rejects the mini-profile persona module from the row-persona filter', () => {
		expect(isMiniProfilePersonaClassModule(miniProfileFixture)).toBe(true);
		expect(isPersonaClassModule(miniProfileFixture)).toBe(false);
	});

	test('requires every identifying class to be a non-empty string', () => {
		expect(isAvatarClassModule({ ...avatarFixture, avatarFrameImg: '' })).toBe(false);
		expect(isPersonaClassModule({ ...personaFixture, playerName: undefined })).toBe(false);
		expect(isFriendsClassModule({ ...friendsFixture, RecentChatIcon: 42 })).toBe(false);
	});
});

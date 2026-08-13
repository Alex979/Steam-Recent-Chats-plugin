import { describe, expect, test } from 'bun:test';

import { classifyFriendsWindow } from '../frontend/friends-window';

describe('Friends window classification', () => {
	test('recognizes the desktop Friends popup', () => {
		expect(classifyFriendsWindow('friendslist_uid0')).toEqual({
			name: 'friendslist_uid0',
			kind: 'desktop',
			processId: 0,
		});
	});

	test('recognizes an in-game overlay Friends popup', () => {
		expect(classifyFriendsWindow('friendslist_uid47128')).toEqual({
			name: 'friendslist_uid47128',
			kind: 'overlay',
			processId: 47128,
		});
	});

	test('rejects unrelated and malformed popup names', () => {
		expect(classifyFriendsWindow('desktopoverlay_uid47128')).toBeUndefined();
		expect(classifyFriendsWindow('contextmenu_4_uid0')).toBeUndefined();
		expect(classifyFriendsWindow('friendslist_uid47128_extra')).toBeUndefined();
		expect(classifyFriendsWindow('friendslist_uid-1')).toBeUndefined();
		expect(classifyFriendsWindow(undefined)).toBeUndefined();
	});
});

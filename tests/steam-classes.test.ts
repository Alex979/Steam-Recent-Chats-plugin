import { describe, expect, test } from 'bun:test';

import { copyNativeTabClassName } from '../frontend/steam-class-logic';

describe('Steam class mapping logic', () => {
	test('copies a native tab class list without active or search state classes', () => {
		expect(
			copyNativeTabClassName(
				' friendTab  socialListTab activeTab TabSearchActive searchPending themeTab socialListTab ',
			),
		).toBe('friendTab socialListTab themeTab');
	});

	test('returns no copied classes when the sibling is absent or contains only state classes', () => {
		expect(copyNativeTabClassName(undefined)).toBeUndefined();
		expect(copyNativeTabClassName(null)).toBeUndefined();
		expect(copyNativeTabClassName('   ')).toBeUndefined();
		expect(copyNativeTabClassName('activeTab TabSearchActive')).toBeUndefined();
	});
});

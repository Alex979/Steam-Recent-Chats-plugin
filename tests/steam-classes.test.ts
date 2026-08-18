import { describe, expect, test } from 'bun:test';

import { copyNativeTabClassName } from '../frontend/steam-class-logic';

describe('Steam class mapping logic', () => {
	test('copies a native tab class list without the known state classes', () => {
		expect(copyNativeTabClassName(' friendTab  socialListTab activeTab TabSearchActive themeTab socialListTab ')).toBe(
			'friendTab socialListTab themeTab',
		);
	});

	test('keeps theme tokens that merely contain a search-like substring', () => {
		expect(copyNativeTabClassName('friendTab socialListTab xSearchy_ab12')).toBe(
			'friendTab socialListTab xSearchy_ab12',
		);
	});

	test('returns no copied classes when the sibling is absent or contains only state classes', () => {
		expect(copyNativeTabClassName(undefined)).toBeUndefined();
		expect(copyNativeTabClassName(null)).toBeUndefined();
		expect(copyNativeTabClassName('   ')).toBeUndefined();
		expect(copyNativeTabClassName('activeTab TabSearchActive')).toBeUndefined();
	});
});

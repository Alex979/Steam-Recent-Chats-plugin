// Steam's Friends tab assembles exactly `friendTab socialListTab activeTab`,
// plus `TabSearchActive` while the header search is open. Strip only these
// known state tokens so theme-added classes survive the copy verbatim.
const NATIVE_TAB_STATE_CLASSES = new Set(['activeTab', 'TabSearchActive', 'SearchActive']);

export function copyNativeTabClassName(className: string | null | undefined): string | undefined {
	if (!className) return undefined;

	const baseClasses = [...new Set(className.split(/\s+/))].filter(
		(classToken) => classToken && !NATIVE_TAB_STATE_CLASSES.has(classToken),
	);
	return baseClasses.length > 0 ? baseClasses.join(' ') : undefined;
}

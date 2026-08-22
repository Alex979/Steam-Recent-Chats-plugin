import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createReleaseArchive, readReleaseVersion, RELEASE_FILES, verifyReleaseArchive } from '../scripts/release';

const temporaryDirectories: string[] = [];

async function createFixture(pluginVersion = '0.3.0', packageVersion = pluginVersion): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'recent-chats-release-test-'));
	temporaryDirectories.push(root);
	await mkdir(join(root, '.millennium', 'Dist'), { recursive: true });
	await writeFile(join(root, 'package.json'), JSON.stringify({ version: packageVersion }));
	await writeFile(join(root, 'plugin.json'), JSON.stringify({ version: pluginVersion }));
	await writeFile(join(root, '.millennium', 'Dist', 'index.js'), 'plugin bundle');
	await writeFile(join(root, 'README.md'), 'readme');
	await writeFile(join(root, 'LICENSE'), 'license');
	return root;
}

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('release packaging', () => {
	test('requires synchronized manifest versions', async () => {
		const root = await createFixture('0.3.0', '0.3.1');
		await expect(readReleaseVersion(root)).rejects.toThrow('versions differ');
	});

	test('creates the exact release layout', async () => {
		const root = await createFixture();
		expect(await readReleaseVersion(root)).toBe('0.3.0');

		const archive = await createReleaseArchive(root);
		const paths = await verifyReleaseArchive(archive);
		expect(paths).toEqual(RELEASE_FILES.map((file) => file.archivePath).sort());
		const { unzipSync } = await import('fflate');
		expect(new TextDecoder().decode(unzipSync(archive)['recent-chats/.millennium/Dist/index.js'])).toBe(
			'plugin bundle',
		);
	});
});

describe('checked-in manifests', () => {
	test('keep package.json and plugin.json synchronized', async () => {
		const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
		await expect(readReleaseVersion(repositoryRoot)).resolves.toBeDefined();
	});
});

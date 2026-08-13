import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SAFE_VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z.+-]*$/;

export const RELEASE_FILES = [
	{
		source: '.millennium/Dist/index.js',
		archivePath: 'recent-chats/.millennium/Dist/index.js',
	},
	{ source: 'plugin.json', archivePath: 'recent-chats/plugin.json' },
	{ source: 'README.md', archivePath: 'recent-chats/README.md' },
	{ source: 'LICENSE', archivePath: 'recent-chats/LICENSE' },
] as const;

interface Manifest {
	version?: unknown;
}

async function readManifestVersion(path: string): Promise<string> {
	const manifest = JSON.parse(await readFile(path, 'utf8')) as Manifest;
	if (typeof manifest.version !== 'string' || !manifest.version) {
		throw new Error(`${path} does not contain a string version`);
	}
	return manifest.version;
}

export async function readReleaseVersion(repositoryRoot: string): Promise<string> {
	const pluginVersion = await readManifestVersion(join(repositoryRoot, 'plugin.json'));
	const packageVersion = await readManifestVersion(join(repositoryRoot, 'package.json'));

	if (pluginVersion !== packageVersion) {
		throw new Error(`package.json (${packageVersion}) and plugin.json (${pluginVersion}) versions differ`);
	}
	if (!SAFE_VERSION_PATTERN.test(pluginVersion)) {
		throw new Error(`Version ${JSON.stringify(pluginVersion)} is not safe to use in a release filename`);
	}

	return pluginVersion;
}

export async function createReleaseArchive(repositoryRoot: string): Promise<Uint8Array> {
	const { zipSync } = await import('fflate');
	const entries: Record<string, Uint8Array> = {};
	for (const file of RELEASE_FILES) {
		entries[file.archivePath] = await readFile(join(repositoryRoot, ...file.source.split('/')));
	}
	return zipSync(entries, { level: 9 });
}

export async function verifyReleaseArchive(archive: Uint8Array): Promise<string[]> {
	const { unzipSync } = await import('fflate');
	const actualPaths = Object.keys(unzipSync(archive)).sort();
	const expectedPaths = RELEASE_FILES.map((file) => file.archivePath).sort();

	if (actualPaths.length !== expectedPaths.length || actualPaths.some((path, index) => path !== expectedPaths[index])) {
		throw new Error(
			`Release archive layout differs from expected:\nExpected: ${expectedPaths.join(', ')}\nActual: ${actualPaths.join(', ')}`,
		);
	}

	return actualPaths;
}

async function runBun(label: string, args: string[]): Promise<void> {
	console.log(`\n> ${label}`);
	const subprocess = Bun.spawn([process.execPath, ...args], {
		cwd: REPOSITORY_ROOT,
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
	});
	const exitCode = await subprocess.exited;
	if (exitCode !== 0) throw new Error(`${label} failed with exit code ${exitCode}`);
}

async function main(): Promise<void> {
	const version = await readReleaseVersion(REPOSITORY_ROOT);
	const outputPath = join(REPOSITORY_ROOT, `recent-chats-${version}.zip`);
	if (existsSync(outputPath)) throw new Error(`${outputPath} already exists`);

	console.log(`Building Recent Chats ${version}`);
	await runBun('Installing locked dependencies', ['ci']);
	await runBun('Typechecking', ['run', 'typecheck']);
	await runBun('Running tests', ['test']);
	await runBun('Building production bundle', ['run', 'build']);

	const archive = await createReleaseArchive(REPOSITORY_ROOT);
	const paths = await verifyReleaseArchive(archive);
	await writeFile(outputPath, archive, { flag: 'wx' });

	console.log(`\nCreated ${outputPath}`);
	for (const path of paths) console.log(path);
}

if (import.meta.main) {
	await main();
}

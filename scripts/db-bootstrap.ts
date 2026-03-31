import { readFile } from 'node:fs/promises';
import { Surreal } from 'surrealdb';

const SURREAL_URL = requiredEnv('SURREAL_URL');
const SURREAL_USER = requiredEnv('SURREAL_USER');
const SURREAL_PASS = requiredEnv('SURREAL_PASS');
const SURREAL_NS = requiredIdentifierEnv('SURREAL_NS');
const SURREAL_DB = requiredIdentifierEnv('SURREAL_DB');

async function main() {
	const admin = new Surreal();
	await admin.connect(SURREAL_URL, {
		authentication: {
			username: SURREAL_USER,
			password: SURREAL_PASS
		}
	});

	await strictQuery(admin, `DEFINE NAMESPACE ${SURREAL_NS};`, 'define_namespace', {
		ignoreAlreadyExists: true
	});
	await admin.close();

	const namespaced = new Surreal();
	await namespaced.connect(SURREAL_URL, {
		authentication: {
			username: SURREAL_USER,
			password: SURREAL_PASS
		},
		namespace: SURREAL_NS
	});
	await strictQuery(namespaced, `DEFINE DATABASE ${SURREAL_DB};`, 'define_database', {
		ignoreAlreadyExists: true
	});
	await namespaced.close();

	const scoped = new Surreal();
	await scoped.connect(SURREAL_URL, {
		authentication: {
			username: SURREAL_USER,
			password: SURREAL_PASS
		},
		namespace: SURREAL_NS,
		database: SURREAL_DB
	});

	const initScriptPath = new URL('../surreal/init.surql', import.meta.url);
	const initScript = await readFile(initScriptPath, 'utf8');
	const schemaOnlyScript = initScript
		.split(/\r?\n/)
		.filter((line) => !/^\s*DEFINE\s+(NAMESPACE|DATABASE)\s+/i.test(line))
		.join('\n');

	await strictQuery(scoped, schemaOnlyScript, 'apply_init_schema', {
		ignoreAlreadyExists: true
	});
	await strictQuery(scoped, 'INFO FOR DB;', 'verify_db_scope');
	await scoped.close();

	console.log(`DB bootstrap complete for ${SURREAL_NS}/${SURREAL_DB}`);
}

function requiredEnv(key: string): string {
	const value = process.env[key]?.trim();
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

function requiredIdentifierEnv(key: string): string {
	const value = requiredEnv(key);
	if (!/^[a-z_][a-z0-9_]*$/i.test(value)) {
		throw new Error(`Invalid ${key}. Only letters, numbers, and underscore are allowed.`);
	}
	return value;
}

async function strictQuery(
	client: Surreal,
	sql: string,
	operation: string,
	options?: { ignoreAlreadyExists?: boolean }
) {
	let result: unknown;
	try {
		result = await client.query(sql);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		if (options?.ignoreAlreadyExists && /already exists/i.test(message)) {
			return;
		}
		throw new Error(`Bootstrap failed (${operation}): ${message}`);
	}

	if (!Array.isArray(result)) {
		return;
	}

	for (const [index, statement] of result.entries()) {
		if (!statement || typeof statement !== 'object') {
			continue;
		}
		const status = (statement as { status?: unknown }).status;
		if (status === 'ERR') {
			const detail = (statement as { result?: unknown }).result;
			const detailText = typeof detail === 'string' ? detail : JSON.stringify(detail);
			if (options?.ignoreAlreadyExists && /already exists/i.test(detailText)) {
				continue;
			}
			throw new Error(`Bootstrap failed (${operation}) at statement ${index + 1}: ${detailText}`);
		}
	}
}

main().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
});

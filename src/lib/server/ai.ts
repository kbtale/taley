import { OPENROUTER_API_KEY, APP_URL, APP_NAME } from '$env/static/private';
import type { ZodType } from 'zod';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const TALey_CORE_RULES = `
# Taley Storyboard Rules
The info in this file is meant to be handled in ENGLISH.

1. Any element on the board must have: id, name, category, and payload.
2. CATEGORIES: 'Character', 'Collective', 'Location', 'Event', 'Artifact', 'Concept', 'Phenomenon', 'Unknown'.
3. CHARACTERS: Must include identity (name, age, species, gender), appearance (desc, clothes, mods), psychology (mbti, enneagram, big5, alignment), biography, and dynamic_attributes.
6. Big 5 scores MUST be integers from 1 to 100.
7. dynamic_attributes must be a flat array of strings (tags).

RESPONSE FORMATS:
- Format 1 (Seed): List of Nodes and Connections.
- Format 2 (Impact): List of affected Categories and Attributes with mutation instructions.
- Format 3 (Mutation): Nodes to create, Nodes to update, Connections to create, and IDs to delete.
`;

const JSON_RESPONSE_RULES = `
JSON FORMAT RULES:
- Return a JSON object at the root.
- Do not wrap inside other containers.
`;

export async function requestTaleyAI<T>(options: {
	schema: ZodType<T>;
	prompt: string;
	model?: string;
	maxTokens?: number;
	retries?: number;
}): Promise<T> {
	const {
		schema,
		prompt,
		model = 'google/gemini-3.1-flash-lite-preview',
		maxTokens = 8000,
		retries = 3
	} = options;

	const body = JSON.stringify({
		model,
		messages: [
			{ role: 'system', content: `${TALey_CORE_RULES}\n${JSON_RESPONSE_RULES}\nReturn ONLY a JSON object.` },
			{ role: 'user', content: prompt }
		],
		max_tokens: maxTokens,
		response_format: { type: 'json_object' }
	});

	let attempt = 0;
	while (attempt <= retries) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 45000);

		try {
			const response = await fetch(OPENROUTER_URL, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
					'HTTP-Referer': APP_URL,
					'X-Title': APP_NAME,
					'Content-Type': 'application/json'
				},
				body,
				signal: controller.signal
			});

			if (!response.ok) {
				if (response.status === 429 || response.status >= 500) {
					attempt++;
					const delay = Math.pow(2, attempt) * 1000;
					await new Promise((res) => setTimeout(res, delay));
					continue;
				}
				throw new Error(`OpenRouter error ${response.status}: ${await response.text()}`);
			}

			const data = await response.json();
			const content = data.choices?.[0]?.message?.content;
			if (!content) throw new Error('Empty AI response');

			const parsed = JSON.parse(content);
			return schema.parse(parsed);

		} catch (error: unknown) {
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('Request timeout', { cause: error });
			}
			if (attempt >= retries) throw error;
			attempt++;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	throw new Error('Max retries reached');
}

export async function requestTaleyAIMarkdown(options: {
	prompt: string;
	model?: string;
	maxTokens?: number;
	retries?: number;
	formatInstruction?: string;
}): Promise<string> {
	const {
		prompt,
		model = 'google/gemini-3.1-flash-lite-preview',
		maxTokens = 8000,
		retries = 3,
		formatInstruction = 'Return ONLY markdown with strict section headings and fenced code blocks.'
	} = options;

	const body = JSON.stringify({
		model,
		messages: [
			{ role: 'system', content: `${TALey_CORE_RULES}\n${formatInstruction}` },
			{ role: 'user', content: prompt }
		],
		max_tokens: maxTokens
	});

	let attempt = 0;
	while (attempt <= retries) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 45000);

		try {
			const response = await fetch(OPENROUTER_URL, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
					'HTTP-Referer': APP_URL,
					'X-Title': APP_NAME,
					'Content-Type': 'application/json'
				},
				body,
				signal: controller.signal
			});

			if (!response.ok) {
				if (response.status === 429 || response.status >= 500) {
					attempt++;
					const delay = Math.pow(2, attempt) * 1000;
					await new Promise((res) => setTimeout(res, delay));
					continue;
				}
				throw new Error(`OpenRouter error ${response.status}: ${await response.text()}`);
			}

			const data = await response.json();
			const content = data.choices?.[0]?.message?.content;
			if (!content) throw new Error('Empty AI response');

			return String(content);
		} catch (error: unknown) {
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('Request timeout', { cause: error });
			}
			if (attempt >= retries) throw error;
			attempt++;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	throw new Error('Max retries reached');
}

import { seedResponseSchema, type SeedResponse } from '../schemas/seed.js';

export async function generateUniverseSeed(options: { 
	premise: string; 
	complexity: 'low' | 'medium' | 'high' 
}): Promise<SeedResponse> {
	const { premise, complexity } = options;
	
	const nodeLimits = { low: 10, medium: 25, high: 50 };
	const limit = nodeLimits[complexity];

	const prompt = `
		Generate a JSON object following Format 1 (Seed) based on the premise: "${premise}".
		Structure:
		- "universe": { name, seed_premise, constraints }
		- "nodes": Exactly ${limit} entries. Each node requires [id, name, category, description, payload]. The payload must include [dynamic_attributes]. Characters require [biography, identity, appearance, psychology].
		- "edges": Connections using generated node IDs. Each edge requires [source, target].
	`;

	return await requestTaleyAI({
		schema: seedResponseSchema,
		prompt,
		model: 'google/gemini-3.1-flash-lite-preview'
	});
}

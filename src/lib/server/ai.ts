import { OPENROUTER_API_KEY, APP_URL, APP_NAME } from '$env/static/private';
import type { ZodType } from 'zod';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_RULES = `
# Taley Storyboard Rules
The info in this file is meant to be handled in ENGLISH.

1. Any element on the board must have: id, name, category, and payload.
2. CATEGORIES: 'Biological Entity', 'Collective', 'Location', 'Event', 'Artifact', 'Concept', 'Phenomenon'.
3. BIOLOGICAL ENTITIES: Must include identity (name, age, species, gender), appearance (desc, clothes, mods), psychology (mbti, enneagram, big5, alignment), biography, and dynamic_attributes.
6. JSON: Strictly follow numeric types. Big 5 scores MUST be integers. dynamic_attributes MUST be a FLAT ARRAY of strings (tags).
7. ROOT: Return the object structure DIRECTLY at the root. Do not nest under 'biological_entity'.
8. EXAMPLE STRUCTURE:
{
  "identity": { "name": "...", "age": 30, "species": "...", "gender": "..." },
  "appearance": { "description": "...", "clothing": "...", "modifications": "..." },
  "psychology": { "mbti": "...", "enneagram": "...", "big5": { "openness": 50, "conscientiousness": 50, "extraversion": 50, "agreeableness": 50, "neuroticism": 50 }, "moral_alignment": "..." },
  "biography": "...",
  "dynamic_attributes": ["tag1", "tag2"]
}

RESPONSE FORMATS:
- Format 1 (Seed): List of Nodes and Connections.
- Format 2 (Impact): List of affected Categories and Attributes with mutation instructions.
- Format 3 (Mutation): Nodes to create, Nodes to update, Connections to create, and IDs to delete.
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
			{ role: 'system', content: SYSTEM_RULES + '\nReturn ONLY a JSON object.' },
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

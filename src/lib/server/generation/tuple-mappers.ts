import type { Node } from '$lib/schemas/node.js';
import type {
	CharacterNodeTuple,
	EnvironmentCategory,
	EnvironmentNodeTuple,
	UniverseMetadataTuple
} from '$lib/schemas/generation.js';
import { buildNodeId, buildUniverseId } from './generation-ids.js';

export function mapUniverseTupleToMetadata(tuple: UniverseMetadataTuple) {
	const [name, seedPremise, constraints] = tuple;
	const id = buildUniverseId(name, seedPremise);
	return {
		id,
		name,
		seed_premise: seedPremise,
		constraints
	};
}

export function mapEnvironmentTupleToNode(
	tuple: EnvironmentNodeTuple,
	category: EnvironmentCategory,
	index: number
): Node {
	const [name, description, dynamicAttributes] = tuple;
	const id = buildNodeId(category.toLowerCase(), name, index);
	return {
		id,
		name,
		category,
		description,
		payload: {
			description,
			dynamic_attributes: dynamicAttributes
		}
	};
}

export function mapCharacterTupleToNode(tuple: CharacterNodeTuple, index: number): Node {
	const [
		name,
		description,
		identityName,
		age,
		species,
		gender,
		appearanceDescription,
		clothing,
		modifications,
		mbti,
		enneagram,
		openness,
		conscientiousness,
		extraversion,
		agreeableness,
		neuroticism,
		moralAlignment,
		biography,
		dynamicAttributes
	] = tuple;

	const id = buildNodeId('character', name, index);

	return {
		id,
		name,
		category: 'Character',
		description,
		payload: {
			identity: {
				name: identityName,
				age,
				species,
				gender
			},
			appearance: {
				description: appearanceDescription,
				clothing,
				modifications
			},
			psychology: {
				mbti,
				enneagram,
				big5: {
					openness,
					conscientiousness,
					extraversion,
					agreeableness,
					neuroticism
				},
				moral_alignment: moralAlignment
			},
			biography,
			dynamic_attributes: dynamicAttributes
		}
	};
}

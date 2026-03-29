export type ViewMode = 'genesis' | 'architect' | 'mutation';

export interface Universe {
    id: string;
    title: string;
    premise: string;
    constraints: string[];
}

export type EventType = 'node_added' | 'mutation' | 'discovery';

export interface AppEvent {
    id: string;
    type: EventType;
    message: string;
    timestamp: number;
}

export type NodeCategory = 'biological' | 'location' | 'artifact' | 'generic';

export interface AppNode {
    id: string;
    name: string;
    category: NodeCategory;
    description: string;
    payload?: Record<string, unknown>;
}

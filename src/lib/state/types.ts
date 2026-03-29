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
    name: string;
    message: string;
    timestamp: number;
}

export type NodeCategory = 'biological' | 'location' | 'artifact' | 'generic';

export interface AppNode {
    id: string;
    name: string;
    category: NodeCategory;
    description: string;
    position: { x: number; y: number };
    payload?: Record<string, unknown>;
}

export interface AppEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
}

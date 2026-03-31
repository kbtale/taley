-- Define system location
DEFINE NAMESPACE taley;
DEFINE DATABASE taley;

-- Root universe storage
DEFINE TABLE universe SCHEMAFULL;
DEFINE FIELD name ON TABLE universe TYPE string;
DEFINE FIELD seed_premise ON TABLE universe TYPE string;
DEFINE FIELD constraints ON TABLE universe TYPE array<string>;
DEFINE FIELD created_at ON TABLE universe TYPE datetime DEFAULT time::now();

-- Storyboard nodes
DEFINE TABLE node SCHEMALESS;
DEFINE FIELD universe ON TABLE node TYPE record<universe>;
DEFINE FIELD name ON TABLE node TYPE string;
DEFINE FIELD category ON TABLE node TYPE string 
    ASSERT $value INSIDE [
        'Character', 
        'Collective', 
        'Location', 
        'Event', 
        'Artifact', 
        'Concept', 
        'Phenomenon',
        'Unknown'
    ];

DEFINE INDEX idx_node_universe ON TABLE node FIELDS universe;
DEFINE INDEX idx_node_cat_name ON TABLE node FIELDS universe, category, name;
DEFINE INDEX idx_node_attributes ON TABLE node FIELDS payload.dynamic_attributes;

-- Relational connections
DEFINE TABLE linked_to SCHEMAFULL TYPE RELATION IN node OUT node;
DEFINE FIELD universe ON TABLE linked_to TYPE record<universe>;
DEFINE FIELD visual_nature ON TABLE linked_to TYPE string 
    ASSERT $value INSIDE [
        'Positive', 
        'Negative', 
        'Hierarchical', 
        'Neutral', 
        'Belonging'
    ];
DEFINE FIELD relational_context ON TABLE linked_to TYPE string;

DEFINE INDEX idx_edge_universe ON TABLE linked_to FIELDS universe;
DEFINE INDEX idx_linked_in_out ON TABLE linked_to FIELDS universe, in, out;

-- Define system location
DEFINE NAMESPACE taley;
DEFINE DATABASE taley;

-- Root universe storage
DEFINE TABLE universe SCHEMAFULL;
DEFINE FIELD title ON TABLE universe TYPE string;
DEFINE FIELD seed_premise ON TABLE universe TYPE string;
DEFINE FIELD created_at ON TABLE universe TYPE datetime DEFAULT time::now();

-- Storyboard nodes
DEFINE TABLE node SCHEMALESS;
DEFINE FIELD name ON TABLE node TYPE string;
DEFINE FIELD category ON TABLE node TYPE string 
    ASSERT $value INSIDE [
        'Biological Entity', 
        'Collective', 
        'Location', 
        'Event', 
        'Artifact', 
        'Concept', 
        'Phenomenon'
    ];

-- Relational connections
DEFINE TABLE linked_to SCHEMAFULL TYPE RELATION IN node OUT node;
DEFINE FIELD visual_nature ON TABLE linked_to TYPE string 
    ASSERT $value INSIDE [
        'Positive', 
        'Negative', 
        'Hierarchical', 
        'Neutral', 
        'Belonging'
    ];
DEFINE FIELD relational_context ON TABLE linked_to TYPE string;

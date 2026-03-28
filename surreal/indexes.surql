-- Define text analyzer with stemming
DEFINE ANALYZER taley_analyzer TOKENIZERS snowball(english) FILTERS snowball(english);

-- Universe scoping for nodes
DEFINE INDEX idx_node_universe ON TABLE node FIELDS universe;

-- Compound index for scoped entity lookups
DEFINE INDEX idx_node_cat_name ON TABLE node FIELDS universe, category, name;

-- Array index for trait-based lookups
DEFINE INDEX idx_node_attributes ON TABLE node FIELDS payload.dynamic_attributes;

-- Relation indexing for graph traversals
DEFINE INDEX idx_edge_universe ON TABLE linked_to FIELDS universe;
DEFINE INDEX idx_linked_in_out ON TABLE linked_to FIELDS universe, in, out;

-- Full-Text Search
DEFINE INDEX idx_bio_search ON TABLE node FIELDS payload.biography SEARCH ANALYZER taley_analyzer;
DEFINE INDEX idx_desc_search ON TABLE node FIELDS payload.description SEARCH ANALYZER taley_analyzer;

DEFINE ANALYZER taley_analyzer TOKENIZERS snowball(english) FILTERS snowball(english);
DEFINE INDEX idx_bio_search ON TABLE node FIELDS payload.biography SEARCH ANALYZER taley_analyzer;
DEFINE INDEX idx_desc_search ON TABLE node FIELDS payload.description SEARCH ANALYZER taley_analyzer;

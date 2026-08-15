ALTER TABLE news_stories DROP CONSTRAINT IF EXISTS news_stories_category_check;
ALTER TABLE news_stories ADD CONSTRAINT news_stories_category_check CHECK (
    category IN ('POLICY', 'ECONOMY', 'SOCIETY', 'INTERNATIONAL', 'TECH', 'LIFE', 'CULTURE', 'SPORTS', 'ESPORTS')
);

ALTER TABLE story_feedback DROP CONSTRAINT IF EXISTS story_feedback_type_check;
ALTER TABLE story_feedback ADD CONSTRAINT story_feedback_type_check CHECK (
    type IN ('INCORRECT', 'BIASED', 'UNCLEAR', 'HELPFUL', 'INTERESTED', 'NOT_INTERESTED')
);

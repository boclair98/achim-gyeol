ALTER TABLE news_stories DROP CONSTRAINT IF EXISTS news_stories_category_check;
ALTER TABLE news_stories ADD CONSTRAINT news_stories_category_check CHECK (
    category IN ('POLICY', 'ECONOMY', 'FINANCE', 'SOCIETY', 'INTERNATIONAL', 'TECH', 'LIFE', 'CULTURE', 'SPORTS', 'ESPORTS')
);

-- Store anonymous feature-demand signals separately from the reading funnel.
ALTER TABLE reader_events
    ADD COLUMN IF NOT EXISTS event_key VARCHAR(80);

CREATE INDEX IF NOT EXISTS idx_reader_event_key
    ON reader_events (event_key);

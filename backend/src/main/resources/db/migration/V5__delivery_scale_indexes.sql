-- Keep the daily fan-out query fast as the public subscriber base grows.
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
    ON push_subscriptions (active);

-- The unique constraint already indexes (edition_id, subscription_id); this
-- explicit edition index keeps bulk status/recovery scans predictable on
-- PostgreSQL installations that do not reuse the constraint index.
CREATE INDEX IF NOT EXISTS idx_push_delivery_attempts_edition
    ON push_delivery_attempts (edition_id);

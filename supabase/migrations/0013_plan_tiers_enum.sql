-- ============================================================================
-- Adds two real paid tiers (Plus, Pro) instead of a single flat "premium"
-- tier with the billing period baked into its name. Postgres requires a new
-- enum value to be committed before it can be used in inserts/comparisons,
-- so this migration ONLY adds the values — the plans catalog and the
-- functions that compare against them are updated in the next migration.
-- ============================================================================

alter type subscription_plan add value 'plus';
alter type subscription_plan add value 'pro';

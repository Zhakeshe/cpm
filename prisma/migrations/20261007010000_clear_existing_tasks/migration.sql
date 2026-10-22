-- Start the operational task list from a clean slate on 2026-10-07.
-- This migration runs once; tasks created after deployment are preserved.
DELETE FROM "Task";

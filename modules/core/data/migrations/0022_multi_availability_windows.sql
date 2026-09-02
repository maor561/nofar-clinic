-- Allow several working-hours windows on the same weekday (e.g. Sun 10:00-14:00
-- and 16:00-20:00). The pure slot engine already iterates every rule per day;
-- only this uniqueness constraint stood in the way.
ALTER TABLE "availability_rule" DROP CONSTRAINT IF EXISTS "availability_rule_therapist_weekday_uq";

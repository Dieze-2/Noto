ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS difficulty_level text;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS target_muscle_group text;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS prime_mover_muscle text;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS secondary_muscle text;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS tertiary_muscle text;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS primary_equipment text;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS secondary_equipment text;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS movement_pattern_1 text;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS movement_pattern_2 text;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS movement_pattern_3 text;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS grip text;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS body_region text;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercise_catalog_name_key') THEN ALTER TABLE exercise_catalog ADD CONSTRAINT exercise_catalog_name_key UNIQUE (name); END IF; END $$;
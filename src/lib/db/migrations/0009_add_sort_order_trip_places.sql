-- Add sort_order column to trip_places for manual ordering within a day
ALTER TABLE "trip_places" ADD COLUMN IF NOT EXISTS "sort_order" integer;

-- Backfill existing rows using id order if sort_order is NULL
UPDATE "trip_places" SET "sort_order" = "id" WHERE "sort_order" IS NULL;
-- Make it NOT NULL going forward
ALTER TABLE "trip_places" ALTER COLUMN "sort_order" SET NOT NULL;

-- Helpful index for ordering queries
CREATE INDEX IF NOT EXISTS "trip_places_itinerary_sort_idx"
  ON "trip_places" USING btree ("trip_itinerary_id", "sort_order");

-- Custom SQL migration file, put your code below! --
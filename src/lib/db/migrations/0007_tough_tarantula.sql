
--> statement-breakpoint
ALTER TABLE "trip_stop_activities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "trip_stop_activities" CASCADE;--> statement-breakpoint
ALTER TABLE "trip_places" RENAME COLUMN "time" TO "scheduled_time";--> statement-breakpoint
ALTER TABLE "trip_places" RENAME COLUMN "notes" TO "user_notes";--> statement-breakpoint
ALTER TABLE "trip_places" ADD COLUMN "place_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_places" ADD COLUMN "is_visited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_places" ADD COLUMN "user_rating" integer;--> statement-breakpoint
ALTER TABLE "trip_places" ADD COLUMN "visit_duration" integer;--> statement-breakpoint


ALTER TABLE "trip_places" ADD CONSTRAINT "trip_places_place_id_places_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("place_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "trip_itinerary_trip_idx" ON "trip_itinerary" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_itinerary_date_idx" ON "trip_itinerary" USING btree ("date");--> statement-breakpoint
CREATE INDEX "trip_places_trip_itinerary_idx" ON "trip_places" USING btree ("trip_itinerary_id");--> statement-breakpoint
CREATE INDEX "trip_places_place_idx" ON "trip_places" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "trip_places_scheduled_time_idx" ON "trip_places" USING btree ("scheduled_time");--> statement-breakpoint
ALTER TABLE "trip_places" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "trip_places" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "trip_places" DROP COLUMN "description";
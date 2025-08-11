CREATE TABLE "trip_itinerary" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"date" date NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_places" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_itinerary_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"time" time,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_itinerary" ADD CONSTRAINT "trip_itinerary_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_places" ADD CONSTRAINT "trip_places_trip_itinerary_id_trip_itinerary_id_fk" FOREIGN KEY ("trip_itinerary_id") REFERENCES "public"."trip_itinerary"("id") ON DELETE cascade ON UPDATE no action;
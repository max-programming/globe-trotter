CREATE TABLE "places" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" text NOT NULL,
	"name" text NOT NULL,
	"formatted_address" text NOT NULL,
	"main_text" text NOT NULL,
	"secondary_text" text,
	"place_types" text[],
	"latitude" double precision,
	"longitude" double precision,
	"country_code" text,
	"country_name" text,
	"administrative_levels" jsonb,
	"timezone" text,
	"photo_reference" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "places_placeId_unique" UNIQUE("place_id")
);
--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "place_id" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "destination_name" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "destination_image_url" text;--> statement-breakpoint
CREATE INDEX "places_place_id_idx" ON "places" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "places_country_code_idx" ON "places" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "places_place_types_idx" ON "places" USING btree ("place_types");--> statement-breakpoint
CREATE INDEX "places_name_idx" ON "places" USING btree ("name");--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_place_id_places_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("place_id") ON DELETE set null ON UPDATE no action;
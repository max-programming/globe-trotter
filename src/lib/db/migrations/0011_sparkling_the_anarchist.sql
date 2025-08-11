CREATE TABLE "recommended_trip_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"recommended_trip_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "activity_category",
	"suggested_day" integer,
	"estimated_duration" integer,
	"estimated_cost" double precision,
	"place_id" text,
	"place_name" text,
	"sort_order" integer DEFAULT 100,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommended_trips" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"destination_name" text NOT NULL,
	"destination_image_url" text,
	"place_id" text,
	"suggested_duration" integer,
	"suggested_budget" double precision,
	"suggested_season" text,
	"trip_type" text,
	"generation_prompt" text,
	"llm_model" text DEFAULT 'gpt-4o-mini' NOT NULL,
	"generated_at" timestamp NOT NULL,
	"viewed_at" timestamp,
	"dismissed_at" timestamp,
	"converted_to_trip_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recommended_trip_activities" ADD CONSTRAINT "recommended_trip_activities_recommended_trip_id_recommended_trips_id_fk" FOREIGN KEY ("recommended_trip_id") REFERENCES "public"."recommended_trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommended_trip_activities" ADD CONSTRAINT "recommended_trip_activities_place_id_places_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("place_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommended_trips" ADD CONSTRAINT "recommended_trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommended_trips" ADD CONSTRAINT "recommended_trips_place_id_places_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("place_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recommended_trip_activities_trip_idx" ON "recommended_trip_activities" USING btree ("recommended_trip_id");--> statement-breakpoint
CREATE INDEX "recommended_trip_activities_day_idx" ON "recommended_trip_activities" USING btree ("suggested_day");--> statement-breakpoint
CREATE INDEX "recommended_trip_activities_sort_idx" ON "recommended_trip_activities" USING btree ("recommended_trip_id","sort_order");--> statement-breakpoint
CREATE INDEX "recommended_trips_user_idx" ON "recommended_trips" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recommended_trips_generated_at_idx" ON "recommended_trips" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "recommended_trips_dismissed_idx" ON "recommended_trips" USING btree ("dismissed_at");--> statement-breakpoint
CREATE INDEX "recommended_trips_viewed_idx" ON "recommended_trips" USING btree ("viewed_at");
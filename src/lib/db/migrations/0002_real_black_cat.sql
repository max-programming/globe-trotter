CREATE TYPE "public"."activity_category" AS ENUM('sightseeing', 'food', 'entertainment', 'adventure', 'culture', 'shopping', 'relaxation', 'transportation', 'accommodation', 'other');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('draft', 'planned', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country_id" integer NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"timezone" text,
	"popularity" integer DEFAULT 0,
	"description" text,
	"image_url" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"region" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_trips" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"share_token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0,
	"allow_copying" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "shared_trips_shareToken_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "trip_stop_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_stop_id" text NOT NULL,
	"activity_category" "activity_category" NOT NULL,
	"activity_name" text NOT NULL,
	"scheduled_date" timestamp,
	"actual_cost" double precision,
	"notes" text,
	"is_completed" boolean DEFAULT false,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_stops" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"country_id" integer NOT NULL,
	"city_id" integer NOT NULL,
	"budget" double precision,
	"stop_order" integer NOT NULL,
	"arrival_date" date,
	"departure_date" date,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"cover_image_url" text,
	"status" "trip_status" DEFAULT 'draft' NOT NULL,
	"total_budget" double precision,
	"is_public" boolean DEFAULT false NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country_id" integer;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_trips" ADD CONSTRAINT "shared_trips_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stop_activities" ADD CONSTRAINT "trip_stop_activities_trip_stop_id_trip_stops_id_fk" FOREIGN KEY ("trip_stop_id") REFERENCES "public"."trip_stops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cities_country_idx" ON "cities" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "cities_city_country_idx" ON "cities" USING btree ("country_id","id");--> statement-breakpoint
CREATE INDEX "cities_popularity_idx" ON "cities" USING btree ("popularity");--> statement-breakpoint
CREATE INDEX "cities_name_idx" ON "cities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "shared_trips_trip_idx" ON "shared_trips" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "shared_trips_token_idx" ON "shared_trips" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "shared_trips_active_idx" ON "shared_trips" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "trip_activities_stop_idx" ON "trip_stop_activities" USING btree ("trip_stop_id");--> statement-breakpoint
CREATE INDEX "trip_activities_activity_category_idx" ON "trip_stop_activities" USING btree ("activity_category");--> statement-breakpoint
CREATE INDEX "trip_activities_date_idx" ON "trip_stop_activities" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "trip_stops_trip_idx" ON "trip_stops" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_stops_order_idx" ON "trip_stops" USING btree ("trip_id","stop_order");--> statement-breakpoint
CREATE INDEX "trip_stops_dates_idx" ON "trip_stops" USING btree ("arrival_date","departure_date");--> statement-breakpoint
CREATE INDEX "trip_stops_city_country_idx" ON "trip_stops" USING btree ("city_id","country_id");--> statement-breakpoint
CREATE INDEX "trip_stops_city_idx" ON "trip_stops" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "trip_stops_country_idx" ON "trip_stops" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "trips_user_idx" ON "trips" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trips_status_idx" ON "trips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trips_public_idx" ON "trips" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "trips_dates_idx" ON "trips" USING btree ("start_date","end_date");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "country";
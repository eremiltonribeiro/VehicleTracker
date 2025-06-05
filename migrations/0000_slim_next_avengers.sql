CREATE TABLE "checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT true,
	"category" text,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "checklist_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"status" text NOT NULL,
	"observation" text,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "checklist_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"license" text NOT NULL,
	"phone" text NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "fuel_stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text
);
--> statement-breakpoint
CREATE TABLE "fuel_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"permissions" text NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS "users";
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"password_hash" varchar,
	"role_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicle_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"template_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"observations" text,
	"odometer" integer NOT NULL,
	"status" text NOT NULL,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "vehicle_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"vehicle_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"initial_km" integer NOT NULL,
	"final_km" integer,
	"fuel_station_id" integer,
	"fuel_type_id" integer,
	"liters" integer,
	"fuel_cost" integer,
	"full_tank" boolean,
	"arla" boolean,
	"maintenance_type_id" integer,
	"maintenance_cost" integer,
	"destination" text,
	"reason" text,
	"observations" text,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"plate" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"image_url" text,
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;
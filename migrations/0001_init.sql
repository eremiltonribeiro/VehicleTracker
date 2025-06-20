PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_checklist_templates` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_default` integer DEFAULT false,
	`created_at` integer DEFAULT 1750361436172
);
--> statement-breakpoint
INSERT INTO `__new_checklist_templates`("id", "name", "description", "is_default", "created_at") SELECT "id", "name", "description", "is_default", "created_at" FROM `checklist_templates`;--> statement-breakpoint
DROP TABLE `checklist_templates`;--> statement-breakpoint
ALTER TABLE `__new_checklist_templates` RENAME TO `checklist_templates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`password_hash` text,
	`role_id` integer,
	`created_at` integer DEFAULT 1750361436168,
	`updated_at` integer DEFAULT 1750361436168,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "first_name", "last_name", "profile_image_url", "password_hash", "role_id", "created_at", "updated_at") SELECT "id", "email", "first_name", "last_name", "profile_image_url", "password_hash", "role_id", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `__new_vehicle_checklists` (
	`id` integer PRIMARY KEY NOT NULL,
	`vehicle_id` integer NOT NULL,
	`driver_id` integer NOT NULL,
	`template_id` integer NOT NULL,
	`date` integer DEFAULT 1750361436172 NOT NULL,
	`observations` text,
	`odometer` integer NOT NULL,
	`status` text NOT NULL,
	`photo_url` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `checklist_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_vehicle_checklists`("id", "vehicle_id", "driver_id", "template_id", "date", "observations", "odometer", "status", "photo_url") SELECT "id", "vehicle_id", "driver_id", "template_id", "date", "observations", "odometer", "status", "photo_url" FROM `vehicle_checklists`;--> statement-breakpoint
DROP TABLE `vehicle_checklists`;--> statement-breakpoint
ALTER TABLE `__new_vehicle_checklists` RENAME TO `vehicle_checklists`;--> statement-breakpoint
CREATE TABLE `__new_vehicle_registrations` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`vehicle_id` integer NOT NULL,
	`driver_id` integer NOT NULL,
	`date` integer DEFAULT 1750361436170 NOT NULL,
	`initial_km` integer NOT NULL,
	`final_km` integer,
	`fuel_station_id` integer,
	`fuel_type_id` integer,
	`liters` integer,
	`fuel_cost` integer,
	`full_tank` integer,
	`arla` integer,
	`maintenance_type_id` integer,
	`maintenance_cost` integer,
	`origin` text,
	`destination` text,
	`reason` text,
	`observations` text,
	`photo_url` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fuel_station_id`) REFERENCES `fuel_stations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fuel_type_id`) REFERENCES `fuel_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`maintenance_type_id`) REFERENCES `maintenance_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_vehicle_registrations`("id", "type", "vehicle_id", "driver_id", "date", "initial_km", "final_km", "fuel_station_id", "fuel_type_id", "liters", "fuel_cost", "full_tank", "arla", "maintenance_type_id", "maintenance_cost", "origin", "destination", "reason", "observations", "photo_url") SELECT "id", "type", "vehicle_id", "driver_id", "date", "initial_km", "final_km", "fuel_station_id", "fuel_type_id", "liters", "fuel_cost", "full_tank", "arla", "maintenance_type_id", "maintenance_cost", "origin", "destination", "reason", "observations", "photo_url" FROM `vehicle_registrations`;--> statement-breakpoint
DROP TABLE `vehicle_registrations`;--> statement-breakpoint
ALTER TABLE `__new_vehicle_registrations` RENAME TO `vehicle_registrations`;
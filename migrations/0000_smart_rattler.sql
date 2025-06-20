CREATE TABLE `checklist_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`template_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_required` integer DEFAULT true,
	`category` text,
	`order` integer DEFAULT 0,
	FOREIGN KEY (`template_id`) REFERENCES `checklist_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `checklist_results` (
	`id` integer PRIMARY KEY NOT NULL,
	`checklist_id` integer NOT NULL,
	`item_id` integer NOT NULL,
	`status` text NOT NULL,
	`observation` text,
	`photo_url` text,
	FOREIGN KEY (`checklist_id`) REFERENCES `vehicle_checklists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `checklist_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `checklist_templates` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_default` integer DEFAULT false,
	`created_at` integer DEFAULT 1750361418502
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`license` text NOT NULL,
	`phone` text NOT NULL,
	`image_url` text
);
--> statement-breakpoint
CREATE TABLE `fuel_stations` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text
);
--> statement-breakpoint
CREATE TABLE `fuel_types` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `maintenance_types` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`permissions` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`password_hash` text,
	`role_id` integer,
	`created_at` integer DEFAULT 1750361418498,
	`updated_at` integer DEFAULT 1750361418498,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vehicle_checklists` (
	`id` integer PRIMARY KEY NOT NULL,
	`vehicle_id` integer NOT NULL,
	`driver_id` integer NOT NULL,
	`template_id` integer NOT NULL,
	`date` integer DEFAULT 1750361418502 NOT NULL,
	`observations` text,
	`odometer` integer NOT NULL,
	`status` text NOT NULL,
	`photo_url` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `checklist_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vehicle_registrations` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`vehicle_id` integer NOT NULL,
	`driver_id` integer NOT NULL,
	`date` integer DEFAULT 1750361418501 NOT NULL,
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
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`plate` text NOT NULL,
	`model` text NOT NULL,
	`year` integer NOT NULL,
	`image_url` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_plate_unique` ON `vehicles` (`plate`);
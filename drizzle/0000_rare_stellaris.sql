CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `internal_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`source` text NOT NULL,
	`original_number` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `journey_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project_media` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`project_id` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`category_id` text,
	`challenge_id` text,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`challenge_id`) REFERENCES `internal_challenges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `learning_reflections` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`milestone_id` text,
	FOREIGN KEY (`milestone_id`) REFERENCES `journey_milestones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tools` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL
);

CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(96) NOT NULL,
	`title` varchar(120) NOT NULL,
	`codename` varchar(48) NOT NULL,
	`summary` varchar(280) NOT NULL,
	`description` text NOT NULL,
	`status` enum('idea','active','shipped','paused') NOT NULL DEFAULT 'idea',
	`visibility` enum('public','private') NOT NULL DEFAULT 'private',
	`progress` int NOT NULL DEFAULT 0,
	`leadOpenId` varchar(64),
	`accent` varchar(16) NOT NULL DEFAULT '#ef3d32',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `projectsVisibilityStatusIndex` ON `projects` (`visibility`,`status`);--> statement-breakpoint
CREATE INDEX `projectsLeadOpenIdIndex` ON `projects` (`leadOpenId`);
CREATE TABLE `contactRateWindows` (
	`sourceHash` varchar(64) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`windowEndsAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contactRateWindows_sourceHash` PRIMARY KEY(`sourceHash`)
);

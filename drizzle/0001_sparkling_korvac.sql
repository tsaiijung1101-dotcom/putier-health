CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lineId` varchar(100),
	`nickname` varchar(100) NOT NULL,
	`birthdate` varchar(20) NOT NULL,
	`gender` enum('male','female') NOT NULL,
	`height` float,
	`weight` float,
	`medications` text,
	`surgeryHistory` text,
	`selectedSymptoms` json NOT NULL,
	`recommendedDosage` int,
	`firstSetDays` int,
	`setCount` int DEFAULT 1,
	`bmi` float,
	`dailyWater` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medication_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`s3Url` varchar(1000) NOT NULL,
	`originalName` varchar(255),
	`mimeType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medication_images_id` PRIMARY KEY(`id`)
);

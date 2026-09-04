ALTER TABLE `payrollCalculations` ADD `taxableGross` int NOT NULL;--> statement-breakpoint
ALTER TABLE `payrollCalculations` ADD `nonTaxableAccruals` int DEFAULT 0 NOT NULL;
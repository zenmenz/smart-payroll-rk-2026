CREATE TABLE `accrualTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(160) NOT NULL,
	`kind` enum('accrual','deduction') NOT NULL,
	`isTaxable` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accrualTypes_id` PRIMARY KEY(`id`),
	CONSTRAINT `accrualTypes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`entityType` varchar(64) NOT NULL,
	`entityId` varchar(64),
	`action` varchar(80) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`legalName` varchar(255) NOT NULL,
	`bin` varchar(12) NOT NULL,
	`address` varchar(500) NOT NULL,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companySettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(160) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `employeePayrollItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`employeeId` int NOT NULL,
	`accrualTypeId` int NOT NULL,
	`amount` int NOT NULL,
	`comment` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeePayrollItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`fullName` varchar(255) NOT NULL,
	`iin` varchar(12) NOT NULL,
	`departmentId` int,
	`positionId` int,
	`grossSalary` int NOT NULL,
	`hireDate` date NOT NULL,
	`birthDate` date,
	`iban` varchar(34),
	`bankName` varchar(120),
	`applyStandardDeduction` boolean NOT NULL DEFAULT false,
	`customDeductionAmount` int NOT NULL DEFAULT 0,
	`opvrApplicable` boolean NOT NULL DEFAULT true,
	`status` enum('active','new','vacation','sick','quitting','archived') NOT NULL DEFAULT 'new',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `employees_iin_unique` UNIQUE(`iin`)
);
--> statement-breakpoint
CREATE TABLE `payrollCalculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`employeeId` int NOT NULL,
	`status` enum('draft','verified','approved','paid') NOT NULL DEFAULT 'draft',
	`gross` int NOT NULL,
	`manualAccruals` int NOT NULL DEFAULT 0,
	`manualDeductions` int NOT NULL DEFAULT 0,
	`opv` int NOT NULL,
	`vosms` int NOT NULL,
	`standardDeduction` int NOT NULL,
	`ipnBase` int NOT NULL,
	`ipnCorrection` int NOT NULL,
	`ipn` int NOT NULL,
	`totalWithheld` int NOT NULL,
	`netSalary` int NOT NULL,
	`soBase` int NOT NULL,
	`so` int NOT NULL,
	`oosms` int NOT NULL,
	`snBase` int NOT NULL,
	`sn` int NOT NULL,
	`opvr` int NOT NULL,
	`totalEmployerContributions` int NOT NULL,
	`totalCompanyCost` int NOT NULL,
	`taxProfileSnapshot` text NOT NULL,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`calculatedByUserId` int,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payrollCalculations_id` PRIMARY KEY(`id`),
	CONSTRAINT `payroll_calculation_period_employee_unq` UNIQUE(`payrollPeriodId`,`employeeId`)
);
--> statement-breakpoint
CREATE TABLE `payrollPeriods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodKey` varchar(7) NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`taxProfileId` int,
	`closedAt` timestamp,
	`closedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payrollPeriods_id` PRIMARY KEY(`id`),
	CONSTRAINT `payrollPeriods_periodKey_unique` UNIQUE(`periodKey`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(160) NOT NULL,
	`departmentId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `positions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `taxProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`effectiveFrom` date NOT NULL,
	`effectiveTo` date,
	`mci` int NOT NULL,
	`minimumWage` int NOT NULL,
	`standardDeductionMciCount` int NOT NULL,
	`opvRateBps` int NOT NULL,
	`opvMaxBaseMinimumWages` int NOT NULL,
	`vosmsRateBps` int NOT NULL,
	`vosmsMaxBaseMinimumWages` int NOT NULL,
	`ipnBaseRateBps` int NOT NULL,
	`ipnHighRateBps` int NOT NULL,
	`ipnHighRateAnnualMciLimit` int NOT NULL,
	`lowIncomeAnnualizedMciLimit` int NOT NULL,
	`lowIncomeCorrectionBps` int NOT NULL,
	`soRateBps` int NOT NULL,
	`soMinBaseMinimumWages` int NOT NULL,
	`soMaxBaseMinimumWages` int NOT NULL,
	`oosmsRateBps` int NOT NULL,
	`oosmsMaxBaseMinimumWages` int NOT NULL,
	`snRateBps` int NOT NULL,
	`opvrRateBps` int NOT NULL,
	`opvrMaxBaseMinimumWages` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taxProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `companySettings` ADD CONSTRAINT `companySettings_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employeePayrollItems` ADD CONSTRAINT `employeePayrollItems_payrollPeriodId_payrollPeriods_id_fk` FOREIGN KEY (`payrollPeriodId`) REFERENCES `payrollPeriods`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employeePayrollItems` ADD CONSTRAINT `employeePayrollItems_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employeePayrollItems` ADD CONSTRAINT `employeePayrollItems_accrualTypeId_accrualTypes_id_fk` FOREIGN KEY (`accrualTypeId`) REFERENCES `accrualTypes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_departmentId_departments_id_fk` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_positionId_positions_id_fk` FOREIGN KEY (`positionId`) REFERENCES `positions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollCalculations` ADD CONSTRAINT `payrollCalculations_payrollPeriodId_payrollPeriods_id_fk` FOREIGN KEY (`payrollPeriodId`) REFERENCES `payrollPeriods`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollCalculations` ADD CONSTRAINT `payrollCalculations_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollCalculations` ADD CONSTRAINT `payrollCalculations_calculatedByUserId_users_id_fk` FOREIGN KEY (`calculatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollPeriods` ADD CONSTRAINT `payrollPeriods_taxProfileId_taxProfiles_id_fk` FOREIGN KEY (`taxProfileId`) REFERENCES `taxProfiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrollPeriods` ADD CONSTRAINT `payrollPeriods_closedByUserId_users_id_fk` FOREIGN KEY (`closedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_departmentId_departments_id_fk` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `auditLogs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `employee_payroll_items_period_employee_idx` ON `employeePayrollItems` (`payrollPeriodId`,`employeeId`);--> statement-breakpoint
CREATE INDEX `employee_payroll_items_type_idx` ON `employeePayrollItems` (`accrualTypeId`);--> statement-breakpoint
CREATE INDEX `employees_department_idx` ON `employees` (`departmentId`);--> statement-breakpoint
CREATE INDEX `employees_position_idx` ON `employees` (`positionId`);--> statement-breakpoint
CREATE INDEX `payroll_calculation_period_status_idx` ON `payrollCalculations` (`payrollPeriodId`,`status`);--> statement-breakpoint
CREATE INDEX `positions_department_idx` ON `positions` (`departmentId`);--> statement-breakpoint
CREATE INDEX `tax_profiles_effective_idx` ON `taxProfiles` (`effectiveFrom`,`effectiveTo`);
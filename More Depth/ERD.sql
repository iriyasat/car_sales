CREATE TABLE `Employees` (
  `employee_id` int PRIMARY KEY AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) UNIQUE NOT NULL,
  `phone` varchar(20),
  `role` varchar(50) NOT NULL,
  `hire_date` date,
  `commission_rate` decimal(5,2)
);

CREATE TABLE `Customers` (
  `customer_id` int PRIMARY KEY AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) UNIQUE,
  `phone` varchar(20) NOT NULL,
  `address` varchar(150),
  `city` varchar(50)
);

CREATE TABLE `Vehicles` (
  `vehicle_id` int PRIMARY KEY AUTO_INCREMENT,
  `vin` varchar(17) UNIQUE NOT NULL,
  `make` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `year` int NOT NULL,
  `color` varchar(30),
  `mileage` int,
  `acquisition_cost` decimal(10,2),
  `selling_price` decimal(10,2),
  `status` varchar(30) COMMENT 'Available, Reserved, Sold'
);

CREATE TABLE `Leads` (
  `lead_id` int PRIMARY KEY AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `vehicle_id` int,
  `employee_id` int NOT NULL,
  `source` varchar(50),
  `status` varchar(30),
  `notes` text,
  `created_at` timestamp
);

CREATE TABLE `Sales` (
  `sale_id` int PRIMARY KEY AUTO_INCREMENT,
  `lead_id` int UNIQUE NOT NULL,
  `vehicle_id` int UNIQUE NOT NULL,
  `sale_date` datetime NOT NULL,
  `base_price` decimal(10,2),
  `discount_amount` decimal(10,2),
  `tax_amount` decimal(10,2),
  `total_amount` decimal(10,2)
);

CREATE TABLE `TradeIns` (
  `trade_in_id` int PRIMARY KEY AUTO_INCREMENT,
  `sale_id` int UNIQUE,
  `make` varchar(50),
  `model` varchar(50),
  `year` int,
  `mileage` int,
  `appraised_value` decimal(10,2),
  `allowance_amount` decimal(10,2)
);

CREATE TABLE `Payments` (
  `payment_id` int PRIMARY KEY AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `payment_date` datetime,
  `amount` decimal(10,2),
  `payment_method` varchar(30),
  `status` varchar(30),
  `transaction_reference` varchar(100)
);

ALTER TABLE `Leads` ADD FOREIGN KEY (`customer_id`) REFERENCES `Customers` (`customer_id`);

ALTER TABLE `Leads` ADD FOREIGN KEY (`vehicle_id`) REFERENCES `Vehicles` (`vehicle_id`);

ALTER TABLE `Leads` ADD FOREIGN KEY (`employee_id`) REFERENCES `Employees` (`employee_id`);

ALTER TABLE `Sales` ADD FOREIGN KEY (`lead_id`) REFERENCES `Leads` (`lead_id`);

ALTER TABLE `Sales` ADD FOREIGN KEY (`vehicle_id`) REFERENCES `Vehicles` (`vehicle_id`);

ALTER TABLE `TradeIns` ADD FOREIGN KEY (`sale_id`) REFERENCES `Sales` (`sale_id`);

ALTER TABLE `Payments` ADD FOREIGN KEY (`sale_id`) REFERENCES `Sales` (`sale_id`);

ALTER TABLE `Employees` ADD FOREIGN KEY (`last_name`) REFERENCES `Employees` (`first_name`);

ALTER TABLE `Customers` ADD FOREIGN KEY (`address`) REFERENCES `Customers` (`last_name`);

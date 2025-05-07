-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 07, 2025 at 11:35 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `habitbite`
--

-- --------------------------------------------------------

--
-- Table structure for table `consumed_foods`
--

CREATE TABLE `consumed_foods` (
  `id` int(11) NOT NULL,
  `entry_id` int(11) NOT NULL,
  `external_api_id` varchar(255) NOT NULL,
  `food_name` varchar(255) NOT NULL,
  `quantity` decimal(7,2) NOT NULL,
  `calories` int(11) NOT NULL,
  `protein` decimal(5,2) DEFAULT NULL,
  `carbs` decimal(5,2) DEFAULT NULL,
  `fats` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daily_entries`
--

CREATE TABLE `daily_entries` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `entry_date` date NOT NULL,
  `total_calories` int(11) NOT NULL,
  `total_protein` decimal(5,2) DEFAULT NULL,
  `total_carbs` decimal(5,2) DEFAULT NULL,
  `total_fats` decimal(5,2) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `birthdate` date NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `height` decimal(5,2) NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  `goal_type` enum('lose','gain','maintain') NOT NULL,
  `activity_level` enum('sedentary','light','moderate','active','very_active') NOT NULL,
  `daily_calorie_goal` int(11) NOT NULL DEFAULT 2000 COMMENT 'Default value will be calculated during registration',
  `role` enum('admin','dietitian','user') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `username`, `password_hash`, `full_name`, `birthdate`, `gender`, `height`, `weight`, `goal_type`, `activity_level`, `daily_calorie_goal`, `role`, `created_at`, `updated_at`) VALUES
(1, 'emily.carter@example.com', 'emily_fitness92', '$2a$10$N9qo8uLOickgx3ZMRM7xEe6h6u/K7fB8Z4zJf7Q7JwYb5t7Q1Z/v2', 'Emily Carter', '1992-08-15', 'female', 167.60, 78.40, 'lose', 'light', 1850, 'user', '2025-04-27 19:38:52', '2025-05-01 21:40:01'),
(2, 'michael.gonzalez@example.com', 'mikegains', '$2a$10$N9qo8uLOickgx3ZMRM7xEe6h6u/K7fB8Z4zJf7Q7JwYb5t7Q1Z/v2', 'Michael Gonzalez', '1988-11-03', 'male', 182.90, 88.50, 'gain', 'very_active', 3200, 'user', '2025-04-27 19:38:52', '2025-05-01 21:40:37'),
(3, 'alex.nguyen@example.com', 'alex_wellness', '$2a$10$N9qo8uLOickgx3ZMRM7xEe6h6u/K7fB8Z4zJf7Q7JwYb5t7Q1Z/v2', 'Alex Nguyen', '1999-02-28', 'other', 175.30, 68.00, 'maintain', 'moderate', 2400, 'user', '2025-04-27 19:38:52', '2025-05-01 21:40:37'),
(4, 'dr.nutrition@example.com', 'dr_wellness', '$2a$10$N9qo8uLOickgx3ZMRM7xEe6h6u/K7fB8Z4zJf7Q7JwYb5t7Q1Z/v2', 'Sarah Thompson', '1985-04-12', 'female', 170.20, 62.10, 'maintain', 'active', 2000, 'dietitian', '2025-04-27 19:38:52', '2025-05-01 21:40:37'),
(5, 'admin.calorietrack@example.com', 'sysadmin_ctl', '$2a$10$N9qo8uLOickgx3ZMRM7xEe6h6u/K7fB8Z4zJf7Q7JwYb5t7Q1Z/v2', 'Robert Chen', '1990-07-22', 'male', 177.80, 81.60, 'maintain', 'moderate', 2000, 'admin', '2025-04-27 19:38:52', '2025-05-01 21:40:37');

-- --------------------------------------------------------

--
-- Table structure for table `user_dietitian`
--

CREATE TABLE `user_dietitian` (
  `user_id` int(11) NOT NULL,
  `dietitian_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_goals`
--

CREATE TABLE `user_goals` (
  `user_id` int(11) NOT NULL,
  `target_calories` int(11) NOT NULL,
  `target_protein` decimal(5,2) DEFAULT NULL,
  `target_carbs` decimal(5,2) DEFAULT NULL,
  `target_fats` decimal(5,2) DEFAULT NULL,
  `target_weight` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `consumed_foods`
--
ALTER TABLE `consumed_foods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_foods_entry` (`entry_id`);

--
-- Indexes for table `daily_entries`
--
ALTER TABLE `daily_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`entry_date`),
  ADD KEY `idx_entries_user_date` (`user_id`,`entry_date`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_email` (`email`);

--
-- Indexes for table `user_dietitian`
--
ALTER TABLE `user_dietitian`
  ADD PRIMARY KEY (`user_id`,`dietitian_id`),
  ADD KEY `dietitian_id` (`dietitian_id`);

--
-- Indexes for table `user_goals`
--
ALTER TABLE `user_goals`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `consumed_foods`
--
ALTER TABLE `consumed_foods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `daily_entries`
--
ALTER TABLE `daily_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `consumed_foods`
--
ALTER TABLE `consumed_foods`
  ADD CONSTRAINT `consumed_foods_ibfk_1` FOREIGN KEY (`entry_id`) REFERENCES `daily_entries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `daily_entries`
--
ALTER TABLE `daily_entries`
  ADD CONSTRAINT `daily_entries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_dietitian`
--
ALTER TABLE `user_dietitian`
  ADD CONSTRAINT `user_dietitian_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_dietitian_ibfk_2` FOREIGN KEY (`dietitian_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_goals`
--
ALTER TABLE `user_goals`
  ADD CONSTRAINT `user_goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

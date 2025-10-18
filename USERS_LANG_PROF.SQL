CREATE OR REPLACE
ALGORITHM = UNDEFINED VIEW `fw_v_users` AS
select
    "id` AS `id`,
    "email` AS `email`,
    "first_name` AS `first_name`,
    "last_name` AS `last_name`,
    "dob` AS `dob`,
    "gender` AS `gender`,
    "nationality` AS `nationality`,
    "country_of_origin` AS `country_of_origin`,
    "workforce_group` AS `workforce_group`,
    "phone` AS `phone`,
    "role_id` AS `role_id`,
    "job_title` AS `job_title`,
    "city` AS `city`,
    "status` AS `status`,
    "emergency` AS `emergency`,
    "status_changed_at` AS `status_changed_at`,
    "status_end_at` AS `status_end_at`,
    "status_reason` AS `status_reason`,
    "status_details` AS `status_details`,
    "additional_info` AS `additional_info`,
    "full_img_url` AS `full_img_url`,
    "avatar_url` AS `avatar_url`,
    "created_at` AS `created_at`,
    "updated_at` AS `updated_at`,
    "invitation_status` AS `invitation_status`,
    "invitation_sent_at` AS `invitation_sent_at`,
    "invitation_expires_at` AS `invitation_expires_at`,
    "invited_by` AS `invited_by`,
    "registration_completed_at` AS `registration_completed_at`,
    "invitation_attempts` AS `invitation_attempts`,
    "last_reminder_sent_at` AS `last_reminder_sent_at`,
    "archived_at` AS `archived_at`,
    `r`.`code` AS `role_code`,
    `r`.`name` AS `role_name`,
    `r`.`category` AS `role_category`,
    `r`.`description` AS `role_description`
from
    (`fw_users` `u`
left join `fw_glob_roles` `r` on
    ("role_id` = `r`.`id`));


    это основная таблица для пользователей и основная информация о пользователе


    есть еще две таблицы связанные с этой 1->M связью. это fw_user_professional и fw_user_language.

    fw_user_professional это таблица для профессиональной информации о пользователе

    CREATE TABLE `fw_user_professional` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `total_experience` int(11) DEFAULT 0,
  `education_level` varchar(100) DEFAULT NULL,
  `field_of_study` varchar(255) DEFAULT NULL,
  `institution_name` varchar(255) DEFAULT NULL,
  `graduation_year` int(11) DEFAULT NULL,
  `professional_summary` text DEFAULT NULL,
  `specialized_skills` text DEFAULT NULL,
  `specialized_experience` text DEFAULT NULL,
  `key_projects` text DEFAULT NULL,
  `previous_employers` text DEFAULT NULL,
  `references` text DEFAULT NULL,
  `availability` varchar(50) DEFAULT NULL,
  `travel_willingness` varchar(50) DEFAULT NULL,
  `drivers_license` varchar(10) DEFAULT NULL,
  `red_seal` varchar(50) DEFAULT NULL,
  `provincial_certificate` varchar(255) DEFAULT NULL,
  `union_membership` varchar(255) DEFAULT NULL,
  `equipment_tools` text DEFAULT NULL,
  `whmis` varchar(50) DEFAULT NULL,
  `first_aid` varchar(50) DEFAULT NULL,
  `fall_protection` varchar(50) DEFAULT NULL,
  `confined_space` varchar(50) DEFAULT NULL,
  `lockout_tagout` varchar(50) DEFAULT NULL,
  `other_safety` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_total_experience` (`total_experience`),
  KEY `idx_education_level` (`education_level`),
  KEY `idx_availability` (`availability`),
  KEY `idx_drivers_license` (`drivers_license`),
  KEY `idx_red_seal` (`red_seal`),
  KEY `fw_user_professional_fw_users_FK` (`user_id`),
  CONSTRAINT `fw_user_professional_fw_users_FK` FOREIGN KEY (`user_id`) REFERENCES `fw_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

  

    fw_user_language таблица языков на которых говорит работник  

    CREATE TABLE `fw_user_languages` (
  `worker_id` bigint(20) unsigned NOT NULL,
  `language_id` bigint(20) unsigned NOT NULL,
  `prof_level` enum('Basic','Intermediate','Fluent') NOT NULL,
  PRIMARY KEY (`worker_id`,`language_id`),
  KEY `fw_languages_FK` (`language_id`),
  CONSTRAINT `fw_languages_FK` FOREIGN KEY (`language_id`) REFERENCES `fw_languages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fw_users_FK` FOREIGN KEY (`worker_id`) REFERENCES `fw_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

и fw_languages таблица языков

CREATE TABLE `fw_languages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fw_languages_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

и проеты  

CREATE TABLE `fw_projects` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','inactive','completed') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `fw_projects_unique` (`name`)

  CREATE TABLE `fw_prj_team_members` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `role_in_project` varchar(100) DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

внешний ключ для работника user_id  

внешний ключ для проекта project_id  


таблица ролей

CREATE TABLE `fw_glob_roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` enum('global','project','task') NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


формат возвращаемых данных:

{
  "data": [
    {
        "id",
        "email",
        "first_name",
        "last_name",
        "dob",
        "gender",
        "nationality",
        "country_of_origin",
        "workforce_group",
        "phone",
        "role_id",
        "job_title",
        "city",
        "status",
        "emergency",
        "status_changed_at",
        "status_end_at",
        "status_reason",
        "status_details",
        "additional_info",
        "full_img_url",
        "avatar_url",
        "created_at",
        "updated_at",
        "invitation_status",
        "invitation_sent_at",
        "invitation_expires_at",
        "invited_by",
        "registration_completed_at",
        "invitation_attempts",
        "last_reminder_sent_at",
        "archived_at",
        "code",
        "name",
        "category",
        "description",
        "role": {
            "id": 1,
            "code": "worker",
            "name": "Worker",
            "category": "project"
        },
        "professional_data": [
            {
                "id": 1,
                .......
            }
        ],
        "projects": [
            {
                "id": 1,
                .......
            },
            {
                "id": 2,
                .......
            }
        ],
        "languages": [
            {
                "id": 1,
                "name": "English",
                "prof_level": "native"
            },
            {
                "id": 2,
                "name": "Spanish",
                "prof_level": "intermediate"
            }
        ]
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 25,
    "total": 100,
    "last_page": 4
  }
}
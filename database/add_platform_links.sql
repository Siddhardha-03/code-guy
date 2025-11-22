-- Add platform links columns to questions table
USE campus_platform;

ALTER TABLE questions 
ADD COLUMN leetcode_url VARCHAR(500) NULL AFTER tags,
ADD COLUMN geeksforgeeks_url VARCHAR(500) NULL AFTER leetcode_url,
ADD COLUMN other_platform_url VARCHAR(500) NULL AFTER geeksforgeeks_url,
ADD COLUMN other_platform_name VARCHAR(100) NULL AFTER other_platform_url;

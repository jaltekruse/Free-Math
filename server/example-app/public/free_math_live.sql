-- MySQL Script generated by MySQL Workbench
-- Sun 13 Nov 2022 11:59:19 PM CST
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema free_math
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema free_math
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `free_math` ;
USE `free_math` ;

-- -----------------------------------------------------
-- Table `free_math`.`users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `free_math`.`users` ;

CREATE TABLE IF NOT EXISTS `free_math`.`users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `free_math`.`quizzes`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `free_math`.`quizzes` ;

CREATE TABLE IF NOT EXISTS `free_math`.`quizzes` (
  `quiz_id` INT NOT NULL AUTO_INCREMENT,
  `quiz_name` VARCHAR(45) NULL,
  `active` TINYINT(1) NULL,
  `join_code` VARCHAR(10) NULL,
  `teacher_user_id` INT NOT NULL,
  PRIMARY KEY (`quiz_id`),
  INDEX `fk_quizzes_users1_idx` (`teacher_user_id` ASC) VISIBLE,
  CONSTRAINT `fk_quizzes_users1`
    FOREIGN KEY (`teacher_user_id`)
    REFERENCES `free_math`.`users` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `free_math`.`questions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `free_math`.`questions` ;

CREATE TABLE IF NOT EXISTS `free_math`.`questions` (
  `question_id` INT NOT NULL AUTO_INCREMENT,
  `question_title` VARCHAR(200) NULL,
  `question_content` TEXT(9000000) NULL,
  `quiz_id` INT NOT NULL,
  `active` TINYINT(1) NULL,
  PRIMARY KEY (`question_id`),
  INDEX `fk_questions_quizzes_idx` (`quiz_id` ASC) VISIBLE,
  UNIQUE INDEX `unique_quiz_id_and_question_name` (`quiz_id` ASC, `question_title` ASC) VISIBLE,
  CONSTRAINT `fk_questions_quizzes`
    FOREIGN KEY (`quiz_id`)
    REFERENCES `free_math`.`quizzes` (`quiz_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `free_math`.`responses`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `free_math`.`responses` ;

CREATE TABLE IF NOT EXISTS `free_math`.`responses` (
  `response_id` INT NOT NULL AUTO_INCREMENT,
  `content` TEXT(9000000) NULL,
  `user_id` INT NOT NULL,
  `questions_question_id` INT NOT NULL,
  PRIMARY KEY (`response_id`),
  INDEX `fk_responses_users1_idx` (`user_id` ASC) VISIBLE,
  INDEX `fk_responses_questions1_idx` (`questions_question_id` ASC) VISIBLE,
  CONSTRAINT `fk_responses_users1`
    FOREIGN KEY (`user_id`)
    REFERENCES `free_math`.`users` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_responses_questions1`
    FOREIGN KEY (`questions_question_id`)
    REFERENCES `free_math`.`questions` (`question_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `free_math`.`reviews`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `free_math`.`reviews` ;

CREATE TABLE IF NOT EXISTS `free_math`.`reviews` (
  `review_id` INT NOT NULL AUTO_INCREMENT,
  `reviewer_user_id` INT NOT NULL,
  `review_content` TEXT(9000000) NULL,
  `responses_response_id` INT NOT NULL,
  PRIMARY KEY (`review_id`, `reviewer_user_id`, `responses_response_id`),
  INDEX `fk_reviews_users1_idx` (`reviewer_user_id` ASC) VISIBLE,
  INDEX `fk_reviews_responses1_idx` (`responses_response_id` ASC) VISIBLE,
  CONSTRAINT `fk_reviews_users1`
    FOREIGN KEY (`reviewer_user_id`)
    REFERENCES `free_math`.`users` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_reviews_responses1`
    FOREIGN KEY (`responses_response_id`)
    REFERENCES `free_math`.`responses` (`response_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

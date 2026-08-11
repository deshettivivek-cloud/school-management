-- Migration: 20260801_add_soft_delete_columns.sql
-- Description: Add nullable deleted_at column to critical tenant tables: students, employees, fee_structures, expenditures

ALTER TABLE students ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE employees ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE fee_structures ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE expenditures ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

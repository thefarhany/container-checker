/*
  Warnings:

  - Added the required column `inspectorName` to the `checker_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "checker_data" ADD COLUMN     "inspectorName" TEXT NOT NULL;

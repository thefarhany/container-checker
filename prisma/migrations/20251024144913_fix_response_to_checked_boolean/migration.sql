/*
  Warnings:

  - You are about to drop the column `response` on the `security_check_responses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "security_check_responses" DROP COLUMN "response",
ADD COLUMN     "checked" BOOLEAN NOT NULL DEFAULT true;

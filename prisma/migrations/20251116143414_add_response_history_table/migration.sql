/*
  Warnings:

  - Added the required column `updatedAt` to the `security_check_responses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "security_check_responses" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "security_check_response_history" (
    "id" TEXT NOT NULL,
    "responseId" TEXT,
    "checklistItemId" TEXT NOT NULL,
    "securityCheckId" TEXT NOT NULL,
    "notes" TEXT,
    "checked" BOOLEAN NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_check_response_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "security_check_response_history" ADD CONSTRAINT "security_check_response_history_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "security_check_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_check_response_history" ADD CONSTRAINT "security_check_response_history_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "checklist_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_check_response_history" ADD CONSTRAINT "security_check_response_history_securityCheckId_fkey" FOREIGN KEY ("securityCheckId") REFERENCES "security_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_check_response_history" ADD CONSTRAINT "security_check_response_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

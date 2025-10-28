/*
  Warnings:

  - You are about to drop the column `value` on the `security_check_responses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `checklist_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[order]` on the table `checklist_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[categoryId,order]` on the table `checklist_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `response` to the `security_check_responses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "security_check_responses" DROP COLUMN "value",
ADD COLUMN     "response" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "checklist_categories_name_key" ON "checklist_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_categories_order_key" ON "checklist_categories"("order");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_items_categoryId_order_key" ON "checklist_items"("categoryId", "order");

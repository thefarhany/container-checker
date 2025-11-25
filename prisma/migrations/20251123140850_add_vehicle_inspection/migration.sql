/*
  Warnings:

  - A unique constraint covering the columns `[securityCheckId,vehicleInspectionItemId]` on the table `security_check_responses` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."security_check_response_history" DROP CONSTRAINT "security_check_response_history_checklistItemId_fkey";

-- AlterTable
ALTER TABLE "security_check_response_history" ADD COLUMN     "vehicleInspectionItemId" TEXT,
ALTER COLUMN "checklistItemId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "security_check_responses" ADD COLUMN     "vehicleInspectionItemId" TEXT,
ALTER COLUMN "checklistItemId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "vehicle_inspection_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_inspection_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_inspection_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "standard" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_inspection_categories_name_key" ON "vehicle_inspection_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_inspection_categories_order_key" ON "vehicle_inspection_categories"("order");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_inspection_items_categoryId_order_key" ON "vehicle_inspection_items"("categoryId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "security_check_responses_securityCheckId_vehicleInspectionI_key" ON "security_check_responses"("securityCheckId", "vehicleInspectionItemId");

-- AddForeignKey
ALTER TABLE "vehicle_inspection_items" ADD CONSTRAINT "vehicle_inspection_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "vehicle_inspection_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_check_responses" ADD CONSTRAINT "security_check_responses_vehicleInspectionItemId_fkey" FOREIGN KEY ("vehicleInspectionItemId") REFERENCES "vehicle_inspection_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_check_response_history" ADD CONSTRAINT "security_check_response_history_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "checklist_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_check_response_history" ADD CONSTRAINT "security_check_response_history_vehicleInspectionItemId_fkey" FOREIGN KEY ("vehicleInspectionItemId") REFERENCES "vehicle_inspection_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

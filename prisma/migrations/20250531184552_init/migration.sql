/*
  Warnings:

  - You are about to drop the column `processedFiles` on the `BatchResource` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BatchResource" DROP COLUMN "processedFiles";

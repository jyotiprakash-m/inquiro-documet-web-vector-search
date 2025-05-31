/*
  Warnings:

  - Added the required column `type` to the `BatchResource` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BatchResource" ADD COLUMN     "type" TEXT NOT NULL;

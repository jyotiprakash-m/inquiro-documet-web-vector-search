/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Share` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `Share` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Share" ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Share_token_key" ON "Share"("token");

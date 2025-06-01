/*
  Warnings:

  - A unique constraint covering the columns `[shareUrl]` on the table `Share` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Share_shareUrl_key" ON "Share"("shareUrl");

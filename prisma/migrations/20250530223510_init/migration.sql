-- DropForeignKey
ALTER TABLE "Vector" DROP CONSTRAINT "Vector_webPageId_fkey";

-- AddForeignKey
ALTER TABLE "Vector" ADD CONSTRAINT "Vector_webPageId_fkey" FOREIGN KEY ("webPageId") REFERENCES "WebPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

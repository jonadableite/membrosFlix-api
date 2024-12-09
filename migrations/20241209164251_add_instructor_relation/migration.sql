-- AlterTable
ALTER TABLE "aulas" ADD COLUMN     "instructorId" INTEGER;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

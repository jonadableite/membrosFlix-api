-- CreateTable
CREATE TABLE "materiais" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "aulaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "materiais_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "aulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

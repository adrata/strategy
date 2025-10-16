-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('INDUSTRY', 'COMPANY', 'PERSON', 'GENERAL');

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "newsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newsIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "newsSources" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "source" VARCHAR(100) NOT NULL,
    "author" TEXT,
    "category" "NewsCategory" NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "relatedCompanyId" VARCHAR(30),
    "relatedPersonId" VARCHAR(30),
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "news_articles_workspaceId_publishedAt_idx" ON "news_articles"("workspaceId", "publishedAt");

-- CreateIndex
CREATE INDEX "news_articles_workspaceId_category_relevanceScore_idx" ON "news_articles"("workspaceId", "category", "relevanceScore");

-- CreateIndex
CREATE INDEX "news_articles_relatedCompanyId_idx" ON "news_articles"("relatedCompanyId");

-- CreateIndex
CREATE INDEX "news_articles_relatedPersonId_idx" ON "news_articles"("relatedPersonId");

-- CreateIndex
CREATE INDEX "news_articles_workspaceId_isRead_idx" ON "news_articles"("workspaceId", "isRead");

-- CreateIndex
CREATE INDEX "news_articles_workspaceId_isFavorite_idx" ON "news_articles"("workspaceId", "isFavorite");

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_relatedCompanyId_fkey" FOREIGN KEY ("relatedCompanyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_relatedPersonId_fkey" FOREIGN KEY ("relatedPersonId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

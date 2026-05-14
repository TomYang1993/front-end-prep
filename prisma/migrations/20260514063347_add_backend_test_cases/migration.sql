-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "functionName" TEXT,
ADD COLUMN     "hiddenTestCases" JSONB,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "publicTestCases" JSONB;

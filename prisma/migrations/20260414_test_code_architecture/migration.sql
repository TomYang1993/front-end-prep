-- AlterTable: Add test code fields to questions
ALTER TABLE "questions" ADD COLUMN "publicTestCode" TEXT;
ALTER TABLE "questions" ADD COLUMN "hiddenTestCode" TEXT;

-- AlterTable: Replace testCaseId with testName on submission_results
ALTER TABLE "submission_results" DROP CONSTRAINT IF EXISTS "submission_results_testCaseId_fkey";
ALTER TABLE "submission_results" DROP COLUMN "testCaseId";
ALTER TABLE "submission_results" ADD COLUMN "testName" TEXT NOT NULL DEFAULT '';

-- DropTable: test_cases
DROP TABLE IF EXISTS "test_cases";

-- DropEnum: TestVisibility
DROP TYPE IF EXISTS "TestVisibility";

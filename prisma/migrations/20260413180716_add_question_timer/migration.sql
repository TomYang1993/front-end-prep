-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "timeLimitMinutes" INTEGER;

-- CreateTable
CREATE TABLE "question_timers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeLimitMinutes" INTEGER NOT NULL,

    CONSTRAINT "question_timers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_timers_userId_questionId_key" ON "question_timers"("userId", "questionId");

-- AddForeignKey
ALTER TABLE "question_timers" ADD CONSTRAINT "question_timers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_timers" ADD CONSTRAINT "question_timers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

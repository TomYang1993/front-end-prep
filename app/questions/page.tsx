import { QuestionCard } from '@/components/question-card';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { listPublishedQuestions } from '@/lib/questions';

export const dynamic = 'force-dynamic';

export default async function QuestionsPage() {
  const user = await getCurrentServerUser();
  const questions = await listPublishedQuestions(user?.id);

  return (
    <section className="stack-gap">
      <div>
        <h1>Question Bank</h1>
        <p>Practice free questions, unlock premium via subscription or one-time packs.</p>
      </div>
      <div className="question-grid">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            slug={question.slug}
            title={question.title}
            difficulty={question.difficulty}
            type={question.type}
            accessTier={question.accessTier}
            tags={question.tags}
            locked={question.locked}
          />
        ))}
      </div>
    </section>
  );
}

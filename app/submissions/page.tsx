import { SubmissionHistory } from '@/components/submission-history';

export default function SubmissionsPage() {
  return (
    <section className="stack-gap">
      <div>
        <h1>Submission History</h1>
        <p>Track every hidden judge attempt and scoring trend.</p>
      </div>
      <SubmissionHistory />
    </section>
  );
}

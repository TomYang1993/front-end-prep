export default function QuestionDetailLayout({ children }: { children: React.ReactNode }) {
  // This passthrough layout overrides the /questions layout which wraps things in constraints
  // Allows the IDE workspace to go full width
  return <>{children}</>;
}

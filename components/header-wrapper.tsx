'use client';

import { usePathname } from 'next/navigation';

export function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide header on individual question pages (e.g., /questions/two-sum)
  // but keep it on the main questions list page (/questions)
  const isQuestionPage = pathname?.startsWith('/questions/') && pathname !== '/questions' && pathname !== '/questions/';
  
  if (isQuestionPage) {
    return null;
  }

  return <>{children}</>;
}

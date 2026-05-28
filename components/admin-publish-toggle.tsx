'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  id: string;
  isPublished: boolean;
}

export function AdminPublishToggle({ id, isPublished }: Props) {
  const router = useRouter();
  const [published, setPublished] = useState(isPublished);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !published;
    setPublished(next);
    startTransition(async () => {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: next }),
      });
      if (!res.ok) {
        setPublished(!next);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={
        published
          ? 'rounded px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
          : 'rounded px-2 py-0.5 text-xs bg-white/10 text-white/70 hover:bg-white/20'
      }
    >
      {published ? 'Published' : 'Draft'}
    </button>
  );
}

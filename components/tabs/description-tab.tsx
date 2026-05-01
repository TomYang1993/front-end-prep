import { MarkdownProse } from '@/components/markdown-prose';

interface DescriptionTabProps {
  prompt: string;
  tags: string[];
}

export function DescriptionTab({ prompt, tags }: DescriptionTabProps) {
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map((tag) => (
          <span key={tag} className="text-[0.65rem] py-1 px-2 bg-surface-raised rounded-sm text-ink-secondary">{tag}</span>
        ))}
      </div>
      <div className="text-[0.95rem] leading-[1.6] text-ink mb-8">
        <MarkdownProse>{prompt}</MarkdownProse>
      </div>
    </>
  );
}

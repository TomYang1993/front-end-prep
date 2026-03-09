'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { ProblemPlayground } from '@/components/problem-playground';
import { DiscussSection } from '@/components/discuss-section';

interface PublicTest {
    id: string;
    input: unknown;
    expected: unknown;
    explanation?: string | null;
}

interface SolutionView {
    id: string;
    language: string;
    framework: string | null;
    explanation: string;
    code: string;
    complexity: string | null;
}

interface ThreadView {
    id: string;
    title: string;
    body: string;
    author: string;
    commentsCount: number;
    likesCount: number;
}

interface QuestionTabsProps {
    questionId: string;
    type: 'FUNCTION_JS' | 'REACT_APP';
    starterCode?: Record<string, string>;
    publicTests: PublicTest[];
    solutions: SolutionView[];
    initialThreads: ThreadView[];
}

export function QuestionTabs({
    questionId,
    type,
    starterCode,
    publicTests,
    solutions,
    initialThreads,
}: QuestionTabsProps) {
    return (
        <Tabs.Root defaultValue="playground">
            <Tabs.List className="tabs-list" aria-label="Question sections">
                <Tabs.Trigger className="tabs-trigger" value="playground">
                    Playground
                </Tabs.Trigger>
                <Tabs.Trigger className="tabs-trigger" value="solutions">
                    Solutions ({solutions.length})
                </Tabs.Trigger>
                <Tabs.Trigger className="tabs-trigger" value="discuss">
                    Discuss ({initialThreads.length})
                </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content className="tabs-content" value="playground">
                <ProblemPlayground
                    questionId={questionId}
                    type={type}
                    starterCode={starterCode}
                    publicTests={publicTests}
                />
            </Tabs.Content>

            <Tabs.Content className="tabs-content" value="solutions">
                <section className="stack-gap">
                    {solutions.length === 0 ? (
                        <p>No official solution published yet.</p>
                    ) : (
                        solutions.map((solution) => (
                            <article key={solution.id} className="solution-item">
                                <p className="meta-row">
                                    <span>{solution.language}</span>
                                    <span>{solution.framework || 'n/a'}</span>
                                    <span>{solution.complexity || 'Complexity pending'}</span>
                                </p>
                                <p>{solution.explanation}</p>
                                <pre>
                                    <code>{solution.code}</code>
                                </pre>
                            </article>
                        ))
                    )}
                </section>
            </Tabs.Content>

            <Tabs.Content className="tabs-content" value="discuss">
                <DiscussSection questionId={questionId} initialThreads={initialThreads} />
            </Tabs.Content>
        </Tabs.Root>
    );
}

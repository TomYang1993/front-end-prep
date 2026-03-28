'use client';

import { useState, useEffect } from 'react';
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
}

export function QuestionTabs({
    questionId,
    type,
    starterCode,
    publicTests,
}: QuestionTabsProps) {
    const [solutions, setSolutions] = useState<SolutionView[]>([]);
    const [threads, setThreads] = useState<ThreadView[]>([]);
    const [loadingSolutions, setLoadingSolutions] = useState(false);
    const [loadingThreads, setLoadingThreads] = useState(false);
    const [activeTab, setActiveTab] = useState('playground');

    useEffect(() => {
        if (activeTab === 'solutions' && solutions.length === 0 && !loadingSolutions) {
            setLoadingSolutions(true);
            fetch(`/api/questions/${questionId}/solutions`)
                .then(res => res.json())
                .then(data => { if(Array.isArray(data)) setSolutions(data); })
                .finally(() => setLoadingSolutions(false));
        } else if (activeTab === 'discuss' && threads.length === 0 && !loadingThreads) {
            setLoadingThreads(true);
            fetch(`/api/questions/${questionId}/threads`)
                .then(res => res.json())
                .then(data => { if(Array.isArray(data)) setThreads(data); })
                .finally(() => setLoadingThreads(false));
        }
    }, [activeTab, questionId, solutions.length, threads.length, loadingSolutions, loadingThreads]);

    return (
        <Tabs.Root defaultValue="playground" onValueChange={setActiveTab}>
            <Tabs.List className="tabs-list" aria-label="Question sections">
                <Tabs.Trigger className="tabs-trigger" value="playground">
                    Playground
                </Tabs.Trigger>
                <Tabs.Trigger className="tabs-trigger" value="solutions">
                    Solutions
                </Tabs.Trigger>
                <Tabs.Trigger className="tabs-trigger" value="discuss">
                    Discuss
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
                    {loadingSolutions ? (
                        <p>Loading official solutions...</p>
                    ) : solutions.length === 0 ? (
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
                {loadingThreads ? (
                    <p>Loading discussion threads...</p>
                ) : (
                    <DiscussSection questionId={questionId} initialThreads={threads} />
                )}
            </Tabs.Content>
        </Tabs.Root>
    );
}

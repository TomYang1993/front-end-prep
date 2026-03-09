'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

interface ThreadView {
  id: string;
  title: string;
  body: string;
  author: string;
  commentsCount: number;
  likesCount: number;
}

interface DiscussSectionProps {
  questionId: string;
  initialThreads: ThreadView[];
}

export function DiscussSection({ questionId, initialThreads }: DiscussSectionProps) {
  const [threads, setThreads] = useState(initialThreads);
  const [commentDraftByThread, setCommentDraftByThread] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function createThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/discuss/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, title, body })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create thread');
      }

      setThreads((current) => [
        {
          id: data.thread.id,
          title: data.thread.title,
          body: data.thread.body,
          author: 'You',
          commentsCount: 0,
          likesCount: 0
        },
        ...current
      ]);
      setTitle('');
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create thread');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLike(threadId: string) {
    try {
      const response = await fetch('/api/discuss/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle like');
      }

      setThreads((current) =>
        current.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                likesCount: thread.likesCount + (data.liked ? 1 : -1)
              }
            : thread
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle like');
    }
  }

  async function addComment(threadId: string) {
    const commentBody = commentDraftByThread[threadId]?.trim();
    if (!commentBody) return;

    try {
      const response = await fetch('/api/discuss/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, body: commentBody })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add comment');
      }

      setCommentDraftByThread((current) => ({ ...current, [threadId]: '' }));
      setThreads((current) =>
        current.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                commentsCount: thread.commentsCount + 1
              }
            : thread
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add comment');
    }
  }

  return (
    <section className="discuss-block">
      <h3>Discuss</h3>
      <form onSubmit={createThread} className="form-stack">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Thread title"
          minLength={5}
          required
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What approach did you try?"
          rows={4}
          minLength={5}
          required
        />
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post thread'}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
      </form>

      <ul className="thread-list">
        {threads.map((thread) => (
          <li key={thread.id} className="thread-item">
            <h4>{thread.title}</h4>
            <p>{thread.body}</p>
            <p className="meta-row">
              <span>{thread.author}</span>
              <span>{thread.commentsCount} comments</span>
              <span>{thread.likesCount} likes</span>
            </p>
            <div className="cta-row">
              <button className="btn btn-secondary" type="button" onClick={() => toggleLike(thread.id)}>
                Like
              </button>
              <input
                value={commentDraftByThread[thread.id] || ''}
                onChange={(event) =>
                  setCommentDraftByThread((current) => ({ ...current, [thread.id]: event.target.value }))
                }
                placeholder="Add comment"
              />
              <button className="btn btn-secondary" type="button" onClick={() => addComment(thread.id)}>
                Comment
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

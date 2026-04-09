'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

const defaultStarterJs = `function solve(...args) {
  return null;
}`;

const defaultStarterPython = `def solve(*args):
    return None
`;

export function AdminQuestionForm() {
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState('');
  const [starterCode, setStarterCode] = useState(defaultStarterJs);
  const [type, setType] = useState<'FUNCTION_JS' | 'REACT_APP' | 'FUNCTION_PYTHON'>('FUNCTION_JS');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [accessTier, setAccessTier] = useState<'FREE' | 'PREMIUM'>('FREE');
  const [isPublished, setIsPublished] = useState(true);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slug,
          title,
          prompt,
          type,
          difficulty,
          accessTier,
          isPublished,
          tags: tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          content: {
            description: prompt
          },
          starterCode:
            type === 'REACT_APP'
              ? { react: starterCode }
              : type === 'FUNCTION_PYTHON'
                ? { python: starterCode }
                : { javascript: starterCode },
          testCases: [
            {
              visibility: 'PUBLIC',
              input: { args: [[1, 2], 3] },
              expected: [0, 1],
              sortOrder: 1,
              explanation: 'Sample test case'
            },
            {
              visibility: 'HIDDEN',
              input: { args: [[3, 2, 4], 6] },
              expected: [1, 2],
              sortOrder: 2
            }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create question');
      }

      setStatus(`Created question ${data.question.title}`);
      setSlug('');
      setTitle('');
      setPrompt('');
      setTags('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to create question');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="form-stack admin-form">
      <h3>Create Question</h3>
      <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="slug" required />
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="title" required />
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={5}
        placeholder="prompt"
        required
      />
      <input
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        placeholder="tags (comma-separated)"
      />
      <div className="grid-two">
        <label>
          Type
          <select value={type} onChange={(event) => {
            const val = event.target.value as 'FUNCTION_JS' | 'REACT_APP' | 'FUNCTION_PYTHON';
            setType(val);
            if (val === 'FUNCTION_PYTHON') setStarterCode(defaultStarterPython);
            else if (val !== 'REACT_APP') setStarterCode(defaultStarterJs);
          }}>
            <option value="FUNCTION_JS">FUNCTION_JS</option>
            <option value="REACT_APP">REACT_APP</option>
            <option value="FUNCTION_PYTHON">FUNCTION_PYTHON</option>
          </select>
        </label>
        <label>
          Difficulty
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
          >
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>
        </label>
      </div>
      <div className="grid-two">
        <label>
          Access Tier
          <select
            value={accessTier}
            onChange={(event) => setAccessTier(event.target.value as 'FREE' | 'PREMIUM')}
          >
            <option value="FREE">FREE</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
        </label>
        <label className="checkbox-line">
          <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
          Publish immediately
        </label>
      </div>
      <textarea
        value={starterCode}
        onChange={(event) => setStarterCode(event.target.value)}
        rows={8}
        placeholder="starter code"
        required
      />
      <button className="btn" disabled={submitting} type="submit">
        {submitting ? 'Creating...' : 'Create question'}
      </button>
      {status ? <p>{status}</p> : null}
    </form>
  );
}

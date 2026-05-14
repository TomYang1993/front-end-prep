import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const teamFreeSlots: SeedQuestion = {
  slug: 'team-free-slots',
  title: 'Team Free Slots',
  prompt: `Implement \`find_common_free_slots(users, range_start, range_end)\` — given a list of users and their busy calendar events, return every time range within the search window when **everyone** is free.

You are given:
- \`users\` — a list of user dicts, each with:
  - \`name\` — string
  - \`events\` — list of busy intervals, each \`{ "start_time": iso8601, "end_time": iso8601 }\`
- \`range_start\`, \`range_end\` — ISO 8601 UTC strings (e.g. \`"2024-06-02T00:00:00.000Z"\`) defining the search window

Return a list of \`{ "start_time": iso8601, "end_time": iso8601 }\` dicts.

### Example

\`\`\`python
users = [
    {"name": "carol", "events": [
        {"start_time": "2024-06-02T16:30:00.000Z", "end_time": "2024-06-02T17:30:00.000Z"},
    ]},
    {"name": "diego", "events": [
        {"start_time": "2024-06-02T16:30:00.000Z", "end_time": "2024-06-02T17:30:00.000Z"},
        {"start_time": "2024-06-02T18:30:00.000Z", "end_time": "2024-06-02T19:30:00.000Z"},
    ]},
]

find_common_free_slots(
    users,
    "2024-06-02T00:00:00.000Z",
    "2024-06-03T00:00:00.000Z",
)
# → [
#     {"start_time": "2024-06-02T00:00:00.000Z", "end_time": "2024-06-02T16:30:00.000Z"},
#     {"start_time": "2024-06-02T17:30:00.000Z", "end_time": "2024-06-02T18:30:00.000Z"},
#     {"start_time": "2024-06-02T19:30:00.000Z", "end_time": "2024-06-03T00:00:00.000Z"},
# ]
\`\`\`

### Rules

1. **Group is busy if anyone is busy** — a slot only counts as free when no user has an event covering it.
2. **Merge overlapping busy times** — events from different users may overlap partially or touch at the edges.
3. **Clip to the window** — only return slots inside \`[range_start, range_end]\`. Events that extend past the window count as busy only for the portion inside it.
4. **Sorted output** — ascending by \`start_time\`.
5. **No zero-length slots** — if two adjacent busy intervals fully cover a moment, do not emit an empty range there.

> [!tip] Interview Tip
> ISO 8601 UTC timestamps with the \`Z\` suffix and a fixed-width format compare correctly with plain string comparison. You don't need to parse them into \`datetime\` objects to sort or check ordering.
`,
  description:
    'Find every time range when an entire group of users is free, given their busy calendar events and a search window.',
  type: QuestionType.FUNCTION_PYTHON,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['interval', 'sorting', 'array'],
  starterCode: {
    python: `def find_common_free_slots(users, range_start, range_end):
    """
    Find time ranges within [range_start, range_end] when all users are free.

    Args:
        users: list of {"name": str, "events": [{"start_time": iso, "end_time": iso}]}
        range_start: ISO 8601 UTC string
        range_end: ISO 8601 UTC string

    Returns:
        Sorted list of {"start_time": iso, "end_time": iso} dicts.
    """
    return []
`,
  },
  language: 'python',
  functionName: 'find_common_free_slots',
  publicTestCases: [
    {
      name: 'two users with non-overlapping busy times',
      args: [
        [
          {
            name: 'carol',
            events: [
              { start_time: '2024-06-02T16:30:00.000Z', end_time: '2024-06-02T17:30:00.000Z' },
            ],
          },
          {
            name: 'diego',
            events: [
              { start_time: '2024-06-02T16:30:00.000Z', end_time: '2024-06-02T17:30:00.000Z' },
              { start_time: '2024-06-02T18:30:00.000Z', end_time: '2024-06-02T19:30:00.000Z' },
              { start_time: '2024-06-02T19:30:00.000Z', end_time: '2024-06-02T20:00:00.000Z' },
            ],
          },
        ],
        '2024-06-02T00:00:00.000Z',
        '2024-06-03T00:00:00.000Z',
      ],
      expected: [
        { start_time: '2024-06-02T00:00:00.000Z', end_time: '2024-06-02T16:30:00.000Z' },
        { start_time: '2024-06-02T17:30:00.000Z', end_time: '2024-06-02T18:30:00.000Z' },
        { start_time: '2024-06-02T20:00:00.000Z', end_time: '2024-06-03T00:00:00.000Z' },
      ],
    },
    {
      name: 'no busy events — entire window is free',
      args: [
        [
          { name: 'ana', events: [] },
          { name: 'ben', events: [] },
        ],
        '2024-06-02T09:00:00.000Z',
        '2024-06-02T17:00:00.000Z',
      ],
      expected: [
        { start_time: '2024-06-02T09:00:00.000Z', end_time: '2024-06-02T17:00:00.000Z' },
      ],
    },
  ],
  hiddenTestCases: [
    {
      name: 'three users with partial overlap',
      args: [
        [
          {
            name: 'carol',
            events: [
              { start_time: '2024-06-02T16:30:00.000Z', end_time: '2024-06-02T17:30:00.000Z' },
              { start_time: '2024-06-02T18:30:00.000Z', end_time: '2024-06-02T19:30:00.000Z' },
            ],
          },
          {
            name: 'priya',
            events: [
              { start_time: '2024-06-02T16:45:00.000Z', end_time: '2024-06-02T17:45:00.000Z' },
            ],
          },
          {
            name: 'diego',
            events: [
              { start_time: '2024-06-02T15:30:00.000Z', end_time: '2024-06-02T17:30:00.000Z' },
              { start_time: '2024-06-02T18:30:00.000Z', end_time: '2024-06-02T19:30:00.000Z' },
              { start_time: '2024-06-02T19:30:00.000Z', end_time: '2024-06-02T20:00:00.000Z' },
            ],
          },
        ],
        '2024-06-02T00:00:00.000Z',
        '2024-06-03T00:00:00.000Z',
      ],
      expected: [
        { start_time: '2024-06-02T00:00:00.000Z', end_time: '2024-06-02T15:30:00.000Z' },
        { start_time: '2024-06-02T17:45:00.000Z', end_time: '2024-06-02T18:30:00.000Z' },
        { start_time: '2024-06-02T20:00:00.000Z', end_time: '2024-06-03T00:00:00.000Z' },
      ],
    },
    {
      name: 'one user busy the entire window',
      args: [
        [
          {
            name: 'kai',
            events: [
              { start_time: '2024-06-02T00:00:00.000Z', end_time: '2024-06-03T00:00:00.000Z' },
            ],
          },
        ],
        '2024-06-02T00:00:00.000Z',
        '2024-06-03T00:00:00.000Z',
      ],
      expected: [],
    },
    {
      name: 'busy event extends past the window — clipped to window edges',
      args: [
        [
          {
            name: 'ren',
            events: [
              { start_time: '2024-06-01T22:00:00.000Z', end_time: '2024-06-02T08:00:00.000Z' },
              { start_time: '2024-06-02T22:00:00.000Z', end_time: '2024-06-03T04:00:00.000Z' },
            ],
          },
        ],
        '2024-06-02T00:00:00.000Z',
        '2024-06-03T00:00:00.000Z',
      ],
      expected: [
        { start_time: '2024-06-02T08:00:00.000Z', end_time: '2024-06-02T22:00:00.000Z' },
      ],
    },
    {
      name: 'adjacent busy intervals merge into one gap, not two',
      args: [
        [
          {
            name: 'tess',
            events: [
              { start_time: '2024-06-02T10:00:00.000Z', end_time: '2024-06-02T11:00:00.000Z' },
              { start_time: '2024-06-02T11:00:00.000Z', end_time: '2024-06-02T12:00:00.000Z' },
            ],
          },
        ],
        '2024-06-02T09:00:00.000Z',
        '2024-06-02T13:00:00.000Z',
      ],
      expected: [
        { start_time: '2024-06-02T09:00:00.000Z', end_time: '2024-06-02T10:00:00.000Z' },
        { start_time: '2024-06-02T12:00:00.000Z', end_time: '2024-06-02T13:00:00.000Z' },
      ],
    },
    {
      name: 'events fully outside the window are ignored',
      args: [
        [
          {
            name: 'lin',
            events: [
              { start_time: '2024-06-01T10:00:00.000Z', end_time: '2024-06-01T12:00:00.000Z' },
              { start_time: '2024-06-03T10:00:00.000Z', end_time: '2024-06-03T12:00:00.000Z' },
            ],
          },
        ],
        '2024-06-02T00:00:00.000Z',
        '2024-06-03T00:00:00.000Z',
      ],
      expected: [
        { start_time: '2024-06-02T00:00:00.000Z', end_time: '2024-06-03T00:00:00.000Z' },
      ],
    },
    {
      name: 'empty users list — entire window is free',
      args: [[], '2024-06-02T00:00:00.000Z', '2024-06-02T12:00:00.000Z'],
      expected: [
        { start_time: '2024-06-02T00:00:00.000Z', end_time: '2024-06-02T12:00:00.000Z' },
      ],
    },
    {
      name: "user with one event nested inside another user's longer event",
      args: [
        [
          {
            name: 'outer',
            events: [
              { start_time: '2024-06-02T13:00:00.000Z', end_time: '2024-06-02T16:00:00.000Z' },
            ],
          },
          {
            name: 'inner',
            events: [
              { start_time: '2024-06-02T14:00:00.000Z', end_time: '2024-06-02T15:00:00.000Z' },
            ],
          },
        ],
        '2024-06-02T12:00:00.000Z',
        '2024-06-02T17:00:00.000Z',
      ],
      expected: [
        { start_time: '2024-06-02T12:00:00.000Z', end_time: '2024-06-02T13:00:00.000Z' },
        { start_time: '2024-06-02T16:00:00.000Z', end_time: '2024-06-02T17:00:00.000Z' },
      ],
    },
  ],
  solutions: [
    {
      language: 'python',
      explanation: `## Sweep, merge, invert

The trick is to skip per-user inversion entirely. Anyone being busy makes the group busy, so the **union** of every user's events is the group's busy schedule. The free slots are just the gaps in that union, clipped to the window.

### 1. Collect every busy interval

Flatten all events from all users into one list of \`(start, end)\` tuples. The user names don't matter for the answer.

### 2. Sort and merge

Sort by \`start_time\`. Then walk the list and merge overlapping or touching intervals into one. Two intervals \`[a, b]\` and \`[c, d]\` merge when \`c <= b\`; the result extends to \`max(b, d)\`.

ISO 8601 UTC strings sort lexicographically when the format is fixed-width (which it is here), so \`<\` works directly on strings — no \`datetime\` parsing needed.

### 3. Invert against the window

Walk the merged busy intervals with a \`cursor\` starting at \`range_start\`:

- Skip intervals fully before the window.
- Stop at intervals fully after \`range_end\`.
- Clip each interval to \`[cursor, range_end]\`.
- Whenever \`cursor < clipped_start\`, emit a free slot \`[cursor, clipped_start]\` and advance.

After the loop, if \`cursor < range_end\`, emit a final \`[cursor, range_end]\` slot.

The "no zero-length slots" rule falls out naturally from the \`cursor < clipped_start\` guard, which also handles adjacent (touching) intervals correctly.`,
      code: `def find_common_free_slots(users, range_start, range_end):
    intervals = []
    for user in users:
        for event in user["events"]:
            intervals.append([event["start_time"], event["end_time"]])

    intervals.sort()

    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            if end > merged[-1][1]:
                merged[-1][1] = end
        else:
            merged.append([start, end])

    free = []
    cursor = range_start
    for start, end in merged:
        if end <= cursor:
            continue
        if start >= range_end:
            break
        clipped_start = max(start, cursor)
        clipped_end = min(end, range_end)
        if cursor < clipped_start:
            free.append({"start_time": cursor, "end_time": clipped_start})
        cursor = clipped_end

    if cursor < range_end:
        free.append({"start_time": cursor, "end_time": range_end})

    return free`,
      complexity: 'O(N log N) where N = total events across all users',
    },
  ],
};

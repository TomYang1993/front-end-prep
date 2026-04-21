import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const autocompleteSearch: SeedQuestion = {
  slug: 'autocomplete-search',
  title: 'Autocomplete Search',
  prompt: 'Build an autocomplete search input that fetches and displays suggestions as the user types. Handle debounced API calls, keyboard navigation through results (arrow keys + enter), loading and empty states, and click-outside to dismiss. Use a provided mock fetch function for data.',
  description: 'Build a search input with autocomplete suggestions, debounced fetching, and keyboard navigation.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['react', 'a11y', 'performance'],
  starterCode: {
    react: `const mockFetch = (query) =>
  new Promise((resolve) =>
    setTimeout(() => resolve(
      ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"]
        .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    ), 200)
  );

export default function AutocompleteSearch() {
  return <input type="text" placeholder="Search..." />;
}`,
    reactTypescript: `const mockFetch = (query: string): Promise<string[]> =>
  new Promise((resolve) =>
    setTimeout(() => resolve(
      ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"]
        .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    ), 200)
  );

export default function AutocompleteSearch(): JSX.Element {
  return <input type="text" placeholder="Search..." />;
}`,
  },
  publicTestCode: `test('renders search input', () => {
  render(<AutocompleteSearch />);
  expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
});`,
};

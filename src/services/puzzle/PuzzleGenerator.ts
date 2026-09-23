import type { Puzzle, PuzzleOption, PuzzleType } from '../../types/puzzle';

type Rand = () => number;

const int = (rand: Rand, min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

function shuffle<T>(items: T[], rand: Rand): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toOptions(values: string[], correct: string, rand: Rand) {
  const options: PuzzleOption[] = shuffle(values, rand).map((label, i) => ({ id: `o${i}`, label }));
  const correctAnswerId = options.find(o => o.label === correct)!.id;
  return { options, correctAnswerId };
}

function arithmetic(rand: Rand): Omit<Puzzle, 'id'> {
  const a = int(rand, 2, 9);
  const b = int(rand, 2, 9);
  const answer = a + b;
  // Pick 3 distinct near-miss answers from a fixed candidate list (no rejection loop, so it always terminates).
  const nearby = [-3, -2, -1, 1, 2, 3, 4].map(d => answer + d).filter(w => w > 0);
  const wrong = shuffle(nearby, rand).slice(0, 3);
  const values = [answer, ...wrong].map(String);
  return { type: 'arithmetic', question: `What is ${a} + ${b}?`, ...toOptions(values, String(answer), rand) };
}

function tapNumber(rand: Rand): Omit<Puzzle, 'id'> {
  const pool = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand).slice(0, 4);
  const target = pool[int(rand, 0, 3)];
  return { type: 'tap_number', question: `Tap the number ${target}`, ...toOptions(pool.map(String), String(target), rand) };
}

const WORD_SETS = [
  ['Apple', 'Banana', 'Orange'],
  ['Coffee', 'Mango', 'Tea'],
  ['Bread', 'Rice', 'Noodle'],
  ['Cloud', 'Rain', 'Sun'],
  ['Desk', 'Pencil', 'Window'],
  ['Guitar', 'Piano', 'Violin'],
];

function alphabetical(rand: Rand): Omit<Puzzle, 'id'> {
  const words = WORD_SETS[int(rand, 0, WORD_SETS.length - 1)];
  const first = [...words].sort()[0];
  return {
    type: 'alphabetical',
    question: 'Which word comes first alphabetically?',
    ...toOptions(words, first, rand),
  };
}

const BUILDERS: Record<PuzzleType, (r: Rand) => Omit<Puzzle, 'id'>> = {
  arithmetic,
  tap_number: tapNumber,
  alphabetical,
};

/** Easy by design: a little active thinking, never a morning math exam. */
export function generatePuzzle(rand: Rand = Math.random, type?: PuzzleType): Puzzle {
  const types = Object.keys(BUILDERS) as PuzzleType[];
  const chosen = type ?? types[int(rand, 0, types.length - 1)];
  return { id: `pz_${Date.now().toString(36)}_${int(rand, 0, 9999)}`, ...BUILDERS[chosen](rand) };
}

export function isPuzzleAnswerCorrect(puzzle: Puzzle, optionId: string): boolean {
  return puzzle.correctAnswerId === optionId;
}

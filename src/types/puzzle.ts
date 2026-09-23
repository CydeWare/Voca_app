export type PuzzleType = 'arithmetic' | 'tap_number' | 'alphabetical';

export type PuzzleOption = { id: string; label: string };

export type Puzzle = {
  id: string;
  type: PuzzleType;
  question: string;
  options: PuzzleOption[];
  correctAnswerId: string;
};

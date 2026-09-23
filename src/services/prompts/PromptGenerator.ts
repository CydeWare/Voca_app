import { PROMPTS } from '../../data/prompts/prompts';
import type { Prompt, PromptCategory, PromptDifficulty } from '../../types/prompt';

export type GeneratePromptInput = {
  category: PromptCategory;
  difficulty: PromptDifficulty;
  recentIds?: string[];
  pool?: Prompt[];
  random?: () => number;
};

const DIFFICULTY_ORDER: PromptDifficulty[] = ['easy', 'normal', 'hard'];

/**
 * Picks a prompt for the alarm:
 * 1. filter by category (random = all categories)
 * 2. prefer the requested difficulty, then the nearest difficulty
 * 3. avoid recently used prompts; only repeat if everything has been used
 */
function generatePrompt({
  category,
  difficulty,
  recentIds = [],
  pool = PROMPTS,
  random = Math.random,
}: GeneratePromptInput): Prompt {
  const inCategory = category === 'random' ? pool : pool.filter(p => p.category === category);
  const base = inCategory.length ? inCategory : pool;

  const target = DIFFICULTY_ORDER.indexOf(difficulty);
  const byDistance = [...DIFFICULTY_ORDER].sort(
    (a, b) => Math.abs(DIFFICULTY_ORDER.indexOf(a) - target) - Math.abs(DIFFICULTY_ORDER.indexOf(b) - target),
  );

  const recent = new Set(recentIds);
  for (const d of byDistance) {
    const fresh = base.filter(p => p.difficulty === d && !recent.has(p.id));
    if (fresh.length) return fresh[Math.floor(random() * fresh.length)];
  }
  // Everything was used recently: pick the least recently used prompt at the requested difficulty.
  const sameDifficulty = base.filter(p => p.difficulty === difficulty);
  const candidates = sameDifficulty.length ? sameDifficulty : base;
  let best = candidates[0];
  let bestIndex = Infinity;
  for (const p of candidates) {
    const idx = recentIds.lastIndexOf(p.id);
    if (idx < bestIndex) {
      bestIndex = idx;
      best = p;
    }
  }
  return best;
}

export const PromptGenerator = { generatePrompt };

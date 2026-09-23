import { PROMPTS } from '../src/data/prompts/prompts';
import { PromptGenerator } from '../src/services/prompts/PromptGenerator';
import { generatePuzzle, isPuzzleAnswerCorrect } from '../src/services/puzzle/PuzzleGenerator';

describe('prompt dataset', () => {
  it('is large and has unique ids', () => {
    expect(PROMPTS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(PROMPTS.map(p => p.id)).size).toBe(PROMPTS.length);
  });
  it('covers every category', () => {
    for (const c of ['motivation', 'fun_fact', 'tongue_twister']) {
      expect(PROMPTS.some(p => p.category === c)).toBe(true);
    }
  });
});

describe('PromptGenerator', () => {
  it('respects category and difficulty', () => {
    for (let i = 0; i < 50; i++) {
      const p = PromptGenerator.generatePrompt({ category: 'tongue_twister', difficulty: 'easy' });
      expect(p.category).toBe('tongue_twister');
      expect(p.difficulty).toBe('easy');
    }
  });
  it('does not repeat recent prompts', () => {
    const recent: string[] = [];
    for (let i = 0; i < 20; i++) {
      const p = PromptGenerator.generatePrompt({ category: 'fun_fact', difficulty: 'normal', recentIds: recent });
      expect(recent).not.toContain(p.id);
      recent.push(p.id);
    }
  });
  it('still returns something when everything was used recently', () => {
    const all = PROMPTS.map(p => p.id);
    const p = PromptGenerator.generatePrompt({ category: 'random', difficulty: 'hard', recentIds: all });
    expect(p).toBeDefined();
  });
});

describe('fallback puzzles', () => {
  it('always contain their correct answer', () => {
    for (let i = 0; i < 200; i++) {
      const pz = generatePuzzle();
      expect(pz.options.some(o => o.id === pz.correctAnswerId)).toBe(true);
      expect(isPuzzleAnswerCorrect(pz, pz.correctAnswerId)).toBe(true);
      expect(new Set(pz.options.map(o => o.label)).size).toBe(pz.options.length);
    }
  });
});

import { WORD_MATCH_THRESHOLD } from '../constants';
import { normalizeText, tokenize } from './textNormalization';

/** Classic Levenshtein distance (two-row DP). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** 1 = identical, 0 = completely different. */
export function stringSimilarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - levenshtein(a, b) / longest;
}

/**
 * Rough "sounds-alike" key so recognizer spellings of the same sound still match:
 * lorry/lori, colour/color, phone/fone, sells/selz, knight/nite-ish.
 */
export function soundKey(word: string): string {
  return word
    .replace(/^kn/, 'n')
    .replace(/^wr/, 'r')
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/q/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/gh/g, '')
    .replace(/ou/g, 'o')
    .replace(/y$/, 'i')
    .replace(/ie$/, 'i')
    .replace(/ee/g, 'i')
    .replace(/(.)\1+/g, '$1');
}

export function wordsMatch(target: string, spoken: string): boolean {
  if (target === spoken) return true;
  // Short words must match exactly-ish, otherwise "a"/"i" would match everything.
  if (target.length <= 2) return false;
  if (stringSimilarity(target, spoken) >= WORD_MATCH_THRESHOLD) return true;
  const a = soundKey(target);
  const b = soundKey(spoken);
  return a === b || (a.length > 3 && stringSimilarity(a, b) >= WORD_MATCH_THRESHOLD);
}

/**
 * Longest common subsequence of words with fuzzy equality.
 * Returns which target-word indexes were matched, in order.
 */
export function matchWordsInOrder(targetWords: string[], spokenWords: string[]): boolean[] {
  const n = targetWords.length;
  const m = spokenWords.length;
  // Suffix DP so the forward walk below prefers the EARLIEST target word for each spoken word.
  // That keeps live highlighting moving left-to-right ("red lorry" lights words 1-2, not 1 and 4).
  const eq: boolean[][] = targetWords.map(t => spokenWords.map(w => wordsMatch(t, w)));
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = eq[i][j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const matched = new Array<boolean>(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (eq[i][j] && dp[i][j] === dp[i + 1][j + 1] + 1) {
      matched[i] = true;
      i++;
      j++;
    } else if (dp[i][j + 1] >= dp[i + 1][j]) {
      j++; // skip an extra spoken word ("um")
    } else {
      i++; // skip a target word
    }
  }
  return matched;
}

export type SimilarityBreakdown = {
  score: number;
  wordRecall: number;
  charSimilarity: number;
  matchedWords: boolean[];
};

/**
 * Tolerant score for "did the user read this sentence":
 *  - 70% word recall: fraction of target words spoken, in order, fuzzy per word
 *  - 30% whole-string character similarity
 * Recall-weighted so accents, hoarse voices and small mis-transcriptions still pass,
 * while unrelated speech ("I want to go back to sleep") scores low.
 */
export function scoreSpeech(targetText: string, recognizedText: string): SimilarityBreakdown {
  const targetWords = tokenize(targetText);
  const spokenWords = tokenize(recognizedText);
  if (!targetWords.length) {
    return { score: 0, wordRecall: 0, charSimilarity: 0, matchedWords: [] };
  }
  const matchedWords = matchWordsInOrder(targetWords, spokenWords);
  const wordRecall = matchedWords.filter(Boolean).length / targetWords.length;
  const charSimilarity = stringSimilarity(normalizeText(targetText), normalizeText(recognizedText));
  const score = Math.round((0.7 * wordRecall + 0.3 * charSimilarity) * 1000) / 1000;
  return { score, wordRecall, charSimilarity, matchedWords };
}

export function calculateSpeechSimilarity(targetText: string, recognizedText: string): number {
  return scoreSpeech(targetText, recognizedText).score;
}

/** Best score across the recognizer's alternative transcriptions. */
export function bestCandidateScore(
  targetText: string,
  candidates: string[],
): { score: number; text: string } {
  let best = { score: 0, text: candidates[0] ?? '' };
  for (const c of candidates) {
    const s = calculateSpeechSimilarity(targetText, c);
    if (s > best.score) best = { score: s, text: c };
  }
  return best;
}

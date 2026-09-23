import { STRICTNESS_THRESHOLDS } from '../../constants';
import type { VoiceStrictness } from '../../types/speech';
import { bestCandidateScore, scoreSpeech } from '../../utils/similarity';
import { tokenize } from '../../utils/textNormalization';

export type MatchResult = { passed: boolean; score: number; text: string; threshold: number };

export const SpeechMatcher = {
  thresholdFor(strictness: VoiceStrictness) {
    return STRICTNESS_THRESHOLDS[strictness];
  },

  /** Final verification: best of the recognizer's alternatives against the threshold. */
  verify(target: string, candidates: string[], strictness: VoiceStrictness): MatchResult {
    const threshold = STRICTNESS_THRESHOLDS[strictness];
    const best = bestCandidateScore(target, candidates);
    return { passed: best.score >= threshold, score: best.score, text: best.text, threshold };
  },

  /** For live highlighting: which target words (by display index) have been spoken so far. */
  spokenWordFlags(target: string, partial: string): boolean[] {
    return scoreSpeech(target, partial).matchedWords;
  },

  targetWordCount(target: string) {
    return tokenize(target).length;
  },
};

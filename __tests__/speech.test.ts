import { normalizeText, tokenize } from '../src/utils/textNormalization';
import { calculateSpeechSimilarity, levenshtein } from '../src/utils/similarity';
import { SpeechMatcher } from '../src/services/speech/SpeechMatcher';
import { SPEECH_MATCH_THRESHOLD } from '../src/constants';

describe('normalizeText', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeText('Hello World!')).toBe('hello world');
  });
  it('collapses whitespace and curly quotes', () => {
    expect(normalizeText('  “Red   lorry,”  yellow lorry. ')).toBe('red lorry yellow lorry');
  });
  it('turns digits into words so "3" matches "three"', () => {
    expect(normalizeText('Octopuses have 3 hearts.')).toBe('octopuses have three hearts');
  });
  it('expands contractions', () => {
    expect(tokenize("Don't stop")).toEqual(['do', 'not', 'stop']);
  });
});

describe('similarity', () => {
  it('levenshtein basics', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });
  it('is 1 for identical normalized text', () => {
    expect(calculateSpeechSimilarity('Red lorry yellow lorry.', 'red lorry yellow lorry')).toBeCloseTo(1);
  });
});

describe('SpeechMatcher.verify', () => {
  const target = 'Red lorry yellow lorry.';
  it('passes a correct reading', () => {
    expect(SpeechMatcher.verify(target, ['Red lorry yellow lorry'], 'normal').passed).toBe(true);
  });
  it('fails an unrelated sentence', () => {
    const r = SpeechMatcher.verify(target, ['I want to go back to sleep'], 'normal');
    expect(r.passed).toBe(false);
    expect(r.score).toBeLessThan(0.5);
  });
  it('tolerates small recognizer spelling slips (morning voice)', () => {
    expect(SpeechMatcher.verify(target, ['red lori yellow lorry'], 'normal').passed).toBe(true);
  });
  it('fails a half-read sentence', () => {
    const long = 'Small actions repeated consistently create big results.';
    expect(SpeechMatcher.verify(long, ['small actions'], 'normal').passed).toBe(false);
  });
  it('uses the best of several alternatives', () => {
    const r = SpeechMatcher.verify(target, ['bread lorry', 'red lorry yellow lorry'], 'normal');
    expect(r.passed).toBe(true);
    expect(r.text).toBe('red lorry yellow lorry');
  });
  it('rejects empty input', () => {
    expect(SpeechMatcher.verify(target, [''], 'relaxed').passed).toBe(false);
    expect(SpeechMatcher.verify(target, [], 'relaxed').passed).toBe(false);
  });
  it('normal strictness uses the configured threshold', () => {
    expect(SpeechMatcher.thresholdFor('normal')).toBe(SPEECH_MATCH_THRESHOLD);
  });
  it('flags spoken words for live highlighting', () => {
    expect(SpeechMatcher.spokenWordFlags(target, 'red lorry')).toEqual([true, true, false, false]);
  });
});

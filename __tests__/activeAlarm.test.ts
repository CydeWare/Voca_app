import reducer, {
  alarmDismissed,
  alarmTriggered,
  attemptFailed,
  canTransition,
  fallbackRequested,
  initialActiveAlarmState,
  listeningStarted,
  partialResult,
  puzzleAnswered,
  ringingStarted,
  verificationPassed,
  verificationStarted,
} from '../src/store/slices/activeAlarmSlice';
import { generatePuzzle } from '../src/services/puzzle/PuzzleGenerator';
import type { Prompt } from '../src/types/prompt';

const info = {
  alarmId: 'a1',
  scheduledAt: 1000,
  triggeredAt: 1000,
  soundId: 'voca_pulse',
  vibration: true,
  isTest: false,
  audioError: false,
};
const prompt: Prompt = { id: 'p1', text: 'Red lorry yellow lorry.', category: 'tongue_twister', difficulty: 'easy' };
const puzzle = generatePuzzle(() => 0.3, 'arithmetic');

function ringing() {
  let s = reducer(initialActiveAlarmState, alarmTriggered(info));
  s = reducer(s, ringingStarted({ prompt }));
  return s;
}
const fail = (s: ReturnType<typeof ringing>) =>
  reducer(s, attemptFailed({ feedback: 'try again', score: 0.3, fallbackPuzzle: puzzle, maxAttempts: 3 }));

describe('active alarm state machine', () => {
  beforeAll(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));

  it('IDLE -> TRIGGERING -> RINGING', () => {
    const t = reducer(initialActiveAlarmState, alarmTriggered(info));
    expect(t.status).toBe('TRIGGERING');
    const r = reducer(t, ringingStarted({ prompt }));
    expect(r.status).toBe('RINGING');
    expect(r.prompt?.id).toBe('p1');
  });

  it('happy path: LISTENING -> VERIFYING -> SUCCESS -> DISMISSED', () => {
    let s = reducer(ringing(), listeningStarted({ engine: 'on_device' }));
    expect(s.status).toBe('LISTENING');
    s = reducer(s, verificationStarted('red lorry yellow lorry'));
    expect(s.status).toBe('VERIFYING');
    s = reducer(s, verificationPassed({ score: 0.95 }));
    expect(s.status).toBe('SUCCESS');
    expect(s.dismissalMethod).toBe('speech');
    expect(s.attempts).toBe(1);
    s = reducer(s, alarmDismissed());
    expect(s.status).toBe('DISMISSED');
  });

  it('partial results never change the state', () => {
    let s = reducer(ringing(), listeningStarted({ engine: 'on_device' }));
    s = reducer(s, partialResult('red lorry yellow lorry'));
    expect(s.status).toBe('LISTENING');
    expect(s.partialText).toBe('red lorry yellow lorry');
  });

  it('VERIFYING -> RETRYING on a bad read, then FALLBACK after max attempts', () => {
    let s = ringing();
    for (let i = 1; i <= 2; i++) {
      s = reducer(s, listeningStarted({ engine: 'on_device' }));
      s = reducer(s, verificationStarted('nope'));
      s = fail(s);
      expect(s.status).toBe('RETRYING');
      expect(s.attempts).toBe(i);
    }
    s = reducer(s, listeningStarted({ engine: 'on_device' }));
    s = fail(s);
    expect(s.status).toBe('FALLBACK');
    expect(s.puzzle).not.toBeNull();
  });

  it('FALLBACK -> SUCCESS -> DISMISSED via puzzle; wrong answers keep ringing', () => {
    let s = reducer(ringing(), fallbackRequested({ puzzle, reason: 'no mic' }));
    expect(s.status).toBe('FALLBACK');
    s = reducer(s, puzzleAnswered({ correct: false, nextPuzzle: puzzle }));
    expect(s.status).toBe('FALLBACK');
    expect(s.puzzleMistakes).toBe(1);
    s = reducer(s, puzzleAnswered({ correct: true, nextPuzzle: puzzle }));
    expect(s.status).toBe('SUCCESS');
    expect(s.dismissalMethod).toBe('fallback');
    expect(reducer(s, alarmDismissed()).status).toBe('DISMISSED');
  });

  it('rejects illegal transitions (cannot dismiss while ringing)', () => {
    const s = reducer(ringing(), alarmDismissed());
    expect(s.status).toBe('RINGING');
    expect(canTransition('RINGING', 'DISMISSED')).toBe(false);
    expect(canTransition('LISTENING', 'SUCCESS')).toBe(false);
  });

  it('ignores the same ring reported twice', () => {
    const s = ringing();
    expect(reducer(s, alarmTriggered(info))).toBe(s);
  });
});

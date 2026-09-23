import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { THEME_LIST, ThemeScope, useTheme } from '../src/theme';
import { PrimaryButton, SecondaryButton } from '../src/components/Buttons';
import { PromptDisplay } from '../src/components/PromptDisplay/PromptDisplay';
import { VoiceIndicator } from '../src/components/VoiceIndicator/VoiceIndicator';
import { AlarmCard } from '../src/components/AlarmCard/AlarmCard';
import { PuzzleView } from '../src/components/Puzzle/PuzzleView';
import { OrnamentDivider, ThemeDecor } from '../src/components/ThemeDecor/ThemeDecor';
import { ThemePreviewCard } from '../src/components/ThemePreviewCard/ThemePreviewCard';
import { generatePuzzle } from '../src/services/puzzle/PuzzleGenerator';
import type { Alarm } from '../src/types/alarm';

const alarm: Alarm = {
  id: 'a1', hour: 6, minute: 40, label: '', enabled: true, repeatDays: [1, 2, 3, 4, 5], soundId: 'voca_sunrise',
  volume: 0.7, promptCategory: 'random', difficulty: 'normal', vibrationEnabled: true,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

function ThemeName() {
  return <Text>{useTheme().id}</Text>;
}

describe.each(THEME_LIST.map(t => [t.id, t] as const))('components under "%s"', (id, theme) => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  it('render without errors', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ThemeScope theme={theme}>
          <ThemeName />
          <ThemeDecor variant="hero" />
          <ThemeDecor variant="ambient" />
          <OrnamentDivider />
          <PrimaryButton label="Go" onPress={() => {}} />
          <SecondaryButton label="Later" onPress={() => {}} />
          <PromptDisplay text="The restless lighthouse" tokenFlags={[true, false, false]} />
          <VoiceIndicator listening={false} level={0} onPress={() => {}} label="Tap" reduceMotion />
          <AlarmCard alarm={alarm} isNext onPress={() => {}} onLongPress={() => {}} onToggle={() => {}} />
          <PuzzleView puzzle={generatePuzzle()} mistakes={0} onAnswer={() => {}} />
          <ThemePreviewCard theme={theme} selected onSelect={() => {}} />
        </ThemeScope>,
      );
    });
    expect(tree.root.findAllByType(Text).some(n => n.props.children === id)).toBe(true);
    act(() => tree.unmount());
  });
});

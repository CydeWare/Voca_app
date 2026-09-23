import React, { useCallback, useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useThemed, type AppTheme } from '../../theme';
import { pad2 } from '../../utils/dateUtils';

const ITEM_H = 64;
const VISIBLE = 3;

type WheelProps = {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
};

function Wheel({ values, value, onChange, label }: WheelProps) {
  const { styles } = useThemed(makeStyles);
  const ref = useRef<ScrollViewInstance>(null);
  const lastIndex = useRef(values.indexOf(value));

  const scrollTo = useCallback(
    (index: number, animated: boolean) => ref.current?.scrollTo({ y: index * ITEM_H, animated }),
    [],
  );

  // Follow external changes (e.g. quick-set chips) without fighting the user's scroll.
  useEffect(() => {
    const idx = values.indexOf(value);
    if (idx >= 0 && idx !== lastIndex.current) {
      lastIndex.current = idx;
      scrollTo(idx, true);
    }
  }, [value, values, scrollTo]);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.max(0, Math.min(values.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));
    if (idx !== lastIndex.current) {
      lastIndex.current = idx;
      onChange(values[idx]);
    }
  };

  const step = (delta: number) => {
    const idx = (values.indexOf(value) + delta + values.length) % values.length;
    lastIndex.current = idx;
    scrollTo(idx, true);
    onChange(values[idx]);
  };

  return (
    <View
      style={styles.wheel}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: pad2(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        nestedScrollEnabled
        onLayout={() => scrollTo(Math.max(0, values.indexOf(value)), false)}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        contentContainerStyle={{ paddingVertical: ITEM_H * ((VISIBLE - 1) / 2) }}>
        {values.map(v => (
          <Pressable key={v} onPress={() => step(values.indexOf(v) - values.indexOf(value))} style={styles.item}>
            <Text style={[styles.itemText, v === value && styles.itemActive]}>{pad2(v)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function AlarmTimePicker({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}) {
  const { styles } = useThemed(makeStyles);
  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.band} />
      <Wheel label="Hour" values={HOURS} value={hour} onChange={h => onChange(h, minute)} />
      <Text style={styles.colon}>:</Text>
      <Wheel label="Minute" values={MINUTES} value={minute} onChange={m => onChange(hour, m)} />
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  container: {
    height: ITEM_H * VISIBLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  band: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: ITEM_H,
    height: ITEM_H,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.primarySoft,
  },
  wheel: { width: 110, height: ITEM_H * VISIBLE },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText: { ...t.type.clockLarge, color: t.colors.onHeroSoft },
  itemActive: { color: t.colors.textPrimary },
  colon: { ...t.type.clockLarge, color: t.colors.textPrimary, marginTop: -6 },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../Buttons';
import { space, useThemed, type AppTheme } from '../../theme';

type Props = {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  dark?: boolean;
};

export function PermissionCard({ title, body, actionLabel, onAction, secondaryLabel, onSecondary, dark }: Props) {
  const { t, styles } = useThemed(makeStyles);
  return (
    <View style={[styles.card, dark && styles.cardDark]}>
      <Text style={[styles.title, dark && { color: t.colors.onHero }]}>{title}</Text>
      <Text style={[styles.body, dark && { color: t.colors.onHeroSoft }]}>{body}</Text>
      <PrimaryButton label={actionLabel} onPress={onAction} tone={dark ? 'dawn' : 'brand'} style={{ marginTop: space.lg }} />
      {secondaryLabel && onSecondary ? (
        <SecondaryButton label={secondaryLabel} onPress={onSecondary} tone={dark ? 'light' : undefined} />
      ) : null}
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  card: { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, padding: space.xl },
  cardDark: { backgroundColor: t.colors.heroRaised },
  title: { ...t.type.heading, color: t.colors.textPrimary },
  body: { ...t.type.body, color: t.colors.textSecondary, marginTop: space.sm },
});

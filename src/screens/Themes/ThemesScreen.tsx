import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SecondaryButton } from '../../components/Buttons';
import { ThemePreviewCard } from '../../components/ThemePreviewCard/ThemePreviewCard';
import { useStatusBar } from '../../hooks/useStatusBar';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetTheme, selectThemeId, setTheme } from '../../store/slices/themeSlice';
import { space, THEME_LIST, useThemed, type AppTheme } from '../../theme';

export function ThemesScreen() {
  const { t, styles } = useThemed(makeStyles);
  useStatusBar('app');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector(selectThemeId);

  // Applies instantly: every screen reads the theme from context.
  const onSelect = useCallback((id: string) => dispatch(setTheme(id)), [dispatch]);

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>
      <FlatList
        data={THEME_LIST}
        keyExtractor={item => item.id}
        extraData={selectedId}
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: insets.bottom + space.xxl }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              Themes
            </Text>
            <Text style={styles.subtitle}>
              Change how VOCA looks, from the home screen to the alarm itself. Your choice is saved on this phone.
            </Text>
          </View>
        }
        renderItem={({ item }) => <ThemePreviewCard theme={item} selected={item.id === selectedId} onSelect={onSelect} />}
        ListFooterComponent={
          selectedId !== THEME_LIST[0].id ? (
            <SecondaryButton label="Reset to VOCA Classic" onPress={() => dispatch(resetTheme())} />
          ) : undefined
        }
        accessibilityRole="radiogroup"
        initialNumToRender={4}
        windowSize={5}
      />
      <Text style={styles.srOnly} accessibilityLiveRegion="polite">
        {`${t.name} theme active`}
      </Text>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.colors.background },
    topBar: { paddingHorizontal: space.md },
    back: { height: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: space.sm },
    backText: { ...t.type.bodyStrong, color: t.colors.primaryDeep },
    header: { paddingBottom: space.lg },
    title: { ...t.type.title, color: t.colors.textPrimary },
    subtitle: { ...t.type.small, color: t.colors.textMuted, marginTop: space.xs },
    srOnly: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  });

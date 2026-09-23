import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { appHydrated } from '../actions';
import { DEFAULT_THEME_ID, getTheme, isThemeId } from '../../theme/themeRegistry';
import type { RootState } from '../rootReducer';

export type ThemeState = { selectedThemeId: string };

export const initialThemeState: ThemeState = { selectedThemeId: DEFAULT_THEME_ID };

const themeSlice = createSlice({
  name: 'theme',
  initialState: initialThemeState,
  reducers: {
    setTheme(state, action: PayloadAction<string>) {
      // Unknown ids are ignored so a stale/removed theme can never break the UI.
      if (isThemeId(action.payload)) state.selectedThemeId = action.payload;
    },
    resetTheme(state) {
      state.selectedThemeId = DEFAULT_THEME_ID;
    },
  },
  extraReducers: b => {
    b.addCase(appHydrated, (state, action) => {
      if (isThemeId(action.payload.themeId)) state.selectedThemeId = action.payload.themeId;
    });
  },
});

export const { setTheme, resetTheme } = themeSlice.actions;
export default themeSlice.reducer;

export const selectThemeId = (s: RootState) => s.theme.selectedThemeId;
/** Returns a static registry object, so the reference only changes when the selection does. */
export const selectCurrentTheme = (s: RootState) => getTheme(s.theme.selectedThemeId);

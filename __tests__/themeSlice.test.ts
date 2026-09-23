import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../src/store/rootReducer';
import { appHydrated } from '../src/store/actions';
import { selectPersisted } from '../src/store/persistence';
import reducer, {
  initialThemeState,
  resetTheme,
  selectCurrentTheme,
  selectThemeId,
  setTheme,
} from '../src/store/slices/themeSlice';
import { starlightTheme } from '../src/theme/themes/starlight';

const makeStore = () => configureStore({ reducer: rootReducer });

describe('themeSlice', () => {
  it('defaults to the classic theme', () => {
    expect(initialThemeState.selectedThemeId).toBe('default');
  });
  it('setTheme updates the selection', () => {
    expect(reducer(initialThemeState, setTheme('starlight')).selectedThemeId).toBe('starlight');
    expect(reducer(initialThemeState, setTheme('grimoire')).selectedThemeId).toBe('grimoire');
  });
  it('ignores unknown theme ids', () => {
    expect(reducer({ selectedThemeId: 'grimoire' }, setTheme('nope')).selectedThemeId).toBe('grimoire');
  });
  it('resetTheme goes back to default', () => {
    expect(reducer({ selectedThemeId: 'grimoire' }, resetTheme()).selectedThemeId).toBe('default');
  });
  it('selectors return the id and the static theme object', () => {
    const store = makeStore();
    store.dispatch(setTheme('starlight'));
    expect(selectThemeId(store.getState())).toBe('starlight');
    expect(selectCurrentTheme(store.getState())).toBe(starlightTheme);
  });
});

describe('theme persistence', () => {
  it('is included in the persisted snapshot', () => {
    const store = makeStore();
    store.dispatch(setTheme('grimoire'));
    expect(selectPersisted(store.getState()).themeId).toBe('grimoire');
  });
  it('survives a restart (persist -> hydrate a fresh store)', () => {
    const first = makeStore();
    first.dispatch(setTheme('starlight'));
    const saved = JSON.parse(JSON.stringify(selectPersisted(first.getState())));
    const second = makeStore(); // "reopened app"
    second.dispatch(appHydrated(saved));
    expect(selectThemeId(second.getState())).toBe('starlight');
  });
  it('a removed/unknown saved theme falls back safely', () => {
    const store = makeStore();
    store.dispatch(appHydrated({ themeId: 'retired-theme' }));
    expect(selectThemeId(store.getState())).toBe('default');
  });
  it('older saves without a theme keep the default', () => {
    const store = makeStore();
    store.dispatch(appHydrated({ alarms: [] }));
    expect(selectThemeId(store.getState())).toBe('default');
  });
});

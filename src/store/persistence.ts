import { STORAGE_KEY } from '../constants';
import { StorageService } from '../services/storage/StorageService';
import { log } from '../utils/logger';
import type { PersistedState } from './actions';
import type { RootState } from './rootReducer';

export function selectPersisted(state: RootState): PersistedState {
  return {
    alarms: state.alarms.items,
    settings: state.settings,
    history: state.history.entries,
    recentPromptIds: state.history.recentPromptIds,
    themeId: state.theme.selectedThemeId,
  };
}

export async function loadPersistedState(): Promise<PersistedState> {
  return (await StorageService.getJSON<PersistedState>(STORAGE_KEY)) ?? {};
}

/** Debounced write whenever persisted slices change (reference equality, so cheap). */
export function startPersistence(store: { getState: () => RootState; subscribe: (l: () => void) => () => void }) {
  let last = selectPersisted(store.getState());
  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribe = store.subscribe(() => {
    const next = selectPersisted(store.getState());
    const changed =
      next.alarms !== last.alarms ||
      next.settings !== last.settings ||
      next.history !== last.history ||
      next.recentPromptIds !== last.recentPromptIds ||
      next.themeId !== last.themeId;
    if (!changed) return;
    last = next;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      StorageService.setJSON(STORAGE_KEY, last).catch(e => log.error('Persist failed', e));
    }, 250);
  });
  return unsubscribe;
}

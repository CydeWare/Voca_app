import { LOG_PREFIX } from '../constants';

/** Dev-only logging. Never pass raw speech transcripts here. */
export const log = {
  info: (...args: unknown[]) => {
    if (__DEV__) console.log(LOG_PREFIX, ...args);
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) console.warn(LOG_PREFIX, ...args);
  },
  error: (...args: unknown[]) => {
    console.error(LOG_PREFIX, ...args);
  },
};

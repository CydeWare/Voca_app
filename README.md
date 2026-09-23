# VOCA — Voice Operated Consciousness Alarm

An Android alarm that only stops when you **read a sentence out loud**. If your voice doesn't work (mic denied, no recognizer, three failed tries), a short tap puzzle takes over, so you are never stuck with a ringing phone.

React Native 0.87 + TypeScript + Redux Toolkit, with native Kotlin for everything that has to work while the app is closed (scheduling, ringing, speech).

---

## 1. Requirements

| Tool | Version |
|---|---|
| Node.js | 22.11+ |
| JDK | 17 or 21 (Android Studio's bundled JBR is fine) |
| Android Studio | latest, with **Android SDK Platform 37**, Build-Tools, and NDK 27.1.12297006 (Studio offers to install missing ones on first sync) |
| Phone | A **real Android phone** (Android 7+; Android 12+ recommended). Emulators can't properly test lock-screen alarms or the microphone. |

Set `ANDROID_HOME` (e.g. `%LOCALAPPDATA%\Android\Sdk` on Windows) and add `platform-tools` to `PATH` so `adb devices` works.

## 2. Install and run

```bash
npm install
npx react-native start          # terminal 1: Metro bundler
npx react-native run-android    # terminal 2: builds + installs on the connected phone
```

Enable **Developer options → USB debugging** on the phone first and accept the prompt. `adb devices` must list it.

Release APK (no Metro needed): `cd android && ./gradlew assembleRelease` → `android/app/build/outputs/apk/release/app-release.apk` (signed with the debug key; fine for demos, not for the Play Store).

## 3. Checks

```bash
npx tsc --noEmit   # types
npm run lint       # eslint
npm test           # 35 unit tests: text normalization, speech matching, alarm state machine, prompts, puzzles, dates
```

## 4. Permissions (and why)

| Permission | Why | Where to fix it |
|---|---|---|
| Alarms & reminders (`SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`) | ring at the exact minute | Settings tab → "Alarms & reminders" |
| Notifications (Android 13+) | the full-screen alarm is delivered through a notification | Settings tab |
| Full-screen intent (Android 14+) | show the challenge over the lock screen | Settings tab |
| Microphone | hear you read; only used while an alarm is ringing | asked on the ringing screen / Settings |
| Battery: Unrestricted | Xiaomi, Oppo, Vivo, Samsung etc. kill background apps aggressively | Settings tab → "Battery" |

Boot, time-change, timezone-change and app-update receivers re-arm all alarms automatically.

## 5. Test the full flow (do this on the real phone)

1. Settings tab → **Ring a test alarm in 60s** → lock the phone.
2. The screen should turn on and show the challenge over the lock screen, with sound ramping up.
3. Tap the mic and read the sentence. Audio pauses while you speak, the sun rises as words are recognized, the alarm stops on a match.
4. Repeat, but say something wrong 3 times → the puzzle appears → solve it → alarm stops.
5. Try to escape: back button, volume keys, swiping the notification. None of them should stop it.
6. Check the **Wake-ups** tab: both mornings recorded with delay, method and attempts.
7. Reboot the phone with a real alarm set a few minutes ahead: it must still ring.

## 6. Architecture

```
src/
  screens/      Home, AlarmEditor, RingingAlarm, AlarmHistory, Settings, Onboarding
  components/   time wheels, prompt display (live word highlight), voice indicator, puzzle, RisingSun…
  store/        Redux Toolkit: alarms, activeAlarm (state machine), settings, history
                + listener middleware that re-syncs the OS schedule on every alarm change
                + debounced persistence to native storage
  services/
    alarm/      AlarmService (.android = native module, .ios = honest "unsupported"), alarmFlow thunks
    speech/     SpeechRecognitionService interface + Android implementation + SpeechMatcher
    prompts/    PromptGenerator (category, difficulty, no recent repeats), ~110 built-in prompts
    puzzle/     fallback puzzles (arithmetic, tap-the-number, alphabetical)
  utils/        text normalization, similarity scoring, dates, permissions
android/app/src/main/java/com/voca/
  alarm/        AlarmScheduler (AlarmManager.setAlarmClock), AlarmReceiver, BootReceiver,
                AlarmRingService (foreground service: looping audio on the alarm stream, vibration, wake lock)
  speech/       VocaSpeechModule (android.speech.SpeechRecognizer wrapper)
  bridge/       VocaAlarmModule (JS bridge + SharedPreferences key-value storage)
```

**Who owns what:** Redux holds intent (what alarms exist). Native holds the timers and the ringing. The alarm keeps ringing even if the JS app is killed; only a successful voice or puzzle result calls `stopRinging()`.

**Alarm state machine** (`store/slices/activeAlarmSlice.ts`):
`IDLE → TRIGGERING → RINGING → LISTENING → VERIFYING → SUCCESS → DISMISSED → IDLE`, with `RETRYING` after a failed read and `FALLBACK` after 3 failures or when voice is impossible. Illegal transitions are ignored.

**Speech matching** (`utils/similarity.ts`): text is normalized (case, punctuation, contractions, digits → words), then scored as 70% in-order word recall (fuzzy per word, plus a sounds-alike key so "lori" = "lorry") + 30% character similarity. Pass thresholds: Relaxed 0.70 / Normal 0.80 / Strict 0.90. Tunables live in `src/constants/index.ts`.

## 7. Known limitations (be honest about these in the pitch)

- **Android only.** iOS doesn't let third-party apps ring an unstoppable alarm the way Android does; the iOS services report "unsupported".
- **Offline speech depends on the phone.** On Android 12+ with an offline English language pack, recognition runs on-device. Otherwise Android's system recognizer is used with "prefer offline", which may still use the internet. The Settings screen shows which one is active. Speech audio is never recorded or stored by VOCA.
- **Whisper mode** is designed into settings but disabled: no available recognizer handles whispers reliably.
- **English prompts only** for now (`SPEECH_LANGUAGE = 'en-US'`).
- Some OEM battery savers can still delay alarms unless battery is set to Unrestricted.
- Freemium is prepared for (settings/prompt categories are separable) but there are no payments.

## 8. Troubleshooting

- **`VocaAlarm native module is not linked`** → you're running an old build. Run `run-android` again (JS reload is not enough after native changes).
- **Build fails on SDK/NDK** → install the versions from section 1 in Android Studio → SDK Manager.
- **Alarm rings late** → "Alarms & reminders" is off, or battery optimization is on.
- **"Voice recognition isn't available"** → install/update Google app or "Speech Recognition & Synthesis", and download the English offline pack (Settings → System → Languages → Speech).
- Clean rebuild: `cd android && ./gradlew clean && cd .. && npx react-native run-android`.

## 9. Themes (Appearance)

Settings → **Appearance → Theme** opens the theme picker. Selecting a card applies it instantly and it's saved with the rest of the app state (survives restarts).

Architecture (`src/theme/`):

- `themeTypes.ts`: `AppTheme` = colour tokens (app zone + hero zone), typography, radius/shape, effects (decor kind, rising sun, glow, ornament), optional copy and assets, and `isPremium` (metadata only, **not enforced**).
- `themes/*.ts`: one file per theme, built with `defineTheme()` (frozen, created once).
- `themeRegistry.ts`: `THEME_LIST` + `getTheme(id)` (unknown ids fall back to default).
- `ThemeProvider.tsx`: `useTheme()`, `useThemed(makeStyles)` (styles cached per theme), `ThemeScope` for previews.
- Redux: `store/slices/themeSlice.ts` stores only `selectedThemeId` (`setTheme`, `resetTheme`, `selectThemeId`, `selectCurrentTheme`).
- Decoration: `components/ThemeDecor` (stars, constellation + crescent, grimoire frame, fireflies, aurora, moon, glow), percentage-positioned, non-interactive, hidden from screen readers.

**Add a theme:** copy a file in `themes/`, change the tokens, add it to `THEME_LIST`. The tests check every theme has all tokens and passes WCAG contrast checks.

Fonts use Android's built-in families (`serif`, `monospace`, `casual`, `sans-serif-light`…), so no font files are bundled. Bundled OFL fonts can be added later in `theme/fonts.ts`.

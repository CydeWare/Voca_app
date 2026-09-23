package com.voca

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.voca.alarm.AlarmRingService

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "VOCA"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    // react-native-screens: don't restore fragments with stale state.
    super.onCreate(null)
    setAlarmWindowMode(AlarmRingService.current != null)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    setAlarmWindowMode(AlarmRingService.current != null)
  }

  override fun onResume() {
    super.onResume()
    setAlarmWindowMode(AlarmRingService.current != null)
  }

  /**
   * While ringing: show over the lock screen, turn the screen on, keep it on.
   * Otherwise: behave like a normal app behind the keyguard.
   */
  fun setAlarmWindowMode(ringing: Boolean) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(ringing)
      setTurnScreenOn(ringing)
    } else {
      @Suppress("DEPRECATION")
      val flags =
          WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
              WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      if (ringing) window.addFlags(flags) else window.clearFlags(flags)
    }
    if (ringing) {
      window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    } else {
      window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
  }

  /** Volume keys can't be used to silence a ringing VOCA alarm. */
  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    if (AlarmRingService.current != null) {
      when (event.keyCode) {
        KeyEvent.KEYCODE_VOLUME_UP,
        KeyEvent.KEYCODE_VOLUME_DOWN,
        KeyEvent.KEYCODE_VOLUME_MUTE -> return true
      }
    }
    return super.dispatchKeyEvent(event)
  }
}

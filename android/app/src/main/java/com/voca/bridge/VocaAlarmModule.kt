package com.voca.bridge

import android.app.NotificationManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.voca.MainActivity
import com.voca.alarm.AlarmRingService
import com.voca.alarm.AlarmScheduler
import com.voca.alarm.AlarmSpec
import com.voca.alarm.AlarmStore
import com.voca.alarm.KeyValueStore
import com.voca.alarm.RingingInfo
import com.voca.speech.VocaSpeechModule

class VocaAlarmModule(private val rc: ReactApplicationContext) : ReactContextBaseJavaModule(rc) {

  companion object {
    const val NAME = "VocaAlarm"
    const val EV_RINGING = "VocaAlarmRinging"
    const val EV_STOPPED = "VocaAlarmStopped"
  }

  init {
    AlarmRingService.onRingingChanged = { info ->
      if (rc.hasActiveReactInstance()) {
        val emitter = rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        if (info != null) emitter.emit(EV_RINGING, info.toMap()) else emitter.emit(EV_STOPPED, null)
      }
    }
  }

  override fun getName() = NAME

  private fun RingingInfo.toMap(): WritableMap =
      Arguments.createMap().apply {
        putString("alarmId", alarmId)
        putDouble("scheduledAt", scheduledAt.toDouble())
        putDouble("triggeredAt", triggeredAt.toDouble())
        putString("soundId", soundId)
        putBoolean("vibration", vibration)
        putBoolean("isTest", isTest)
        putBoolean("audioError", audioError)
      }

  // ---------- Scheduling ----------

  /** json: array of AlarmSpec for every ENABLED alarm. Returns per-alarm trigger times. */
  @ReactMethod
  fun syncAlarms(json: String, promise: Promise) {
    try {
      val results = AlarmScheduler.syncAll(rc, AlarmSpec.listFromJson(json))
      val arr = Arguments.createArray()
      results.forEach {
        arr.pushMap(
            Arguments.createMap().apply {
              putString("id", it.id)
              putDouble("triggerAt", it.triggerAt.toDouble())
              putBoolean("exact", it.exact)
            })
      }
      promise.resolve(arr)
    } catch (e: Exception) {
      promise.reject("E_SCHEDULE", e.message ?: "Could not schedule alarms", e)
    }
  }

  @ReactMethod
  fun scheduleTestAlarm(seconds: Double, soundId: String, vibration: Boolean, volume: Double, promise: Promise) {
    try {
      val spec =
          AlarmSpec(
              AlarmScheduler.TEST_ALARM_ID,
              0,
              0,
              emptyList(),
              soundId,
              vibration,
              volume.coerceIn(0.0, 1.0),
          )
      val at = System.currentTimeMillis() + (seconds * 1000).toLong()
      val r = AlarmScheduler.schedule(rc, spec, triggerAtOverride = at, isTest = true)
      promise.resolve(
          Arguments.createMap().apply {
            putDouble("triggerAt", r.triggerAt.toDouble())
            putBoolean("exact", r.exact)
          })
    } catch (e: Exception) {
      promise.reject("E_SCHEDULE", e.message ?: "Could not schedule test alarm", e)
    }
  }

  @ReactMethod
  fun consumeFiredOneShots(promise: Promise) {
    val arr = Arguments.createArray()
    AlarmStore.consumeFiredOneShots(rc).forEach { arr.pushString(it) }
    promise.resolve(arr)
  }

  // ---------- Ringing control ----------

  @ReactMethod
  fun getRingingAlarm(promise: Promise) {
    promise.resolve(AlarmRingService.current?.toMap())
  }

  @ReactMethod
  fun stopRinging(promise: Promise) {
    AlarmRingService.stop(rc)
    refreshActivityLockFlags(false)
    promise.resolve(null)
  }

  @ReactMethod
  fun setRingingDucked(ducked: Boolean, promise: Promise) {
    AlarmRingService.setDucked(rc, ducked)
    promise.resolve(null)
  }

  private fun refreshActivityLockFlags(ringing: Boolean) {
    val activity = rc.currentActivity as? MainActivity ?: return
    activity.runOnUiThread { activity.setAlarmWindowMode(ringing) }
  }

  // ---------- Permissions / system settings ----------

  @ReactMethod
  fun getSystemStatus(promise: Promise) {
    val map = Arguments.createMap()
    map.putInt("sdkInt", Build.VERSION.SDK_INT)
    map.putBoolean("exactAlarms", AlarmScheduler.canScheduleExact(rc))
    map.putBoolean("notifications", NotificationManagerCompat.from(rc).areNotificationsEnabled())
    val fullScreen =
        if (Build.VERSION.SDK_INT >= 34) {
          (rc.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
              .canUseFullScreenIntent()
        } else {
          true
        }
    map.putBoolean("fullScreenIntent", fullScreen)
    val pm = rc.getSystemService(Context.POWER_SERVICE) as PowerManager
    map.putBoolean("batteryUnrestricted", pm.isIgnoringBatteryOptimizations(rc.packageName))
    map.putString("manufacturer", Build.MANUFACTURER)
    promise.resolve(map)
  }

  private fun openSettings(action: String, withPackageUri: Boolean): Boolean {
    return try {
      val intent = Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      if (withPackageUri) intent.data = Uri.parse("package:${rc.packageName}")
      rc.startActivity(intent)
      true
    } catch (e: ActivityNotFoundException) {
      false
    }
  }

  private fun openAppDetails() =
      openSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, true)

  /** target: exact_alarm | full_screen | notifications | battery | app */
  @ReactMethod
  fun openSystemSettings(target: String, promise: Promise) {
    val ok =
        when (target) {
          "exact_alarm" ->
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
                  openSettings(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, true)
              else openAppDetails()
          "full_screen" ->
              if (Build.VERSION.SDK_INT >= 34)
                  openSettings(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, true)
              else openAppDetails()
          "notifications" ->
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                  rc.startActivity(
                      Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                          .putExtra(Settings.EXTRA_APP_PACKAGE, rc.packageName)
                          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                  true
                } catch (e: ActivityNotFoundException) {
                  openAppDetails()
                }
              } else openAppDetails()
          "battery" -> openSettings(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS, false)
          else -> openAppDetails()
        }
    promise.resolve(ok || openAppDetails())
  }

  // ---------- Key-value storage for JS state ----------

  @ReactMethod
  fun storageGet(key: String, promise: Promise) = promise.resolve(KeyValueStore.get(rc, key))

  @ReactMethod
  fun storageSet(key: String, value: String, promise: Promise) {
    KeyValueStore.set(rc, key, value)
    promise.resolve(null)
  }

  @ReactMethod
  fun storageRemove(key: String, promise: Promise) {
    KeyValueStore.remove(rc, key)
    promise.resolve(null)
  }

  @ReactMethod fun addListener(eventName: String) {}

  @ReactMethod fun removeListeners(count: Double) {}
}

class VocaPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      when (name) {
        VocaAlarmModule.NAME -> VocaAlarmModule(reactContext)
        VocaSpeechModule.NAME -> VocaSpeechModule(reactContext)
        else -> null
      }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
        VocaAlarmModule.NAME to
            ReactModuleInfo(
                VocaAlarmModule.NAME,
                VocaAlarmModule::class.java.name,
                false, // canOverrideExistingModule
                false, // needsEagerInit
                false, // isCxxModule
                false, // isTurboModule -> legacy module via interop layer
            ),
        VocaSpeechModule.NAME to
            ReactModuleInfo(
                VocaSpeechModule.NAME,
                VocaSpeechModule::class.java.name,
                false,
                false,
                false,
                false,
            ),
    )
  }
}

package com.voca.alarm

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray

/**
 * Native persistence. Alarms live here (not only in JS) so they can be rescheduled after a reboot
 * or fired while the JavaScript runtime is not running.
 */
object AlarmStore {
  private const val PREFS = "voca_alarm_store"
  private const val KEY_ALARMS = "scheduled_alarms"
  private const val KEY_FIRED = "fired_one_shots"

  private fun prefs(ctx: Context): SharedPreferences =
      ctx.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  @Synchronized
  fun loadAlarms(ctx: Context): List<AlarmSpec> =
      try {
        AlarmSpec.listFromJson(prefs(ctx).getString(KEY_ALARMS, "[]") ?: "[]")
      } catch (e: Exception) {
        emptyList()
      }

  @Synchronized
  fun saveAlarms(ctx: Context, alarms: List<AlarmSpec>) {
    prefs(ctx).edit().putString(KEY_ALARMS, AlarmSpec.listToJson(alarms)).commit()
  }

  @Synchronized
  fun removeAlarm(ctx: Context, id: String) {
    saveAlarms(ctx, loadAlarms(ctx).filter { it.id != id })
  }

  /** One-shot alarms that fired while JS may not have been running; JS disables them on start. */
  @Synchronized
  fun addFiredOneShot(ctx: Context, id: String) {
    val arr = JSONArray(prefs(ctx).getString(KEY_FIRED, "[]") ?: "[]")
    arr.put(id)
    prefs(ctx).edit().putString(KEY_FIRED, arr.toString()).commit()
  }

  @Synchronized
  fun consumeFiredOneShots(ctx: Context): List<String> {
    val arr = JSONArray(prefs(ctx).getString(KEY_FIRED, "[]") ?: "[]")
    prefs(ctx).edit().putString(KEY_FIRED, "[]").commit()
    return (0 until arr.length()).map { arr.getString(it) }.distinct()
  }
}

/** Simple key-value storage used by the JS StorageService (app state, history, settings). */
object KeyValueStore {
  private const val PREFS = "voca_kv"

  private fun prefs(ctx: Context) =
      ctx.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun get(ctx: Context, key: String): String? = prefs(ctx).getString(key, null)

  fun set(ctx: Context, key: String, value: String) {
    prefs(ctx).edit().putString(key, value).apply()
  }

  fun remove(ctx: Context, key: String) {
    prefs(ctx).edit().remove(key).apply()
  }
}

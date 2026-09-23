package com.voca.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.util.Log
import com.voca.MainActivity
import java.util.Calendar

data class ScheduleResult(val id: String, val triggerAt: Long, val exact: Boolean)

/**
 * Schedules alarms with AlarmManager.setAlarmClock(), which is exact, wakes the device from Doze,
 * and shows the alarm icon in the status bar. Falls back to setAndAllowWhileIdle() (inexact) only
 * if exact-alarm permission is unavailable, and reports that honestly to JS.
 */
object AlarmScheduler {
  private const val TAG = "VOCA"
  const val ACTION_FIRE = "com.voca.alarm.ACTION_FIRE"
  const val EXTRA_ALARM_ID = "alarmId"
  const val EXTRA_SCHEDULED_AT = "scheduledAt"
  const val EXTRA_IS_TEST = "isTest"
  const val EXTRA_SOUND_ID = "soundId"
  const val EXTRA_VIBRATION = "vibration"
  const val EXTRA_VOLUME = "volume"
  const val TEST_ALARM_ID = "__voca_test__"

  private fun alarmManager(ctx: Context) =
      ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  fun canScheduleExact(ctx: Context): Boolean =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        alarmManager(ctx).canScheduleExactAlarms()
      } else {
        true
      }

  /** Next occurrence strictly after [now]. */
  fun nextTrigger(spec: AlarmSpec, now: Long = System.currentTimeMillis()): Long {
    val base =
        Calendar.getInstance().apply {
          timeInMillis = now
          set(Calendar.HOUR_OF_DAY, spec.hour)
          set(Calendar.MINUTE, spec.minute)
          set(Calendar.SECOND, 0)
          set(Calendar.MILLISECOND, 0)
        }
    if (!spec.isRepeating) {
      if (base.timeInMillis <= now) base.add(Calendar.DAY_OF_YEAR, 1)
      return base.timeInMillis
    }
    for (offset in 0..7) {
      val candidate = base.clone() as Calendar
      candidate.add(Calendar.DAY_OF_YEAR, offset)
      // Re-apply the wall-clock time in case a DST shift moved it.
      candidate.set(Calendar.HOUR_OF_DAY, spec.hour)
      candidate.set(Calendar.MINUTE, spec.minute)
      val jsDay = candidate.get(Calendar.DAY_OF_WEEK) - 1
      if (jsDay in spec.repeatDays && candidate.timeInMillis > now) return candidate.timeInMillis
    }
    base.add(Calendar.DAY_OF_YEAR, 7)
    return base.timeInMillis
  }

  private fun fireIntent(ctx: Context, id: String): Intent =
      Intent(ctx, AlarmReceiver::class.java).apply {
        action = ACTION_FIRE
        // Unique data URI so each alarm gets its own PendingIntent and can be cancelled precisely.
        data = Uri.parse("voca://alarm/$id")
      }

  private fun requestCode(id: String) = id.hashCode()

  fun schedule(
      ctx: Context,
      spec: AlarmSpec,
      triggerAtOverride: Long? = null,
      isTest: Boolean = false,
  ): ScheduleResult {
    val triggerAt = triggerAtOverride ?: nextTrigger(spec)
    val intent =
        fireIntent(ctx, spec.id).apply {
          putExtra(EXTRA_ALARM_ID, spec.id)
          putExtra(EXTRA_SCHEDULED_AT, triggerAt)
          putExtra(EXTRA_IS_TEST, isTest)
          putExtra(EXTRA_SOUND_ID, spec.soundId)
          putExtra(EXTRA_VIBRATION, spec.vibration)
          putExtra(EXTRA_VOLUME, spec.volume)
        }
    val firePi =
        PendingIntent.getBroadcast(
            ctx,
            requestCode(spec.id),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    val am = alarmManager(ctx)
    return if (canScheduleExact(ctx)) {
      val showIntent =
          PendingIntent.getActivity(
              ctx,
              requestCode("show_${spec.id}"),
              Intent(ctx, MainActivity::class.java),
              PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
          )
      am.setAlarmClock(AlarmManager.AlarmClockInfo(triggerAt, showIntent), firePi)
      Log.i(TAG, "Alarm scheduled (exact): ${spec.id} at $triggerAt")
      ScheduleResult(spec.id, triggerAt, true)
    } else {
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, firePi)
      Log.w(TAG, "Alarm scheduled (INEXACT, no exact-alarm permission): ${spec.id}")
      ScheduleResult(spec.id, triggerAt, false)
    }
  }

  fun cancel(ctx: Context, id: String) {
    val pi =
        PendingIntent.getBroadcast(
            ctx,
            requestCode(id),
            fireIntent(ctx, id),
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE,
        )
    if (pi != null) {
      alarmManager(ctx).cancel(pi)
      pi.cancel()
    }
  }

  /** Replace the full set of enabled alarms. Cancels anything no longer present. */
  fun syncAll(ctx: Context, specs: List<AlarmSpec>): List<ScheduleResult> {
    val newIds = specs.map { it.id }.toSet()
    AlarmStore.loadAlarms(ctx).filter { it.id !in newIds }.forEach { cancel(ctx, it.id) }
    AlarmStore.saveAlarms(ctx, specs)
    return specs.map { schedule(ctx, it) }
  }

  fun rescheduleAll(ctx: Context) {
    AlarmStore.loadAlarms(ctx).forEach {
      try {
        schedule(ctx, it)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to reschedule ${it.id}", e)
      }
    }
  }
}

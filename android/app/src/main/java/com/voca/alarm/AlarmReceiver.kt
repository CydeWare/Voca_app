package com.voca.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/** Fired by AlarmManager at the scheduled time. Starts the ringing foreground service. */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != AlarmScheduler.ACTION_FIRE) return
    val id = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
    val scheduledAt =
        intent.getLongExtra(AlarmScheduler.EXTRA_SCHEDULED_AT, System.currentTimeMillis())
    val isTest = intent.getBooleanExtra(AlarmScheduler.EXTRA_IS_TEST, false)
    Log.i("VOCA", "Alarm triggered: $id")

    var soundId = intent.getStringExtra(AlarmScheduler.EXTRA_SOUND_ID) ?: "voca_sunrise"
    var vibration = intent.getBooleanExtra(AlarmScheduler.EXTRA_VIBRATION, true)
    var volume = intent.getDoubleExtra(AlarmScheduler.EXTRA_VOLUME, 0.7)

    if (!isTest) {
      val spec = AlarmStore.loadAlarms(context).find { it.id == id }
      if (spec == null) {
        Log.w("VOCA", "Alarm $id no longer exists; ignoring")
        return
      }
      soundId = spec.soundId
      vibration = spec.vibration
      volume = spec.volume
      if (spec.isRepeating) {
        AlarmScheduler.schedule(context, spec) // queue the next occurrence right away
      } else {
        AlarmStore.removeAlarm(context, id)
        AlarmStore.addFiredOneShot(context, id)
      }
    }

    AlarmRingService.start(
        context,
        RingingInfo(
            alarmId = id,
            scheduledAt = scheduledAt,
            triggeredAt = System.currentTimeMillis(),
            soundId = soundId,
            vibration = vibration,
            volume = volume,
            isTest = isTest,
        ),
    )
  }
}

/** Restores alarms after reboot, app update, or clock/timezone changes. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    Log.i("VOCA", "Rescheduling alarms after ${intent.action}")
    AlarmScheduler.rescheduleAll(context)
  }
}

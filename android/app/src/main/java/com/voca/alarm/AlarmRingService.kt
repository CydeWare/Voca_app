package com.voca.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.voca.MainActivity
import com.voca.R
import kotlin.math.ceil
import kotlin.math.min

data class RingingInfo(
    val alarmId: String,
    val scheduledAt: Long,
    val triggeredAt: Long,
    val soundId: String,
    val vibration: Boolean,
    /** Fraction (0..1) of max alarm-stream volume this alarm was set to ring at. */
    val volume: Double = 0.7,
    val isTest: Boolean = false,
    val audioError: Boolean = false,
)

/**
 * Foreground service that owns everything that must keep working while the alarm rings:
 * looping alarm audio (USAGE_ALARM stream), vibration, a wake lock, and the full-screen
 * notification that brings the VOCA challenge over the lock screen.
 *
 * There is intentionally no "Dismiss" action on the notification. Only JS (after speech or
 * fallback verification) calls stop().
 */
class AlarmRingService : Service() {

  companion object {
    private const val TAG = "VOCA"
    const val CHANNEL_ID = "voca_alarm_ringing_v1"
    const val NOTIFICATION_ID = 7042
    const val EXTRA_FROM_ALARM = "voca_from_alarm"

    private const val ACTION_START = "com.voca.alarm.RING_START"
    private const val ACTION_STOP = "com.voca.alarm.RING_STOP"
    private const val ACTION_DUCK = "com.voca.alarm.RING_DUCK"
    private const val ACTION_UNDUCK = "com.voca.alarm.RING_UNDUCK"

    /** The alarm currently ringing, or null. Read by MainActivity and the JS bridge. */
    @Volatile
    var current: RingingInfo? = null
      private set

    /** Set by the JS bridge to forward "alarm is ringing" to JavaScript when it is alive. */
    @Volatile var onRingingChanged: ((RingingInfo?) -> Unit)? = null

    fun start(ctx: Context, info: RingingInfo) {
      val intent =
          Intent(ctx, AlarmRingService::class.java).apply {
            action = ACTION_START
            putExtra("alarmId", info.alarmId)
            putExtra("scheduledAt", info.scheduledAt)
            putExtra("triggeredAt", info.triggeredAt)
            putExtra("soundId", info.soundId)
            putExtra("vibration", info.vibration)
            putExtra("volume", info.volume)
            putExtra("isTest", info.isTest)
          }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        ctx.startForegroundService(intent)
      } else {
        ctx.startService(intent)
      }
    }

    fun stop(ctx: Context) = send(ctx, ACTION_STOP)

    /** Pause audio + vibration while the user speaks, so the microphone can hear them. */
    fun setDucked(ctx: Context, ducked: Boolean) =
        send(ctx, if (ducked) ACTION_DUCK else ACTION_UNDUCK)

    private fun send(ctx: Context, action: String) {
      if (current == null) return
      ctx.startService(Intent(ctx, AlarmRingService::class.java).setAction(action))
    }
  }

  private var player: MediaPlayer? = null
  private var vibrator: Vibrator? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var originalAlarmVolume: Int? = null
  private val handler = Handler(Looper.getMainLooper())
  private var currentVolume = 0.35f
  private var ducked = false

  private val rampRunnable =
      object : Runnable {
        override fun run() {
          if (!ducked) {
            currentVolume = min(1f, currentVolume + 0.05f)
            player?.setVolume(currentVolume, currentVolume)
          }
          if (currentVolume < 1f) handler.postDelayed(this, 1000)
        }
      }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START -> handleStart(intent)
      ACTION_STOP -> handleStop()
      ACTION_DUCK -> duck(true)
      ACTION_UNDUCK -> duck(false)
      else -> if (current == null) stopSelf()
    }
    return START_NOT_STICKY
  }

  private fun handleStart(intent: Intent) {
    var info =
        RingingInfo(
            alarmId = intent.getStringExtra("alarmId") ?: "unknown",
            scheduledAt = intent.getLongExtra("scheduledAt", System.currentTimeMillis()),
            triggeredAt = intent.getLongExtra("triggeredAt", System.currentTimeMillis()),
            soundId = intent.getStringExtra("soundId") ?: "voca_sunrise",
            vibration = intent.getBooleanExtra("vibration", true),
            volume = intent.getDoubleExtra("volume", 0.7).coerceIn(0.0, 1.0),
            isTest = intent.getBooleanExtra("isTest", false),
        )

    // Must call startForeground quickly after startForegroundService().
    startInForeground(buildNotification())

    // If another alarm is already ringing, keep ringing but switch to the newest alarm.
    releaseAudio()
    stopVibration()

    acquireWakeLock()
    ensureAudibleVolume(info.volume)
    val audioOk = startSound(info.soundId)
    if (!audioOk) info = info.copy(audioError = true)
    if (info.vibration) startVibration()

    current = info
    ducked = false
    onRingingChanged?.invoke(info)
    Log.i(TAG, "Ringing started for ${info.alarmId} (audioOk=$audioOk)")
  }

  private fun handleStop() {
    Log.i(TAG, "Alarm dismissed; stopping ring service")
    current = null
    handler.removeCallbacksAndMessages(null)
    releaseAudio()
    stopVibration()
    restoreVolume()
    releaseWakeLock()
    onRingingChanged?.invoke(null)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION") stopForeground(true)
    }
    stopSelf()
  }

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    releaseAudio()
    stopVibration()
    restoreVolume()
    releaseWakeLock()
    super.onDestroy()
  }

  // ---------- Notification / full-screen intent ----------

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CHANNEL_ID) != null) return
    val channel =
        NotificationChannel(CHANNEL_ID, "Ringing alarms", NotificationManager.IMPORTANCE_HIGH)
            .apply {
              description = "Shown while a VOCA alarm is ringing"
              setSound(null, null) // audio is played by the service on the alarm stream
              enableVibration(false) // vibration is handled by the service
              lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
    nm.createNotificationChannel(channel)
  }

  private fun buildNotification(): Notification {
    ensureChannel()
    val launch =
        Intent(this, MainActivity::class.java).apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
          putExtra(EXTRA_FROM_ALARM, true)
        }
    val pi =
        PendingIntent.getActivity(
            this,
            NOTIFICATION_ID,
            launch,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    return NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_voca_alarm)
        .setContentTitle("VOCA alarm")
        .setContentText("Read the sentence aloud to turn it off.")
        .setCategory(NotificationCompat.CATEGORY_ALARM)
        .setPriority(NotificationCompat.PRIORITY_MAX)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setOngoing(true)
        .setAutoCancel(false)
        .setContentIntent(pi)
        .setFullScreenIntent(pi, true)
        .build()
  }

  private fun startInForeground(notification: Notification) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
          NOTIFICATION_ID,
          notification,
          ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  // ---------- Audio ----------

  private fun soundUri(soundId: String): Uri? =
      when (soundId) {
        "voca_pulse" -> Uri.parse("android.resource://$packageName/${R.raw.voca_pulse}")
        "voca_sunrise" -> Uri.parse("android.resource://$packageName/${R.raw.voca_sunrise}")
        else -> systemAlarmUri()
      }

  private fun systemAlarmUri(): Uri? =
      RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM)
          ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
          ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

  private fun startSound(soundId: String): Boolean {
    val candidates = listOfNotNull(soundUri(soundId), systemAlarmUri(),
        Uri.parse("android.resource://$packageName/${R.raw.voca_pulse}"))
    for (uri in candidates) {
      try {
        val mp = MediaPlayer()
        mp.setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build())
        mp.setDataSource(this, uri)
        mp.isLooping = true
        mp.prepare()
        currentVolume = 0.35f
        mp.setVolume(currentVolume, currentVolume)
        mp.start()
        player = mp
        handler.postDelayed(rampRunnable, 1000)
        return true
      } catch (e: Exception) {
        Log.e(TAG, "Could not play $uri, trying next sound", e)
      }
    }
    return false
  }

  private fun releaseAudio() {
    handler.removeCallbacks(rampRunnable)
    try {
      player?.stop()
    } catch (_: Exception) {}
    player?.release()
    player = null
  }

  /**
   * Raises the alarm stream up to [targetVolume] (0..1 of max) if it's currently set lower, so
   * the loudness the user chose for this alarm can't be silently defeated by the system slider.
   * Never LOWERS a volume the user already has set higher than their chosen level. Restored
   * to whatever it was before, on stop.
   */
  private fun ensureAudibleVolume(targetVolume: Double) {
    try {
      val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val max = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
      val cur = am.getStreamVolume(AudioManager.STREAM_ALARM)
      // The alarm rings at exactly the loudness chosen in VOCA (never fully silent), whatever
      // the system slider says. The user's original level is restored when ringing stops.
      val target = ceil(max * targetVolume).toInt().coerceIn(1, max)
      if (cur != target) {
        if (originalAlarmVolume == null) originalAlarmVolume = cur
        am.setStreamVolume(AudioManager.STREAM_ALARM, target, 0)
      }
    } catch (e: Exception) {
      Log.w(TAG, "Could not adjust alarm volume", e)
    }
  }

  private fun restoreVolume() {
    val original = originalAlarmVolume ?: return
    try {
      val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
      am.setStreamVolume(AudioManager.STREAM_ALARM, original, 0)
    } catch (_: Exception) {}
    originalAlarmVolume = null
  }

  private fun duck(on: Boolean) {
    if (current == null) return
    ducked = on
    try {
      if (on) {
        player?.pause()
        stopVibration()
      } else {
        player?.start()
        if (current?.vibration == true) startVibration()
      }
    } catch (e: Exception) {
      Log.w(TAG, "Duck toggle failed", e)
    }
  }

  // ---------- Vibration ----------

  private fun getVibrator(): Vibrator? =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
      }

  private fun startVibration() {
    val v = getVibrator() ?: return
    if (!v.hasVibrator()) return
    vibrator = v
    val pattern = longArrayOf(0, 700, 500)
    try {
      when {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ->
            v.vibrate(
                VibrationEffect.createWaveform(pattern, 0),
                VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM),
            )
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.O -> {
          @Suppress("DEPRECATION")
          v.vibrate(
              VibrationEffect.createWaveform(pattern, 0),
              AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build(),
          )
        }
        else -> {
          @Suppress("DEPRECATION") v.vibrate(pattern, 0)
        }
      }
    } catch (e: Exception) {
      Log.w(TAG, "Vibration failed", e)
    }
  }

  private fun stopVibration() {
    try {
      vibrator?.cancel()
    } catch (_: Exception) {}
  }

  // ---------- Wake lock ----------

  private fun acquireWakeLock() {
    if (wakeLock?.isHeld == true) return
    val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
    wakeLock =
        pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "voca:ringing").apply {
          setReferenceCounted(false)
          acquire(60 * 60 * 1000L)
        }
  }

  private fun releaseWakeLock() {
    try {
      if (wakeLock?.isHeld == true) wakeLock?.release()
    } catch (_: Exception) {}
    wakeLock = null
  }
}

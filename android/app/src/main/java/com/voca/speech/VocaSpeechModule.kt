package com.voca.speech

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Thin wrapper over android.speech.SpeechRecognizer.
 *
 * Engine selection (reported to JS so the UI never over-claims):
 *  - "on_device": SpeechRecognizer.createOnDeviceSpeechRecognizer (Android 12+/API 31) when the
 *    device reports on-device recognition is available. Audio never leaves the phone.
 *  - "system_prefer_offline": the default system recognizer with EXTRA_PREFER_OFFLINE. Offline
 *    ONLY if the user has the offline language pack installed; otherwise it may use the network.
 *
 * SpeechRecognizer must be used on the main thread.
 */
class VocaSpeechModule(private val rc: ReactApplicationContext) : ReactContextBaseJavaModule(rc) {

  companion object {
    const val NAME = "VocaSpeech"
    private const val TAG = "VOCA"
    private const val EV_PARTIAL = "VocaSpeechPartial"
    private const val EV_FINAL = "VocaSpeechFinal"
    private const val EV_ERROR = "VocaSpeechError"
    private const val EV_STATE = "VocaSpeechState"
    private const val EV_VOLUME = "VocaSpeechVolume"
  }

  private val main = Handler(Looper.getMainLooper())
  private var recognizer: SpeechRecognizer? = null
  private var engine: String = "none"
  private var lastVolumeEmit = 0L
  private var session = 0
  private var onlineRetried = false

  override fun getName() = NAME

  private fun emit(event: String, data: WritableMap?) {
    if (!rc.hasActiveReactInstance()) return
    rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(event, data)
  }

  private fun onDeviceAvailable(): Boolean =
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
          SpeechRecognizer.isOnDeviceRecognitionAvailable(rc)

  @ReactMethod
  fun getCapabilities(promise: Promise) {
    main.post {
      try {
        val map = Arguments.createMap()
        map.putBoolean("available", SpeechRecognizer.isRecognitionAvailable(rc) || onDeviceAvailable())
        map.putBoolean("onDeviceAvailable", onDeviceAvailable())
        map.putInt("sdkInt", Build.VERSION.SDK_INT)
        promise.resolve(map)
      } catch (e: Exception) {
        promise.reject("E_SPEECH_CAPS", e.message, e)
      }
    }
  }

  /** options: { language: string, preferOnDevice: boolean, biasingText?: string } */
  @ReactMethod
  fun start(options: ReadableMap, promise: Promise) {
    val language = if (options.hasKey("language")) options.getString("language") ?: "en-US" else "en-US"
    val preferOnDevice = !options.hasKey("preferOnDevice") || options.getBoolean("preferOnDevice")
    val biasing = if (options.hasKey("biasingText")) options.getString("biasingText") else null
    main.post {
      try {
        destroyRecognizer()
        onlineRetried = false
        val useOnDevice = preferOnDevice && onDeviceAvailable()
        startInternal(language, useOnDevice, biasing)
        val result = Arguments.createMap()
        result.putString("engine", engine)
        promise.resolve(result)
      } catch (e: Exception) {
        Log.e(TAG, "Speech start failed", e)
        promise.reject("E_SPEECH_START", e.message ?: "Speech recognition could not start", e)
      }
    }
  }

  private fun startInternal(language: String, useOnDevice: Boolean, biasing: String?, preferOffline: Boolean = true) {
    val mySession = ++session
    val rec =
        if (useOnDevice && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          engine = "on_device"
          SpeechRecognizer.createOnDeviceSpeechRecognizer(rc)
        } else {
          if (!SpeechRecognizer.isRecognitionAvailable(rc)) {
            throw IllegalStateException("No speech recognition service on this device")
          }
          engine = if (preferOffline) "system_prefer_offline" else "system_online"
          SpeechRecognizer.createSpeechRecognizer(rc)
        }
    recognizer = rec

    rec.setRecognitionListener(
        object : RecognitionListener {
          override fun onReadyForSpeech(params: Bundle?) {
            Log.i(TAG, "Speech: ready for speech")
            state(mySession, "ready")
          }

          override fun onBeginningOfSpeech() {
            Log.i(TAG, "Speech: beginning of speech detected")
            state(mySession, "speaking")
          }

          override fun onRmsChanged(rmsdB: Float) {
            if (mySession != session) return
            val now = System.currentTimeMillis()
            if (now - lastVolumeEmit < 90) return
            lastVolumeEmit = now
            val m = Arguments.createMap()
            m.putDouble("value", rmsdB.toDouble())
            emit(EV_VOLUME, m)
          }

          override fun onBufferReceived(buffer: ByteArray?) {}

          override fun onEndOfSpeech() = state(mySession, "processing")

          override fun onError(error: Int) {
            if (mySession != session) return
            // On-device engine without the language pack: retry once on the system engine.
            val languageMissing =
                error == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED ||
                    error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE
            if (engine == "on_device" && languageMissing) {
              Log.w(TAG, "On-device language unavailable; falling back to system recognizer")
              main.post {
                try {
                  destroyRecognizer()
                  startInternal(language, false, biasing)
                } catch (e: Exception) {
                  emitError("unavailable", "Speech recognition isn't available right now.")
                }
              }
              return
            }
            // The system recognizer can hard-fail with "language not supported" simply because
            // the offline pack for it isn't installed, instead of transparently going online.
            // Retry once allowing network use before giving up.
            if (languageMissing && !onlineRetried) {
              onlineRetried = true
              Log.w(TAG, "Offline language pack unavailable; retrying with network allowed")
              main.post {
                try {
                  destroyRecognizer()
                  startInternal(language, false, biasing, preferOffline = false)
                } catch (e: Exception) {
                  emitError(
                      "unavailable",
                      "English speech recognition isn't set up on this device. Install/update the offline language pack in Settings \u2192 System \u2192 Languages \u2192 Speech, or use the puzzle.",
                  )
                }
              }
              return
            }
            val (code, message) = mapError(error)
            Log.e(TAG, "Speech error: raw=$error mapped=$code engine=$engine")
            emitError(code, message)
          }

          override fun onResults(results: Bundle?) {
            if (mySession != session) return
            val list = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            val arr = Arguments.createArray()
            list?.forEach { arr.pushString(it) }
            val m = Arguments.createMap()
            m.putArray("candidates", arr)
            m.putString("engine", engine)
            emit(EV_FINAL, m)
          }

          override fun onPartialResults(partialResults: Bundle?) {
            if (mySession != session) return
            val list = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            val text = list?.firstOrNull() ?: return
            val m = Arguments.createMap()
            m.putString("text", text)
            emit(EV_PARTIAL, m)
          }

          override fun onEvent(eventType: Int, params: Bundle?) {}
        })

    val intent =
        Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
          putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
          putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
          putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
          putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
          putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, preferOffline)
          putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, rc.packageName)
          // Hints only; many engines ignore these. Longer silence helps slow morning speech.
          putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L)
          putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1500L)
          if (biasing != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val words = ArrayList(biasing.split(" ").filter { it.isNotBlank() }.distinct())
            putExtra(RecognizerIntent.EXTRA_BIASING_STRINGS, words)
          }
        }
    rec.startListening(intent)
    Log.i(TAG, "Speech recognition started (engine=$engine)")
  }

  private fun state(mySession: Int, s: String) {
    if (mySession != session) return
    val m = Arguments.createMap()
    m.putString("state", s)
    emit(EV_STATE, m)
  }

  private fun emitError(code: String, message: String) {
    val m = Arguments.createMap()
    m.putString("code", code)
    m.putString("message", message)
    emit(EV_ERROR, m)
  }

  private fun mapError(error: Int): Pair<String, String> =
      when (error) {
        SpeechRecognizer.ERROR_NO_MATCH -> "no_match" to "We didn't catch that."
        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "no_speech" to "We didn't hear anything."
        SpeechRecognizer.ERROR_AUDIO -> "audio" to "We couldn't access your microphone."
        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS ->
            "permission" to "Microphone permission is required."
        SpeechRecognizer.ERROR_NETWORK, SpeechRecognizer.ERROR_NETWORK_TIMEOUT ->
            "network" to "Voice recognition needs a connection or an offline language pack."
        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "busy" to "Voice recognition is busy."
        SpeechRecognizer.ERROR_CLIENT -> "client" to "Voice recognition stopped."
        else -> "unknown" to "Voice recognition failed (code $error)."
      }

  @ReactMethod
  fun stop(promise: Promise) {
    main.post {
      try {
        recognizer?.stopListening()
      } catch (_: Exception) {}
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun cancel(promise: Promise) {
    main.post {
      session++ // ignore any late callbacks
      destroyRecognizer()
      promise.resolve(null)
    }
  }

  private fun destroyRecognizer() {
    try {
      recognizer?.cancel()
      recognizer?.destroy()
    } catch (_: Exception) {}
    recognizer = null
  }

  override fun invalidate() {
    main.post { destroyRecognizer() }
    super.invalidate()
  }

  @ReactMethod fun addListener(eventName: String) {}

  @ReactMethod fun removeListeners(count: Double) {}
}

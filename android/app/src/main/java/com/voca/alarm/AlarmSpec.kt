package com.voca.alarm

import org.json.JSONArray
import org.json.JSONObject

/**
 * The subset of an alarm the native layer needs to schedule and ring it.
 * repeatDays uses JavaScript's Date.getDay() convention: 0 = Sunday ... 6 = Saturday.
 */
data class AlarmSpec(
    val id: String,
    val hour: Int,
    val minute: Int,
    val repeatDays: List<Int>,
    val soundId: String,
    val vibration: Boolean,
    /** Fraction (0..1) of max alarm-stream volume; enforced as a floor while ringing. */
    val volume: Double = 0.7,
) {
  val isRepeating: Boolean
    get() = repeatDays.isNotEmpty()

  fun toJson(): JSONObject =
      JSONObject()
          .put("id", id)
          .put("hour", hour)
          .put("minute", minute)
          .put("repeatDays", JSONArray(repeatDays))
          .put("soundId", soundId)
          .put("vibration", vibration)
          .put("volume", volume)

  companion object {
    fun fromJson(o: JSONObject): AlarmSpec {
      val days = mutableListOf<Int>()
      val arr = o.optJSONArray("repeatDays") ?: JSONArray()
      for (i in 0 until arr.length()) {
        val d = arr.optInt(i, -1)
        if (d in 0..6) days.add(d)
      }
      return AlarmSpec(
          id = o.getString("id"),
          hour = o.getInt("hour").coerceIn(0, 23),
          minute = o.getInt("minute").coerceIn(0, 59),
          repeatDays = days.distinct().sorted(),
          soundId = o.optString("soundId", "voca_sunrise"),
          vibration = o.optBoolean("vibration", true),
          volume = o.optDouble("volume", 0.7).coerceIn(0.0, 1.0),
      )
    }

    fun listFromJson(json: String): List<AlarmSpec> {
      val arr = JSONArray(json)
      return (0 until arr.length()).map { fromJson(arr.getJSONObject(it)) }
    }

    fun listToJson(list: List<AlarmSpec>): String {
      val arr = JSONArray()
      list.forEach { arr.put(it.toJson()) }
      return arr.toString()
    }
  }
}

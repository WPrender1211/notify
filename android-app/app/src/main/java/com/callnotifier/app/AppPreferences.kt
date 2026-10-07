package com.callnotifier.app

import android.content.Context
import android.content.SharedPreferences

class AppPreferences(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("call_notifier_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_API_KEY = "api_key"
        private const val KEY_DEVICE_NAME = "device_name"
        private const val KEY_SERVICE_RUNNING = "is_service_running"
    }

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER_URL, "http://192.168.1.100:5000/api/calls/event") ?: "http://192.168.1.100:5000/api/calls/event"
        set(value) = prefs.edit().putString(KEY_SERVER_URL, value).apply()

    var apiKey: String
        get() = prefs.getString(KEY_API_KEY, "") ?: ""
        set(value) = prefs.edit().putString(KEY_API_KEY, value).apply()

    var deviceName: String
        get() = prefs.getString(KEY_DEVICE_NAME, "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}") ?: "Android Phone"
        set(value) = prefs.edit().putString(KEY_DEVICE_NAME, value).apply()

    var isServiceRunning: Boolean
        get() = prefs.getBoolean(KEY_SERVICE_RUNNING, false)
        set(value) = prefs.edit().putBoolean(KEY_SERVICE_RUNNING, value).apply()
}

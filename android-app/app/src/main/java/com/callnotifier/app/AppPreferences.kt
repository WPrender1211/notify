package com.callnotifier.app

import android.content.Context
import android.content.SharedPreferences

class AppPreferences(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("call_notifier_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_USER_TOKEN = "user_token"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_API_KEY = "api_key"
        private const val KEY_DEVICE_NAME = "device_name"
        private const val KEY_SERVICE_RUNNING = "is_service_running"
    }

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER_URL, "https://callnotify-hub.onrender.com") ?: "https://callnotify-hub.onrender.com"
        set(value) = prefs.edit().putString(KEY_SERVER_URL, value.trim().removeSuffix("/")).apply()

    var userToken: String
        get() = prefs.getString(KEY_USER_TOKEN, "") ?: ""
        set(value) = prefs.edit().putString(KEY_USER_TOKEN, value).apply()

    var userName: String
        get() = prefs.getString(KEY_USER_NAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_USER_NAME, value).apply()

    var userEmail: String
        get() = prefs.getString(KEY_USER_EMAIL, "") ?: ""
        set(value) = prefs.edit().putString(KEY_USER_EMAIL, value).apply()

    var apiKey: String
        get() = prefs.getString(KEY_API_KEY, "") ?: ""
        set(value) = prefs.edit().putString(KEY_API_KEY, value).apply()

    var deviceName: String
        get() = prefs.getString(KEY_DEVICE_NAME, "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}") ?: "Android Phone"
        set(value) = prefs.edit().putString(KEY_DEVICE_NAME, value).apply()

    var isServiceRunning: Boolean
        get() = prefs.getBoolean(KEY_SERVICE_RUNNING, false)
        set(value) = prefs.edit().putBoolean(KEY_SERVICE_RUNNING, value).apply()

    val isLoggedIn: Boolean
        get() = apiKey.isNotBlank() && userToken.isNotBlank()

    fun saveLogin(token: String, name: String, email: String, key: String) {
        prefs.edit()
            .putString(KEY_USER_TOKEN, token)
            .putString(KEY_USER_NAME, name)
            .putString(KEY_USER_EMAIL, email)
            .putString(KEY_API_KEY, key)
            .apply()
    }

    fun logout() {
        prefs.edit()
            .remove(KEY_USER_TOKEN)
            .remove(KEY_USER_NAME)
            .remove(KEY_USER_EMAIL)
            .remove(KEY_API_KEY)
            .putBoolean(KEY_SERVICE_RUNNING, false)
            .apply()
    }
}

package com.callnotifier.app

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class NotificationForwarderService : NotificationListenerService() {

    companion object {
        private const val TAG = "NotifForwarderService"

        private val IGNORED_PACKAGES = setOf(
            "com.callnotifier.app",
            "android",
            "com.android.systemui",
            "com.google.android.googlequicksearchbox"
        )
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var prefs: AppPreferences

    override fun onCreate() {
        super.onCreate()
        prefs = AppPreferences(this)
        Log.d(TAG, "NotificationForwarderService initialized.")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return
        if (!prefs.isLoggedIn || !prefs.isServiceRunning) return

        val pkg = sbn.packageName ?: return
        if (IGNORED_PACKAGES.contains(pkg)) return

        val notification = sbn.notification ?: return

        // Skip ongoing persistent notifications (like media playback, downloads, battery monitor)
        val isOngoing = (notification.flags and Notification.FLAG_ONGOING_EVENT) != 0
        val isForeground = (notification.flags and Notification.FLAG_FOREGROUND_SERVICE) != 0
        if (isOngoing || isForeground) return

        val extras = notification.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim() ?: ""
        val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()?.trim() ?: ""

        // Skip blank notifications
        if (title.isBlank() && text.isBlank()) return

        val appName = try {
            val appInfo = packageManager.getApplicationInfo(pkg, 0)
            packageManager.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            pkg
        }

        Log.d(TAG, "Forwarding Notification: App=$appName ($pkg), Title=$title, Text=$text")

        serviceScope.launch {
            try {
                val serverUrl = prefs.serverUrl
                val apiKey = prefs.apiKey
                ApiClient.sendNotificationEvent(
                    serverUrl = serverUrl,
                    packageName = pkg,
                    appName = appName,
                    title = title,
                    text = text,
                    subText = subText,
                    apiKey = apiKey
                )
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send notification: ${e.message}")
            }
        }
    }
}

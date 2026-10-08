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

        private val recentNotifications = java.util.concurrent.ConcurrentHashMap<String, Long>()
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var prefs: AppPreferences

    override fun onCreate() {
        super.onCreate()
        prefs = AppPreferences(this)
        Log.d(TAG, "NotificationForwarderService initialized.")
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "NotificationListener connected and listening.")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.w(TAG, "NotificationListener disconnected. Attempting rebind...")
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            requestRebind(android.content.ComponentName(this, NotificationForwarderService::class.java))
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return
        if (!prefs.isLoggedIn) return

        val pkg = sbn.packageName ?: return
        if (IGNORED_PACKAGES.contains(pkg)) return

        val notification = sbn.notification ?: return
        val extras = notification.extras ?: return

        // Extract Title (fallback to BIG_TITLE)
        var title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim() ?: ""
        if (title.isBlank()) {
            title = extras.getCharSequence(Notification.EXTRA_TITLE_BIG)?.toString()?.trim() ?: ""
        }

        // Extract Text (fallback to BIG_TEXT or TEXT_LINES for multi-message previews)
        var text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim() ?: ""
        if (text.isBlank()) {
            text = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.trim() ?: ""
        }
        if (text.isBlank()) {
            val lines = extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)
            if (lines != null && lines.isNotEmpty()) {
                text = lines.mapNotNull { it?.toString()?.trim() }.filter { it.isNotBlank() }.joinToString(" \n ")
            }
        }

        // Extract SubText / Summary
        var subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()?.trim() ?: ""
        if (subText.isBlank()) {
            subText = extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT)?.toString()?.trim() ?: ""
        }

        // Skip blank notifications
        if (title.isBlank() && text.isBlank()) return

        // Fast In-Memory Deduplication: Ignore identical updates posted within 2.0s
        val notifKey = "$pkg|$title|$text|$subText"
        val now = System.currentTimeMillis()
        val lastTime = recentNotifications[notifKey]
        if (lastTime != null && (now - lastTime) < 2000) {
            return
        }
        recentNotifications[notifKey] = now
        if (recentNotifications.size > 150) {
            val cutoff = now - 10000
            recentNotifications.entries.removeIf { it.value < cutoff }
        }

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

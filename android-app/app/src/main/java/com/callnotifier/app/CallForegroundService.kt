package com.callnotifier.app

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel

class CallForegroundService : Service() {

    companion object {
        private const val TAG = "CallForegroundService"
        private const val NOTIFICATION_ID = 1001

        fun start(context: Context) {
            val intent = Intent(context, CallForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, CallForegroundService::class.java)
            context.stopService(intent)
        }
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var prefs: AppPreferences
    private lateinit var telephonyManager: TelephonyManager

    private var dynamicCallReceiver: BroadcastReceiver? = null

    override fun onCreate() {
        super.onCreate()
        prefs = AppPreferences(this)
        telephonyManager = getSystemService(TELEPHONY_SERVICE) as TelephonyManager

        startForegroundWithNotification()
        registerDynamicCallReceiver()

        prefs.isServiceRunning = true
        Log.d(TAG, "CallForegroundService started and listening for calls.")
    }

    private fun registerDynamicCallReceiver() {
        try {
            dynamicCallReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
                        val stateStr = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
                        @Suppress("DEPRECATION")
                        val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

                        Log.d(TAG, "Dynamic Service Broadcast: State=$stateStr, Number=$incomingNumber")

                        if (!incomingNumber.isNullOrBlank()) {
                            when (stateStr) {
                                TelephonyManager.EXTRA_STATE_RINGING -> {
                                    CallDispatcher.dispatch(context, incomingNumber, "RINGING", delayMs = 0)
                                }
                                TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                                    CallDispatcher.dispatch(context, incomingNumber, "ANSWERED", delayMs = 0)
                                }
                                TelephonyManager.EXTRA_STATE_IDLE -> {
                                    CallDispatcher.dispatch(context, incomingNumber, "ENDED", delayMs = 500)
                                }
                            }
                        }
                    }
                }
            }

            val filter = IntentFilter(TelephonyManager.ACTION_PHONE_STATE_CHANGED)
            registerReceiver(dynamicCallReceiver, filter)
            Log.d(TAG, "Dynamic call receiver registered inside Foreground Service.")
        } catch (e: Exception) {
            Log.e(TAG, "Error registering dynamic receiver: ${e.message}")
        }
    }

    private fun startForegroundWithNotification() {
        try {
            val pendingIntent = PendingIntent.getActivity(
                this,
                0,
                Intent(this, MainActivity::class.java),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            val notification: Notification = NotificationCompat.Builder(this, CallNotifierApp.CHANNEL_ID)
                .setContentTitle("Call Notifier Active")
                .setContentText("Listening for incoming calls & dispatching alerts to web")
                .setSmallIcon(android.R.drawable.sym_call_incoming)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in startForegroundWithNotification: ${e.message}")
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        prefs.isServiceRunning = false
        try {
            dynamicCallReceiver?.let { unregisterReceiver(it) }
        } catch (e: Exception) {}
        serviceScope.cancel()
        Log.d(TAG, "CallForegroundService stopped.")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

package com.callnotifier.app

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class CallForegroundService : Service() {

    companion object {
        private const val NOTIFICATION_ID = 101
        private const val TAG = "CallForegroundService"

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

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private lateinit var telephonyManager: TelephonyManager
    private lateinit var prefs: AppPreferences

    // State tracking
    private var lastState = TelephonyManager.CALL_STATE_IDLE
    private var savedNumber: String? = null
    private var isIncoming = false

    override fun onCreate() {
        super.onCreate()
        prefs = AppPreferences(this)
        telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        startForegroundWithNotification()
        registerPhoneListener()
        prefs.isServiceRunning = true
        Log.d(TAG, "CallForegroundService started and listening.")
    }

    private fun startForegroundWithNotification() {
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
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL)
            } else {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL)
            }
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun registerPhoneListener() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                override fun onCallStateChanged(state: Int) {
                    handleCallStateChange(state, null)
                }
            }
            try {
                telephonyManager.registerTelephonyCallback(mainExecutor, callback)
            } catch (e: SecurityException) {
                Log.e(TAG, "SecurityException registering TelephonyCallback: ${e.message}")
            }
        } else {
            @Suppress("DEPRECATION")
            val listener = object : PhoneStateListener() {
                @Deprecated("Deprecated in Java")
                override fun onCallStateChanged(state: Int, incomingNumber: String?) {
                    handleCallStateChange(state, incomingNumber)
                }
            }
            try {
                @Suppress("DEPRECATION")
                telephonyManager.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
            } catch (e: SecurityException) {
                Log.e(TAG, "SecurityException registering PhoneStateListener: ${e.message}")
            }
        }
    }

    fun handleCallStateChange(state: Int, number: String?) {
        if (lastState == state) return

        if (!number.isNullOrBlank()) {
            savedNumber = number
        }

        val callerNumber = savedNumber ?: "Unknown Number"
        val callerName = ContactResolver.getContactName(this, callerNumber)

        when (state) {
            TelephonyManager.CALL_STATE_RINGING -> {
                isIncoming = true
                Log.d(TAG, "Incoming call ringing: $callerNumber ($callerName)")
                dispatchCallEvent(callerNumber, callerName, "RINGING")
            }
            TelephonyManager.CALL_STATE_OFFHOOK -> {
                if (lastState == TelephonyManager.CALL_STATE_RINGING) {
                    isIncoming = true
                    Log.d(TAG, "Incoming call answered: $callerNumber ($callerName)")
                    dispatchCallEvent(callerNumber, callerName, "ANSWERED")
                }
            }
            TelephonyManager.CALL_STATE_IDLE -> {
                if (lastState == TelephonyManager.CALL_STATE_RINGING) {
                    // Ringing but never answered -> Missed
                    Log.d(TAG, "Missed call from: $callerNumber ($callerName)")
                    dispatchCallEvent(callerNumber, callerName, "MISSED")
                } else if (isIncoming) {
                    // In call and hung up -> Ended
                    Log.d(TAG, "Call ended: $callerNumber ($callerName)")
                    dispatchCallEvent(callerNumber, callerName, "ENDED")
                }
                isIncoming = false
                savedNumber = null
            }
        }
        lastState = state
    }

    private fun dispatchCallEvent(number: String, name: String, state: String) {
        serviceScope.launch {
            ApiClient.sendCallEvent(
                serverUrl = prefs.serverUrl,
                number = number,
                name = name,
                state = state,
                device = prefs.deviceName,
                apiKey = prefs.apiKey
            )
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        prefs.isServiceRunning = false
        serviceScope.cancel()
        Log.d(TAG, "CallForegroundService destroyed.")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

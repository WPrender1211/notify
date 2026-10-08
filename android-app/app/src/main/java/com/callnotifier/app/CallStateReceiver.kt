package com.callnotifier.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class CallStateReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "CallStateReceiver"
        private val receiverScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

        private var lastState = TelephonyManager.EXTRA_STATE_IDLE
        private var savedNumber: String? = null
        private var isIncoming = false
    }

    override fun onReceive(context: Context, intent: Intent) {
        val prefs = AppPreferences(context)

        // Handle Boot Completed
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            if (prefs.isLoggedIn && prefs.isServiceRunning) {
                Log.d(TAG, "Boot completed: Restarting CallForegroundService")
                CallForegroundService.start(context)
            }
            return
        }

        // Handle Telephony State Broadcast
        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val stateStr = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
            @Suppress("DEPRECATION")
            val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

            Log.d(TAG, "Phone State Broadcast: State=$stateStr, Number=$incomingNumber")

            // Ensure background service is running
            if (prefs.isLoggedIn && !prefs.isServiceRunning) {
                CallForegroundService.start(context)
            }

            if (!prefs.isLoggedIn) {
                Log.d(TAG, "User not logged in; ignoring call broadcast.")
                return
            }

            if (stateStr == lastState) return

            if (!incomingNumber.isNullOrBlank()) {
                savedNumber = incomingNumber
            }

            val numberToReport = savedNumber ?: incomingNumber ?: "Incoming Caller"
            val contactName = ContactResolver.getContactName(context, numberToReport)

            when (stateStr) {
                TelephonyManager.EXTRA_STATE_RINGING -> {
                    isIncoming = true
                    Log.d(TAG, "⚡ REAL CALL DETECTED (RINGING): $numberToReport ($contactName)")
                    dispatchCallEvent(context, prefs, numberToReport, contactName, "RINGING")
                }
                TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                    if (isIncoming || lastState == TelephonyManager.EXTRA_STATE_RINGING) {
                        isIncoming = true
                        Log.d(TAG, "⚡ REAL CALL ANSWERED: $numberToReport ($contactName)")
                        dispatchCallEvent(context, prefs, numberToReport, contactName, "ANSWERED")
                    }
                }
                TelephonyManager.EXTRA_STATE_IDLE -> {
                    if (lastState == TelephonyManager.EXTRA_STATE_RINGING) {
                        Log.d(TAG, "⚡ REAL CALL MISSED: $numberToReport ($contactName)")
                        dispatchCallEvent(context, prefs, numberToReport, contactName, "MISSED")
                    } else if (isIncoming) {
                        Log.d(TAG, "⚡ REAL CALL ENDED: $numberToReport ($contactName)")
                        dispatchCallEvent(context, prefs, numberToReport, contactName, "ENDED")
                    }
                    isIncoming = false
                    savedNumber = null
                }
            }

            lastState = stateStr
        }
    }

    private fun dispatchCallEvent(
        context: Context,
        prefs: AppPreferences,
        number: String,
        name: String,
        state: String
    ) {
        val pendingResult = goAsync()
        receiverScope.launch {
            try {
                val serverUrl = prefs.serverUrl
                val deviceName = prefs.deviceName
                val apiKey = prefs.apiKey

                Log.d(TAG, "Sending $state to $serverUrl for $number ($name)")
                val success = ApiClient.sendCallEvent(
                    serverUrl = serverUrl,
                    number = number,
                    name = name,
                    state = state,
                    device = deviceName,
                    apiKey = apiKey
                )
                Log.d(TAG, "Dispatch call event success: $success")
            } catch (e: Exception) {
                Log.e(TAG, "Error dispatching call event: ${e.message}")
            } finally {
                pendingResult.finish()
            }
        }
    }
}

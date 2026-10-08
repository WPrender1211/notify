package com.callnotifier.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

class CallStateReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "CallStateReceiver"

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

            if (prefs.isLoggedIn && !prefs.isServiceRunning) {
                CallForegroundService.start(context)
            }

            if (!prefs.isLoggedIn) return

            if (stateStr == lastState) return

            if (!incomingNumber.isNullOrBlank()) {
                savedNumber = incomingNumber
            }

            val targetNumber = savedNumber ?: incomingNumber

            when (stateStr) {
                TelephonyManager.EXTRA_STATE_RINGING -> {
                    isIncoming = true
                    val pendingResult = goAsync()
                    // Allow 300ms for secondary broadcast with number to arrive or CallLog lookup
                    CallDispatcher.dispatch(context, targetNumber, "RINGING", delayMs = 300) {
                        pendingResult.finish()
                    }
                }
                TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                    if (isIncoming || lastState == TelephonyManager.EXTRA_STATE_RINGING) {
                        isIncoming = true
                        val pendingResult = goAsync()
                        CallDispatcher.dispatch(context, targetNumber, "ANSWERED", delayMs = 0) {
                            pendingResult.finish()
                        }
                    }
                }
                TelephonyManager.EXTRA_STATE_IDLE -> {
                    val pendingResult = goAsync()
                    val targetState = if (lastState == TelephonyManager.EXTRA_STATE_RINGING) "MISSED" else "ENDED"
                    // On IDLE (Call Ended or Missed), delay 500ms so Android has written the actual phone number and contact name into CallLog!
                    CallDispatcher.dispatch(context, targetNumber, targetState, delayMs = 500) {
                        pendingResult.finish()
                    }
                    isIncoming = false
                    savedNumber = null
                }
            }

            lastState = stateStr
        }
    }
}

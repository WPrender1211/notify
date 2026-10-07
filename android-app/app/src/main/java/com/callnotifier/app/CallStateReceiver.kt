package com.callnotifier.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

class CallStateReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "CallStateReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val prefs = AppPreferences(context)

        // Handle Boot Completed
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            if (prefs.isServiceRunning) {
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

            Log.d(TAG, "Phone State Broadcast: $stateStr, Number: $incomingNumber")

            // Ensure background service is up
            if (!prefs.isServiceRunning) {
                CallForegroundService.start(context)
            }
        }
    }
}

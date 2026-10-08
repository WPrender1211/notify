package com.callnotifier.app

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.util.Log
import androidx.annotation.RequiresApi

@RequiresApi(Build.VERSION_CODES.Q)
class IncomingCallScreeningService : CallScreeningService() {

    companion object {
        private const val TAG = "CallScreeningService"
    }

    override fun onScreenCall(callDetails: Call.Details) {
        try {
            val handle = callDetails.handle
            val rawNumber = handle?.schemeSpecificPart

            Log.d(TAG, "⚡ Live CallScreening Event: RawNumber=$rawNumber")

            if (!rawNumber.isNullOrBlank()) {
                CallDispatcher.dispatch(this, rawNumber, "RINGING")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in onScreenCall: ${e.message}")
        } finally {
            // Allow the call to ring normally without blocking
            respondToCall(callDetails, CallResponse.Builder().build())
        }
    }
}

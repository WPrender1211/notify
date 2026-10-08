package com.callnotifier.app

import android.content.Context
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

object CallDispatcher {
    private const val TAG = "CallDispatcher"
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private var lastDispatchedState: String? = null
    private var lastDispatchedNumber: String? = null
    private var lastDispatchedTime: Long = 0

    fun dispatch(
        context: Context,
        rawNumber: String?,
        state: String,
        delayMs: Long = 0,
        onComplete: (() -> Unit)? = null
    ) {
        val prefs = AppPreferences(context)
        if (!prefs.isLoggedIn) {
            Log.d(TAG, "Skipping call dispatch: user not logged in.")
            onComplete?.invoke()
            return
        }

        scope.launch {
            try {
                if (delayMs > 0) {
                    delay(delayMs)
                }

                val callerInfo = ContactResolver.resolveCaller(context, rawNumber)
                val now = System.currentTimeMillis()

                // Deduplication: prevent firing identical event within 1500ms
                if (state == lastDispatchedState && 
                    callerInfo.number == lastDispatchedNumber && 
                    (now - lastDispatchedTime) < 1500) {
                    Log.d(TAG, "Deduplicating duplicate event: $state for ${callerInfo.number}")
                    return@launch
                }

                lastDispatchedState = state
                lastDispatchedNumber = callerInfo.number
                lastDispatchedTime = now

                val serverUrl = prefs.serverUrl
                val deviceName = prefs.deviceName
                val apiKey = prefs.apiKey

                Log.d(TAG, "📡 Dispatching: State=$state, Caller=${callerInfo.name} (${callerInfo.number}) to $serverUrl")
                val success = ApiClient.sendCallEvent(
                    serverUrl = serverUrl,
                    number = callerInfo.number,
                    name = callerInfo.name,
                    state = state,
                    device = deviceName,
                    apiKey = apiKey
                )
                Log.d(TAG, "Dispatch result: $success")
            } catch (e: Exception) {
                Log.e(TAG, "Dispatch failed: ${e.message}")
            } finally {
                onComplete?.invoke()
            }
        }
    }
}

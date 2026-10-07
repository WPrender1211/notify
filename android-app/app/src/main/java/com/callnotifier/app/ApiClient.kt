package com.callnotifier.app

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object ApiClient {
    private const val TAG = "ApiClient"

    private val client = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .writeTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .build()

    private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()

    suspend fun sendCallEvent(
        serverUrl: String,
        number: String,
        name: String,
        state: String,
        device: String,
        apiKey: String = ""
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("number", number)
                put("name", name)
                put("state", state)
                put("device", device)
                put("timestamp", java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).apply {
                    timeZone = java.util.TimeZone.getTimeZone("UTC")
                }.format(java.util.Date()))
                if (apiKey.isNotBlank()) {
                    put("apiKey", apiKey)
                }
            }

            val body = json.toString().toRequestBody(JSON_MEDIA_TYPE)
            val request = Request.Builder()
                .url(serverUrl)
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            val success = response.isSuccessful
            Log.d(TAG, "Dispatched $state event to $serverUrl: Success=$success, Code=${response.code}")
            response.close()
            return@withContext success
        } catch (e: Exception) {
            Log.e(TAG, "Error sending call event: ${e.message}", e)
            return@withContext false
        }
    }

    suspend fun testConnection(serverUrl: String): Pair<Boolean, String> = withContext(Dispatchers.IO) {
        try {
            // Ping health or options
            val healthUrl = if (serverUrl.contains("/api/calls/event")) {
                serverUrl.replace("/api/calls/event", "/api/health")
            } else {
                serverUrl
            }

            val request = Request.Builder()
                .url(healthUrl)
                .get()
                .build()

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string() ?: ""
            val isSuccess = response.isSuccessful
            response.close()

            if (isSuccess) {
                return@withContext Pair(true, "Server connected successfully!")
            } else {
                return@withContext Pair(false, "Server returned status ${response.code}")
            }
        } catch (e: Exception) {
            return@withContext Pair(false, "Connection error: ${e.localizedMessage}")
        }
    }
}

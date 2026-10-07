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

data class UserSession(
    val token: String,
    val id: String,
    val name: String,
    val email: String,
    val apiKey: String
)

object ApiClient {
    private const val TAG = "ApiClient"

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()

    suspend fun login(
        serverUrl: String,
        emailOrUsername: String,
        password: String
    ): Pair<Boolean, UserSession?> = withContext(Dispatchers.IO) {
        try {
            val base = serverUrl.trim().removeSuffix("/").removeSuffix("/api/calls/event")
            val loginUrl = "$base/api/auth/login"

            val json = JSONObject().apply {
                put("email", emailOrUsername)
                put("password", password)
            }

            val body = json.toString().toRequestBody(JSON_MEDIA_TYPE)
            val request = Request.Builder()
                .url(loginUrl)
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            val resStr = response.body?.string() ?: ""
            response.close()

            if (response.isSuccessful) {
                val data = JSONObject(resStr)
                val token = data.getString("token")
                val userObj = data.getJSONObject("user")

                val session = UserSession(
                    token = token,
                    id = userObj.optString("id", ""),
                    name = userObj.optString("name", "User"),
                    email = userObj.optString("email", emailOrUsername),
                    apiKey = userObj.getString("apiKey")
                )
                return@withContext Pair(true, session)
            } else {
                Log.e(TAG, "Login failed: $resStr")
                return@withContext Pair(false, null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Login exception: ${e.message}", e)
            return@withContext Pair(false, null)
        }
    }

    suspend fun sendCallEvent(
        serverUrl: String,
        number: String,
        name: String,
        state: String,
        device: String,
        apiKey: String = ""
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val base = serverUrl.trim().removeSuffix("/")
            val endpoint = if (base.endsWith("/api/calls/event")) base else "$base/api/calls/event"

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
                .url(endpoint)
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            val success = response.isSuccessful
            Log.d(TAG, "Dispatched $state event to $endpoint: Success=$success, Code=${response.code}")
            response.close()
            return@withContext success
        } catch (e: Exception) {
            Log.e(TAG, "Error sending call event: ${e.message}", e)
            return@withContext false
        }
    }
}

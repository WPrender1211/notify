package com.callnotifier.app

import android.content.Context
import android.net.Uri
import android.provider.CallLog
import android.provider.ContactsContract
import android.util.Log

object ContactResolver {
    private const val TAG = "ContactResolver"

    data class CallerInfo(val number: String, val name: String)

    fun resolveCaller(context: Context, incomingNumber: String?): CallerInfo {
        var finalNumber = incomingNumber?.trim()

        // Fallback: If Android OS hid the number in the broadcast, check CallLog for the latest active incoming call
        if (finalNumber.isNullOrBlank() || finalNumber.equals("Unknown Number", ignoreCase = true) || finalNumber.equals("Incoming Caller", ignoreCase = true)) {
            val callLogNumber = getLatestNumberFromCallLog(context)
            if (!callLogNumber.isNullOrBlank()) {
                finalNumber = callLogNumber
            }
        }

        val displayNum = if (!finalNumber.isNullOrBlank()) finalNumber else "Unknown Number"
        val contactName = getContactName(context, displayNum)

        val displayName = if (contactName != "Unknown Caller") {
            contactName
        } else if (displayNum != "Unknown Number") {
            displayNum
        } else {
            "Unknown Caller"
        }

        return CallerInfo(number = displayNum, name = displayName)
    }

    private fun getContactName(context: Context, phoneNumber: String): String {
        if (phoneNumber == "Unknown Number" || phoneNumber.isBlank()) return "Unknown Caller"

        try {
            val uri = Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                Uri.encode(phoneNumber)
            )
            val projection = arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME)

            context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val nameIndex = cursor.getColumnIndex(ContactsContract.PhoneLookup.DISPLAY_NAME)
                    if (nameIndex != -1) {
                        val name = cursor.getString(nameIndex)
                        if (!name.isNullOrBlank()) return name
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error looking up contact name: ${e.message}")
        }

        return "Unknown Caller"
    }

    private fun getLatestNumberFromCallLog(context: Context): String? {
        try {
            val projection = arrayOf(CallLog.Calls.NUMBER, CallLog.Calls.CACHED_NAME, CallLog.Calls.DATE)
            val sortOrder = "${CallLog.Calls.DATE} DESC LIMIT 1"

            context.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                projection,
                null,
                null,
                sortOrder
            )?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val numIndex = cursor.getColumnIndex(CallLog.Calls.NUMBER)
                    if (numIndex != -1) {
                        return cursor.getString(numIndex)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error querying CallLog fallback: ${e.message}")
        }
        return null
    }
}

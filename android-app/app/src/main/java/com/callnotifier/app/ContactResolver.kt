package com.callnotifier.app

import android.content.Context
import android.net.Uri
import android.provider.ContactsContract

object ContactResolver {
    fun getContactName(context: Context, phoneNumber: String?): String {
        if (phoneNumber.isNullOrBlank()) return "Unknown Caller"

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
                        return cursor.getString(nameIndex) ?: "Unknown Caller"
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return "Unknown Caller"
    }
}

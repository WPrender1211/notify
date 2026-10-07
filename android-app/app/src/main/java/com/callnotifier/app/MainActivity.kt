package com.callnotifier.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var prefs: AppPreferences
    private lateinit var etServerUrl: EditText
    private lateinit var etApiKey: EditText
    private lateinit var etDeviceName: EditText
    private lateinit var btnToggleService: Button
    private lateinit var btnTestConnection: Button
    private lateinit var tvStatus: TextView
    private lateinit var tvLogs: TextView

    private val requiredPermissions = buildList {
        add(Manifest.permission.READ_PHONE_STATE)
        add(Manifest.permission.READ_CALL_LOG)
        add(Manifest.permission.READ_CONTACTS)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val allGranted = results.values.all { it }
        if (allGranted) {
            appendLog("✅ All permissions granted successfully.")
            updateUiState()
        } else {
            appendLog("⚠️ Some permissions were denied. Call monitoring may not work.")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = AppPreferences(this)

        etServerUrl = findViewById(R.id.etServerUrl)
        etApiKey = findViewById(R.id.etApiKey)
        etDeviceName = findViewById(R.id.etDeviceName)
        btnToggleService = findViewById(R.id.btnToggleService)
        btnTestConnection = findViewById(R.id.btnTestConnection)
        tvStatus = findViewById(R.id.tvStatus)
        tvLogs = findViewById(R.id.tvLogs)

        // Populate fields
        etServerUrl.setText(prefs.serverUrl)
        etApiKey.setText(prefs.apiKey)
        etDeviceName.setText(prefs.deviceName)

        btnToggleService.setOnClickListener {
            saveInputs()
            if (!hasPermissions()) {
                requestRequiredPermissions()
                return@setOnClickListener
            }

            if (prefs.isServiceRunning) {
                CallForegroundService.stop(this)
                prefs.isServiceRunning = false
                appendLog("⏹️ Background Service stopped.")
            } else {
                CallForegroundService.start(this)
                prefs.isServiceRunning = true
                appendLog("▶️ Background Service started.")
            }
            updateUiState()
        }

        btnTestConnection.setOnClickListener {
            saveInputs()
            appendLog("📡 Testing connection to ${prefs.serverUrl}...")
            CoroutineScope(Dispatchers.Main).launch {
                val (success, message) = ApiClient.testConnection(prefs.serverUrl)
                if (success) {
                    appendLog("✅ $message")
                    Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show()
                } else {
                    appendLog("❌ $message")
                    Toast.makeText(this@MainActivity, message, Toast.LENGTH_LONG).show()
                }
            }
        }

        updateUiState()
        if (!hasPermissions()) {
            requestRequiredPermissions()
        }
    }

    private fun saveInputs() {
        prefs.serverUrl = etServerUrl.text.toString().trim()
        prefs.apiKey = etApiKey.text.toString().trim()
        prefs.deviceName = etDeviceName.text.toString().trim()
    }

    private fun hasPermissions(): Boolean {
        return requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestRequiredPermissions() {
        permissionLauncher.launch(requiredPermissions.toTypedArray())
    }

    private fun updateUiState() {
        if (prefs.isServiceRunning) {
            tvStatus.text = "● Active & Listening"
            tvStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_dark))
            btnToggleService.text = "Stop Background Service"
        } else {
            tvStatus.text = "○ Stopped"
            tvStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
            btnToggleService.text = "Start Background Service"
        }
    }

    private fun appendLog(msg: String) {
        val timestamp = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())
        val current = tvLogs.text.toString()
        tvLogs.text = "[$timestamp] $msg\n$current"
    }
}

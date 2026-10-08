package com.callnotifier.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
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

    // Login View
    private lateinit var layoutLogin: LinearLayout
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: Button

    // Connected View
    private lateinit var layoutConnected: LinearLayout
    private lateinit var tvUserName: TextView
    private lateinit var tvUserEmail: TextView
    private lateinit var tvStatus: TextView
    private lateinit var tvConnectedServer: TextView
    private lateinit var btnToggleService: Button
    private lateinit var btnSendTestCall: Button
    private lateinit var btnLogout: Button

    private lateinit var tvLogs: TextView

    private val requiredPermissions = buildList {
        add(Manifest.permission.READ_PHONE_STATE)
        add(Manifest.permission.READ_CALL_LOG)
        add(Manifest.permission.READ_CONTACTS)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            add(Manifest.permission.READ_PHONE_NUMBERS)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val allGranted = results.values.all { it }
        if (allGranted) {
            appendLog("✅ Phone & Call permissions granted.")
            if (prefs.isLoggedIn && !prefs.isServiceRunning) {
                startServiceInternal()
            }
        } else {
            appendLog("⚠️ Some permissions were denied. Call detection may be limited.")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = AppPreferences(this)

        // Bind Views
        layoutLogin = findViewById(R.id.layoutLogin)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)

        layoutConnected = findViewById(R.id.layoutConnected)
        tvUserName = findViewById(R.id.tvUserName)
        tvUserEmail = findViewById(R.id.tvUserEmail)
        tvStatus = findViewById(R.id.tvStatus)
        tvConnectedServer = findViewById(R.id.tvConnectedServer)
        btnToggleService = findViewById(R.id.btnToggleService)
        btnSendTestCall = findViewById(R.id.btnSendTestCall)
        btnLogout = findViewById(R.id.btnLogout)
        tvLogs = findViewById(R.id.tvLogs)

        // Login Action (Zero URL prompt needed)
        btnLogin.setOnClickListener {
            val server = prefs.serverUrl
            val email = etEmail.text.toString().trim()
            val pass = etPassword.text.toString().trim()

            if (email.isBlank() || pass.isBlank()) {
                Toast.makeText(this, "Please enter your Email and Password", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnLogin.isEnabled = false
            btnLogin.text = "Signing In..."
            appendLog("🔐 Signing in as $email...")

            CoroutineScope(Dispatchers.Main).launch {
                val (success, session) = ApiClient.login(server, email, pass)
                btnLogin.isEnabled = true
                btnLogin.text = "Sign In & Connect Phone"

                if (success && session != null) {
                    prefs.saveLogin(session.token, session.name, session.email, session.apiKey)
                    appendLog("✅ Connected as ${session.name}! Ready to forward calls.")
                    Toast.makeText(this@MainActivity, "Connected as ${session.name}", Toast.LENGTH_SHORT).show()

                    if (hasPermissions()) {
                        startServiceInternal()
                    } else {
                        requestRequiredPermissions()
                    }
                    updateScreens()
                } else {
                    appendLog("❌ Sign in failed. Please verify your Email or Password.")
                    Toast.makeText(this@MainActivity, "Invalid credentials", Toast.LENGTH_LONG).show()
                }
            }
        }

        // Service Toggle Action
        btnToggleService.setOnClickListener {
            if (prefs.isServiceRunning) {
                CallForegroundService.stop(this)
                prefs.isServiceRunning = false
                appendLog("⏹️ Background Service paused.")
            } else {
                if (hasPermissions()) {
                    startServiceInternal()
                } else {
                    requestRequiredPermissions()
                }
            }
            updateScreens()
        }

        // Send Test Call Event
        btnSendTestCall.setOnClickListener {
            appendLog("📡 Sending test call alert to web dashboard...")
            CoroutineScope(Dispatchers.Main).launch {
                val success = ApiClient.sendCallEvent(
                    serverUrl = prefs.serverUrl,
                    number = "+1 (555) 019-9234",
                    name = "VIP Client",
                    state = "RINGING",
                    device = prefs.deviceName,
                    apiKey = prefs.apiKey
                )
                if (success) {
                    appendLog("✅ Test call event delivered to dashboard!")
                    Toast.makeText(this@MainActivity, "Test call sent to dashboard!", Toast.LENGTH_SHORT).show()
                } else {
                    appendLog("❌ Failed to deliver test call. Check internet connection.")
                }
            }
        }

        // Logout Action
        btnLogout.setOnClickListener {
            CallForegroundService.stop(this)
            prefs.logout()
            appendLog("🔒 Signed out.")
            updateScreens()
        }

        updateScreens()

        if (prefs.isLoggedIn && !hasPermissions()) {
            requestRequiredPermissions()
        } else if (prefs.isLoggedIn && !prefs.isServiceRunning) {
            startServiceInternal()
            updateScreens()
        }
    }

    override fun onResume() {
        super.onResume()
        if (prefs.isLoggedIn) {
            if (hasPermissions() && !prefs.isServiceRunning) {
                startServiceInternal()
            }
            updateScreens()
        }
    }

    private fun startServiceInternal() {
        CallForegroundService.start(this)
        prefs.isServiceRunning = true
        appendLog("▶️ Background Call Monitoring is ACTIVE.")
    }

    private fun hasPermissions(): Boolean {
        return requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestRequiredPermissions() {
        permissionLauncher.launch(requiredPermissions.toTypedArray())
    }

    private fun updateScreens() {
        if (prefs.isLoggedIn) {
            layoutLogin.visibility = View.GONE
            layoutConnected.visibility = View.VISIBLE

            tvUserName.text = prefs.userName
            tvUserEmail.text = prefs.userEmail
            tvConnectedServer.text = "Cloud Relay: Connected"

            if (prefs.isServiceRunning) {
                tvStatus.text = "● Service Active & Forwarding Calls"
                tvStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_dark))
                btnToggleService.text = "Pause Background Service"
            } else {
                tvStatus.text = "○ Service Paused"
                tvStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
                btnToggleService.text = "Resume Background Service"
            }
        } else {
            layoutLogin.visibility = View.VISIBLE
            layoutConnected.visibility = View.GONE
        }
    }

    private fun appendLog(msg: String) {
        val timestamp = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())
        val current = tvLogs.text.toString()
        tvLogs.text = "[$timestamp] $msg\n$current"
    }
}

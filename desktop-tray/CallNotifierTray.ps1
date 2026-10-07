# Windows System Tray Companion for CallNotify
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

$ServerUrl = "http://localhost:5000"
$script:isMuted = $false

# Create System Tray NotifyIcon
$trayIcon = New-Object System.Windows.Forms.NotifyIcon
$trayIcon.Text = "CallNotify: Listening for Calls"
$trayIcon.Visible = $true

# Draw a sleek phone icon bitmap
$bmp = New-Object System.Drawing.Bitmap 32, 32
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(56, 189, 248))
$g.FillEllipse($brush, 2, 2, 28, 28)
$phonePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White, 3)
$g.DrawArc($phonePen, 8, 8, 16, 16, 200, 140)
$g.FillEllipse([System.Drawing.Brushes]::White, 12, 12, 8, 8)
$g.Dispose()
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$trayIcon.Icon = $icon

# Create Context Menu
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$headerItem = New-Object System.Windows.Forms.ToolStripMenuItem
$headerItem.Text = "CallNotify Hub"
$headerItem.Enabled = $false

$muteItem = New-Object System.Windows.Forms.ToolStripMenuItem
$muteItem.Text = "Mute Notifications (Off)"
$muteItem.Checked = $false

$openWebItem = New-Object System.Windows.Forms.ToolStripMenuItem
$openWebItem.Text = "Open Web Dashboard"

$testItem = New-Object System.Windows.Forms.ToolStripMenuItem
$testItem.Text = "Test Call Notification"

$sep = New-Object System.Windows.Forms.ToolStripSeparator

$exitItem = New-Object System.Windows.Forms.ToolStripMenuItem
$exitItem.Text = "Exit CallNotify"

$contextMenu.Items.Add($headerItem) | Out-Null
$contextMenu.Items.Add($muteItem) | Out-Null
$contextMenu.Items.Add($openWebItem) | Out-Null
$contextMenu.Items.Add($testItem) | Out-Null
$contextMenu.Items.Add($sep) | Out-Null
$contextMenu.Items.Add($exitItem) | Out-Null

$trayIcon.ContextMenuStrip = $contextMenu

# Update UI State
function Update-TrayState {
    param([bool]$muted)
    $script:isMuted = $muted
    $muteItem.Checked = $script:isMuted
    if ($script:isMuted) {
        $trayIcon.Text = "CallNotify: MUTED (Notifications Off)"
        $muteItem.Text = "Unmute Notifications (Turn ON)"
    } else {
        $trayIcon.Text = "CallNotify: Active (Listening for Calls)"
        $muteItem.Text = "Mute Notifications (Turn OFF)"
    }
}

# Toggle Mute Action
$muteItem.add_Click({
    $newMute = -not $script:isMuted
    Update-TrayState $newMute
    try {
        Invoke-RestMethod -Uri "$ServerUrl/api/tray/toggle-mute" -Method Post -TimeoutSec 2 | Out-Null
    } catch {}
    
    if ($script:isMuted) {
        $trayIcon.ShowBalloonTip(3000, "Notifications Muted", "Call alerts are now MUTED. Incoming calls will log quietly to web.", [System.Windows.Forms.ToolTipIcon]::Warning)
    } else {
        $trayIcon.ShowBalloonTip(3000, "Notifications Active", "Call alerts are now ON. You will receive notifications when your phone rings.", [System.Windows.Forms.ToolTipIcon]::Info)
    }
})

# Open Web Dashboard
$openWebItem.add_Click({
    Start-Process "$ServerUrl"
})

$trayIcon.add_DoubleClick({
    Start-Process "$ServerUrl"
})

# Test Alert
$testItem.add_Click({
    if ($script:isMuted) {
        $trayIcon.ShowBalloonTip(3000, "Notifications Muted", "Unmute in tray menu to see incoming call alerts.", [System.Windows.Forms.ToolTipIcon]::Warning)
    } else {
        $trayIcon.ShowBalloonTip(5000, "Incoming Call: Sarah Jenkins", "+1 (555) 349-8812`nNovacorp Global (VIP Client)", [System.Windows.Forms.ToolTipIcon]::Info)
    }
})

# Exit
$exitItem.add_Click({
    $trayIcon.Visible = $false
    $trayIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
    Stop-Process -Id $PID
})

# Background Polling Timer for Call Events & Mute Sync
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 2000
$lastProcessedCallId = ""

$timer.add_Tick({
    try {
        $status = Invoke-RestMethod -Uri "$ServerUrl/api/tray/status" -Method Get -TimeoutSec 1
        if ($status -and $status.isMuted -ne $script:isMuted) {
            Update-TrayState $status.isMuted
        }
        
        $callsData = Invoke-RestMethod -Uri "$ServerUrl/api/calls" -Method Get -TimeoutSec 1
        if ($callsData -and $callsData.activeCall) {
            $act = $callsData.activeCall
            if ($act.id -ne $script:lastProcessedCallId) {
                $script:lastProcessedCallId = $act.id
                if (-not $script:isMuted -and $act.state -eq "RINGING") {
                    $caller = if ($act.name) { $act.name } else { "Unknown Caller" }
                    $details = "$($act.number)"
                    if ($act.company) { $details += " ($($act.company))" }
                    $trayIcon.ShowBalloonTip(7000, "Incoming Call: $caller", $details, [System.Windows.Forms.ToolTipIcon]::Info)
                }
            }
        }
    } catch {}
})
$timer.Start()

# Initial balloon tip on start
$trayIcon.ShowBalloonTip(3000, "CallNotify Active in Tray", "Right-click this tray icon anytime to Mute Notifications or Open Dashboard.", [System.Windows.Forms.ToolTipIcon]::Info)

# Run Windows message loop
[System.Windows.Forms.Application]::Run()

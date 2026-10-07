# 🌐 Hostinger Deployment Guide for CallNotify

This guide walks you through deploying your **Multi-User Call Notification Platform** to **Hostinger** so that your Android phone works from anywhere in the world over **4G/5G mobile data or any Wi-Fi network**.

---

## 🎯 High-Level Cloud Setup

```
📱 Android Phone (Anywhere on 4G/5G) 
       │
       ▼ HTTPS POST to https://yourdomain.com/api/calls/event
☁️ Hostinger Cloud / VPS (PM2 + Nginx + Node.js)
       │
       ▼ WebSocket Stream
💻 Web Dashboard (Accessible from any computer in the world)
```

---

## 🚀 Step-by-Step Deployment on Hostinger VPS (Recommended)

### Step 1: Connect to your Hostinger VPS via SSH
Open PowerShell or Terminal and connect to your VPS:
```bash
ssh root@YOUR_HOSTINGER_SERVER_IP
```

### Step 2: Clone or Upload Your Project
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/notification.git callnotify
cd callnotify
```
*(Or upload this `notification` folder using FileZilla / Cyberduck SFTP).*

### Step 3: Run the 1-Click Deployment Script
```bash
chmod +x hostinger/deploy.sh
./hostinger/deploy.sh
```
This automatically installs Node.js, builds your frontend UI, and starts your backend service with **PM2** (auto-restarting 24/7).

### Step 4: Configure Nginx & Free SSL (Let's Encrypt)
1. Copy the Nginx config file:
   ```bash
   sudo cp hostinger/nginx.conf /etc/nginx/sites-available/callnotify
   sudo sed -i 's/yourdomain.com/YOUR_ACTUAL_DOMAIN.com/g' /etc/nginx/sites-available/callnotify
   sudo ln -s /etc/nginx/sites-available/callnotify /etc/nginx/sites-enabled/
   ```
2. Get free HTTPS / SSL certificate:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d YOUR_ACTUAL_DOMAIN.com
   sudo systemctl restart nginx
   ```

---

## 📱 Configuring Your Android Phone on 4G/5G

Once your server is live at `https://YOUR_DOMAIN.com`:

1. Open the **CallNotifier Android App** on your phone.
2. In the **Server URL** box, enter:
   ```
   https://YOUR_DOMAIN.com/api/calls/event
   ```
3. Enter your **Personal API Key** (e.g. `usr_key_alex_...`).
4. Tap **"Start Background Service"**.

🎉 **You're all set!** Whenever someone calls your phone — whether you are at home, traveling, or using mobile data — the notification will instantly appear on your web dashboard at `https://YOUR_DOMAIN.com` in real time!

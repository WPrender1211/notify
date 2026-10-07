# 🚀 Hostinger + Render.com Setup Guide (Option 1)

This guide shows you how to host your **Frontend Web Dashboard on Hostinger** (HTML/CSS/JS in `public_html`) while using **Render.com (Free)** for the real-time Node.js & WebSocket backend.

---

## 🏗️ Architecture

```
📱 Android Phone (Anywhere on 4G/5G) 
       │
       ▼ (POST /api/calls/event)
⚡ Render.com Free Backend (Node.js + WebSockets)
   URL: https://your-backend.onrender.com
       │
       ▼ WebSocket Real-Time Stream
🌐 Your Hostinger Website (e.g., https://yourdomain.com)
   (Uploaded to Hostinger public_html)
```

---

## 🛠️ Step 1: Deploy Backend to Render.com (Free)

1. Push your project code to a **GitHub repository** (public or private).
2. Go to [**Render.com**](https://dashboard.render.com/) ➔ Click **"New +" ➔ "Web Service"**.
3. Select your GitHub repository.
4. Set the following settings:
   * **Name**: `callnotify-backend` (or your choice)
   * **Language**: `Node`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`
   * **Plan**: `Free`
5. Click **"Create Web Service"**.
6. Copy your live Render URL (e.g. `https://callnotify-backend.onrender.com`).

---

## 🌐 Step 2: Build & Upload Frontend to Hostinger

Now, configure your frontend with your Render URL and upload it to Hostinger:

1. On your computer, open a terminal in `d:\Yash-Development\notification\frontend`.
2. Run the build command with your Render URL:
   ```bash
   # In frontend/ folder
   npx vite build --base=/
   ```
   *(Or add `VITE_API_URL=https://callnotify-backend.onrender.com` in `frontend/.env.production` before building).*
3. Open your Hostinger **File Manager** (or FTP) ➔ Go to `public_html`.
4. Upload all files from `d:\Yash-Development\notification\frontend\dist/`:
   * `index.html`
   * `.htaccess`
   * `sw.js`
   * `assets/` folder
5. Visit your Hostinger domain: `https://yourdomain.com` ➔ Your CallNotify dashboard is live!

---

## 📱 Step 3: Connect Android App (Works 24/7 on 4G/5G)

1. Open the **CallNotifier** app on your phone.
2. In **Server URL**, enter your Render backend URL:
   ```
   https://callnotify-backend.onrender.com/api/calls/event
   ```
3. Enter your **Personal API Key** (from your dashboard profile).
4. Tap **"Start Background Service"**.

🎉 **You're done!** When your phone rings anywhere on 4G/5G, the alert will instantly pop up on your Hostinger web dashboard in real time!

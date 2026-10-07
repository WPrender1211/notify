# 🚀 Deploying CallNotify to Render.com (Free & Fast)

Render.com provides free Node.js hosting with **automatic HTTPS**, **native WebSocket support**, and continuous deployment directly from your GitHub repository.

---

## 📋 Step-by-Step Deployment Guide

### Step 1: Push Project to GitHub
1. Create a new repository on [GitHub.com](https://github.com/new) (public or private).
2. Push your project code:
   ```bash
   git init
   git add .
   git commit -m "Initial CallNotify platform commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

---

### Step 2: Create Web Service on Render
1. Go to [**Render.com**](https://dashboard.render.com/) and sign in with GitHub.
2. Click **"New +"** in the top right ➔ Select **"Web Service"**.
3. Connect your GitHub repository (`YOUR_REPO_NAME`).
4. Configure the settings:
   * **Name**: `callnotify-hub` (or any name you choose)
   * **Language / Environment**: `Node`
   * **Region**: Choose the closest region (e.g., Singapore, Frankfurt, Oregon, Ohio)
   * **Branch**: `main`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free`
5. Click **"Create Web Service"**.

---

### Step 3: Get Your Live HTTPS URL
Render will automatically:
1. Install backend & frontend packages.
2. Compile the production dashboard UI.
3. Start the server and assign you a free public HTTPS URL, e.g.:
   ```
   https://callnotify-hub.onrender.com
   ```

---

## 📱 Connecting Your Android Phone Over 4G/5G

Now that your server is live globally on Render:

1. Open the **CallNotifier** app on your Android phone.
2. Set the **Server URL** to your Render webhook URL:
   ```
   https://callnotify-hub.onrender.com/api/calls/event
   ```
3. Enter your **Personal API Key** (copied from your web dashboard profile).
4. Tap **"Start Background Service"**.

🎉 **You are completely set!** Whenever someone calls your phone anywhere in the world on mobile data (4G/5G) or any Wi-Fi, the notification will instantly pop up on your web dashboard at `https://callnotify-hub.onrender.com` in real time!

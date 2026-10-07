# 📞 CallNotify — Multi-User Real-Time Phone Alerts System

A complete multi-user system with JWT authentication where multiple users can register, link their Android devices via personal API tokens, and receive real-time call notifications on their personal Web Dashboards with complete data isolation.

---

## 🏗️ Multi-User Architecture

```
📱 Android Phone (User A)  ──► [POST /api/calls/event + Key A] ──┐
📱 Android Phone (User B)  ──► [POST /api/calls/event + Key B] ──┤
                                                                 ▼
                                                  🖥️ Multi-User Backend Server
                                                       (JWT Auth & Room Routing)
                                                                 │
                                     ┌───────────────────────────┴───────────────────────────┐
                                     ▼                                                       ▼
                       💻 Web Dashboard (User A)                               💻 Web Dashboard (User B)
                      (Room: user:user-A-id)                                  (Room: user:user-B-id)
                      • Live Nav Call Pill (A's Calls)                        • Live Nav Call Pill (B's Calls)
                      • Personal Contact Directory                            • Personal Contact Directory
                      • Scoped Web Push Alerts                                • Scoped Web Push Alerts
```

---

## ⚡ Quick Start & Login

1. **Access Web Dashboard**: Open [**http://localhost:5000**](http://localhost:5000)
2. **Pre-configured Demo Accounts** (or click the quick-login pills):
   * **User 1**: `alex@example.com` / `password123`
   * **User 2**: `sarah@example.com` / `password123`
3. **Register New Users**: Any number of users can register via the Sign Up form.

---

## 📱 Connecting Any User's Android Device

Every registered user gets a **Unique Device API Key** displayed in their dashboard profile and in the **"Android App"** guide modal.

### Webhook Specification:
* **Endpoint**: `http://YOUR_LOCAL_IP:5000/api/calls/event`
* **Method**: `POST`
* **Content-Type**: `application/json`
* **JSON Payload**:
  ```json
  {
    "number": "+15552345678",
    "name": "Caller Name",
    "state": "RINGING",
    "device": "Samsung Galaxy / Pixel",
    "apiKey": "usr_key_your_unique_token"
  }
  ```

---

## 🔒 Security & Data Isolation

* **JWT Web Sessions**: 30-day encrypted tokens for web dashboards.
* **Socket.io Private Rooms**: Web clients join `user:<userId>` rooms upon authenticated handshake.
* **Per-User Contact Matching**: Contact lookups only query contacts saved by that specific user.
* **User-Specific Desktop Push**: Browser push notifications are delivered exclusively to the device owner.

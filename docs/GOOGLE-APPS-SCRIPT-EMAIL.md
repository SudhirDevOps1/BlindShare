# 📧 Zero-DNS Google Apps Script ($0 Free) Email Relay for BlindShare

> **100% Free Transactional Email Dispatcher without Custom Domain DNS Configuration**

This guide shows you how to deploy a private Google Apps Script Web App that connects BlindShare to your Gmail account for **1-click Magic Link logins**, **6-digit Email OTPs**, **Password Resets**, and **Admin Invitations** — completely free ($0/mo), with **zero DNS/DKIM/SPF records needed**.

---

## 🌟 Why Use Google Apps Script Relay?

| Feature | Standard Resend / Brevo | Google Apps Script Relay |
| :--- | :--- | :--- |
| **Cost** | Free tier requires credit card / domain | **100% Free Forever ($0)** |
| **Custom Domain Required?** | **Yes** (Requires adding TXT/MX records to DNS) | **No** (Works directly on `*.vercel.app`, Docker, VPS) |
| **Daily Quota** | 100/mo (Resend without domain) | **100 emails/day** (Free Gmail) or **1,500/day** (Workspace) |
| **Setup Time** | 15 - 30 minutes (DNS propagation) | **2 minutes** (Instant) |
| **Zero-Knowledge Safety** | Document keys `#k=...` never transmitted | Document keys `#k=...` never transmitted |

---

## 🛠️ Step-by-Step Setup Guide

### Step 1: Create a New Google Apps Script
1. Visit **[script.google.com](https://script.google.com)** while logged into your Google/Gmail account.
2. Click **+ New project** in the top left.
3. Name the project **"BlindShare Email Relay"**.

### Step 2: Paste the Relay Code (`Code.gs`)
Replace all contents of `Code.gs` with the following code:

```javascript
/**
 * BlindShare Zero-Knowledge Email Relay (Google Apps Script)
 * Compatible with BlindShare v1.4.0
 */

// Define your shared secret token (must match GAS_SECRET_TOKEN in your .env)
const SHARED_SECRET = "your_secret_token_here";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Missing request body"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);

    // 1. Verify Secret Token Security (accepts either secretToken or secret)
    const token = payload.secretToken || payload.secret;
    if (token !== SHARED_SECRET) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Unauthorized: Invalid secretToken"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Validate Required Fields
    if (!payload.to || !payload.subject) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Missing required 'to' or 'subject' field"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Dispatch Email via GmailApp
    const emailOptions = {
      name: payload.fromName || "BlindShare Security",
    };

    if (payload.html) {
      emailOptions.htmlBody = payload.html;
    }

    GmailApp.sendEmail(
      payload.to,
      payload.subject,
      payload.text || "Please view this email in an HTML-compatible email client.",
      emailOptions
    );

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      provider: "gas",
      messageId: "gas_" + new Date().getTime(),
      remainingDailyQuota: MailApp.getRemainingDailyQuota()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

> 💡 **Tip:** Change `"your_secret_token_here"` to a secure random passphrase of your choice.

### Step 3: Deploy as Web App
1. In the top-right corner, click **Deploy** -> **New deployment**.
2. Click the gear icon (**Select type**) next to "Select type" and choose **Web app**.
3. Fill in the deployment details:
   - **Description:** `BlindShare Production Email Relay`
   - **Execute as:** `Me (your-email@gmail.com)`
   - **Who has access:** `Anyone` *(Note: The endpoint is protected by your `secretToken` check)*
4. Click **Deploy**.
5. When prompted, click **Authorize access**, select your Google account, click **Advanced** -> **Go to BlindShare Email Relay (unsafe)**, and click **Allow**.
6. Copy the **Web App URL** (it ends with `/exec`).

### Step 4: Add to BlindShare `.env`
In your `.env` (or Vercel Environment Variables), set:

```env
EMAIL_PROVIDER="gas"
GAS_WEBAPP_URL="https://script.google.com/macros/s/AKfycbx.../exec"
GAS_SECRET_TOKEN="your_secret_token_here"
```

---

## 🔒 Security & Privacy Guarantees

1. **Zero-Knowledge Preservation:** Document encryption keys `#k=...` reside exclusively in the client browser URL fragment and are **never** included in email payloads, database records, or server logs.
2. **Shared Secret Verification:** Requests without the matching `GAS_SECRET_TOKEN` are immediately rejected with HTTP 401.
3. **Cascading Fallback:** If `GAS_WEBAPP_URL` ever reaches its 100/day limit, BlindShare automatically cascades to Resend, Brevo, or SMTP without user interruption.

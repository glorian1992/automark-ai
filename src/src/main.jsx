import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

### 1.3 — Lidh me Vercel

1. Shko te [vercel.com](https://vercel.com) → **Login with GitHub**
2. **"Add New Project"** → zgjidh `automark-ai`
3. Framework: **Vite** (e zbulon vetë)
4. Klikë **Deploy** → pas 2 minutash ke URL live!

> 💡 Domainën tënde e lidh te: Vercel Dashboard → Project → Settings → Domains → Add Domain

---

## ✅ HAPI 2 — Make.com: Zemra e Automatizimit

Ky është hapi më i rëndësishëm. Make.com do të bëjë "urën" mes platformave dhe AutoMark AI.

### 2.1 — Krijo Skenarin e Parë (Webhook → AI → Reply)

1. Hyr në Make.com → **Create new scenario**
2. Klikë **"+"** → kërko **Webhooks** → zgjidh **"Custom webhook"**
3. Klikë **"Add"** → emri: `automark-incoming-message`
4. Kopjo **Webhook URL** (duket si: `https://hook.eu1.make.com/xxxx`) — **ruaje këtë!**

### 2.2 — Shto modulin HTTP (thirrja tek AI)

Pas Webhook → **"+"** → **HTTP** → **"Make a request":**
```
URL: https://api.anthropic.com/v1/messages
Method: POST
Headers:
  x-api-key: [ANTHROPIC_API_KEY_JOTE]
  anthropic-version: 2023-06-01
  content-type: application/json

Body (Raw/JSON):
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1000,
  "system": "[SYSTEM_PROMPT_AUTOMARK]",
  "messages": [
    {
      "role": "user", 
      "content": "{{1.message}}"
    }
  ]
}
```

> 🔑 API key Anthropic e merr te: [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

### 2.3 — Parse përgjigjja JSON

Pas HTTP → **"+"** → **JSON** → **"Parse JSON":**
- String to parse: `{{2.data.content[].text}}`

Kjo të jep: `thinking`, `action`, `reply_text`, `escalation_note`

### 2.4 — Router: dërgon në drejtimin e duhur

Pas Parse → **Router** (ikona e degëzimit) → krijo 3 degë:

| Degë | Kushti | Aksioni |
|------|--------|---------|
| 1 | `action = send_reply` | Dërgo reply në platformë |
| 2 | `action = escalate` | Dërgo në Telegram tënd |
| 3 | Gjithmonë | Log në Google Sheets |

---

## ✅ HAPI 3 — Instagram DMs (Meta API)

### 3.1 — Krijo Meta App

1. Shko te [developers.facebook.com](https://developers.facebook.com)
2. **My Apps → Create App → Business**
3. Emri: `AutoMark AI` → Create
4. Shto produktin: **Instagram Graph API** + **Messenger**

### 3.2 — Lidh Page dhe Instagram

1. Te App Dashboard → **Instagram → Basic Display → Add Instagram Tester**
2. Shto llogarinë e klientit si tester
3. Merr **Access Token** (Page Token, jetëgjatë)

### 3.3 — Lidh Webhook me Meta

1. Te Meta App → **Webhooks → Subscribe**
2. URL: `[webhook_url_nga_make]`
3. Verify Token: një fjalëkalim random që ti vendos (p.sh. `automark2026`)
4. Subscribe te: `messages`, `messaging_postbacks`

Tani çdo DM në Instagram → shkon direkt te Make.com → AutoMark AI i përgjigjet!

---

## ✅ HAPI 4 — WhatsApp Business API

### 4.1 — WhatsApp Cloud API (falas deri 1000 msg/muaj)

1. Te Meta App (i njëjti) → shto **WhatsApp**
2. **WhatsApp → Getting Started** → merr **Phone Number ID** dhe **Access Token**
3. Webhook: i njëjti URL i Make.com (shto `/whatsapp` në fund)

### 4.2 — Dërgim Reply nga Make.com

Te Make.com, dega `send_reply` për WhatsApp:
- **HTTP Request:**
```
URL: https://graph.facebook.com/v18.0/[PHONE_NUMBER_ID]/messages
Method: POST
Headers: Authorization: Bearer [TOKEN]
Body:
{
  "messaging_product": "whatsapp",
  "to": "{{phone_number}}",
  "type": "text",
  "text": { "body": "{{reply_text}}" }
}

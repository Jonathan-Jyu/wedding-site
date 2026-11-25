# Google Sheets RSVP API Configuration

## Environment Variables

You need to set the following environment variables in your `.env.local` file:

```env
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_CLIENT_EMAIL=your_service_account_email@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Wedding RSVP")
3. Enable the Google Sheets API:
   - In the search bar, search for "Google Sheets API"
   - Click "Enable"

### 2. Create a Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in the details and click **Create and Continue**
4. Skip optional steps and click **Done**

### 3. Generate and Download the Private Key

1. In the Credentials page, click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** format
5. Download the JSON file
6. Open the JSON file and copy:
   - `client_email` → `GOOGLE_CLIENT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (keep the `\n` characters as-is)

### 4. Share Your Google Sheet with the Service Account

1. Open your Google Sheet (named `20260117家宴RVSP` or your desired sheet name)
2. Click **Share**
3. Enter the service account email (from the JSON file)
4. Give it **Editor** access
5. Click **Share**

### 5. Get Your Sheet ID

1. Open your Google Sheet in the browser
2. The Sheet ID is in the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Copy the `{SHEET_ID}` → `GOOGLE_SHEET_ID`

## Using the API

### Request

```bash
curl -X POST http://localhost:3000/api/rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "張三",
    "phone": "0912345678",
    "attending": true,
    "guests": 3,
    "vegetarian": 1,
    "children": 1,
    "message": "期待與大家相聚"
  }'
```

### Response (Success)

```json
{
  "success": true
}
```

### Response (Error)

```json
{
  "success": false,
  "code": "RSVP_PAYLOAD_TOO_LARGE",
  "error": "填寫的內容太長了，請縮短後再試。",
  "requestId": "a16bc078-b363-4a48-9ea5-930234a521cc"
}
```

## Sheet Column Setup

Make sure your Google Sheet has the following headers in row 1:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| 建立時間 | 姓名 | 聯絡電話 | 是否出席家宴 | 出席人數(包含自己) | 素食人數 | 小孩人數(需兒童座椅或餐具) | 想說的話 |

The API will append data starting from row 2.

## RSVP 請求防護

- `POST /api/rsvp` 只接受 `application/json`，大小寫不敏感，允許合法參數（例如 `charset=utf-8`）。內容以 UTF-8 解析。沒有 `Content-Encoding` 或明示 `identity` 才會進入解析。
- 上限為 **32 KiB（32,768 bytes）**。合法且過大的 `Content-Length` 可提早回絕，實際串流仍以收到的 bytes 為準。以下情況均在 Sheets client 建立前處理。

| HTTP | 應用程式錯誤分類 | 行為 |
|---|---|---|
| 400 | `RSVP_INVALID_JSON` | 空 body、無效 UTF-8、讀取中斷或 JSON 無法解析 |
| 413 | `RSVP_PAYLOAD_TOO_LARGE` | 提示縮短內容 |
| 415 | `RSVP_UNSUPPORTED_MEDIA_TYPE` | 提示重新整理頁面 |
| 429 | `RSVP_RATE_LIMITED` | 前端支援應用程式契約。實際限流採 WAF，平台回應可為非 JSON，未必有應用程式 UUID |

平台 429 的來源未經驗證，表單會保留資料並提示稍後再試及先確認上次提交。有效的 `Retry-After` 整數秒數或 IMF-fixdate 可顯示等候時間，使用者須主動決定是否重送。Vercel 本身也可先行回傳平台 413。應用程式的 413／415 不逐筆寫入日誌。平台 Firewall、Request Logs 由 Vercel 管理，欄位及保留方式依該平台和專案設定。[Vercel Functions 請求限制](https://vercel.com/docs/functions/limitations)

## Vercel Hobby 平台限流

2026-11-25（台北時間）查證，Hobby 每專案可設 1 條限流規則，支援 IP／JA4 key、10 秒至 10 分鐘的 Fixed Window，每月含 100 萬筆允許通過的限流請求。Vercel 的 edge 計數與 Function instance 分離，同一區域跨 instance 生效，各 edge region 分開計數。官方說明預設阻擋回 429，未保證 WAF 回應 body 形狀或 `Retry-After`。Hobby 的額度及 Pricing 對話框以當時 Dashboard 為準。[WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) · [計數範圍](https://vercel.com/i/rate-limiting-algorithms) · [Vercel Pricing](https://vercel.com/pricing)

本專案採 **`POST /api/rsvp`、IP、每 60 秒 10 次** 作為起始設定。計數使用 Vercel WAF 識別的來源 IP。由於 IP 可能由家庭、公司或行動網路共用，先看匹配流量和實際誤擋，再決定是否調高上限，例如 15–20 次。準備以 Dashboard 手動設定。官方 `vercel.json` 的 WAF 規則只列 challenge／deny；Firewall CLI、REST API 或 Terraform 另可管理平台規則，但需要授權及相應維運流程。[規則條件](https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration) · [Custom Rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules) · [Firewall CLI](https://vercel.com/docs/cli/firewall)

### Dashboard 操作

1. 在隔離的測試專案開啟 **Firewall → Configure → New Rule**。先確認角色有發布權限，以及 Hobby 的限流規則名額尚可使用。
2. 命名為 `rsvp-post-ip-limit`。新增 **Request Path Equals `/api/rsvp`** 與 **Method Equals `POST`**，條件用 **AND**。
3. **Then** 選 **Rate Limit**，確認首次的 Pricing 對話框。選 **Fixed Window**、**60 seconds**、**10 requests**，計數 key 選 **IP**。超過門檻時選 **Default (429)**。若先觀察流量，可將超限處置設為 **Log**，此模式僅觀察。
4. **Save Rule → Review Changes → Publish**。驗收通過後再由專案管理者對正式專案套用同一設定。若正常賓客被誤擋，先以 Rule traffic 檢視時窗及共享 IP 影響，調高上限或切回 Log。必要時可從 Firewall Audit Log 還原配置。[WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) · [Firewall rollback](https://vercel.com/docs/vercel-firewall/vercel-waf)

### 部署驗收

1. 在使用獨立 Sheets 或 Mock 的測試專案，從同一來源先測低於門檻的家庭提交，再於同一固定視窗測超過門檻與並行請求。比對 WAF 指標、HTTP 429 的 body／`Retry-After`，以及被擋時 Function 與 append 記錄。跨固定視窗時重新量測。
2. 超過 60 秒後驗證可再提交。用另一個正常網路檢查獨立計數，確認首頁、Gallery、音樂、圖片及 GET 不受這條規則影響。若測試環境可分辨不同 Function instance，在同一區域核對仍共用計數。跨 edge region 的請求依各區域門檻計算。
3. 檢查 413、415、429 的友善提示、表單資料保留及 loading 復原。若平台回 HTML 429，確認顯示固定文案而且主動重試會要求確認。在 Firewall 概覽用 rule filter 觀察匹配與阻擋，不在應用程式記錄 IP 或提交內容。

### 替代方案與目前範圍

若日後需要跨區域共享的精確計數，可評估 Upstash Redis 的單一共享計數。Free 方案有每月 50 萬 commands，Pay as You Go 自 US$0.20／10 萬 commands 起，需額外管理服務、secrets、延遲、故障策略及共享 IP 誤擋。Vercel Pro 支援更多規則，固定視窗計數仍依區域。單一 Function 的記憶體計數無法涵蓋跨 instance。這一階段使用原生 WAF 規則，等待管理者發布和驗收。CAPTCHA、honeypot、持久化限流和伺服器去重均未導入。[Upstash Redis Pricing](https://upstash.com/pricing/redis) · [Vercel 各方案限流能力](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)

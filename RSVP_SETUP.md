# Google Sheets RSVP API Configuration

## Environment Variables

You need to set the following environment variables in your `.env.local` file:

```env
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_CLIENT_EMAIL=your_service_account_email@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Setup Instructions

### 憑證、文件權限與個資維護

- 本機只在 `.env.local` 設定上述三個 server-only 環境變數。如須保留下載的 Service Account 金鑰 JSON，請集中存放於專案根目錄下的 `.local-secrets/`，並以 `git check-ignore -- <path>` 確認實際路徑受保護。Git 不會依 JSON 檔名判斷憑證。禁止提交真實金鑰，也請避免放入 `public/`、Client Component、日誌或工單。
- 主辦方已在 Vercel **Settings → Environment Variables** 確認三個 server-only RSVP 變數，Production／Preview 共用。沒有獨立測試環境。主辦方決定維持設定，接受 Preview 的有效提交可能寫入正式 Sheet。測試使用 Mock；日後若重新評估隔離，可採獨立帳號與 Sheet。[Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- 在 Google Sheets 按 **共用 → 一般存取權 → 受限制**，核對可存取的主辦方名單。確認服務帳號只有目標試算表的編輯權限，並檢視 Drive 內是否還有其他不必要的直接或繼承分享。Google Cloud **IAM 與管理 → IAM／服務帳戶** 核對帳號、專案權限與金鑰清單。程式使用 Sheets scope 來寫入，實際能存取哪些試算表仍受 Google 分享權限控制。
- 由帳號管理者輪替時，在 **IAM 與管理 → 服務帳戶 → 選取帳號 → 金鑰** 建立新金鑰，安全地放入目標環境。先以隔離 Sheet 驗證新設定，依授權部署並確認正式寫入及回復路徑，再停用舊金鑰，確認無其他使用者後撤銷。若懷疑外洩，優先通知管理者評估停用並查核存取紀錄。[Google Cloud 金鑰管理建議](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)
- 主辦方已確認服務帳號、IAM／金鑰及 Sheet 共用權限正常，維持目前設定。RSVP 沿用現有文案，取消額外用途提示與同意流程的待辦。個資採人工管理，暫無固定保存期限；婚禮安排與聯繫需求結束後由主辦方決定整理及刪除方式。匯出宜僅含必要欄位並以受控方式管理副本和備份。
- 應用程式錯誤日誌只記錄固定事件名、伺服器產生的 requestId、錯誤代碼、耗時及符合範圍的 upstream status。以 requestId 查 **Vercel Logs**，檢查平台原生日誌的權限與留存設定時，另行確認 Dashboard 實際設定。

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

應用程式錯誤包含 `success: false`、固定 `code`、中文 `error` 與伺服器產生的 `requestId`。HTTP 400 使用 `RSVP_INVALID_JSON` 或 `RSVP_VALIDATION_ERROR`。500 使用 `RSVP_CONFIGURATION_ERROR`。502 區分明確拒絕的 `RSVP_SUBMISSION_FAILED`，以及寫入結果未能確認的 `RSVP_SUBMISSION_UNCERTAIN`。其餘 413／415／429 見下方請求防護。平台直接回應的 429 可能沒有上述欄位。

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

API 單次追加到 `工作表1!A:H`，從標題列之後開始。使用 `RAW`，A 是由 `Asia/Taipei` 產生的 `YYYY-MM-DD HH:mm:ss` 文字，C 是電話文字（保留前導零及加號），B／H 保留純文字，D 是「是」或「否」，E／F／G 是數字。姓名或備註的公式樣式字元會依 RAW 寫入。追加回應需確認恰好一列才回成功。寫入不自動重試，逾時或結果不明時請先查既有回覆。

### A 欄日期與隔離驗收

主辦方已回報現有寫入、台北時間、A:H、電話與人數型別，以及新舊日期型別、日期排序與篩選的通常使用情境皆正常。以下是日後遇到日期契約變更時的通用隔離驗證步驟，目前沒有獨立 Preview 或 Sheet。

1. 在 **檔案 → 設定** 核對 locale 與試算表時區，選一筆舊版及一筆新版資料。可在授權的隔離副本用 `TYPE(A2)`、`ISTEXT(A2)`、`ISNUMBER(A2)` 檢視底層型別，並核對 **格式 → 數字**。歷史列可能是日期序號，新列固定是文字。連續採用同樣格式的文字可按字串排序，混合文字與數字時須實測實際排序與日期篩選。
2. 在隔離 Sheet／Preview 使用合成資料提交一次，確認只有一列、頁籤及 A:H 正確、A 顯示台北時間、C 保留前導零或國碼、E:G 為數字、H 的公式樣式仍為文字。以主辦方使用的排序、日期篩選、QUERY 或報表副本比較新舊列是否同時納入。核對當地午夜前後跨日。若需 CSV，檢查匯入端對公式前綴的另一次解析。
3. 若確認業務需要原生日期，先在隔離副本用已知台北日期和午夜樣本驗證日期序號及日期格式，並對照舊列、locale、時區與報表。待主辦方核准回復方案、寫入契約及歷史遷移後，才考慮 A 欄限定使用數值序號及日期顯示格式。B:H 繼續使用 RAW 與原型別。[Sheets 日期與數字格式](https://developers.google.com/workspace/sheets/api/guides/formats)

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

正式環境已於 2026-11-25 啟用 **RSVP Rate Limit**，以 Path Equals `/api/rsvp` AND Method Equals `POST`，按 Vercel WAF 識別的來源 IP 固定視窗每 60 秒 10 次，超限於 WAF 回 HTTP 429。Request Headers 紀錄未額外啟用。使用者已實測 400 → 429 → 視窗恢復，並核對 Firewall Traffic。共用 IP 會共用額度，可觀察正常賓客誤擋再評估調整。規則由 Dashboard 管理。[規則條件](https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration)

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

若日後需要跨區域共享的精確計數，可評估 Upstash Redis 的單一共享計數，需額外管理服務、secrets、延遲、故障策略及共享 IP 誤擋。Vercel WAF 固定視窗依區域計數。CAPTCHA、honeypot、持久化限流和伺服器去重均未導入。[Upstash Redis Pricing](https://upstash.com/pricing/redis) · [Vercel 各方案限流能力](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)

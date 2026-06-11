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
  "error": "Error message describing what went wrong"
}
```

## Sheet Column Setup

Make sure your Google Sheet has the following headers in row 1:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| 建立時間 | 姓名 | 聯絡電話 | 是否出席家宴 | 出席人數(包含自己) | 素食人數 | 小孩人數(需兒童座椅或餐具) | 想說的話 |

The API will append data starting from row 2.

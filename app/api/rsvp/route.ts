/*-- 測試 API
curl -X POST http://192.168.4.31:3000/api/rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "張三",
    "phone": "0912345678",
    "attending": true,
    "guests": 3,
    "vegetarian": 1,
    "children": 1,
    "message": "期待相聚"
  }'
*/


import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getTimeInTaipei } from '@/lib/timezone';

interface RSVPRequest {
  name: string;
  phone: string;
  attending: boolean;
  guests: number;
  vegetarian: number;
  children: number;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

interface SuccessResponse {
  success: true;
}

async function initializeSheets() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!privateKey || !clientEmail || !sheetId) {
    throw new Error(
      'Missing required environment variables: GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL, or GOOGLE_SHEET_ID'
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      // type: 'service_account',
      // project_id: 'wedding-site',
      private_key: privateKey,
      client_email: clientEmail,
      // client_id: '',
      // auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      // token_uri: 'https://oauth2.googleapis.com/token',
      // auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  return {
    sheets,
    sheetId,
  };
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body: RSVPRequest = await request.json();

    // Validate request body
    if (
      !body.name ||
      !body.phone ||
      body.attending === undefined ||
      body.guests === undefined ||
      body.vegetarian === undefined ||
      body.children === undefined
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' } as ErrorResponse,
        { status: 400 }
      );
    }

    const { sheets, sheetId } = await initializeSheets();

    // Get current Taiwan time
    const taipeiTime = getTimeInTaipei();

    // Prepare row data in the specified column order
    const values = [
      [
        taipeiTime, // 建立時間
        body.name, // 姓名
        `'${body.phone}`, // 聯絡電話
        body.attending ? '是' : '否', // 是否出席家宴
        body.guests, // 出席人數(包含自己)
        body.vegetarian, // 素食人數
        body.children, // 小孩人數(需兒童座椅或餐具)
        body.message || '', // 想說的話
      ],
    ];

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: '工作表1!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    return NextResponse.json({ success: true } as SuccessResponse);
  } catch (error) {
    console.error('RSVP API Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      } as ErrorResponse,
      { status: 500 }
    );
  }
}

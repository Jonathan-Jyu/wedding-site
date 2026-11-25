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


import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getTimeInTaipei } from '@/lib/timezone';
import { validateRSVP } from '@/lib/rsvp-validation';
import { RSVP_ERRORS, type RSVPErrorCode, type RSVPErrorResponse } from '@/lib/rsvp-errors';

interface SuccessResponse {
  success: true;
}

function initializeSheets() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!privateKey?.trim() || !clientEmail?.trim() || !sheetId?.trim()) {
    throw new Error('Missing RSVP Sheets configuration');
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
    clientOptions: { forceRefreshOnFailure: false },
  });

  const sheets = google.sheets({ version: 'v4', auth });

  return {
    sheets,
    sheetId,
  };
}

function getUpstreamStatus(error: unknown): number | undefined {
  try {
    const status: unknown = (error as { response?: { status?: unknown } } | null)?.response?.status;
    if (typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599) {
      return status;
    }
  } catch {
    // An unexpected exception shape must not interfere with the response.
  }
}

const rejectedAppendStatuses = new Set([400, 403, 404, 405, 413, 415, 422, 429]);

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | RSVPErrorResponse>> {
  const requestId = randomUUID();
  const startedAt = performance.now();

  function failure(code: RSVPErrorCode, error: string = RSVP_ERRORS[code].message) {
    return NextResponse.json<RSVPErrorResponse>(
      { success: false, code, error, requestId },
      { status: RSVP_ERRORS[code].status }
    );
  }

  function logFailure(code: RSVPErrorCode, upstreamStatus?: number) {
    console.error({
      event: 'rsvp_submission_failed',
      requestId,
      code,
      durationMs: Math.round(performance.now() - startedAt),
      ...(upstreamStatus === undefined ? {} : { upstreamStatus }),
    });
    return failure(code);
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return failure('RSVP_INVALID_JSON');
  }

  const result = validateRSVP(input);
  if (!result.success) {
    return failure('RSVP_VALIDATION_ERROR', result.error);
  }
  const body = result.data;

  let client: ReturnType<typeof initializeSheets>;
  let taipeiTime: string;
  try {
    client = initializeSheets();
    taipeiTime = getTimeInTaipei();
  } catch (error) {
    return logFailure('RSVP_CONFIGURATION_ERROR', getUpstreamStatus(error));
  }

  const { sheets, sheetId } = client;
  const values = [[
    taipeiTime, // 建立時間
    body.name, // 姓名
    body.phone, // 聯絡電話
    body.attending ? '是' : '否', // 是否出席家宴
    body.guests, // 出席人數(包含自己)
    body.vegetarian, // 素食人數
    body.children, // 小孩人數(需兒童座椅或餐具)
    body.message, // 想說的話
  ]];

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: '工作表1!A:H',
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    }, { retry: false, redirect: 'error', timeout: 10_000 });

    if (response?.data?.updates?.updatedRows !== 1) {
      return logFailure('RSVP_SUBMISSION_UNCERTAIN');
    }
    return NextResponse.json<SuccessResponse>({ success: true });
  } catch (error) {
    const upstreamStatus = getUpstreamStatus(error);
    if (upstreamStatus === 401) return logFailure('RSVP_CONFIGURATION_ERROR', upstreamStatus);
    if (upstreamStatus !== undefined && rejectedAppendStatuses.has(upstreamStatus)) {
      return logFailure('RSVP_SUBMISSION_FAILED', upstreamStatus);
    }
    return logFailure('RSVP_SUBMISSION_UNCERTAIN', upstreamStatus);
  }
}

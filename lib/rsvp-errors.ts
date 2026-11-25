export const RSVP_VALIDATION_MESSAGES = {
  payload: "請提供有效的 RSVP 資料",
  name: "請輸入姓名，最多 100 個字元",
  phone: "請輸入有效的聯絡電話，最多 32 個字元",
  attending: "請選擇是否出席",
  guests: "出席人數須為 1 到 10 的整數",
  declining: "未出席時，出席人數須為 0",
  vegetarian: "請填寫正確的素食人數。",
  vegetarianLimit: "素食人數不能超過出席人數，請再確認一下喔！",
  children: "請填寫正確的兒童人數。",
  childrenLimit: "兒童人數不能超過出席人數，請再確認一下喔！",
  message: "備註須為文字，且最多 2000 個字元",
} as const;

const submissionFailed = "目前無法送出回覆，請稍後再試。";
const submissionUncertain = "目前無法確認您的回覆是否已成功送出，請先與我們確認，以避免重複提交。";

export const RSVP_ERRORS = {
  RSVP_INVALID_JSON: { status: 400, message: "回覆格式有誤，請重新確認後再送出。" },
  RSVP_VALIDATION_ERROR: { status: 400, message: "請確認填寫的資料是否正確。" },
  RSVP_PAYLOAD_TOO_LARGE: { status: 413, message: "填寫的內容太長了，請縮短後再試。" },
  RSVP_UNSUPPORTED_MEDIA_TYPE: { status: 415, message: "回覆格式有誤，請重新整理頁面後再試。" },
  RSVP_RATE_LIMITED: { status: 429, message: "您剛剛送出了太多次回覆，請稍等一下再試喔！" },
  RSVP_CONFIGURATION_ERROR: { status: 500, message: submissionFailed },
  RSVP_SUBMISSION_FAILED: { status: 502, message: submissionFailed },
  RSVP_SUBMISSION_UNCERTAIN: { status: 502, message: submissionUncertain },
} as const;

export type RSVPErrorCode = keyof typeof RSVP_ERRORS;
export type RSVPErrorResponse = {
  success: false;
  code: RSVPErrorCode;
  error: string;
  requestId: string;
};

type SubmissionOutcome =
  | { success: true }
  | { success: false; error: string; uncertain: boolean };

export const RSVP_NETWORK_ERROR = {
  success: false,
  error: `連線中斷或等候逾時。${submissionUncertain}`,
  uncertain: true,
} as const;

const unexpectedResponse = {
  success: false,
  error: `收到非預期的回應。${submissionUncertain}`,
  uncertain: true,
} as const;

const requestProtectionMessages: Readonly<Partial<Record<number, string>>> = {
  413: RSVP_ERRORS.RSVP_PAYLOAD_TOO_LARGE.message,
  415: RSVP_ERRORS.RSVP_UNSUPPORTED_MEDIA_TYPE.message,
  429: RSVP_ERRORS.RSVP_RATE_LIMITED.message,
};

function retryHint(response: Response): string {
  if (response.status !== 429) return "";
  const value = response.headers.get("retry-after");
  if (!value) return "";

  let seconds: number;
  if (/^\d+$/.test(value)) {
    seconds = Number(value);
  } else {
    const date = new Date(value);
    if (date.toUTCString() !== value) return "";
    seconds = Math.ceil((date.getTime() - Date.now()) / 1000);
  }
  if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 86_400) return "";
  return "建議至少等 " + seconds + " 秒。";
}

function unexpectedRSVPResponse(response: Response): SubmissionOutcome {
  const message = requestProtectionMessages[response.status];
  if (!message) return unexpectedResponse;

  // Status alone doesn't prove the response was generated before append.
  return { success: false, error: message + retryHint(response) + submissionUncertain, uncertain: true };
}

export async function readRSVPResponse(response: Response): Promise<SubmissionOutcome> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    return error instanceof SyntaxError || requestProtectionMessages[response.status]
      ? unexpectedRSVPResponse(response)
      : RSVP_NETWORK_ERROR;
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return unexpectedRSVPResponse(response);
  const data = payload as Record<string, unknown>;
  if (response.status === 200 && data.success === true && Object.keys(data).length === 1) {
    return { success: true };
  }

  const { code, error, requestId } = data;
  if (
    data.success !== false || typeof code !== "string" || !Object.hasOwn(RSVP_ERRORS, code)
    || typeof error !== "string" || typeof requestId !== "string"
    || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(requestId)
  ) return unexpectedRSVPResponse(response);

  const definition = RSVP_ERRORS[code as RSVPErrorCode];
  if (response.status !== definition.status) return unexpectedRSVPResponse(response);

  if (code === "RSVP_VALIDATION_ERROR" && Object.values(RSVP_VALIDATION_MESSAGES).some((message) => message === error)) {
    return { success: false, error, uncertain: false };
  }
  return { success: false, error: definition.message + retryHint(response), uncertain: code === "RSVP_SUBMISSION_UNCERTAIN" };
}

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

export async function readRSVPResponse(response: Response): Promise<SubmissionOutcome> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    return error instanceof SyntaxError ? unexpectedResponse : RSVP_NETWORK_ERROR;
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return unexpectedResponse;
  const data = payload as Record<string, unknown>;
  if (response.status === 200 && data.success === true && Object.keys(data).length === 1) {
    return { success: true };
  }

  const { code, error, requestId } = data;
  if (
    data.success !== false || typeof code !== "string" || !Object.hasOwn(RSVP_ERRORS, code)
    || typeof error !== "string" || typeof requestId !== "string"
    || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(requestId)
  ) return unexpectedResponse;

  const definition = RSVP_ERRORS[code as RSVPErrorCode];
  if (response.status !== definition.status) return unexpectedResponse;

  if (code === "RSVP_VALIDATION_ERROR" && Object.values(RSVP_VALIDATION_MESSAGES).some((message) => message === error)) {
    return { success: false, error, uncertain: false };
  }
  return { success: false, error: definition.message, uncertain: code === "RSVP_SUBMISSION_UNCERTAIN" };
}

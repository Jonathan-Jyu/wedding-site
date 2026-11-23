const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 32;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_GUESTS = 10;

// Accept common phone separators and optional extensions without rewriting the number.
const PHONE_PATTERN = /^\+?((?:\d|\(\d+\))(?:[ .-]*(?:\d|\(\d+\)))*)(?: *(?:ext\.?|x|#|轉) *\d{1,6})?$/i;

type ValidatedRSVP = {
  name: string;
  phone: string;
  attending: boolean;
  guests: number;
  vegetarian: number;
  children: number;
  message: string;
};

type ValidationResult =
  | { success: true; data: ValidatedRSVP }
  | { success: false; error: string };

function isCount(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

export function validateRSVP(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { success: false, error: "請提供有效的 RSVP 資料" };
  }

  const body = input as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > MAX_NAME_LENGTH) {
    return { success: false, error: "請輸入姓名，最多 100 個字元" };
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phoneMatch = phone.length <= MAX_PHONE_LENGTH ? PHONE_PATTERN.exec(phone.normalize("NFKC")) : null;
  const phoneDigits = phoneMatch?.[1].replace(/\D/g, "").length ?? 0;
  if (phoneDigits < 7 || phoneDigits > 15) {
    return { success: false, error: "請輸入有效的聯絡電話，最多 32 個字元" };
  }

  const { attending, guests, vegetarian, children } = body;
  if (typeof attending !== "boolean") {
    return { success: false, error: "請選擇是否出席" };
  }
  if (!isCount(guests, attending ? 1 : 0, attending ? MAX_GUESTS : 0)) {
    return {
      success: false,
      error: attending ? "出席人數須為 1 到 10 的整數" : "未出席時，出席人數須為 0",
    };
  }
  if (!isCount(vegetarian, 0, guests)) {
    return { success: false, error: "素食人數須為非負整數，且不得超過出席人數" };
  }
  if (!isCount(children, 0, guests)) {
    return { success: false, error: "兒童人數須為非負整數，且不得超過出席人數" };
  }

  const message = body.message === undefined ? "" : body.message;
  if (typeof message !== "string" || message.length > MAX_MESSAGE_LENGTH) {
    return { success: false, error: "備註須為文字，且最多 2000 個字元" };
  }

  return { success: true, data: { name, phone, attending, guests, vegetarian, children, message } };
}

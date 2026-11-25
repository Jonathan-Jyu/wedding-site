import { RSVP_VALIDATION_MESSAGES as messages } from "./rsvp-errors";

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

function isCount(value: unknown, min: number, max = Infinity): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

export function validateRSVP(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { success: false, error: messages.payload };
  }

  const body = input as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > MAX_NAME_LENGTH) {
    return { success: false, error: messages.name };
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phoneMatch = phone.length <= MAX_PHONE_LENGTH ? PHONE_PATTERN.exec(phone.normalize("NFKC")) : null;
  const phoneDigits = phoneMatch?.[1].replace(/\D/g, "").length ?? 0;
  if (phoneDigits < 7 || phoneDigits > 15) {
    return { success: false, error: messages.phone };
  }

  const { attending, guests, vegetarian, children } = body;
  if (typeof attending !== "boolean") {
    return { success: false, error: messages.attending };
  }
  if (!isCount(guests, attending ? 1 : 0, attending ? MAX_GUESTS : 0)) {
    return {
      success: false,
      error: attending ? messages.guests : messages.declining,
    };
  }
  if (!isCount(vegetarian, 0)) {
    return { success: false, error: messages.vegetarian };
  }
  if (vegetarian > guests) {
    return { success: false, error: messages.vegetarianLimit };
  }
  if (!isCount(children, 0)) {
    return { success: false, error: messages.children };
  }
  if (children > guests) {
    return { success: false, error: messages.childrenLimit };
  }

  const message = body.message === undefined ? "" : body.message;
  if (typeof message !== "string" || message.length > MAX_MESSAGE_LENGTH) {
    return { success: false, error: messages.message };
  }

  return { success: true, data: { name, phone, attending, guests, vegetarian, children, message } };
}

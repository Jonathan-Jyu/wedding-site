"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { readRSVPResponse, RSVP_NETWORK_ERROR, RSVP_VALIDATION_MESSAGES as messages } from "@/lib/rsvp-errors";
import { validateRSVP } from "@/lib/rsvp-validation";

interface FormData {
  name: string;
  phone: string;
  attending: boolean | null;
  guests: number;
  vegetarian: number;
  children: number;
  message: string;
}

interface SubmitState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialFormData: FormData = {
  name: "",
  phone: "",
  attending: null,
  guests: 1,
  vegetarian: 0,
  children: 0,
  message: "",
};

type SubmissionStatus = "idle" | "pending" | "uncertain" | "success";
const errorId = "rsvp-submit-error";
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700";

type CounterFieldProps = {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  invalid?: boolean;
  onChange: (value: number) => void;
};

function CounterField({
  label,
  description,
  value,
  min = 0,
  max = 10,
  invalid,
  onChange,
}: CounterFieldProps) {
  const labelId = useId();
  const descriptionId = description ? `${labelId}-description` : undefined;
  const decrease = () => onChange(Math.max(min, value - 1));
  const increase = () => onChange(Math.min(max, value + 1));

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={[descriptionId, invalid ? errorId : undefined].filter(Boolean).join(" ") || undefined} className="rounded-2xl border border-rose-100/70 bg-[#fffaf7] p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <p id={labelId} className="font-medium text-stone-700">{label}</p>
          {description && (
            <p id={descriptionId} className="mt-1 text-sm text-stone-400">{description}</p>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={decrease}
            aria-label={`減少${label}`}
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-stone-500 shadow-sm transition hover:bg-rose-50 disabled:opacity-40 ${focusRing}`}
            disabled={value <= min}
          >
            −
          </button>

          <span aria-live="polite" aria-atomic="true" className="w-8 text-center font-serif text-3xl text-stone-800">
            {value}
          </span>

          <button
            type="button"
            onClick={increase}
            aria-label={`增加${label}`}
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-stone-500 shadow-sm transition hover:bg-rose-50 disabled:opacity-40 ${focusRing}`}
            disabled={value >= max}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RSVPSection() {
  const [formData, setFormData] = useState(initialFormData);
  const [formVersion, setFormVersion] = useState(0);
  const submission = useRef<{ version: number; status: SubmissionStatus }>({ version: 0, status: "idle" });
  const formHeading = useRef<HTMLHeadingElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);

  const [submitState, setSubmitState] = useState<SubmitState>({
    loading: false,
    success: false,
    error: null,
  });

  useEffect(() => {
    const target = submitState.error ? errorSummary.current
      : submitState.success ? successHeading.current
      : formVersion > 0 && !submitState.loading ? formHeading.current
      : null;
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "nearest" });
  }, [submitState, formVersion]);

  function errorAttributes(invalid: boolean) {
    return invalid ? { "aria-invalid": true, "aria-describedby": errorId } : {};
  }

  const updateField = <K extends keyof FormData>(
    key: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAttendingChange = (value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      attending: value,
      guests: value ? Math.max(prev.guests, 1) : 0,
      vegetarian: value ? prev.vegetarian : 0,
      children: value ? prev.children : 0,
    }));
  };

  const updateGuestCount = (guests: number) => {
    setFormData((prev) => prev.attending ? {
      ...prev,
      guests,
      vegetarian: Math.min(prev.vegetarian, guests),
      children: Math.min(prev.children, guests),
    } : prev);
  };

  const updateSubCount = (field: "vegetarian" | "children", count: number) => {
    setFormData((prev) => prev.attending ? {
      ...prev,
      [field]: Math.min(count, prev.guests),
    } : prev);
  };

  const startNewResponse = () => {
    if (submission.current.version !== formVersion || submission.current.status !== "success") return;

    const version = formVersion + 1;
    submission.current = { version, status: "idle" };
    setFormVersion(version);
    setFormData(initialFormData);
    setSubmitState({ loading: false, success: false, error: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const guard = submission.current;
    if (guard.version !== formVersion || guard.status === "pending" || guard.status === "success") return;

    const validated = validateRSVP(formData);
    if (!validated.success) {
      setSubmitState({ loading: false, success: false, error: validated.error });
      return;
    }

    const wasUncertain = guard.status === "uncertain";
    if (wasUncertain && !window.confirm("前一次回覆可能已成功送出。確定要再送出一份回覆嗎？")) return;

    guard.status = "pending";
    setSubmitState({ loading: true, success: false, error: null });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    let result: Awaited<ReturnType<typeof readRSVPResponse>>;
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        redirect: "error",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validated.data),
        signal: controller.signal,
      });
      result = await readRSVPResponse(response);
    } catch {
      result = RSVP_NETWORK_ERROR;
    } finally {
      window.clearTimeout(timeout);
    }

    if (result.success) {
      guard.status = "success";
      setSubmitState({ loading: false, success: true, error: null });
    } else {
      guard.status = result.uncertain || wasUncertain ? "uncertain" : "idle";
      const error = wasUncertain && !result.uncertain
        ? `${result.error}前一次回覆可能已成功送出，請先與我們確認。`
        : result.error;
      setSubmitState({ loading: false, success: false, error });
    }
  };

  if (submitState.success) {
    return (
      <section id="rsvp" className="px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/80 p-10 text-center shadow-2xl shadow-stone-200/60 backdrop-blur md:p-14"
        >
          <p className="mb-4 text-5xl text-rose-300">♡</p>
          <p className="mb-3 text-xs tracking-[0.4em] text-rose-300">
            THANK YOU
          </p>
          <h2 ref={successHeading} tabIndex={-1} className="font-serif text-4xl text-stone-800">
            我們已收到您的回覆
          </h2>
          <p className="mt-5 leading-8 text-stone-500">
            謝謝您的回覆，
            <br />
            期待在婚禮當天與您相見。
          </p>

          <button
            onClick={startNewResponse}
            className={`mt-10 rounded-full bg-stone-800 px-8 py-3 text-sm font-medium text-white shadow-lg transition motion-safe:hover:scale-105 hover:bg-stone-700 ${focusRing}`}
          >
            填寫另一份回覆
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="rsvp" className="relative overflow-hidden px-6 py-24">
      <div className="absolute left-[-120px] top-10 h-80 w-80 rounded-full bg-rose-100/50 blur-3xl" />
      <div className="absolute bottom-0 right-[-120px] h-80 w-80 rounded-full bg-amber-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs tracking-[0.4em] text-rose-300">RSVP</p>

          <h2 ref={formHeading} tabIndex={-1} className="font-serif text-4xl text-stone-800 md:text-5xl">
            期待與你們相見
          </h2>

          <div className="mx-auto mt-5 h-px w-20 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />

          <p className="mx-auto mt-5 max-w-md leading-7 text-stone-500">
            請留下您的回覆，
            <br className="hidden md:block" />
            讓我們為這一天準備最合適的安排。
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.25 }}
          transition={{
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-2xl shadow-stone-200/60 backdrop-blur md:p-10"
        >
          <p role="status" className="sr-only">{submitState.loading ? "送出中..." : ""}</p>
          <form onSubmit={handleSubmit} noValidate aria-busy={submitState.loading} className="space-y-7">
            {submitState.error && (
              <div id={errorId} ref={errorSummary} role="alert" tabIndex={-1} className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                {submitState.error}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="rsvp-name" className="mb-2 block text-sm font-medium text-stone-700">
                  怎麼稱呼您？ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  id="rsvp-name"
                  autoComplete="name"
                  required
                  {...errorAttributes(submitState.error === messages.name)}
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="請留下您的姓名"
                  className={`w-full rounded-2xl border border-stone-200 bg-[#fffaf7] px-5 py-4 text-stone-800 transition placeholder:text-stone-300 focus:border-rose-200 focus:bg-white ${focusRing}`}
                />
              </div>

              <div>
                <label htmlFor="rsvp-phone" className="mb-2 block text-sm font-medium text-stone-700">
                  聯絡電話 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  id="rsvp-phone"
                  autoComplete="tel"
                  required
                  {...errorAttributes(submitState.error === messages.phone)}
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="例如：0912-345-678"
                  className={`w-full rounded-2xl border border-stone-200 bg-[#fffaf7] px-5 py-4 text-stone-800 transition placeholder:text-stone-300 focus:border-rose-200 focus:bg-white ${focusRing}`}
                />
              </div>
            </div>

            <fieldset className="min-w-0" aria-describedby={submitState.error === messages.attending || submitState.error === messages.declining ? errorId : undefined}>
              <legend className="mb-3 block text-sm font-medium text-stone-700">
                是否出席家宴 <span className="text-rose-400">*</span>
              </legend>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid">
                <input id="rsvp-attending" className="peer sr-only" type="radio" name="rsvp-attendance" required checked={formData.attending === true} onChange={() => handleAttendingChange(true)} />
                <label
                  htmlFor="rsvp-attending"
                  className={`cursor-pointer rounded-2xl border px-5 py-5 text-left transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rose-700 ${
                    formData.attending === true
                      ? "border-rose-200 bg-rose-50 text-rose-800 shadow-sm"
                      : "border-stone-200 bg-[#fffaf7] text-stone-600 hover:bg-white"
                  }`}
                >
                  <span className="block font-medium">❤️ 要，我要去</span>
                  <span className="mt-1 block text-sm opacity-70">
                    期待與新人一起分享喜悅
                  </span>
                </label>
                </div>

                <div className="grid">
                <input id="rsvp-declining" className="peer sr-only" type="radio" name="rsvp-attendance" required checked={formData.attending === false} onChange={() => handleAttendingChange(false)} />
                <label
                  htmlFor="rsvp-declining"
                  className={`cursor-pointer rounded-2xl border px-5 py-5 text-left transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rose-700 ${
                    formData.attending === false
                      ? "border-stone-300 bg-stone-100 text-stone-800 shadow-sm"
                      : "border-stone-200 bg-[#fffaf7] text-stone-600 hover:bg-white"
                  }`}
                >
                  <span className="block font-medium">😢 抱歉，已有安排無法出席</span>
                  <span className="mt-1 block text-sm opacity-70">
                    送上祝福，我們也會收到
                  </span>
                </label>
                </div>
              </div>
            </fieldset>

            {formData.attending === true && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid gap-4"
              >
                <CounterField
                  label="一起出席的人數"
                  description="包含您自己"
                  invalid={submitState.error === messages.guests}
                  min={1}
                  max={10}
                  value={formData.guests}
                  onChange={updateGuestCount}
                />

                <CounterField
                  label="需要素食的人數"
                  invalid={submitState.error === messages.vegetarian || submitState.error === messages.vegetarianLimit}
                  min={0}
                  max={formData.guests}
                  value={formData.vegetarian}
                  onChange={(value) => updateSubCount("vegetarian", value)}
                />

                <CounterField
                  label="需要兒童座椅 / 餐具的人數"
                  invalid={submitState.error === messages.children || submitState.error === messages.childrenLimit}
                //   description="需兒童座椅或餐具"
                  min={0}
                  max={formData.guests}
                  value={formData.children}
                  onChange={(value) => updateSubCount("children", value)}
                />
              </motion.div>
            )}

            <div>
              <label htmlFor="rsvp-message" className="mb-2 block text-sm font-medium text-stone-700">
                想說的話
              </label>
              <textarea
                id="rsvp-message"
                {...errorAttributes(submitState.error === messages.message)}
                value={formData.message}
                onChange={(e) => updateField("message", e.target.value)}
                placeholder="留下您的祝福或備註"
                rows={4}
                className={`w-full resize-none rounded-2xl border border-stone-200 bg-[#fffaf7] px-5 py-4 text-stone-800 transition placeholder:text-stone-300 focus:border-rose-200 focus:bg-white ${focusRing}`}
              />
            </div>

            <button
              type="submit"
              disabled={submitState.loading}
              className={`w-full rounded-full bg-stone-800 px-8 py-4 text-sm font-medium tracking-[0.15em] text-white shadow-xl transition motion-safe:hover:scale-[1.01] hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              {submitState.loading ? "送出中..." : "送出回覆 ♡"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

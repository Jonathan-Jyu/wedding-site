"use client";

import { useState } from "react";
import { motion } from "framer-motion";

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

type CounterFieldProps = {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

function CounterField({
  label,
  description,
  value,
  min = 0,
  max = 10,
  onChange,
}: CounterFieldProps) {
  const decrease = () => onChange(Math.max(min, value - 1));
  const increase = () => onChange(Math.min(max, value + 1));

  return (
    <div className="rounded-2xl border border-rose-100/70 bg-[#fffaf7] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-stone-700">{label}</p>
          {description && (
            <p className="mt-1 text-sm text-stone-400">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={decrease}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-stone-500 shadow-sm transition hover:bg-rose-50 disabled:opacity-40"
            disabled={value <= min}
          >
            −
          </button>

          <span className="w-8 text-center font-serif text-3xl text-stone-800">
            {value}
          </span>

          <button
            type="button"
            onClick={increase}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-stone-500 shadow-sm transition hover:bg-rose-50 disabled:opacity-40"
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
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    attending: null,
    guests: 1,
    vegetarian: 0,
    children: 0,
    message: "",
  });

  const [submitState, setSubmitState] = useState<SubmitState>({
    loading: false,
    success: false,
    error: null,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setSubmitState({ loading: false, success: false, error: "請輸入姓名" });
      return;
    }

    if (!formData.phone.trim()) {
      setSubmitState({
        loading: false,
        success: false,
        error: "請輸入聯絡電話",
      });
      return;
    }

    if (formData.attending === null) {
      setSubmitState({
        loading: false,
        success: false,
        error: "請選擇是否出席",
      });
      return;
    }

    setSubmitState({ loading: true, success: false, error: null });

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitState({ loading: false, success: true, error: null });
        return;
      }

      setSubmitState({
        loading: false,
        success: false,
        error: data.error || "提交失敗，請稍後重試",
      });
    } catch {
      setSubmitState({
        loading: false,
        success: false,
        error: "提交失敗，請檢查網路連線",
      });
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
          <h2 className="font-serif text-4xl text-stone-800">
            我們已收到您的回覆
          </h2>
          <p className="mt-5 leading-8 text-stone-500">
            謝謝您的回覆，
            <br />
            期待在婚禮當天與您相見。
          </p>

          <button
            onClick={() =>
              setSubmitState({ loading: false, success: false, error: null })
            }
            className="mt-10 rounded-full bg-stone-800 px-8 py-3 text-sm font-medium text-white shadow-lg transition hover:scale-105 hover:bg-stone-700"
          >
            返回表單
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

          <h2 className="font-serif text-4xl text-stone-800 md:text-5xl">
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
          <form onSubmit={handleSubmit} className="space-y-7">
            {submitState.error && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                {submitState.error}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  怎麼稱呼您？ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="請留下您的姓名"
                  className="w-full rounded-2xl border border-stone-200 bg-[#fffaf7] px-5 py-4 text-stone-800 outline-none transition placeholder:text-stone-300 focus:border-rose-200 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  聯絡電話 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="例如：0912-345-678"
                  className="w-full rounded-2xl border border-stone-200 bg-[#fffaf7] px-5 py-4 text-stone-800 outline-none transition placeholder:text-stone-300 focus:border-rose-200 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-stone-700">
                是否出席家宴 <span className="text-rose-400">*</span>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleAttendingChange(true)}
                  className={`rounded-2xl border px-5 py-5 text-left transition ${
                    formData.attending === true
                      ? "border-rose-200 bg-rose-50 text-rose-800 shadow-sm"
                      : "border-stone-200 bg-[#fffaf7] text-stone-600 hover:bg-white"
                  }`}
                >
                  <p className="font-medium">❤️ 要，我要去</p>
                  <p className="mt-1 text-sm opacity-70">
                    期待與新人一起分享喜悅
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleAttendingChange(false)}
                  className={`rounded-2xl border px-5 py-5 text-left transition ${
                    formData.attending === false
                      ? "border-stone-300 bg-stone-100 text-stone-800 shadow-sm"
                      : "border-stone-200 bg-[#fffaf7] text-stone-600 hover:bg-white"
                  }`}
                >
                  <p className="font-medium">😢 抱歉，已有安排無法出席</p>
                  <p className="mt-1 text-sm opacity-70">
                    送上祝福，我們也會收到
                  </p>
                </button>
              </div>
            </div>

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
                  min={1}
                  max={10}
                  value={formData.guests}
                  onChange={(value) => updateField("guests", value)}
                />

                <CounterField
                  label="需要素食的人數"
                  min={0}
                  max={10}
                  value={formData.vegetarian}
                  onChange={(value) => updateField("vegetarian", value)}
                />

                <CounterField
                  label="需要兒童座椅 / 餐具的人數"
                //   description="需兒童座椅或餐具"
                  min={0}
                  max={10}
                  value={formData.children}
                  onChange={(value) => updateField("children", value)}
                />
              </motion.div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                想說的話
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => updateField("message", e.target.value)}
                placeholder="留下您的祝福或備註"
                rows={4}
                className="w-full resize-none rounded-2xl border border-stone-200 bg-[#fffaf7] px-5 py-4 text-stone-800 outline-none transition placeholder:text-stone-300 focus:border-rose-200 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitState.loading}
              className="w-full rounded-full bg-stone-800 px-8 py-4 text-sm font-medium tracking-[0.15em] text-white shadow-xl transition hover:scale-[1.01] hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitState.loading ? "送出中..." : "送出回覆 ♡"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
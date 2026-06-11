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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "guests" || name === "vegetarian" || name === "children"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleAttendingChange = (value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      attending: value,
      // Reset attending-related fields when selecting 不參加
      ...(value === false && {
        guests: 0,
        vegetarian: 0,
        children: 0,
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setSubmitState({
        loading: false,
        success: false,
        error: "請輸入姓名",
      });
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
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          attending: formData.attending,
          guests: formData.guests,
          vegetarian: formData.vegetarian,
          children: formData.children,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitState({ loading: false, success: true, error: null });
        // Reset form after success
        setFormData({
          name: "",
          phone: "",
          attending: null,
          guests: 1,
          vegetarian: 0,
          children: 0,
          message: "",
        });
      } else {
        setSubmitState({
          loading: false,
          success: false,
          error: data.error || "提交失敗，請稍後重試",
        });
      }
    } catch (err) {
      setSubmitState({
        loading: false,
        success: false,
        error: "提交失敗，請檢查網路連線",
      });
    }
  };

  if (submitState.success) {
    return (
      <section id="rsvp" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl rounded-2xl border border-white/70 bg-white/80 p-12 text-center backdrop-blur shadow-xl"
          >
            <div className="mb-4 text-5xl">♡</div>
            <h3 className="mb-3 font-serif text-3xl text-stone-800">Thank You</h3>
            <p className="mb-2 text-lg text-stone-600">我們已收到您的回覆</p>
            <p className="text-stone-500">期待與您相見</p>

            <button
              onClick={() => {
                setSubmitState({
                  loading: false,
                  success: false,
                  error: null,
                });
              }}
              className="mt-8 rounded-full bg-rose-200/80 px-8 py-3 text-sm font-medium text-rose-800 transition hover:bg-rose-200"
            >
              返回表單
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="rsvp" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs tracking-[0.4em] text-rose-300">
            RSVP
          </p>

          <h2 className="font-serif text-4xl text-stone-800 md:text-5xl">
            期待與你們相見
          </h2>

          <div className="mx-auto mt-5 h-px w-20 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
        </div>

        <div className="mx-auto max-w-2xl rounded-2xl border border-white/70 bg-white/75 p-8 backdrop-blur shadow-xl md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {submitState.error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {submitState.error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                姓名 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="請輸入姓名"
                className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-4 py-3 text-stone-800 placeholder-stone-400 transition focus:border-rose-300 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                聯絡電話 <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="請輸入聯絡電話"
                className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-4 py-3 text-stone-800 placeholder-stone-400 transition focus:border-rose-300 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Attendance Radio */}
            <div>
              <label className="mb-3 block text-sm font-medium text-stone-700">
                是否出席家宴 <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="attending"
                    checked={formData.attending === true}
                    onChange={() => handleAttendingChange(true)}
                    className="h-4 w-4 cursor-pointer border-stone-300 text-rose-500"
                  />
                  <span className="text-stone-700">參加</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="attending"
                    checked={formData.attending === false}
                    onChange={() => handleAttendingChange(false)}
                    className="h-4 w-4 cursor-pointer border-stone-300 text-rose-500"
                  />
                  <span className="text-stone-700">不參加</span>
                </label>
              </div>
            </div>

            {/* Conditional Fields - Only show if attending */}
            {formData.attending === true && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 pt-2"
              >
                {/* Guests */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    出席人數(包含自己)
                  </label>
                  <input
                    type="number"
                    name="guests"
                    min="1"
                    max="10"
                    value={formData.guests}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-4 py-3 text-stone-800 transition focus:border-rose-300 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Vegetarian */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    素食人數
                  </label>
                  <input
                    type="number"
                    name="vegetarian"
                    min="0"
                    max="10"
                    value={formData.vegetarian}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-4 py-3 text-stone-800 transition focus:border-rose-300 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Children */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    小孩人數(需兒童座椅或餐具)
                  </label>
                  <input
                    type="number"
                    name="children"
                    min="0"
                    max="10"
                    value={formData.children}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-4 py-3 text-stone-800 transition focus:border-rose-300 focus:bg-white focus:outline-none"
                  />
                </div>
              </motion.div>
            )}

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                想說的話
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="留下您的祝福或備註"
                rows={4}
                className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-4 py-3 text-stone-800 placeholder-stone-400 transition focus:border-rose-300 focus:bg-white focus:outline-none resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitState.loading}
              className="w-full rounded-lg bg-rose-200 px-6 py-3 font-medium text-rose-800 transition hover:bg-rose-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitState.loading ? "提交中..." : "提交"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

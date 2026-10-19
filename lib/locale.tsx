"use client";

import { useSyncExternalStore } from "react";

export type Locale = "zh-Hans" | "zh-Hant" | "en";

const KEY = "cuhk-bus-locale";
const EVENT = "cuhk-locale-change";

export function parseLocale(value: string | null): Locale {
  if (value === "zh-Hant" || value === "en" || value === "zh-Hans") return value;
  return "zh-Hans";
}

function readLocale(): Locale {
  try {
    return parseLocale(window.localStorage.getItem(KEY));
  } catch {
    return "zh-Hans";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Default is 简体中文. A saved choice is read after hydration so the server HTML stays simplified. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, readLocale, () => "zh-Hans");
}

export function setLocale(locale: Locale) {
  window.localStorage.setItem(KEY, locale);
  window.dispatchEvent(new Event(EVENT));
}

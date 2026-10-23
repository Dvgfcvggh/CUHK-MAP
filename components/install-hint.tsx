"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { messages } from "@/lib/copy";
import { useLocale } from "@/lib/locale";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let promptEvent: BeforeInstallPromptEvent | null = null;
let listening = false;
const promptListeners = new Set<() => void>();

function emitPrompt() {
  promptListeners.forEach((listener) => listener());
}

function ensureInstallListener() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    promptEvent = event as BeforeInstallPromptEvent;
    emitPrompt();
  });
  window.addEventListener("appinstalled", () => {
    promptEvent = null;
    emitPrompt();
  });
}

function subscribePrompt(onChange: () => void) {
  ensureInstallListener();
  promptListeners.add(onChange);
  return () => promptListeners.delete(onChange);
}

function useInstallPrompt(): BeforeInstallPromptEvent | null {
  return useSyncExternalStore(subscribePrompt, () => promptEvent, () => null);
}

function runInstallPrompt() {
  const current = promptEvent;
  if (!current) return;
  void current.prompt().finally(() => {
    promptEvent = null;
    emitPrompt();
  });
}

function alreadyInstalled(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function subscribeInstalled(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

const barControl =
  "h-8 whitespace-nowrap rounded-md border border-input bg-card px-1.5 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

let guideOpen = false;
const guideListeners = new Set<() => void>();

function emitGuide() {
  guideListeners.forEach((listener) => listener());
}

function subscribeGuide(onChange: () => void) {
  guideListeners.add(onChange);
  return () => {
    guideListeners.delete(onChange);
  };
}

function useGuideOpen() {
  return useSyncExternalStore(subscribeGuide, () => guideOpen, () => false);
}

function toggleGuide() {
  guideOpen = !guideOpen;
  emitGuide();
}

export function InstallBarButton() {
  const copy = messages(useLocale());
  const installed = useSyncExternalStore(subscribeInstalled, alreadyInstalled, () => false);
  const promptEvent = useInstallPrompt();
  const open = useGuideOpen();
  if (installed) return null;

  return (
    <button
      type="button"
      className={barControl}
      aria-expanded={promptEvent ? undefined : open}
      onClick={() => {
        if (promptEvent) {
          runInstallPrompt();
          return;
        }
        toggleGuide();
      }}
    >
      {copy.installAdd}
    </button>
  );
}

export function InstallBarNote() {
  const copy = messages(useLocale());
  const installed = useSyncExternalStore(subscribeInstalled, alreadyInstalled, () => false);
  const promptEvent = useInstallPrompt();
  const open = useGuideOpen();
  if (installed || promptEvent || !open) return null;
  return <p className="w-full text-xs leading-5 text-muted-foreground">{copy.iosGuide}</p>;
}

export function InstallHint() {
  const copy = messages(useLocale());
  const installed = useSyncExternalStore(subscribeInstalled, alreadyInstalled, () => false);
  const promptEvent = useInstallPrompt();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
  }, []);

  if (installed) return null;

  return (
    <div className="mt-4 flex w-full flex-col gap-2">
      {promptEvent && !hidden ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-8 min-h-8 px-3 text-xs"
            onClick={() => runInstallPrompt()}
          >
            {copy.installAdd}
          </Button>
          <Button variant="ghost" className="h-8 min-h-8 px-3 text-xs" onClick={() => setHidden(true)}>
            {copy.installLater}
          </Button>
        </div>
      ) : null}
      <p className="w-full text-xs leading-5 text-muted-foreground">{copy.iosGuide}</p>
    </div>
  );
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { messages } from "@/lib/copy";
import { useLocale } from "@/lib/locale";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

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

export function InstallHint() {
  const copy = messages(useLocale());
  const installed = useSyncExternalStore(subscribeInstalled, alreadyInstalled, () => false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;

  return (
    <div className="mt-4 flex max-w-[65ch] flex-col gap-2">
      {promptEvent && !hidden ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-8 min-h-8 px-3 text-xs"
            onClick={() => {
              void promptEvent.prompt().then(() => setPromptEvent(null));
            }}
          >
            {copy.installAdd}
          </Button>
          <Button variant="ghost" className="h-8 min-h-8 px-3 text-xs" onClick={() => setHidden(true)}>
            {copy.installLater}
          </Button>
        </div>
      ) : null}
      <p className="text-xs leading-5 text-muted-foreground">{copy.iosGuide}</p>
    </div>
  );
}

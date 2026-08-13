"use client";

import { useEffect } from "react";
import { reconcileExistingSubscription } from "@/components/PushControls";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const hadController = Boolean(navigator.serviceWorker.controller);
      let refreshing = false;
      navigator.serviceWorker.register(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sw.js?v=11`, { updateViaCache: "none" })
        .then(async (registration) => {
          await registration.update();
          // Subscription controls live in a modal, but stale VAPID recovery must
          // run on every page visit. Otherwise returning Android readers remain
          // inactive until they happen to open the settings modal.
          if ("Notification" in window && Notification.permission === "granted") {
            const saved = readSavedDelivery();
            await reconcileExistingSubscription(saved.time, saved.days);
          }
        })
        .catch(() => undefined);
      const updatePage = () => {
        if (hadController && !refreshing) { refreshing = true; window.location.reload(); }
      };
      navigator.serviceWorker.addEventListener("controllerchange", updatePage);
      window.addEventListener("pagehide", () => navigator.serviceWorker.removeEventListener("controllerchange", updatePage), { once: true });
    }
    const donationSelectors = [
      "[data-coders-donation]", "[data-donation-widget]", "#coders-donation", "#donation-widget",
      ".coders-donation", ".donation-widget", "iframe[src*='donat' i]", "a[href*='donat' i]",
    ].join(",");
    const removeDonation = () => document.querySelectorAll(donationSelectors).forEach((node) => node.remove());
    removeDonation();
    const observer = new MutationObserver(removeDonation);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

function readSavedDelivery() {
  try {
    const saved = JSON.parse(window.localStorage.getItem("achim-gyeol-delivery") ?? "null") as { time?: unknown; days?: unknown } | null;
    const days = Array.isArray(saved?.days)
      ? saved.days.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6)
      : [];
    return {
      time: typeof saved?.time === "string" ? saved.time : "07:30",
      days: days.length ? days : [0, 1, 2, 3, 4],
    };
  } catch {
    return { time: "07:30", days: [0, 1, 2, 3, 4] };
  }
}

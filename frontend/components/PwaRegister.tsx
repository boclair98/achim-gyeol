"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const hadController = Boolean(navigator.serviceWorker.controller);
      let refreshing = false;
      navigator.serviceWorker.register(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sw.js?v=10`, { updateViaCache: "none" })
        .then((registration) => registration.update()).catch(() => undefined);
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

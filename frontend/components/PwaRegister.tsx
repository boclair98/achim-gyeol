"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sw.js`).catch(() => undefined);
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

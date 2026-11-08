"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Briefing } from "@/lib/briefing";
import { cachedLiveBriefing, lastLiveBriefingKey, parseLiveBriefing, validEditionDate } from "@/lib/daily-letter";
import { deviceHeaders } from "@/lib/device";

export const receivedApiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const lastReceivedEditionKey = "achim-gyeol-last-received-edition";

export type ReceivedEditionResult =
  | { state: "ready" | "cached" | "empty"; data: Briefing }
  | { state: "loading" | "error" | "invalid"; data?: undefined };

function subscribeToAddress(notify: () => void) {
  window.addEventListener("popstate", notify);
  window.addEventListener("hashchange", notify);
  return () => {
    window.removeEventListener("popstate", notify);
    window.removeEventListener("hashchange", notify);
  };
}

const browserAddress = () => window.location.search + window.location.hash;
const serverAddress = () => null;

export function readReceivedStorage(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writeReceivedStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ }
}

export function receivedDeviceHeaders() {
  try { return deviceHeaders(); } catch { return { "Content-Type": "application/json" }; }
}

export function useReceivedEdition(preview = false) {
  const address = useSyncExternalStore(subscribeToAddress, browserAddress, serverAddress);
  const fragment = address?.match(/#.*$/)?.[0] ?? "";
  const date = address === null ? null : new URLSearchParams(address.split("#", 1)[0]).get("date") ?? "";
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<{ date: string; version: number; result: ReceivedEditionResult }>();
  const invalid = !!date && !validEditionDate(date);

  useEffect(() => {
    if (date === null || invalid) return;
    const requested = date;
    const controller = new AbortController();
    let current = true;
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    async function load() {
      let result: ReceivedEditionResult;
      try {
        const path = requested ? `/api/briefings/${encodeURIComponent(requested)}` : "/api/briefings/today";
        const response = await fetch(receivedApiBase + path, {
          signal: controller.signal, cache: "no-store",
          headers: preview ? undefined : receivedDeviceHeaders(),
        });
        if (!response.ok) throw new Error("Edition unavailable");
        const data = parseLiveBriefing(await response.json());
        if (requested && data.briefingDate !== requested) throw new Error("Unexpected edition date");
        if (!current) return;
        if (!preview && data.productionReady && data.stories.length && data.briefingDate && validEditionDate(data.briefingDate)) {
          writeReceivedStorage(requested ? lastReceivedEditionKey : lastLiveBriefingKey, JSON.stringify(data));
        }
        result = { state: data.stories.length ? "ready" : "empty", data };
      } catch {
        if (!current) return;
        const cached = preview ? null
          : (requested ? [lastReceivedEditionKey, lastLiveBriefingKey] : [lastLiveBriefingKey])
            .map(key => cachedLiveBriefing(readReceivedStorage(key)))
            .find(edition => edition && (!requested || edition.briefingDate === requested));
        result = cached
          ? { state: "cached", data: cached }
          : { state: "error" };
      } finally {
        clearTimeout(timeout);
      }
      if (current) setSettled({ date: requested, version, result });
    }
    void load();
    return () => { current = false; clearTimeout(timeout); controller.abort(); };
  }, [date, invalid, preview, version]);

  const result: ReceivedEditionResult = invalid ? { state: "invalid" }
    : settled && settled.date === date && settled.version === version ? settled.result
    : { state: "loading" };
  return { date, fragment, result, retry: () => setVersion(count => count + 1) };
}

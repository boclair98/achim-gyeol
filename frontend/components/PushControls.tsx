"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Send } from "lucide-react";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type Props = { deliveryTime: string; selectedDays: number[]; onNotice: (message: string) => void };
type PushConfig = { enabled: boolean; publicKey: string };
type PushResponse = { delivered: boolean; message: string };

export function PushControls({ deliveryTime, selectedDays, onNotice }: Props) {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!available) { queueMicrotask(() => setSupported(false)); return; }
    navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setSubscribed(Boolean(subscription))).catch(() => setSubscribed(false));
  }, []);

  const subscribe = async () => {
    setWorking(true);
    try {
      if (!supported) throw new Error("이 브라우저는 웹푸시를 지원하지 않습니다.");
      if (selectedDays.length === 0) throw new Error("발송 요일을 하나 이상 선택해 주세요.");
      const sessionResponse = await fetch(`${apiBase}/api/push/session`, { cache: "no-store" });
      const session = sessionResponse.ok ? await sessionResponse.json() as { authenticated: boolean } : { authenticated: false };
      if (!session.authenticated) {
        window.location.assign(`https://mcp.coders.kr/sso/login?return_to=${encodeURIComponent(`${window.location.origin}${window.location.pathname}#delivery-deck`)}`);
        return;
      }
      if (await Notification.requestPermission() !== "granted") throw new Error("브라우저 설정에서 알림을 허용해 주세요.");
      const configResponse = await fetch(`${apiBase}/api/push/public-key`, { cache: "no-store" });
      if (!configResponse.ok) throw new Error("푸시 설정을 불러오지 못했습니다.");
      const config = await configResponse.json() as PushConfig;
      if (!config.enabled || !config.publicKey) throw new Error("서버의 웹푸시 설정이 아직 완료되지 않았습니다.");

      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      const subscription = current ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(config.publicKey) });
      const [hour, minute] = deliveryTime.split(":").map(Number);
      const response = await fetch(`${apiBase}/api/push/subscriptions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint, keys: subscription.toJSON().keys, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul", deliveryHour: hour, deliveryMinute: minute, weekdays: selectedDays }),
      });
      if (!response.ok) throw new Error(await errorMessage(response, "알림 설정을 저장하지 못했습니다."));
      window.localStorage.setItem("achim-gyeol-delivery", JSON.stringify({ time: deliveryTime, days: selectedDays }));
      setSubscribed(true);
      onNotice(`알림 등록 완료! 선택한 요일 ${deliveryTime}에 이 기기로 뉴스 브리핑을 보내드려요.`);
    } catch (error) { onNotice(error instanceof Error ? error.message : "알림 등록 중 오류가 발생했습니다."); }
    finally { setWorking(false); }
  };

  const unsubscribe = async () => {
    setWorking(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch(`${apiBase}/api/push/subscriptions`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
      setSubscribed(false); onNotice("이 기기의 뉴스 알림을 해지했습니다.");
    } catch { onNotice("알림 해지를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
    finally { setWorking(false); }
  };

  const sendTest = async () => {
    setWorking(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) throw new Error("먼저 이 기기에 알림을 등록해 주세요.");
      const response = await fetch(`${apiBase}/api/push/test`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
      if (!response.ok) throw new Error(await errorMessage(response, "테스트 알림을 발송하지 못했습니다."));
      const result = await response.json() as PushResponse;
      if (!result.delivered) throw new Error(result.message);
      onNotice("이 기기로 테스트 뉴스 알림을 보냈습니다. 알림창을 확인해 주세요.");
    } catch (error) { onNotice(error instanceof Error ? error.message : "테스트 발송 중 오류가 발생했습니다."); }
    finally { setWorking(false); }
  };

  if (!supported) return <p className="push-help">최신 Chrome·Edge 또는 홈 화면에 설치한 Safari에서 열어 주세요.</p>;
  return <div className="push-controls">
    <button className="primary-button" onClick={subscribe} disabled={working}><BellRing size={16} /> {subscribed ? "시간·요일 저장" : "이 기기에 알림 등록"}</button>
    {subscribed && <button className="secondary-button blue" onClick={sendTest} disabled={working}><Send size={16} /> 내게 테스트 발송</button>}
    {subscribed && <button className="text-button" onClick={unsubscribe} disabled={working}><BellOff size={15} /> 알림 해지</button>}
    <p className="push-help">메일이 아니라 휴대폰 잠금화면·알림센터로 도착합니다. 구독 주소는 이 기기의 발송에만 사용됩니다.</p>
  </div>;
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = window.atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

async function errorMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { message?: string } | null;
  return body?.message || fallback;
}

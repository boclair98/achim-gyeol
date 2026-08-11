"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, CheckCircle2, Send } from "lucide-react";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type Props = { deliveryTime: string; selectedDays: number[]; onNotice: (message: string) => void; onSubscriptionChange?: (subscribed: boolean) => void };
type PushConfig = { enabled: boolean; publicKey: string };
type PushResponse = { delivered: boolean; message: string };

export function PushControls({ deliveryTime, selectedDays, onNotice, onSubscriptionChange }: Props) {
  const [supported, setSupported] = useState(true);
  const [iosInstallRequired, setIosInstallRequired] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (ios && !standalone) {
      queueMicrotask(() => { setIosInstallRequired(true); setSupported(false); });
      return;
    }
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!available) { queueMicrotask(() => setSupported(false)); return; }
    navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => { const active = Boolean(subscription); setSubscribed(active); onSubscriptionChange?.(active); })
      .catch(() => { setSubscribed(false); onSubscriptionChange?.(false); });
  }, [onSubscriptionChange]);

  const subscribe = async () => {
    setWorking(true);
    try {
      if (!supported) throw new Error("이 브라우저는 웹푸시를 지원하지 않습니다.");
      if (selectedDays.length === 0) throw new Error("발송 요일을 하나 이상 선택해 주세요.");
      if (await Notification.requestPermission() !== "granted") throw new Error("브라우저 설정에서 알림을 허용해 주세요.");
      const configResponse = await fetch(`${apiBase}/api/push/public-key`, { cache: "no-store" });
      if (!configResponse.ok) throw new Error("푸시 설정을 불러오지 못했습니다.");
      const config = await configResponse.json() as PushConfig;
      if (!config.enabled || !config.publicKey) throw new Error("알림 서비스가 잠시 준비 중입니다. 운영자에게 알려주세요.");

      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      const subscription = current ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(config.publicKey) });
      const [hour, minute] = deliveryTime.split(":").map(Number);
      const response = await fetch(`${apiBase}/api/push/subscriptions`, {
        method: "POST", headers: deviceHeaders(),
        body: JSON.stringify({ endpoint: subscription.endpoint, keys: subscription.toJSON().keys, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul", deliveryHour: hour, deliveryMinute: minute, weekdays: selectedDays }),
      });
      if (!response.ok) throw new Error(await errorMessage(response, "알림 설정을 저장하지 못했습니다."));
      window.localStorage.setItem("achim-gyeol-delivery", JSON.stringify({ time: deliveryTime, days: selectedDays }));
      setSubscribed(true);
      onSubscriptionChange?.(true);
      onNotice(`등록 완료! 선택한 요일 ${deliveryTime} 이후, 준비된 어제 뉴스 종합을 이 기기로 보내드려요.`);
    } catch (error) { onNotice(error instanceof Error ? error.message : "알림 등록 중 오류가 발생했습니다."); }
    finally { setWorking(false); }
  };

  const unsubscribe = async () => {
    setWorking(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch(`${apiBase}/api/push/subscriptions`, { method: "DELETE", headers: deviceHeaders(), body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
      setSubscribed(false); onSubscriptionChange?.(false); onNotice("이 기기의 뉴스 알림을 해지했습니다.");
    } catch { onNotice("알림 해지를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
    finally { setWorking(false); }
  };

  const sendTest = async () => {
    setWorking(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) throw new Error("먼저 이 기기에 알림을 등록해 주세요.");
      const response = await fetch(`${apiBase}/api/push/test`, { method: "POST", headers: deviceHeaders(), body: JSON.stringify({ endpoint: subscription.endpoint }) });
      if (!response.ok) throw new Error(await errorMessage(response, "테스트 알림을 발송하지 못했습니다."));
      const result = await response.json() as PushResponse;
      if (!result.delivered) throw new Error(result.message);
      onNotice("실제 푸시 서버를 통해 이 기기로 운영 테스트를 보냈습니다. 잠금화면·알림센터를 확인해 주세요.");
    } catch (error) { onNotice(error instanceof Error ? error.message : "테스트 발송 중 오류가 발생했습니다."); }
    finally { setWorking(false); }
  };

  if (iosInstallRequired) return <div className="push-controls ios-push-controls">
    <button className="primary-button" onClick={() => setShowIosGuide(true)}><BellRing size={16} /> 이 기기에 알림 등록</button>
    {showIosGuide && <div className="ios-install-guide" role="status">
      <strong>아이폰은 홈 화면 설치가 먼저 필요해요</strong>
      <ol><li>Safari 하단의 <b>공유</b> 버튼 누르기</li><li><b>홈 화면에 추가</b> 선택하기</li><li>홈 화면의 <b>아침결</b> 아이콘으로 다시 열기</li></ol>
      <p>카드 화면의 ‘이 기기에 알림 등록’을 누르면 실제 등록 화면으로 이어집니다.</p>
    </div>}
    <p className="push-help">버튼을 없앤 것이 아니라 iOS의 설치 절차를 먼저 안내합니다. 설치 후에는 다른 기기와 동일하게 등록할 수 있습니다.</p>
  </div>;
  if (!supported) return <div className="push-controls unsupported-push-controls">
    <button className="primary-button" onClick={() => onNotice("Safari 또는 최신 Chrome·Edge에서 열어 주세요. 아이폰은 Safari의 ‘홈 화면에 추가’ 후 등록할 수 있습니다.")}><BellRing size={16} /> 이 기기에 알림 등록</button>
    <p className="push-help">현재 브라우저가 Web Push를 지원하지 않습니다. 지원 브라우저에서 열면 이 버튼으로 바로 등록됩니다.</p>
  </div>;
  return <div className="push-controls">
    <button className="primary-button" onClick={subscribe} disabled={working}><BellRing size={16} /> {subscribed ? "시간·요일 저장" : "이 기기에 알림 등록"}</button>
    {subscribed && <p className="push-status"><CheckCircle2 size={15} /> 이 기기는 실제 아침 브리핑 수신 등록이 완료됐습니다.</p>}
    {subscribed && <button className="secondary-button blue" onClick={sendTest} disabled={working}><Send size={16} /> 내 기기 실제 푸시 테스트</button>}
    {subscribed && <button className="text-button" onClick={unsubscribe} disabled={working}><BellOff size={15} /> 알림 해지</button>}
    <p className="push-help">회원가입 없이 바로 등록됩니다. 처음 한 번 브라우저 알림만 허용하면 되고, 테스트 발송은 이 기기에만 전송됩니다.</p>
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

function deviceHeaders(): Record<string, string> {
  let deviceId = window.localStorage.getItem("achim-gyeol-device-id");
  if (!deviceId) {
    deviceId = window.crypto.randomUUID();
    window.localStorage.setItem("achim-gyeol-device-id", deviceId);
  }
  return { "Content-Type": "application/json", "X-Achim-Device": deviceId };
}

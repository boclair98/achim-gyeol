const CACHE = "achim-gyeol-v10";
const SHELL = ["./", "./briefing/", "./archive/", "./preferences/", "./trust/", "./manifest.webmanifest", "./mail-icon.svg", "./briefing-card-bg.png", "./og-v2.png"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isApi = url.origin === self.location.origin && url.pathname.startsWith("/api/");
  const isPublicBriefingApi = url.pathname.startsWith("/api/briefings") || url.pathname === "/api/push/public-key";

  // Preferences, device sessions and operator endpoints must never enter a
  // shared Cache Storage entry. Cache keys do not vary by authorization header.
  if (isApi && !isPublicBriefingApi) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && (url.origin === self.location.origin || isPublicBriefingApi)) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    if (event.request.mode === "navigate") return (await caches.match("./briefing/")) || (await caches.match("./"));
    return Response.error();
  }));
});
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "아침결 · 어제 핵심 뉴스", body: "30초 한눈에 보기부터 사실·영향·다음 확인 포인트까지 확인하세요." };
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: "./mail-icon.svg", badge: "./mail-icon.svg",
    tag: data.tag || "achim-gyeol-daily", renotify: true,
    data: { url: data.url || new URL("./briefing/", self.registration.scope).href },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./briefing/", self.registration.scope).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
    const existing = windows.find((client) => new URL(client.url).origin === new URL(target).origin);
    if (existing) { await existing.navigate(target); return existing.focus(); }
    return clients.openWindow(target);
  }));
});

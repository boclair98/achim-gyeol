const CACHE = "achim-gyeol-v7";
const SHELL = ["./", "./briefing/", "./archive/", "./preferences/", "./trust/", "./manifest.webmanifest", "./icon.svg", "./briefing-card-bg.png", "./og-v2.png"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request).then((response) => response || caches.match("./"))));
});
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "아침결 · 오늘 꼭 알아야 할 뉴스", body: "확인된 핵심과 근거 원문을 큰 글자의 뉴스 화면에서 확인하세요." };
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: "./icon.svg", badge: "./icon.svg",
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

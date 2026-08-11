const CACHE = "achim-gyeol-v5";
const SHELL = ["./", "./briefing/", "./archive/", "./preferences/", "./trust/", "./manifest.webmanifest", "./icon.svg", "./briefing-card-bg.png", "./og-v2.png"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request).then((response) => response || caches.match("./"))));
});
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "아침결 · 어제 뉴스 종합이 도착했어요", body: "어제 하루의 핵심 뉴스를 카드로 확인하세요." };
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

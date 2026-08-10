const CACHE = "achim-gyeol-v3";
const SHELL = ["./", "./archive/", "./preferences/", "./trust/", "./manifest.webmanifest", "./icon.svg", "./briefing-card-bg.png", "./og-v2.png"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request).then((response) => response || caches.match("./"))));
});
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "아침결 · 뉴스 카드가 도착했어요", body: "밤사이 핵심 뉴스를 카드 묶음으로 확인하세요." };
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "./icon.svg", data: { url: data.url || "./" } }));
});
self.addEventListener("notificationclick", (event) => { event.notification.close(); event.waitUntil(clients.openWindow(event.notification.data.url)); });

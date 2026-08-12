export function deviceHeaders(): Record<string, string> {
  let deviceId = window.localStorage.getItem("achim-gyeol-device-id");
  if (!deviceId) {
    deviceId = window.crypto.randomUUID();
    window.localStorage.setItem("achim-gyeol-device-id", deviceId);
  }
  return { "Content-Type": "application/json", "X-Achim-Device": deviceId };
}
